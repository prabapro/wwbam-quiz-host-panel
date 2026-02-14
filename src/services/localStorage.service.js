// src/services/localStorage.service.js

/**
 * LocalStorage Service
 * Handles persistent storage of question sets using browser localStorage
 * Provides CRUD operations with validation
 */

import { validateQuestionSet } from '@utils/validation';
import { isValidSetId } from '@constants/validationRules';
import { QUESTIONS_PER_SET } from '@constants/config';
import {
  QUESTION_SETS_KEY,
  METADATA_KEY,
  STORAGE_LIMIT_BYTES,
  getStorageUsage,
} from '@constants/storage';

/**
 * Get all question sets from localStorage
 * @returns {Object} Object with setId as keys
 */
export const getAllQuestionSets = () => {
  try {
    const stored = localStorage.getItem(QUESTION_SETS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to get question sets:', error);
    return {};
  }
};

/**
 * Get a specific question set by ID
 * @param {string} setId - Question set ID
 * @returns {Object|null} Question set or null if not found
 */
export const getQuestionSet = (setId) => {
  if (!isValidSetId(setId)) {
    console.warn('Invalid set ID:', setId);
    return null;
  }

  const allSets = getAllQuestionSets();
  return allSets[setId] || null;
};

/**
 * Save a new question set to localStorage
 * @param {Object} questionSet - Question set object
 * @returns {Object} Result with success status
 */
export const saveQuestionSet = (questionSet) => {
  if (!questionSet || typeof questionSet !== 'object') {
    return {
      success: false,
      error: 'Invalid question set',
    };
  }

  // Validate question set
  const validation = validateQuestionSet(questionSet);

  if (!validation.isValid) {
    return {
      success: false,
      error: 'Validation failed',
      validationErrors: validation,
    };
  }

  const { setId } = questionSet;

  try {
    const allSets = getAllQuestionSets();

    // Check if set already exists
    if (allSets[setId]) {
      return {
        success: false,
        error: `Question set '${setId}' already exists. Please use a different ID or delete the existing set first.`,
      };
    }

    // Trim questions array to QUESTIONS_PER_SET
    const trimmedQuestions = questionSet.questions.slice(0, QUESTIONS_PER_SET);

    const trimmedQuestionSet = {
      ...questionSet,
      questions: trimmedQuestions,
      totalQuestions: trimmedQuestions.length,
    };

    // Log if questions were trimmed
    if (questionSet.questions.length > QUESTIONS_PER_SET) {
      console.log(
        `✂️ Trimmed question set from ${questionSet.questions.length} to ${QUESTIONS_PER_SET} questions`,
      );
    }

    // Add timestamps
    const setWithMetadata = {
      ...trimmedQuestionSet,
      uploadedAt: Date.now(),
      lastModified: Date.now(),
    };

    // Check storage space before saving
    const testData = JSON.stringify({
      ...allSets,
      [setId]: setWithMetadata,
    });

    if (testData.length * 2 > STORAGE_LIMIT_BYTES) {
      return {
        success: false,
        error: 'Storage limit exceeded. Please delete some question sets.',
      };
    }

    // Save to localStorage
    allSets[setId] = setWithMetadata;
    localStorage.setItem(QUESTION_SETS_KEY, JSON.stringify(allSets));

    // Update metadata
    updateMetadata();

    console.log(
      `✅ Question set saved: ${setId} (${trimmedQuestions.length} questions)`,
    );

    return {
      success: true,
      setId,
      data: setWithMetadata,
    };
  } catch (error) {
    console.error(`Failed to save question set ${setId}:`, error);

    if (error.name === 'QuotaExceededError') {
      return {
        success: false,
        error: 'Storage quota exceeded. Please delete some question sets.',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to save question set',
    };
  }
};

/**
 * Update an existing question set
 * @param {string} setId - Question set ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Result with success status
 */
export const updateQuestionSet = (setId, updates) => {
  if (!isValidSetId(setId)) {
    return {
      success: false,
      error: 'Invalid set ID',
    };
  }

  try {
    const allSets = getAllQuestionSets();

    if (!allSets[setId]) {
      return {
        success: false,
        error: `Question set '${setId}' not found`,
      };
    }

    // Merge updates
    const updatedSet = {
      ...allSets[setId],
      ...updates,
      setId, // Preserve original ID
      lastModified: Date.now(),
    };

    // If questions are being updated, trim to QUESTIONS_PER_SET
    if (updates.questions && Array.isArray(updates.questions)) {
      updatedSet.questions = updates.questions.slice(0, QUESTIONS_PER_SET);
      updatedSet.totalQuestions = updatedSet.questions.length;

      if (updates.questions.length > QUESTIONS_PER_SET) {
        console.log(
          `✂️ Trimmed updated questions from ${updates.questions.length} to ${QUESTIONS_PER_SET}`,
        );
      }
    }

    // Validate updated set
    const validation = validateQuestionSet(updatedSet);

    if (!validation.isValid) {
      return {
        success: false,
        error: 'Updated question set validation failed',
        validationErrors: validation,
      };
    }

    // Save updated set
    allSets[setId] = updatedSet;
    localStorage.setItem(QUESTION_SETS_KEY, JSON.stringify(allSets));

    updateMetadata();

    console.log(`✅ Question set updated: ${setId}`);

    return {
      success: true,
      setId,
      data: updatedSet,
    };
  } catch (error) {
    console.error(`Failed to update question set ${setId}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to update question set',
    };
  }
};

/**
 * Delete a question set
 * @param {string} setId - Question set ID
 * @returns {Object} Result with success status
 */
export const deleteQuestionSet = (setId) => {
  if (!isValidSetId(setId)) {
    return {
      success: false,
      error: 'Invalid set ID',
    };
  }

  try {
    const allSets = getAllQuestionSets();

    if (!allSets[setId]) {
      return {
        success: false,
        error: `Question set '${setId}' not found`,
      };
    }

    // Remove from storage
    delete allSets[setId];
    localStorage.setItem(QUESTION_SETS_KEY, JSON.stringify(allSets));

    updateMetadata();

    console.log(`✅ Question set deleted: ${setId}`);

    return {
      success: true,
      setId,
    };
  } catch (error) {
    console.error(`Failed to delete question set ${setId}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to delete question set',
    };
  }
};

/**
 * Get question set metadata summary
 * @returns {Object} Metadata about stored question sets
 */
export const getQuestionSetsMetadata = () => {
  try {
    const allSets = getAllQuestionSets();
    const setIds = Object.keys(allSets);

    return {
      totalSets: setIds.length,
      setIds,
      sets: setIds.map((id) => ({
        setId: id,
        setName: allSets[id].setName,
        // Use questions array length instead of totalQuestions field
        totalQuestions: Array.isArray(allSets[id].questions)
          ? allSets[id].questions.length
          : 0,
        uploadedAt: allSets[id].uploadedAt,
        lastModified: allSets[id].lastModified,
      })),
    };
  } catch (error) {
    console.error('Failed to get metadata:', error);
    return {
      totalSets: 0,
      setIds: [],
      sets: [],
    };
  }
};

/**
 * Update global metadata
 * @private
 */
const updateMetadata = () => {
  try {
    const metadata = {
      lastUpdated: Date.now(),
      ...getQuestionSetsMetadata(),
    };
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.warn('Failed to update metadata:', error);
  }
};

/**
 * Check if a question set exists
 * @param {string} setId - Question set ID
 * @returns {boolean} True if exists
 */
export const questionSetExists = (setId) => {
  const allSets = getAllQuestionSets();
  return setId in allSets;
};

/**
 * Get available storage space info
 * @returns {Object} Storage usage information
 */
export const getStorageInfo = () => {
  try {
    // Use centralized storage utility
    const usage = getStorageUsage();

    if (!usage) {
      return null;
    }

    // Add question sets specific info
    const allSets = getAllQuestionSets();
    const setsSize = JSON.stringify(allSets).length;

    return {
      ...usage,
      questionSetsSize: setsSize,
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return null;
  }
};

/**
 * Clear all question sets (use with caution!)
 * @returns {Object} Result with success status
 */
export const clearAllQuestionSets = () => {
  try {
    localStorage.removeItem(QUESTION_SETS_KEY);
    localStorage.removeItem(METADATA_KEY);

    console.log('✅ All question sets cleared');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Failed to clear question sets:', error);
    return {
      success: false,
      error: error.message || 'Failed to clear question sets',
    };
  }
};

/**
 * Export question set as JSON string
 * @param {string} setId - Question set ID
 * @returns {string|null} JSON string or null if error
 */
export const exportQuestionSet = (setId) => {
  const questionSet = getQuestionSet(setId);

  if (!questionSet) {
    return null;
  }

  try {
    return JSON.stringify(questionSet, null, 2);
  } catch (error) {
    console.error(`Failed to export question set ${setId}:`, error);
    return null;
  }
};

/**
 * Import question set from JSON string
 * @param {string} jsonString - JSON string of question set
 * @returns {Object} Result with success status
 */
export const importQuestionSet = (jsonString) => {
  try {
    const questionSet = JSON.parse(jsonString);
    return saveQuestionSet(questionSet);
  } catch (error) {
    console.error('Failed to import question set:', error);
    return {
      success: false,
      error: 'Invalid JSON or question set format',
    };
  }
};

// Export all functions as a service object
export const localStorageService = {
  getAllQuestionSets,
  getQuestionSet,
  saveQuestionSet,
  updateQuestionSet,
  deleteQuestionSet,
  getQuestionSetsMetadata,
  questionSetExists,
  getStorageInfo,
  clearAllQuestionSets,
  exportQuestionSet,
  importQuestionSet,
};

export default localStorageService;
