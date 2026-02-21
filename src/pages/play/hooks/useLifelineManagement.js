// src/pages/play/hooks/useLifelineManagement.js

import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '@stores/useGameStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { useQuestionsStore } from '@stores/useQuestionsStore';
import { databaseService } from '@services/database.service';
import { applyFiftyFifty } from '@utils/gameplay/lifelineLogic';
import { LIFELINE_TYPE } from '@constants/teamStates';
import { ANSWER_OPTIONS } from '@constants/config';
import { usePhoneTimer } from './usePhoneTimer';

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
 * Phone-a-Friend Flow:
 * 1. Host activates → Firebase updated, game PAUSED
 * 2. Modal shows team contact number
 * 3. Host dials, explains, hands over phone
 * 4. Host clicks "Start Timer" → 3-min countdown begins (local only)
 * 5. Timer expires → auto-resume OR host clicks "Resume Game" manually
 * 6. Resume → Firebase active-lifeline cleared, game set back to ACTIVE
 *
 * CRITICAL - LIFELINE PERSISTENCE:
 * Team lifeline availability (lifelinesAvailable) is stored in Firebase under:
 *   teams/{teamId}/lifelines-available/phoneAFriend: boolean
 *   teams/{teamId}/lifelines-available/fiftyFifty: boolean
 *
 * Once a lifeline is used (set to false), it PERSISTS across all questions for that team.
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

  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const currentQuestionNumber = useGameStore(
    (state) => state.currentQuestionNumber,
  );
  const questionVisible = useGameStore((state) => state.questionVisible);
  const answerRevealed = useGameStore((state) => state.answerRevealed);
  const pauseGame = useGameStore((state) => state.pauseGame);
  const resumeGame = useGameStore((state) => state.resumeGame);

  const teams = useTeamsStore((state) => state.teams);
  const currentTeam = teams[currentTeamId];

  const hostQuestion = useQuestionsStore((state) => state.hostQuestion);
  const setFilteredOptions = useQuestionsStore(
    (state) => state.setFilteredOptions,
  );

  // ============================================================
  // PHONE TIMER
  // ============================================================

  // Use a ref for the expiry callback to avoid circular dependency:
  // resumeFromPhoneAFriend references phoneTimer.reset,
  // and phoneTimer.onExpire needs to call resumeFromPhoneAFriend.
  const resumeCallbackRef = useRef(null);

  const phoneTimer = usePhoneTimer({
    onExpire: useCallback(() => {
      resumeCallbackRef.current?.();
    }, []),
  });

  /**
   * Start the phone-a-friend countdown.
   *
   * Wraps phoneTimer.start() (local tick) with a Firebase write so the
   * display app can derive remaining time from a shared timestamp — even
   * if it reconnects mid-call.
   *
   * Called from PhoneAFriendDialog via the onStartTimer prop.
   */
  const startPhoneTimer = useCallback(async () => {
    phoneTimer.start(); // start local countdown immediately
    await databaseService.startLifelineTimer(); // write timestamp to Firebase
  }, [phoneTimer]);

  // ============================================================
  // RESET ON NEW QUESTION
  // ============================================================

  useEffect(() => {
    setLifelineUsedThisQuestion(false);
    setActivationError(null);
    phoneTimer.reset();
    // phoneTimer.reset is stable — safe to include
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionNumber]);

  // ============================================================
  // AVAILABILITY CHECKS
  // ============================================================

  /**
   * Check if Phone-a-Friend is available for the current team.
   * Reads from live Firebase-synced team data.
   */
  const isPhoneAvailable = useCallback(() => {
    if (!currentTeam?.lifelinesAvailable) return false;
    return (
      currentTeam.lifelinesAvailable[LIFELINE_TYPE.PHONE_A_FRIEND] === true
    );
  }, [currentTeam]);

  /**
   * Check if 50/50 is available for the current team.
   * Reads from live Firebase-synced team data.
   */
  const isFiftyFiftyAvailable = useCallback(() => {
    if (!currentTeam?.lifelinesAvailable) return false;
    return currentTeam.lifelinesAvailable[LIFELINE_TYPE.FIFTY_FIFTY] === true;
  }, [currentTeam]);

  /**
   * Check if a lifeline can be used right now.
   * Validates all WWBAM rules before allowing activation.
   */
  const canUseLifeline = useCallback(
    (lifelineType) => {
      if (!questionVisible) return false;
      if (answerRevealed) return false;
      if (!hostQuestion) return false;
      if (lifelineUsedThisQuestion) return false;

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
      const result = applyFiftyFifty(
        ANSWER_OPTIONS,
        hostQuestion.correctAnswer.toUpperCase(),
      );

      // Build filtered options object for Firebase
      // ANSWER_OPTIONS uses uppercase; hostQuestion.options uses lowercase keys
      const filteredOptionsObj = {};

      ANSWER_OPTIONS.forEach((option) => {
        filteredOptionsObj[option.toLowerCase()] = null;
      });

      result.remainingOptions.forEach((option) => {
        const lowercaseKey = option.toLowerCase();
        const optionValue = hostQuestion.options[lowercaseKey];

        if (optionValue === undefined || optionValue === null) {
          throw new Error(
            `Option ${option} not found in question. Available: ${Object.keys(hostQuestion.options).join(', ')}`,
          );
        }

        filteredOptionsObj[lowercaseKey] = optionValue;
      });

      const hasUndefined = Object.values(filteredOptionsObj).some(
        (val) => val === undefined,
      );
      if (hasUndefined) {
        throw new Error(
          'Filtered options contain undefined values. Firebase will reject this.',
        );
      }

      // Atomic Firebase update:
      // 1. game-state/active-lifeline = 'fifty-fifty'
      // 2. game-state/current-question/options = filteredOptionsObj
      // 3. teams/{teamId}/lifelines-available/fiftyFifty = false (PERMANENT)
      await databaseService.activateFiftyFiftyLifeline(
        currentTeamId,
        filteredOptionsObj,
      );

      setFilteredOptions(result.remainingOptions);
      setLifelineUsedThisQuestion(true);

      // Clear active-lifeline flag after a short delay
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
      // Atomic Firebase update:
      // 1. game-state/active-lifeline = 'phone-a-friend'
      // 2. teams/{teamId}/lifelines-available/phoneAFriend = false (PERMANENT)
      await databaseService.activatePhoneAFriendLifeline(currentTeamId);

      // Pause the game so no other actions can be taken during the call
      await pauseGame();

      setLifelineUsedThisQuestion(true);

      console.log('📞 Phone-a-Friend activated — game paused');
      setIsActivating(false);

      return { success: true };
    } catch (error) {
      console.error('Failed to activate Phone-a-Friend:', error);
      setActivationError(error.message);
      setIsActivating(false);
      return { success: false, error: error.message };
    }
  }, [canUseLifeline, currentTeamId, pauseGame]);

  // ============================================================
  // RESUME FROM PHONE-A-FRIEND
  // ============================================================

  /**
   * Resume the game after Phone-a-Friend ends.
   * Called either manually (host button) or automatically (timer expiry).
   *
   * Actions:
   * 1. Clear active-lifeline in Firebase → null
   * 2. Resume game status → ACTIVE
   * 3. Reset the local countdown timer
   */
  const resumeFromPhoneAFriend = useCallback(async () => {
    try {
      await databaseService.clearLifelineTimer();
      await databaseService.clearActiveLifeline();
      await resumeGame();
      phoneTimer.reset();

      console.log('✅ Resumed from Phone-a-Friend — game active');
      return { success: true };
    } catch (error) {
      console.error('Failed to resume from Phone-a-Friend:', error);
      return { success: false, error: error.message };
    }
  }, [resumeGame, phoneTimer]);

  // Wire the resume callback into the timer's expiry ref
  resumeCallbackRef.current = resumeFromPhoneAFriend;

  // ============================================================
  // RETURN HOOK INTERFACE
  // ============================================================

  return {
    // State
    isActivating,
    activationError,
    lifelineUsedThisQuestion,

    // Availability (live from Firebase-synced team data)
    isPhoneAvailable: isPhoneAvailable(),
    isFiftyFiftyAvailable: isFiftyFiftyAvailable(),
    canUsePhone: canUseLifeline(LIFELINE_TYPE.PHONE_A_FRIEND),
    canUseFiftyFifty: canUseLifeline(LIFELINE_TYPE.FIFTY_FIFTY),

    // Phone timer (exposed for PhoneAFriendDialog)
    phoneTimer,
    startPhoneTimer,

    // Actions
    activateFiftyFifty,
    activatePhoneAFriend,
    resumeFromPhoneAFriend,
  };
}
