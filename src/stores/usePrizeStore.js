// src/stores/usePrizeStore.js

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { databaseService } from '@services/database.service';
import { DEFAULT_PRIZE_STRUCTURE } from '@constants/prizeStructure';

const appName = import.meta.env.VITE_APP_NAME || 'wwbam-quiz-host-panel';

/**
 * Prize Structure Store
 * Manages prize structure state and Firebase synchronization
 */
export const usePrizeStore = create()(
  devtools(
    persist(
      (set, get) => ({
        // ============================================================
        // STATE
        // ============================================================

        // Current prize structure (array of numbers)
        prizeStructure: [],

        // Edited prize structure (local changes before save)
        editedPrizeStructure: [],

        // Whether user has unsaved changes
        hasUnsavedChanges: false,

        // Loading state for Firebase operations
        isLoading: false,

        // Syncing state
        isSyncing: false,

        // Error state
        error: null,

        // Last sync timestamp
        lastSyncedAt: null,

        // ============================================================
        // ACTIONS
        // ============================================================

        /**
         * Load prize structure from Firebase
         */
        loadPrizeStructure: async () => {
          set({ isLoading: true, error: null });

          try {
            const firebasePrizes = await databaseService.getPrizeStructure();

            if (firebasePrizes && Array.isArray(firebasePrizes)) {
              set({
                prizeStructure: firebasePrizes,
                editedPrizeStructure: [...firebasePrizes],
                isLoading: false,
                lastSyncedAt: Date.now(),
              });
              console.log('✅ Prize structure loaded from Firebase');
            } else {
              // No prize structure in Firebase - use default
              set({
                prizeStructure: DEFAULT_PRIZE_STRUCTURE,
                editedPrizeStructure: [...DEFAULT_PRIZE_STRUCTURE],
                isLoading: false,
              });
              console.log('📋 No prize structure in Firebase - using default');
            }

            return { success: true };
          } catch (error) {
            console.error('Failed to load prize structure:', error);
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
          }
        },

        /**
         * Save prize structure to Firebase
         */
        savePrizeStructure: async () => {
          const { editedPrizeStructure } = get();

          set({ isSyncing: true, error: null });

          try {
            await databaseService.setPrizeStructure(editedPrizeStructure);

            set({
              prizeStructure: [...editedPrizeStructure],
              hasUnsavedChanges: false,
              isSyncing: false,
              lastSyncedAt: Date.now(),
            });

            console.log('✅ Prize structure saved to Firebase');

            return { success: true };
          } catch (error) {
            console.error('Failed to save prize structure:', error);
            set({ isSyncing: false, error: error.message });
            return { success: false, error: error.message };
          }
        },

        /**
         * Update a single prize value
         */
        updatePrizeValue: (index, value) => {
          const { editedPrizeStructure } = get();

          const newStructure = [...editedPrizeStructure];
          newStructure[index] = value;

          set({
            editedPrizeStructure: newStructure,
            hasUnsavedChanges: true,
          });
        },

        /**
         * Add a new prize level
         */
        addPrizeLevel: () => {
          const { editedPrizeStructure } = get();

          const lastValue =
            editedPrizeStructure[editedPrizeStructure.length - 1] || 0;
          const newValue = lastValue + 500;

          set({
            editedPrizeStructure: [...editedPrizeStructure, newValue],
            hasUnsavedChanges: true,
          });
        },

        /**
         * Remove last prize level
         */
        removePrizeLevel: () => {
          const { editedPrizeStructure } = get();

          if (editedPrizeStructure.length <= 1) {
            console.warn('Cannot remove - must have at least 1 prize level');
            return;
          }

          const newStructure = editedPrizeStructure.slice(0, -1);

          set({
            editedPrizeStructure: newStructure,
            hasUnsavedChanges: true,
          });
        },

        /**
         * Reset to default prize structure
         */
        useDefaultStructure: () => {
          set({
            editedPrizeStructure: [...DEFAULT_PRIZE_STRUCTURE],
            hasUnsavedChanges: true,
          });

          console.log('📋 Using default prize structure');
        },

        /**
         * Reset to saved Firebase structure (discard changes)
         */
        discardChanges: () => {
          const { prizeStructure } = get();

          set({
            editedPrizeStructure: [...prizeStructure],
            hasUnsavedChanges: false,
          });

          console.log('🔄 Changes discarded');
        },

        /**
         * Validate prize structure
         */
        validatePrizeStructure: (structure = null) => {
          const prizes = structure || get().editedPrizeStructure;

          const errors = [];

          if (!Array.isArray(prizes)) {
            errors.push('Prize structure must be an array');
            return { isValid: false, errors };
          }

          if (prizes.length === 0) {
            errors.push('Must have at least 1 prize level');
            return { isValid: false, errors };
          }

          prizes.forEach((prize, index) => {
            if (typeof prize !== 'number' || isNaN(prize)) {
              errors.push(`Question ${index + 1}: Prize must be a number`);
            } else if (prize < 0) {
              errors.push(`Question ${index + 1}: Prize cannot be negative`);
            }
          });

          return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : null,
          };
        },

        /**
         * Get prize structure summary
         * Note: Total prize pool = maxPrizePerTeam × teamCount
         * Use getTotalPrizePool(teamCount, editedPrizeStructure) for actual pool calculation
         */
        getPrizeSummary: () => {
          const { editedPrizeStructure } = get();

          const min = Math.min(...editedPrizeStructure);
          const max = Math.max(...editedPrizeStructure);

          return {
            totalQuestions: editedPrizeStructure.length,
            maxPrizePerTeam: max,
            minPrize: min,
            maxPrize: max,
          };
        },

        /**
         * Clear error
         */
        clearError: () => set({ error: null }),
      }),
      {
        name: `${appName}-prizes`,
        version: 1,

        // Don't persist loading/error states
        partialize: (state) => ({
          prizeStructure: state.prizeStructure,
          lastSyncedAt: state.lastSyncedAt,
        }),

        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.warn(
              '💰 Prizes: Failed to hydrate from localStorage:',
              error,
            );
            return;
          }

          if (state) {
            console.log('💰 Prizes: Hydrated from localStorage');

            // Initialize edited structure with saved structure
            state.editedPrizeStructure = [...state.prizeStructure];
            state.hasUnsavedChanges = false;

            // AUTO-LOAD: Check if prize structure is empty (cleared localStorage or first load)
            const hasPrizes =
              state.prizeStructure && state.prizeStructure.length > 0;

            if (!hasPrizes) {
              console.log(
                '💰 Prizes: Empty state detected - auto-loading from Firebase...',
              );

              // Trigger async load - don't await to avoid blocking rehydration
              state.loadPrizeStructure().then((result) => {
                if (result.success) {
                  console.log('💰 Prizes: Auto-load complete ✅');
                } else {
                  console.warn('💰 Prizes: Auto-load failed ⚠️', result.error);
                }
              });
            } else {
              console.log(
                `💰 Prizes: ${state.prizeStructure.length} prize level(s) loaded from localStorage`,
              );
            }
          }
        },
      },
    ),
    {
      name: 'prize-store',
    },
  ),
);

export default usePrizeStore;
