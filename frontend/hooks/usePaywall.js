import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

/**
 * Custom hook to manage paywall display logic
 * @returns {Object} Paywall state and control functions
 */
export const usePaywall = () => {
  const [paywallConfig, setPaywallConfig] = useState({
    isOpen: false,
    type: null,
    expiresIn: 48,
    userName: ''
  });

  const user = useSelector((state) => state.authReducer.user);
  const chatTokens = user?.chat_tokens || 0;
  const remainingChats = user?.remaining_chats || 0;
  const interestedTokens = user?.interested_tokens || 0;
  const superInterestedTokens = user?.super_interested_tokens || 0;
  const isFemale = user?.gender === 'female';
  const isMale = user?.gender === 'male';

  /**
   * Show paywall for men when viewing first date profiles
   * @param {string} userName - Name of the user being interacted with
   * @param {number} expiresIn - Hours until offer expires
   * @param {boolean} forceShow - Force show the paywall regardless of token check
   */
  const showMenFirstDatePaywall = (userName = 'Someone', expiresIn = 48, forceShow = false) => {
    console.log('[PAYWALL DEBUG] showMenFirstDatePaywall called', {
      isMale,
      interestedTokens,
      superInterestedTokens,
      forceShow,
      userName
    });
    
    if (!isMale) {
      console.log('[PAYWALL DEBUG] Not male, skipping paywall');
      return;
    }
    
    // If forceShow is true, always show the paywall
    if (forceShow) {
      console.log('[PAYWALL DEBUG] SHOWING PAYWALL (FORCED)');
      setPaywallConfig({
        isOpen: true,
        type: 'men_first_date',
        expiresIn,
        userName
      });
      return;
    }
    
    // Otherwise, show if user has no tokens at all
    if (interestedTokens === 0 && superInterestedTokens === 0) {
      console.log('[PAYWALL DEBUG] SHOWING PAYWALL (NO TOKENS)');
      setPaywallConfig({
        isOpen: true,
        type: 'men_first_date',
        expiresIn,
        userName
      });
    } else {
      console.log('[PAYWALL DEBUG] NOT showing paywall - user has tokens:', {
        interestedTokens,
        superInterestedTokens
      });
    }
  };

  /**
   * Show paywall for ladies when they run out of chats
   */
  const showLadiesChatPaywall = (expiresIn = 32, forceShow = false) => {
    if (!isFemale) return;
    
    if (forceShow || (chatTokens === 0 && remainingChats === 0)) {
      setPaywallConfig({
        isOpen: true,
        type: 'ladies_chat',
        expiresIn,
        userName: ''
      });
    }
  };

  /**
   * Close the paywall
   */
  const closePaywall = () => {
    setPaywallConfig({
      isOpen: false,
      type: null,
      expiresIn: 48,
      userName: ''
    });
  };

  /**
   * Check if user should see paywall automatically
   */
  const shouldShowPaywall = () => {
    if (isMale && interestedTokens === 0 && superInterestedTokens === 0) {
      return true;
    }
    if (isFemale && chatTokens === 0 && remainingChats === 0) {
      return true;
    }
    return false;
  };

  return {
    paywallConfig,
    showMenFirstDatePaywall,
    showLadiesChatPaywall,
    closePaywall,
    shouldShowPaywall
  };
};
