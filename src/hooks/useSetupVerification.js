// src/hooks/useSetupVerification.js

import { useMemo, useState, useEffect } from 'react';
import { useTeamsStore } from '@stores/useTeamsStore';
import { usePrizeStore } from '@stores/usePrizeStore';
import { useGameStore } from '@stores/useGameStore';
import { databaseService } from '@services/database.service';
import { GAME_STATUS } from '@constants/gameStates';
import {
  validateCompleteSetup,
  validateRequiredQuestionSets,
} from '@utils/setupValidation';

// Stable empty defaults to prevent unnecessary re-renders
const EMPTY_TEAMS = {};
const EMPTY_PRIZE_STRUCTURE = [];
const EMPTY_ASSIGNMENTS = {};

/**
 * Setup Verification Hook
 * Validates complete setup (teams, questions, prizes)
 * Returns validation status and detailed checks
 *
 * @param {number} refreshKey - Optional key to trigger re-validation (e.g., after uploads)
 */
export const useSetupVerification = (refreshKey = 0) => {
  // Get teams from store with stable default
  const teamsObject = useTeamsStore((state) =>
    state.teams ? state.teams : EMPTY_TEAMS,
  );

  // Get prize structure from store with stable default
  const prizeStructure = usePrizeStore(
    (state) => state.prizeStructure ?? EMPTY_PRIZE_STRUCTURE,
  );

  // Get game state to check if initialized
  const gameStatus = useGameStore((state) => state.gameStatus);

  // Get question set assignments with stable default
  const questionSetAssignments = useGameStore(
    (state) => state.questionSetAssignments ?? EMPTY_ASSIGNMENTS,
  );

  // Question sets metadata state
  const [questionSetsMetadata, setQuestionSetsMetadata] = useState([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  // Load question sets metadata from Firebase
  // refreshKey dependency is intentional - forces re-read when incremented
  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        const metadata = await databaseService.getQuestionSetsMetadata();
        setQuestionSetsMetadata(metadata.sets || []);
      } catch (error) {
        console.error('Failed to get question sets metadata:', error);
        setQuestionSetsMetadata([]);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    loadMetadata();
  }, [refreshKey]); // ← Intentional: triggers re-read when refreshKey changes

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

    // Validate that all required question sets are in Firebase
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
    isReady: validation.isReady && !isLoadingMetadata,
    hasWarnings: validation.hasWarnings,
    checks: validation.checks,
    summary: validation.summary,

    // Loading state
    isLoadingMetadata,

    // NEW: Missing required question sets detection
    isMissingRequiredQuestionSets,
    requiredQuestionSetsValidation,
    isGameInitialized,

    // Raw data for additional UI needs
    teams: Object.values(teamsObject),
    questionSets: questionSetsMetadata,
    prizeStructure: prizeStructure,
  };
};

export default useSetupVerification;
