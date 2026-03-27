/**
 * Payment Controller for BucksBus Integration
 */

const Payment = require('../../models/payment');
const User = require('../../models/user');
const bucksbus = require('../../lib/bucksbus');
const logger = require('../../config/winston');

const isTestModeEnabled = () => process.env.BUCKSBUS_TEST_MODE === 'true';

const shouldAutoCompleteTestPayment = () => process.env.BUCKSBUS_AUTO_COMPLETE !== 'false';
const normalizePaymentStatus = (status) =>
  String(status || '').toLowerCase();

const normalizeMetadata = (metadata) => {
  if (!metadata) {
    return {};
  }

  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch (error) {
      return {};
    }
  }

  return metadata;
};

const isSuccessfulPaymentStatus = (status) =>
  ['completed', 'complete', 'paid'].includes(normalizePaymentStatus(status));

const isLocalTestPayment = (payment) =>
  Boolean(
    payment &&
      (String(payment.transaction_id || '').startsWith('test_') ||
        payment.bank_name === 'BucksBus (Test)')
  );
const creditCompletedPayment = async (paymentId, status, metadata = {}) => {
  const normalizedStatus = normalizePaymentStatus(status);
  const normalizedMetadata = normalizeMetadata(metadata);
  const payment = await Payment.findOne({ transaction_id: paymentId });

  if (!payment) {
    return { payment: null, credited: false };
  }

  if (!isSuccessfulPaymentStatus(normalizedStatus)) {
    await Payment.updateOne(
      { transaction_id: paymentId },
      { $set: { payment_status: normalizedStatus, updated_at: new Date() } }
    );
    return { payment, credited: false };
  }

  const paymentForCredit = await Payment.findOneAndUpdate(
    { transaction_id: paymentId, credited_at: null },
    {
      $set: {
        payment_status: normalizedStatus,
        updated_at: new Date(),
        credited_at: new Date(),
      },
    },
    { new: true }
  );

  if (!paymentForCredit) {
    await Payment.updateOne(
      { transaction_id: paymentId },
      { $set: { payment_status: normalizedStatus, updated_at: new Date() } }
    );
    return { payment, credited: false };
  }

  const user = await User.findById(paymentForCredit.username_id);
  if (!user) {
    return { payment: paymentForCredit, credited: false };
  }

  const interestedTokens =
    Number(paymentForCredit.interested_tokens) ||
    parseInt(normalizedMetadata.interested_tokens, 10) ||
    0;
  const superInterestedTokens =
    Number(paymentForCredit.super_interested_tokens) ||
    parseInt(normalizedMetadata.super_interested_tokens, 10) ||
    0;
  const chatTokens =
    Number(paymentForCredit.chat_tokens) ||
    parseInt(normalizedMetadata.chat_tokens, 10) ||
    0;

  if (interestedTokens > 0) {
    user.interested_tokens = (user.interested_tokens || 0) + interestedTokens;
  }
  if (superInterestedTokens > 0) {
    user.super_interested_tokens =
      (user.super_interested_tokens || 0) + superInterestedTokens;
  }
  if (chatTokens > 0) {
    user.chat_tokens = (user.chat_tokens || 0) + chatTokens;
  }

  user.interested_tokens_max = Math.max(
    Number(user.interested_tokens_max) || 0,
    Number(user.interested_tokens) || 0
  );
  user.super_interested_tokens_max = Math.max(
    Number(user.super_interested_tokens_max) || 0,
    Number(user.super_interested_tokens) || 0
  );
  user.chat_tokens_max = Math.max(
    Number(user.chat_tokens_max) || 0,
    Number(user.chat_tokens) || 0
  );

  await user.save();
  logger.info(
    `Tokens updated for user ${user._id}: +${interestedTokens} interested, +${superInterestedTokens} super interested, +${chatTokens} chat`
  );

  return { payment: paymentForCredit, credited: true, user };
};

/**
 * Create a new payment with BucksBus
 * POST /api/v1/payment/create
 */
exports.createPayment = async (req, res) => {
  try {
    // Extract user ID from JWT token (set by validateApi middleware)
    const userId = req.datajwt?.userdata?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { 
      amount, 
      currency = 'USD',
      interested_tokens = 0,
      super_interested_tokens = 0,
      description = 'Le Society Token Purchase',
      metadata = {},
      provider = 'transak'
    } = req.body;

    const numericAmount = Number(amount);

    // Validate amount
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than $0'
      });
    }

    if (!isTestModeEnabled() && numericAmount < 25) {
      return res.status(400).json({
        success: false,
        message: 'Minimum payment amount is $25'
      });
    }

    // Get user details for pre-filling
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // TEMPORARY: Test mode bypass for development
    if (isTestModeEnabled()) {
      const mockPaymentId = `test_${Date.now()}_${userId}`;
      
      logger.info(`Creating test payment: ${mockPaymentId}`);
      
      // Save mock payment in database
      const payment = new Payment({
        username_id: userId,
        transaction_id: mockPaymentId,
        amount: numericAmount.toString(),
        currency,
        bank_name: 'BucksBus (Test)',
        payment_status: 'pending',
        interested_tokens: parseInt(interested_tokens) || 0,
        super_interested_tokens: parseInt(super_interested_tokens) || 0,
        chat_tokens: parseInt(metadata.chat_tokens) || 0,
        created_at: new Date(),
      });
      await payment.save();

      // Simulate immediate success for testing
      // In real scenario, this would come via webhook
      if (shouldAutoCompleteTestPayment()) {
        const result = await creditCompletedPayment(mockPaymentId, 'completed');
        logger.info(
          `Test payment auto-completed for user ${userId}: ${mockPaymentId} (credited=${result.credited})`
        );
      }

      // Return mock payment URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.status(200).json({
        success: true,
        message: 'Payment created successfully (TEST MODE)',
        data: {
          payment_id: mockPaymentId,
          payment_url: `${frontendUrl}/payment/success?payment_id=${mockPaymentId}`,
          amount: numericAmount,
          currency,
          status: shouldAutoCompleteTestPayment() ? 'completed' : payment.payment_status,
        }
      });
    }

    // Create payment in BucksBus with reverse fiat payment.
    // Provider order is enforced in the BucksBus service:
    // Transak > Banxa > MoonPay > generic onramp page.
    const userName = user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.user_name;
    
    // Log user data for debugging
    logger.info('User data for payment:', {
      userId: userId.toString(),
      email: user.email,
      userName,
      country: user.country,
      country_code: user.country_code,
      province: user.province,
      state: user.state,
    });
    
    const bucksbusPayment = await bucksbus.createFiatPayment({
      userId: userId.toString(),
      email: user.email,
      name: userName,
      amount: numericAmount,
      currency,
      description,
      metadata: {
        interested_tokens,
        super_interested_tokens,
        user_name: user.user_name,
        first_name: user.first_name,
        last_name: user.last_name,
        ...metadata, // Include any additional metadata (like chat_tokens)
      },
      country: user.country_code || user.country || 'US',
      state: user.province || 'CA', // Default state if not provided
      provider,
      allowProviderFallback: true,
    });

    // Save payment record in database
    const payment = new Payment({
      username_id: userId,
      transaction_id: bucksbusPayment.payment_id,
      amount: numericAmount.toString(),
      currency,
      bank_name: 'BucksBus',
      payment_status: 'pending',
      interested_tokens: parseInt(interested_tokens) || 0,
      super_interested_tokens: parseInt(super_interested_tokens) || 0,
      chat_tokens: parseInt(metadata.chat_tokens) || 0,
      created_at: new Date(),
    });

    await payment.save();

    logger.info(`Payment created for user ${userId}: ${bucksbusPayment.payment_id}`);

    // CRITICAL FIX: Use fiat_payment_url for direct provider redirect!
    // payment_url → Shows BucksBus selection page with BTC address ❌
    // fiat_payment_url → Goes DIRECTLY to provider (Topper, Transak, etc.) ✅
    const redirectUrl = bucksbusPayment.fiat_payment_url || bucksbusPayment.payment_url;
    
    logger.info(`Payment redirect URL: ${redirectUrl}`);
    logger.info(`Provider: ${bucksbusPayment.fund_provider_name || 'unknown'}`);

    // Return fiat_payment_url for direct redirect to provider
    res.status(200).json({
      success: true,
      message: 'Payment created successfully',
      data: {
        payment_id: bucksbusPayment.payment_id,
        payment_url: redirectUrl,  // Using fiat_payment_url - goes directly to provider!
        amount: numericAmount,
        currency,
        status: bucksbusPayment.status,
        provider: bucksbusPayment.fund_provider_name, // e.g., "Transak"
      }
    });

  } catch (error) {
    logger.error('Payment creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment'
    });
  }
};

/**
 * Get payment details
 * GET /api/v1/payment/:paymentId
 */
exports.getPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Get payment from database
    const payment = await Payment.findOne({ transaction_id: paymentId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (isLocalTestPayment(payment) || isTestModeEnabled()) {
      if (!isSuccessfulPaymentStatus(payment.payment_status) && shouldAutoCompleteTestPayment()) {
        await creditCompletedPayment(paymentId, 'completed');
      }

      const refreshedPayment = await Payment.findOne({ transaction_id: paymentId });
      return res.status(200).json({
        success: true,
        data: {
          payment_id: refreshedPayment.transaction_id,
          amount: refreshedPayment.amount,
          currency: refreshedPayment.currency,
          status: refreshedPayment.payment_status,
          created_at: refreshedPayment.created_at,
        }
      });
    }

    // Get latest status from BucksBus
    const bucksbusPayment = await bucksbus.getPayment(paymentId);

    const paymentStatus = normalizePaymentStatus(bucksbusPayment.status);
    const paymentMetadata = normalizeMetadata(
      bucksbusPayment.metadata || bucksbusPayment.custom || {}
    );

    if (isSuccessfulPaymentStatus(paymentStatus)) {
      await creditCompletedPayment(paymentId, paymentStatus, paymentMetadata);
    } else if (payment.payment_status !== paymentStatus) {
      payment.payment_status = paymentStatus;
      payment.updated_at = new Date();
      await payment.save();
    }

    res.status(200).json({
      success: true,
      data: {
        payment_id: payment.transaction_id,
        amount: payment.amount,
        currency: payment.currency,
        status: bucksbusPayment.status,
        created_at: payment.created_at,
      }
    });

  } catch (error) {
    logger.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment'
    });
  }
};

/**
 * BucksBus Webhook Handler
 * POST /api/v1/payment/bucksbus-webhook
 */
exports.bucksbusWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-bucksbus-signature'];
    const payload = req.body || {};

    // Verify webhook signature
    if (!bucksbus.verifyWebhookSignature(signature, payload)) {
      logger.warn('Invalid webhook signature');
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    const paymentId = payload.id || payload.payment_id;
    const status = payload.status;
    const metadata = normalizeMetadata(payload.metadata || payload.custom || {});

    logger.info(`Webhook received for payment ${paymentId}: ${status}`);

    // Find payment in database
    const payment = await Payment.findOne({ transaction_id: paymentId });
    if (!payment) {
      logger.warn(`Payment not found for webhook: ${paymentId}`);
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const result = await creditCompletedPayment(paymentId, status, metadata);
    if (!result.credited && isSuccessfulPaymentStatus(status)) {
      logger.info(`Skipping token credit for ${paymentId}: already credited.`);
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });

  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Webhook processing failed'
    });
  }
};

/**
 * List user payments
 * GET /api/v1/payment/list
 */
exports.listPayments = async (req, res) => {
  try {
    const userId = req.datajwt?.userdata?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const payments = await Payment.find({ username_id: userId })
      .sort({ created_at: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: payments
    });

  } catch (error) {
    logger.error('List payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to list payments'
    });
  }
};

/**
 * Get available payment providers
 * GET /api/v1/payment/providers
 */
exports.getProviders = async (req, res) => {
  try {
    const { country, currency } = req.query;

    const providers = await bucksbus.getProviders({
      country,
      currency,
    });

    res.status(200).json({
      success: true,
      data: providers
    });

  } catch (error) {
    logger.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get providers'
    });
  }
};
