// src/services/localStorage.service.js

import { validateQuestionSet, isValidSetId } from '@utils/validation';

/**
 * localStorage Service
 * Manages question sets in browser's localStorage with validation
 */

const STORAGE_PREFIX = 'wwbam-quiz-';
const QUESTION_SETS_KEY = `${STORAGE_PREFIX}question-sets`;
const METADATA_KEY = `${STORAGE_PREFIX}metadata`;

/**
 * Get all question sets from localStorage
 * @returns {Object} Object with set IDs as keys
 */
export const getAllQuestionSets = () => {
  try {
    const stored = localStorage.getItem(QUESTION_SETS_KEY);
    if (!stored) {
      return {};
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to retrieve question sets:', error);
    return {};
  }
};

/**
 * Get a single question set by ID
 * @param {string} setId - Question set ID
 * @returns {Object|null} Question set or null if not found
 */
export const getQuestionSet = (setId) => {
  if (!isValidSetId(setId)) {
    console.warn(`Invalid set ID: ${setId}`);
    return null;
  }

  try {
    const allSets = getAllQuestionSets();
    return allSets[setId] || null;
  } catch (error) {
    console.error(`Failed to retrieve question set ${setId}:`, error);
    return null;
  }
};

/**
 * Save a question set to localStorage
 * @param {Object} questionSet - Question set object
 * @returns {Object} Result with success status and any errors
 */
export const saveQuestionSet = (questionSet) => {
  // Validate question set first
  const validation = validateQuestionSet(questionSet);

  if (!validation.isValid) {
    return {
      success: false,
      error: 'Question set validation failed',
      validationErrors: validation,
    };
  }

  try {
    const allSets = getAllQuestionSets();

    // Check if set already exists
    if (allSets[questionSet.setId]) {
      return {
        success: false,
        error: `Question set with ID '${questionSet.setId}' already exists`,
      };
    }

    // Add upload metadata
    const setWithMetadata = {
      ...questionSet,
      uploadedAt: Date.now(),
      lastModified: Date.now(),
    };

    // Save to storage
    allSets[questionSet.setId] = setWithMetadata;
    localStorage.setItem(QUESTION_SETS_KEY, JSON.stringify(allSets));

    // Update metadata
    updateMetadata();

    console.log(`✅ Question set saved: ${questionSet.setId}`);

    return {
      success: true,
      setId: questionSet.setId,
      data: setWithMetadata,
    };
  } catch (error) {
    console.error('Failed to save question set:', error);

    // Handle quota exceeded error
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
        totalQuestions: allSets[id].totalQuestions || allSets[id].questions?.length || 0,
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
    // Estimate storage usage
    const allSets = getAllQuestionSets();
    const setsSize = JSON.stringify(allSets).length;

    // Calculate approximate total localStorage usage
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }

    // Most browsers limit localStorage to ~5-10MB
    const limit = 5 * 1024 * 1024; // 5MB estimate

    return {
      questionSetsSize: setsSize,
      totalUsed: total,
      estimatedLimit: limit,
      percentUsed: ((total / limit) * 100).toFixed(2),
      availableSpace: limit - total,
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
