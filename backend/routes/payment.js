/**
 * Payment Routes for BucksBus Integration
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/v1/payment.controller');
const validateApi = require('../helpers/validateApi');

/**
 * @route   POST /api/v1/payment/create
 * @desc    Create a new payment with BucksBus
 * @access  Private
 */
router.post('/create', validateApi, paymentController.createPayment);

/**
 * @route   GET /api/v1/payment/:paymentId
 * @desc    Get payment details
 * @access  Private
 */
router.get('/:paymentId', validateApi, paymentController.getPayment);

/**
 * @route   GET /api/v1/payment/list
 * @desc    List user payments
 * @access  Private
 */
router.get('/list', validateApi, paymentController.listPayments);

/**
 * @route   GET /api/v1/payment/providers
 * @desc    Get available payment providers
 * @access  Public
 */
router.get('/providers', paymentController.getProviders);

/**
 * @route   POST /api/v1/payment/bucksbus-webhook
 * @desc    BucksBus webhook handler (public endpoint)
 * @access  Public (webhook)
 */
router.post('/bucksbus-webhook', paymentController.bucksbusWebhook);

module.exports = router;
