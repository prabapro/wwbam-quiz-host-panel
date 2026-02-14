// src/utils/sampleDataLoader.js

import { localStorageService } from '@services/localStorage.service';
import { useTeamsStore } from '@stores/useTeamsStore';

/**
 * Sample Data Configuration
 * Defines paths to sample data files in /public/sample-data/
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
 * Fetch JSON file from public directory
 * @param {string} path - Path to JSON file
 * @returns {Promise<Object>} Parsed JSON data
 */
const fetchJSON = async (path) => {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Clear all existing data (teams and question sets)
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Result object
 */
const clearExistingData = async (onProgress) => {
  try {
    onProgress?.('Clearing existing data...');

    // Clear teams from Firebase (also clears localStorage via persist middleware)
    const deleteTeamsResult = await useTeamsStore
      .getState()
      .deleteAllTeamsFromFirebase();

    if (!deleteTeamsResult.success) {
      throw new Error('Failed to clear teams: ' + deleteTeamsResult.error);
    }

    // Clear question sets from localStorage
    const clearQuestionsResult = localStorageService.clearAllQuestionSets();

    if (!clearQuestionsResult.success) {
      throw new Error(
        'Failed to clear question sets: ' + clearQuestionsResult.error,
      );
    }

    console.log('✅ Existing data cleared successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to clear existing data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Load sample teams from JSON file
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Result object with loaded team count
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

    // Upload teams sequentially
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
 * @returns {Promise<Object>} Result object with loaded set count
 */
const loadSampleQuestionSets = async (onProgress) => {
  try {
    onProgress?.('Loading sample question sets...');

    const questionSetFiles = SAMPLE_FILES.questionSets;
    const uploadedSetIds = [];

    // Upload question sets sequentially
    for (let i = 0; i < questionSetFiles.length; i++) {
      const filePath = questionSetFiles[i];

      onProgress?.(
        `Uploading question set ${i + 1}/${questionSetFiles.length}...`,
      );

      // Fetch question set JSON
      const questionSet = await fetchJSON(filePath);

      // Save to localStorage (includes validation)
      const result = localStorageService.saveQuestionSet(questionSet);

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
    console.error('❌ Unexpected error loading sample data:', error);

    return {
      success: false,
      error: error.message || 'Unexpected error occurred',
    };
  }
};

export default loadSampleData;
