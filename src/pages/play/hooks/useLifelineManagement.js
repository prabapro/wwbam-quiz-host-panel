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
 * CRITICAL - LIFELINE PERSISTENCE:
 * Team lifeline availability (lifelinesAvailable) is stored in Firebase under:
 *   teams/{teamId}/lifelines-available/phoneAFriend: boolean
 *   teams/{teamId}/lifelines-available/fiftyFifty: boolean
 *
 * Once a lifeline is used (set to false), it PERSISTS across all questions for that team.
 * The database service atomically updates:
 *   1. game-state/active-lifeline (temporary, cleared after use)
 *   2. teams/{teamId}/lifelines-available/{lifelineType} = false (permanent for this game)
 *
 * Per-question state (lifelineUsedThisQuestion) resets with each new question,
 * but the team's actual availability in Firebase never reverts to true.
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
    // Reset per-question state
    // IMPORTANT: Team's lifelinesAvailable in Firebase is NOT reset
    // Once false, it stays false for the entire game
    setLifelineUsedThisQuestion(false);
    setActivationError(null);
  }, [currentQuestionNumber]);

  // ============================================================
  // AVAILABILITY CHECKS
  // ============================================================

  /**
   * Check if Phone-a-Friend is available for the current team
   * Reads from team's Firebase data: teams/{teamId}/lifelines-available/phoneAFriend
   */
  const isPhoneAvailable = useCallback(() => {
    if (!currentTeam?.lifelinesAvailable) return false;
    return (
      currentTeam.lifelinesAvailable[LIFELINE_TYPE.PHONE_A_FRIEND] === true
    );
  }, [currentTeam]);

  /**
   * Check if 50/50 is available for the current team
   * Reads from team's Firebase data: teams/{teamId}/lifelines-available/fiftyFifty
   */
  const isFiftyFiftyAvailable = useCallback(() => {
    if (!currentTeam?.lifelinesAvailable) return false;
    return currentTeam.lifelinesAvailable[LIFELINE_TYPE.FIFTY_FIFTY] === true;
  }, [currentTeam]);

  /**
   * Check if a lifeline can be used right now
   * Validates all WWBAM rules before allowing activation
   */
  const canUseLifeline = useCallback(
    (lifelineType) => {
      // Question must be visible to public
      if (!questionVisible) return false;

      // Answer must not be locked yet
      if (answerRevealed) return false;

      // Must have host question loaded
      if (!hostQuestion) return false;

      // Cannot use if already used a lifeline this question (WWBAM rule: 1 per question)
      if (lifelineUsedThisQuestion) return false;

      // Check if specific lifeline is available for team (reads from Firebase)
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
      // Apply 50/50 logic (normalize correctAnswer to uppercase)
      const result = applyFiftyFifty(
        ANSWER_OPTIONS,
        hostQuestion.correctAnswer.toUpperCase(),
      );

      // ============================================================
      // BUILD FILTERED OPTIONS OBJECT FOR FIREBASE
      // ============================================================
      // Case normalization: ANSWER_OPTIONS uses uppercase ['A', 'B', 'C', 'D']
      // but hostQuestion.options uses lowercase keys {a: '5', b: '6', ...}
      // Convert to lowercase when accessing hostQuestion.options

      const filteredOptionsObj = {};

      // Set all options to null (marks for deletion in Firebase)
      ANSWER_OPTIONS.forEach((option) => {
        filteredOptionsObj[option.toLowerCase()] = null;
      });

      // Set remaining options to actual values
      result.remainingOptions.forEach((option) => {
        const lowercaseKey = option.toLowerCase();
        const optionValue = hostQuestion.options[lowercaseKey];

        // Defensive check: ensure the option exists
        if (optionValue === undefined || optionValue === null) {
          console.error(
            `Option ${option} not found in question. Available options: ${Object.keys(hostQuestion.options).join(', ')}`,
          );
          throw new Error(
            `Option ${option} not found in question. Available options: ${Object.keys(hostQuestion.options).join(', ')}`,
          );
        }

        filteredOptionsObj[lowercaseKey] = optionValue;
      });

      // Validate no undefined values exist
      const hasUndefined = Object.values(filteredOptionsObj).some(
        (val) => val === undefined,
      );
      if (hasUndefined) {
        throw new Error(
          'Filtered options object contains undefined values. Firebase will reject this.',
        );
      }

      // ============================================================
      // DATABASE OPERATION
      // ============================================================
      // Atomic updates to Firebase:
      //   1. game-state/active-lifeline = 'fifty-fifty'
      //   2. game-state/current-question/options = filteredOptionsObj
      //   3. teams/{teamId}/lifelines-available/fiftyFifty = false (PERMANENT)

      await databaseService.activateFiftyFiftyLifeline(
        currentTeamId,
        filteredOptionsObj,
      );

      // ============================================================
      // UPDATE LOCAL STATE
      // ============================================================

      setFilteredOptions(result.remainingOptions);
      setLifelineUsedThisQuestion(true);

      // Clear active lifeline after brief delay
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
      await databaseService.activatePhoneAFriendLifeline(currentTeamId);
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

    // Availability (reads from team's Firebase lifeline status)
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
