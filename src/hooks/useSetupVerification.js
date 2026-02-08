// src/hooks/useSetupVerification.js

import { useMemo } from 'react';
import { useTeamsStore } from '@stores/useTeamsStore';
import { localStorageService } from '@services/localStorage.service';
import { validateCompleteSetup } from '@utils/setupValidation';

/**
 * Custom hook for setup verification
 * Monitors teams and question sets stores and provides real-time validation status
 */
export const useSetupVerification = () => {
  // Get teams from store
  const teamsObject = useTeamsStore((state) => state.teams);

  // Get question sets metadata from localStorage
  const questionSetsMetadata = useMemo(() => {
    try {
      const metadata = localStorageService.getQuestionSetsMetadata();
      return metadata.sets || [];
    } catch (error) {
      console.error('Failed to get question sets metadata:', error);
      return [];
    }
  }, []);

  // Perform validation
  const validation = useMemo(() => {
    return validateCompleteSetup(teamsObject, questionSetsMetadata);
  }, [teamsObject, questionSetsMetadata]);

  return {
    // Validation result
    ...validation,

    // Quick accessors
    isReady: validation.isReady,
    hasWarnings: validation.hasWarnings,
    checks: validation.checks,
    summary: validation.summary,

    // Raw data for additional UI needs
    teams: Object.values(teamsObject),
    questionSets: questionSetsMetadata,
  };
};

export default useSetupVerification;
