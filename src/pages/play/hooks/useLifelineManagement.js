// src/pages/play/hooks/useLifelineManagement.js

import { useState, useCallback, useEffect } from 'react';
import { useGameStore } from '@stores/useGameStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { useQuestionsStore } from '@stores/useQuestionsStore';
import { databaseService } from '@services/database.service';
import { applyFiftyFifty } from '@utils/gameplay/lifelineLogic';
import { LIFELINE_TYPE } from '@constants/teamStates';
import { ANSWER_OPTIONS } from '@constants/config';

/**
 * Lifeline Management Hook - WWBAM Style
 *
 * Purpose: Manages lifeline activation following WWBAM rules
 *
 * WWBAM Rules:
 * - Lifelines are DECISION TOOLS, not safety nets
 * - Team can use ONE lifeline per question BEFORE locking answer
 * - Once answer is locked, wrong answer = direct elimination (no lifeline rescue)
 * - Lifeline usage: Phone-a-Friend OR 50/50 (not both in same question)
 *
 * Architecture:
 * - This hook manages UI state and validation
 * - Database operations delegated to database.service.js
 * - Follows separation of concerns principle
 *
 * @returns {Object} Lifeline management state and actions
 */
export function useLifelineManagement() {
  // ============================================================
  // STATE
  // ============================================================

  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState(null);
  const [lifelineUsedThisQuestion, setLifelineUsedThisQuestion] =
    useState(false);

  // ============================================================
  // STORE STATE
  // ============================================================

  // Game Store
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const currentQuestionNumber = useGameStore(
    (state) => state.currentQuestionNumber,
  );
  const questionVisible = useGameStore((state) => state.questionVisible);
  const answerRevealed = useGameStore((state) => state.answerRevealed);

  // Teams Store
  const teams = useTeamsStore((state) => state.teams);
  const currentTeam = teams[currentTeamId];

  // Questions Store
  const hostQuestion = useQuestionsStore((state) => state.hostQuestion);
  const setFilteredOptions = useQuestionsStore(
    (state) => state.setFilteredOptions,
  );

  // ============================================================
  // RESET LIFELINE STATE ON NEW QUESTION
  // ============================================================

  useEffect(() => {
    setLifelineUsedThisQuestion(false);
    setActivationError(null);
  }, [currentQuestionNumber]);

  // ============================================================
  // AVAILABILITY CHECKS
  // ============================================================

  const isPhoneAvailable = useCallback(() => {
    if (!currentTeam?.lifelinesAvailable) return false;
    return (
      currentTeam.lifelinesAvailable[LIFELINE_TYPE.PHONE_A_FRIEND] === true
    );
  }, [currentTeam]);

  const isFiftyFiftyAvailable = useCallback(() => {
    if (!currentTeam?.lifelinesAvailable) return false;
    return currentTeam.lifelinesAvailable[LIFELINE_TYPE.FIFTY_FIFTY] === true;
  }, [currentTeam]);

  const canUseLifeline = useCallback(
    (lifelineType) => {
      // Question must be visible to public
      if (!questionVisible) return false;

      // Answer must not be locked yet
      if (answerRevealed) return false;

      // Must have host question loaded
      if (!hostQuestion) return false;

      // Cannot use if already used a lifeline this question
      if (lifelineUsedThisQuestion) return false;

      // Check if specific lifeline is available for team
      if (lifelineType === LIFELINE_TYPE.PHONE_A_FRIEND) {
        return isPhoneAvailable();
      } else if (lifelineType === LIFELINE_TYPE.FIFTY_FIFTY) {
        return isFiftyFiftyAvailable();
      }

      return false;
    },
    [
      questionVisible,
      answerRevealed,
      hostQuestion,
      lifelineUsedThisQuestion,
      isPhoneAvailable,
      isFiftyFiftyAvailable,
    ],
  );

  // ============================================================
  // 50/50 ACTIVATION
  // ============================================================

  const activateFiftyFifty = useCallback(async () => {
    if (!canUseLifeline(LIFELINE_TYPE.FIFTY_FIFTY)) {
      console.warn('Cannot use 50/50 at this time');
      return { success: false, error: 'Cannot use 50/50 at this time' };
    }

    setIsActivating(true);
    setActivationError(null);

    try {
      // Apply 50/50 logic (calculate which options to remove)
      const result = applyFiftyFifty(
        ANSWER_OPTIONS,
        hostQuestion.correctAnswer,
      );

      console.log('🔪 50/50 Applied:', result);

      // Create filtered options object for Firebase
      const filteredOptionsObj = {};
      result.remainingOptions.forEach((option) => {
        filteredOptionsObj[option] = hostQuestion.options[option];
      });

      // ============================================================
      // DATABASE OPERATION (delegated to service layer)
      // ============================================================

      await databaseService.activateFiftyFiftyLifeline(
        currentTeamId,
        filteredOptionsObj,
      );

      // ============================================================
      // UPDATE LOCAL STATE
      // ============================================================

      // Update questions store with filtered options
      setFilteredOptions(result.remainingOptions);

      // Mark lifeline as used this question
      setLifelineUsedThisQuestion(true);

      // Clear active lifeline after brief delay (50/50 is instant)
      setTimeout(async () => {
        await databaseService.clearActiveLifeline();
      }, 1000);

      console.log('✅ 50/50 activated successfully');
      setIsActivating(false);

      return {
        success: true,
        removedOptions: result.removedOptions,
        remainingOptions: result.remainingOptions,
      };
    } catch (error) {
      console.error('Failed to activate 50/50:', error);
      setActivationError(error.message);
      setIsActivating(false);
      return { success: false, error: error.message };
    }
  }, [canUseLifeline, hostQuestion, currentTeamId, setFilteredOptions]);

  // ============================================================
  // PHONE-A-FRIEND ACTIVATION
  // ============================================================

  const activatePhoneAFriend = useCallback(async () => {
    if (!canUseLifeline(LIFELINE_TYPE.PHONE_A_FRIEND)) {
      console.warn('Cannot use Phone-a-Friend at this time');
      return {
        success: false,
        error: 'Cannot use Phone-a-Friend at this time',
      };
    }

    setIsActivating(true);
    setActivationError(null);

    try {
      // ============================================================
      // DATABASE OPERATION (delegated to service layer)
      // ============================================================

      await databaseService.activatePhoneAFriendLifeline(currentTeamId);

      // ============================================================
      // UPDATE LOCAL STATE
      // ============================================================

      // Mark lifeline as used this question
      setLifelineUsedThisQuestion(true);

      console.log('📞 Phone-a-Friend activated successfully');
      setIsActivating(false);

      return { success: true };
    } catch (error) {
      console.error('Failed to activate Phone-a-Friend:', error);
      setActivationError(error.message);
      setIsActivating(false);
      return { success: false, error: error.message };
    }
  }, [canUseLifeline, currentTeamId]);

  // ============================================================
  // RESUME FROM PHONE-A-FRIEND
  // ============================================================

  const resumeFromPhoneAFriend = useCallback(async () => {
    try {
      await databaseService.clearActiveLifeline();
      console.log('✅ Resumed from Phone-a-Friend');
      return { success: true };
    } catch (error) {
      console.error('Failed to resume from Phone-a-Friend:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // ============================================================
  // RETURN HOOK INTERFACE
  // ============================================================

  return {
    // State
    isActivating,
    activationError,
    lifelineUsedThisQuestion,

    // Availability
    isPhoneAvailable: isPhoneAvailable(),
    isFiftyFiftyAvailable: isFiftyFiftyAvailable(),
    canUsePhone: canUseLifeline(LIFELINE_TYPE.PHONE_A_FRIEND),
    canUseFiftyFifty: canUseLifeline(LIFELINE_TYPE.FIFTY_FIFTY),

    // Actions
    activateFiftyFifty,
    activatePhoneAFriend,
    resumeFromPhoneAFriend,
  };
}
