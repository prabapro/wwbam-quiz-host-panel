// src/hooks/useSetupVerification.js

import { useMemo, useState, useEffect } from 'react';
import { useTeamsStore } from '@stores/useTeamsStore';
import { usePrizeStore } from '@stores/usePrizeStore';
import { useGameStore } from '@stores/useGameStore';
import { databaseService } from '@services/database.service';
import { GAME_STATUS } from '@constants/gameStates';
import { validateCompleteSetup } from '@utils/setupValidation';

// Stable empty defaults to prevent unnecessary re-renders
const EMPTY_TEAMS = {};
const EMPTY_PRIZE_STRUCTURE = [];

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

  // Perform standard validation
  const validation = useMemo(() => {
    return validateCompleteSetup(
      teamsObject,
      questionSetsMetadata,
      prizeStructure,
    );
  }, [teamsObject, questionSetsMetadata, prizeStructure]);

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

    // Game state
    isGameInitialized,

    // Raw data for additional UI needs
    teams: Object.values(teamsObject),
    questionSets: questionSetsMetadata,
    prizeStructure: prizeStructure,
  };
};

export default useSetupVerification;
