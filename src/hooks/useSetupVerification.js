// src/hooks/useSetupVerification.js

import { useMemo } from 'react';
import { useTeamsStore } from '@stores/useTeamsStore';
import { usePrizeStore } from '@stores/usePrizeStore';
import { useGameStore } from '@stores/useGameStore';
import { localStorageService } from '@services/localStorage.service';
import {
  validateCompleteSetup,
  validateRequiredQuestionSets,
} from '@utils/setupValidation';
import { GAME_STATUS } from '@constants/gameStates';

/**
 * Custom hook for setup verification
 * Monitors teams, question sets, and prize structure stores and provides real-time validation status
 *
 * Compatible with updated validation logic that properly handles:
 * - Empty teams/question sets (no false positives)
 * - Grouped check structure (teams, questions, prizes)
 * - Info status for 0/0 sufficient sets check
 * - Missing required question sets detection (for multi-browser edge case)
 *
 * @param {number} refreshKey - Optional key to force re-validation (increment to refresh)
 */
export const useSetupVerification = (refreshKey = 0) => {
  // Get teams from store with safe default
  const teamsObject = useTeamsStore((state) => state.teams) || {};

  // Get prize structure from store with safe default
  const prizeStructure = usePrizeStore((state) => state.prizeStructure) || [];

  // Get game state to check if initialized
  const gameStatus = useGameStore((state) => state.gameStatus);
  const questionSetAssignments =
    useGameStore((state) => state.questionSetAssignments) || {};

  // Get question sets metadata from localStorage
  // Now includes refreshKey as dependency to re-read when it changes
  const questionSetsMetadata = useMemo(() => {
    try {
      const metadata = localStorageService.getQuestionSetsMetadata();
      return metadata.sets || [];
    } catch (error) {
      console.error('Failed to get question sets metadata:', error);
      return [];
    }
  }, [refreshKey]); // ← Now dependent on refreshKey

  // Check if game is initialized
  const isGameInitialized = gameStatus !== GAME_STATUS.NOT_STARTED;

  // NEW: Validate required question sets (for initialized games on new browsers)
  const requiredQuestionSetsValidation = useMemo(() => {
    // Only run this validation if game is initialized
    if (!isGameInitialized) {
      return {
        allFound: true,
        requiredSetIds: [],
        missingSetIds: [],
        foundSetIds: [],
        missingCount: 0,
        foundCount: 0,
      };
    }

    // Validate that all required question sets are in localStorage
    return validateRequiredQuestionSets(
      questionSetAssignments,
      questionSetsMetadata,
    );
  }, [isGameInitialized, questionSetAssignments, questionSetsMetadata]);

  // Perform standard validation
  const validation = useMemo(() => {
    return validateCompleteSetup(
      teamsObject,
      questionSetsMetadata,
      prizeStructure,
    );
  }, [teamsObject, questionSetsMetadata, prizeStructure]);

  // Determine if we're in the "missing required question sets" scenario
  const isMissingRequiredQuestionSets =
    isGameInitialized && !requiredQuestionSetsValidation.allFound;

  return {
    // Standard validation result
    ...validation,

    // Quick accessors
    isReady: validation.isReady,
    hasWarnings: validation.hasWarnings,
    checks: validation.checks,
    summary: validation.summary,

    // NEW: Missing required question sets detection
    isMissingRequiredQuestionSets,
    requiredQuestionSetsValidation,
    isGameInitialized,

    // Raw data for additional UI needs
    teams: Object.values(teamsObject || {}),
    questionSets: questionSetsMetadata,
    prizeStructure: prizeStructure || [],
  };
};

export default useSetupVerification;
