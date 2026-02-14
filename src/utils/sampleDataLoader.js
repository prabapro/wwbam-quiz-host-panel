// src/utils/sampleDataLoader.js

/**
 * Sample Data Loader Utility
 *
 * Purpose: Load sample teams and question sets from /public/sample-data/
 * Used for testing and demonstrations
 *
 * Features:
 * - Loads sample teams JSON
 * - Loads sample question set ZIPs
 * - Clears existing data first (atomic operation)
 * - Progress callbacks for UI feedback
 * - Comprehensive error handling
 *
 * Usage:
 * const result = await loadSampleData((message) => {
 *   console.log(message);
 * });
 *
 * if (result.success) {
 *   console.log(`Loaded ${result.teams.count} teams and ${result.questionSets.count} sets`);
 * }
 */

import { databaseService } from '@services/database.service';
import { useTeamsStore } from '@stores/useTeamsStore';

/**
 * Sample data file paths
 */
const SAMPLE_FILES = {
  teams: '/sample-data/sample-teams.json',
  questionSets: [
    '/sample-data/sample-question-set-01.json',
    '/sample-data/sample-question-set-02.json',
    '/sample-data/sample-question-set-03.json',
    '/sample-data/sample-question-set-04.json',
  ],
};

/**
 * Fetch JSON from public folder
 * @param {string} path - Path to JSON file
 * @returns {Promise<Object>} Parsed JSON data
 */
const fetchJSON = async (path) => {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Clear existing data (teams and question sets)
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Result object
 */
const clearExistingData = async (onProgress) => {
  try {
    onProgress?.('Clearing existing data...');

    // 1. Clear all teams from Firebase
    await databaseService.deleteAllTeams();

    // 2. Clear all question sets from Firebase
    const existingSets = await databaseService.getAllQuestionSets();

    if (existingSets) {
      const setIds = Object.keys(existingSets);

      for (const setId of setIds) {
        await databaseService.deleteQuestionSet(setId);
      }

      console.log(`🗑️ Deleted ${setIds.length} existing question sets`);
    }

    console.log('✅ Existing data cleared');

    return { success: true };
  } catch (error) {
    console.error('Failed to clear existing data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Load sample teams from JSON file
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Result object with loaded team IDs
 */
const loadSampleTeams = async (onProgress) => {
  try {
    onProgress?.('Loading sample teams...');

    // Fetch teams JSON
    const teamsData = await fetchJSON(SAMPLE_FILES.teams);

    if (!teamsData.teams || !Array.isArray(teamsData.teams)) {
      throw new Error('Invalid teams JSON structure');
    }

    const teams = teamsData.teams;
    const uploadedTeamIds = [];

    // Upload teams sequentially to Firebase
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];

      onProgress?.(`Uploading team ${i + 1}/${teams.length}: ${team.name}...`);

      const result = await useTeamsStore.getState().addTeam({
        name: team.name,
        participants: team.participants,
        contact: team.contact,
      });

      if (!result.success) {
        throw new Error(
          `Failed to upload team "${team.name}": ${result.error}`,
        );
      }

      uploadedTeamIds.push(result.teamId);
      console.log(`✅ Uploaded team: ${team.name} (${result.teamId})`);
    }

    console.log(`✅ Successfully uploaded ${teams.length} teams`);

    return {
      success: true,
      count: teams.length,
      teamIds: uploadedTeamIds,
    };
  } catch (error) {
    console.error('❌ Failed to load sample teams:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Load sample question sets from JSON files
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Result object with loaded set IDs
 */
const loadSampleQuestionSets = async (onProgress) => {
  try {
    onProgress?.('Loading sample question sets...');

    const questionSetFiles = SAMPLE_FILES.questionSets;
    const uploadedSetIds = [];

    // Upload question sets sequentially to Firebase
    for (let i = 0; i < questionSetFiles.length; i++) {
      const filePath = questionSetFiles[i];

      onProgress?.(
        `Uploading question set ${i + 1}/${questionSetFiles.length}...`,
      );

      // Fetch question set JSON
      const questionSet = await fetchJSON(filePath);

      // Save to Firebase (includes validation)
      const result = await databaseService.saveQuestionSet(questionSet);

      if (!result.success) {
        throw new Error(
          `Failed to upload question set from "${filePath}": ${result.error}`,
        );
      }

      uploadedSetIds.push(result.setId);
      console.log(`✅ Uploaded question set: ${result.setId}`);
    }

    console.log(
      `✅ Successfully uploaded ${questionSetFiles.length} question sets`,
    );

    return {
      success: true,
      count: questionSetFiles.length,
      setIds: uploadedSetIds,
    };
  } catch (error) {
    console.error('❌ Failed to load sample question sets:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Load all sample data (teams and question sets)
 * Clears existing data first, then loads fresh sample data
 *
 * @param {Function} onProgress - Optional callback for progress updates
 * @returns {Promise<Object>} Result object with success status and details
 *
 * @example
 * const result = await loadSampleData((message) => {
 *   console.log(message);
 * });
 *
 * if (result.success) {
 *   console.log(`Loaded ${result.teams.count} teams and ${result.questionSets.count} sets`);
 * }
 */
export const loadSampleData = async (onProgress) => {
  const startTime = Date.now();

  try {
    console.log('🔄 Starting sample data load...');

    // Step 1: Clear existing data
    const clearResult = await clearExistingData(onProgress);

    if (!clearResult.success) {
      return {
        success: false,
        error: 'Failed to clear existing data: ' + clearResult.error,
      };
    }

    // Step 2: Load sample teams
    const teamsResult = await loadSampleTeams(onProgress);

    if (!teamsResult.success) {
      return {
        success: false,
        error: 'Failed to load teams: ' + teamsResult.error,
        teams: teamsResult,
      };
    }

    // Step 3: Load sample question sets
    const questionSetsResult = await loadSampleQuestionSets(onProgress);

    if (!questionSetsResult.success) {
      return {
        success: false,
        error: 'Failed to load question sets: ' + questionSetsResult.error,
        teams: teamsResult,
        questionSets: questionSetsResult,
      };
    }

    const elapsed = Date.now() - startTime;

    console.log(
      `✅ Sample data loaded successfully in ${elapsed}ms:`,
      `${teamsResult.count} teams, ${questionSetsResult.count} question sets`,
    );

    onProgress?.('Sample data loaded successfully!');

    return {
      success: true,
      teams: teamsResult,
      questionSets: questionSetsResult,
      elapsed,
    };
  } catch (error) {
    console.error('❌ Sample data load failed:', error);

    return {
      success: false,
      error: error.message || 'Unknown error during sample data load',
    };
  }
};

/**
 * Check if sample data files exist
 * @returns {Promise<boolean>} True if all sample files exist
 */
export const checkSampleDataExists = async () => {
  try {
    // Check teams file
    const teamsResponse = await fetch(SAMPLE_FILES.teams, { method: 'HEAD' });

    if (!teamsResponse.ok) return false;

    // Check question set files
    for (const filePath of SAMPLE_FILES.questionSets) {
      const response = await fetch(filePath, { method: 'HEAD' });
      if (!response.ok) return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to check sample data files:', error);
    return false;
  }
};
