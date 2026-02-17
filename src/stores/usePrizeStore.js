// src/stores/usePrizeStore.js

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { databaseService } from '@services/database.service';
import { DEFAULT_PRIZE_STRUCTURE } from '@constants/defaultDatabase';

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

        prizeStructure: [],
        editedPrizeStructure: [],
        hasUnsavedChanges: false,
        isLoading: false,
        isSyncing: false,
        error: null,
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
         * Load default prize structure into the editor (local only — no Firebase write).
         * The user still needs to hit Save to persist the change.
         */
        loadDefaultStructure: () => {
          set({
            editedPrizeStructure: [...DEFAULT_PRIZE_STRUCTURE],
            hasUnsavedChanges: true,
          });
          console.log('📋 Default prize structure loaded into editor');
        },

        /**
         * Discard unsaved changes — resets editor back to the last saved structure.
         */
        discardChanges: () => {
          const { prizeStructure } = get();
          set({
            editedPrizeStructure: [...prizeStructure],
            hasUnsavedChanges: false,
          });
          console.log('↩️ Prize structure changes discarded');
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
         * Reset edited structure to saved structure
         * @deprecated Use discardChanges instead
         */
        resetEditedStructure: () => {
          const { prizeStructure } = get();
          set({
            editedPrizeStructure: [...prizeStructure],
            hasUnsavedChanges: false,
          });
        },

        /**
         * Add a new prize level
         */
        addPrizeLevel: (value) => {
          const { editedPrizeStructure } = get();
          set({
            editedPrizeStructure: [...editedPrizeStructure, value],
            hasUnsavedChanges: true,
          });
        },

        /**
         * Remove a prize level
         */
        removePrizeLevel: (index) => {
          const { editedPrizeStructure } = get();
          const newStructure = editedPrizeStructure.filter(
            (_, i) => i !== index,
          );
          set({
            editedPrizeStructure: newStructure,
            hasUnsavedChanges: true,
          });
        },

        /**
         * Get prize by index
         */
        getPrizeByIndex: (index) => {
          const { prizeStructure } = get();
          return prizeStructure[index] || 0;
        },

        /**
         * Check if there are unsaved changes
         */
        hasChanges: () => {
          const { prizeStructure, editedPrizeStructure } = get();
          return (
            JSON.stringify(prizeStructure) !==
            JSON.stringify(editedPrizeStructure)
          );
        },

        /**
         * Validate prize structure
         */
        validatePrizeStructure: () => {
          const { editedPrizeStructure } = get();

          const errors = [];

          if (!editedPrizeStructure || editedPrizeStructure.length === 0) {
            errors.push('Prize structure cannot be empty');
          }

          editedPrizeStructure.forEach((prize, index) => {
            if (typeof prize !== 'number' || prize < 0) {
              errors.push(`Prize at index ${index} must be a positive number`);
            }
          });

          return {
            isValid: errors.length === 0,
            errors,
          };
        },

        /**
         * Get prize structure summary
         */
        getPrizeSummary: () => {
          const { editedPrizeStructure } = get();

          if (!editedPrizeStructure || editedPrizeStructure.length === 0) {
            return {
              totalQuestions: 0,
              maxPrizePerTeam: 0,
              minPrize: 0,
              maxPrize: 0,
            };
          }

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
         * Reset to default prize structure (for factory reset).
         * Immediately syncs to both local state and Firebase.
         * @returns {Promise<{ success: boolean, error?: string }>}
         */
        resetToDefault: async () => {
          set({ isSyncing: true, error: null });

          try {
            await databaseService.setPrizeStructure(DEFAULT_PRIZE_STRUCTURE);

            set({
              prizeStructure: [...DEFAULT_PRIZE_STRUCTURE],
              editedPrizeStructure: [...DEFAULT_PRIZE_STRUCTURE],
              hasUnsavedChanges: false,
              isSyncing: false,
              lastSyncedAt: Date.now(),
            });

            console.log(
              '✅ Prize structure reset to defaults and synced to Firebase',
            );

            return { success: true };
          } catch (error) {
            console.error('Failed to reset prize structure:', error);
            set({ isSyncing: false, error: error.message });
            return { success: false, error: error.message };
          }
        },

        /**
         * Start real-time Firebase listener for prize structure changes.
         * Returns unsubscribe function for cleanup.
         */
        startPrizeListener: () => {
          console.log('🔄 Starting real-time prize structure listener...');

          const unsubscribe = databaseService.onPrizeStructureChange(
            (firebasePrizes) => {
              if (firebasePrizes && Array.isArray(firebasePrizes)) {
                const { editedPrizeStructure } = get();
                const hasLocalEdits =
                  JSON.stringify(firebasePrizes) !==
                  JSON.stringify(editedPrizeStructure);

                if (!hasLocalEdits || !get().hasUnsavedChanges) {
                  set({
                    prizeStructure: firebasePrizes,
                    editedPrizeStructure: [...firebasePrizes],
                    hasUnsavedChanges: false,
                    lastSyncedAt: Date.now(),
                  });
                  console.log('🔄 Prize structure updated from Firebase');
                } else {
                  console.log(
                    '⚠️ Prize structure changed in Firebase but local edits exist - skipping update',
                  );
                }
              }
            },
          );

          console.log('✅ Prize structure listener started');
          return unsubscribe;
        },

        /**
         * Clear error
         */
        clearError: () => set({ error: null }),
      }),
      {
        name: `${appName}-prizes`,
        version: 2,

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

            state.editedPrizeStructure = [...state.prizeStructure];
            state.hasUnsavedChanges = false;

            const hasPrizes =
              state.prizeStructure && state.prizeStructure.length > 0;

            if (!hasPrizes) {
              console.log(
                '💰 Prizes: Empty state detected - auto-loading from Firebase...',
              );

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
