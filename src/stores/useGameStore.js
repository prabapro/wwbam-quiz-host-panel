// src/stores/useGameStore.js

import { create } from 'zustand';
import { databaseService } from '@services/database.service';
import { devtools, persist } from 'zustand/middleware';
import { GAME_STATUS } from '@constants/gameStates';
import { DEFAULT_GAME_STATE } from '@constants/defaultDatabase';
import { useQuestionsStore } from './useQuestionsStore';
import { useTeamsStore } from './useTeamsStore';

const appName = import.meta.env.VITE_APP_NAME || 'wwbam-quiz-host-panel';

/**
 * Game State Store
 * Manages game flow, team rotation, question navigation
 *
 * UPDATED: Added data ready state and improved initialization sequence
 * - Added isDataReady flag to indicate when critical game data is synced
 * - Added ensureDataReady() method to force sync if needed
 * - Improved rehydration flow to prevent premature access
 * - Better handling of question set assignments sync
 *
 * Reduced localStorage persistence - only critical game config is persisted
 * All gameplay state is fetched fresh from Firebase
 */
export const useGameStore = create()(
  devtools(
    persist(
      (set, get) => ({
        // ============================================================
        // STATE
        // ============================================================

        // Game status
        ...DEFAULT_GAME_STATE,

        // 'phone-a-friend' | 'fifty-fifty' | null
        activeLifeline: null,

        // Data ready flag - true when critical game data is synced from Firebase
        isDataReady: false,

        // Loading state for data sync operations
        isSyncingData: false,

        // ============================================================
        // DATA READY MANAGEMENT
        // ============================================================

        /**
         * Mark data as ready after successful Firebase sync
         * @private
         */
        _setDataReady: (ready) => {
          set({ isDataReady: ready });
          if (ready) {
            console.log('✅ Game data ready for use');
          }
        },

        /**
         * Ensure critical game data is loaded and ready
         * If not ready, triggers fresh sync from Firebase
         *
         * @returns {Promise<{ success: boolean, error?: string }>}
         */
        ensureDataReady: async () => {
          const { isDataReady, gameStatus } = get();

          // If data already ready and game is initialized or active, we're good
          if (
            isDataReady &&
            (gameStatus === GAME_STATUS.INITIALIZED ||
              gameStatus === GAME_STATUS.ACTIVE ||
              gameStatus === GAME_STATUS.PAUSED)
          ) {
            console.log('✅ Game data already ready');
            return { success: true };
          }

          // Need to sync from Firebase
          console.log('🔄 Ensuring game data is ready...');
          set({ isSyncingData: true });

          try {
            const result = await get().loadFromFirebase();

            if (result.success) {
              set({ isDataReady: true, isSyncingData: false });
              console.log('✅ Game data synced and ready');
              return { success: true };
            } else {
              set({ isSyncingData: false });
              return { success: false, error: result.error };
            }
          } catch (error) {
            console.error('Failed to ensure data ready:', error);
            set({ isSyncingData: false });
            return { success: false, error: error.message };
          }
        },

        // ============================================================
        // ACTIONS
        // ============================================================

        /**
         * Set current question number
         */
        setQuestionNumber: (questionNumber) => {
          set({
            currentQuestionNumber: questionNumber,
            lastUpdated: Date.now(),
          });

          console.log(`📝 Question number set: ${questionNumber}`);
        },

        /**
         * Set active lifeline
         * @param {string|null} lifeline - 'phone-a-friend' | 'fifty-fifty' | null
         */
        setActiveLifeline: (lifeline) => {
          set({
            activeLifeline: lifeline,
            lastUpdated: Date.now(),
          });

          console.log(`🎯 Active lifeline set: ${lifeline || 'none'}`);
        },

        /**
         * Clear active lifeline (convenience method)
         */
        clearActiveLifeline: () => {
          set({
            activeLifeline: null,
            lastUpdated: Date.now(),
          });

          console.log('🧹 Active lifeline cleared locally');
        },

        /**
         * Push to Display to public (without correct answer)
         */
        showQuestion: () => {
          set({
            questionVisible: true,
            optionsVisible: true,
            lastUpdated: Date.now(),
          });

          console.log('👁️ Question shown to public');
        },

        /**
         * Hide question from public
         */
        hideQuestion: () => {
          set({
            questionVisible: false,
            lastUpdated: Date.now(),
          });

          console.log('🙈 Question hidden from public');
        },

        /**
         * Reveal answer to public
         */
        revealAnswer: (correctOption, selectedOption, isCorrect) => {
          set({
            answerRevealed: true,
            correctOption,
            selectedOption,
            optionWasCorrect: isCorrect,
            lastUpdated: Date.now(),
          });

          console.log(
            `✅ Answer revealed: ${correctOption} (Selected: ${selectedOption}, Correct: ${isCorrect})`,
          );
        },
        /**
         * Initialize game
         * Sets up play queue and question set assignments
         * Syncs to Firebase and updates local state
         */
        initializeGame: async (playQueue, questionSetAssignments) => {
          try {
            const timestamp = Date.now();

            // Update local state
            set({
              gameStatus: GAME_STATUS.INITIALIZED,
              playQueue,
              questionSetAssignments,
              initializedAt: timestamp,
              lastUpdated: timestamp,
              isDataReady: true, // Mark data as ready after initialization
            });

            // Sync to Firebase
            await databaseService.updateGameState({
              gameStatus: GAME_STATUS.INITIALIZED,
              playQueue,
              questionSetAssignments,
              initializedAt: timestamp,
            });

            console.log('🎲 Game initialized and synced to Firebase');
            console.log('✅ Data marked as ready');
            return { success: true };
          } catch (error) {
            console.error('Failed to initialize game:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Start game
         * Sets game to ACTIVE status and assigns first team
         */
        startGame: async (firstTeamId) => {
          try {
            const timestamp = Date.now();

            // Update local state
            set({
              gameStatus: GAME_STATUS.ACTIVE,
              currentTeamId: firstTeamId,
              startedAt: timestamp,
              lastUpdated: timestamp,
            });

            // Update team status to ACTIVE in teams store
            await useTeamsStore.getState().updateTeam(firstTeamId, {
              status: 'active',
            });

            // Sync to Firebase
            await databaseService.updateGameState({
              gameStatus: GAME_STATUS.ACTIVE,
              currentTeamId: firstTeamId,
              startedAt: timestamp,
            });

            console.log('🎮 Game started and synced to Firebase');
            return { success: true };
          } catch (error) {
            console.error('Failed to start game:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Pause game
         */
        pauseGame: async () => {
          try {
            set({
              gameStatus: GAME_STATUS.PAUSED,
              lastUpdated: Date.now(),
            });

            await databaseService.updateGameState({
              gameStatus: GAME_STATUS.PAUSED,
            });

            console.log('⏸️ Game paused');
            return { success: true };
          } catch (error) {
            console.error('Failed to pause game:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Resume game
         */
        resumeGame: async () => {
          try {
            set({
              gameStatus: GAME_STATUS.ACTIVE,
              lastUpdated: Date.now(),
            });

            await databaseService.updateGameState({
              gameStatus: GAME_STATUS.ACTIVE,
            });

            console.log('▶️ Game resumed');
            return { success: true };
          } catch (error) {
            console.error('Failed to resume game:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Complete game
         */
        completeGame: async () => {
          try {
            const timestamp = Date.now();

            set({
              gameStatus: GAME_STATUS.COMPLETED,
              currentTeamId: null,
              currentQuestion: null,
              questionVisible: false,
              optionsVisible: false,
              answerRevealed: false,
              correctOption: null,
              selectedOption: null,
              optionWasCorrect: null,
              lastUpdated: timestamp,
            });

            await databaseService.updateGameState({
              gameStatus: GAME_STATUS.COMPLETED,
              currentTeamId: null,
              currentQuestion: null,
              questionVisible: false,
              optionsVisible: false,
              answerRevealed: false,
              correctOption: null,
              selectedOption: null,
              optionWasCorrect: null,
            });

            console.log('🏁 Game completed and synced to Firebase');
            return { success: true };
          } catch (error) {
            console.error('Failed to complete game:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Push final results Flag to Firebase to trigger public display of final results
         */
        pushFinalResults: async () => {
          await databaseService.updateGameState({ displayFinalResults: true });
          set({ displayFinalResults: true, lastUpdated: Date.now() });
        },

        /**
         * Move to next team in play queue
         * Updates current team and resets question-related state
         *
         * CRITICAL FIX: Does NOT modify previous team's status
         * The previous team's status should already be set correctly by:
         * - completeTeam() → status: "completed"
         * - eliminateTeam() → status: "eliminated"
         * - (no action) → status remains "active" (team didn't finish)
         *
         * Only updates the NEXT team's status to "active"
         *
         * @returns {Promise<Object>} { success: boolean, error?: string, nextTeamId?: string }
         */
        nextTeam: async () => {
          try {
            const { playQueue, currentTeamId } = get();

            if (!playQueue || playQueue.length === 0) {
              return {
                success: false,
                error: 'No teams in play queue',
              };
            }

            const currentIndex = playQueue.indexOf(currentTeamId);
            const nextIndex = currentIndex + 1;

            if (nextIndex >= playQueue.length) {
              // No more teams - game is complete
              await get().completeGame();
              return {
                success: true,
                nextTeamId: null,
                message: 'All teams completed',
              };
            }

            const nextTeamId = playQueue[nextIndex];
            const timestamp = Date.now();

            // ============================================================
            // UPDATE NEXT TEAM TO ACTIVE
            // ============================================================

            // Set next team to active status
            await useTeamsStore.getState().updateTeam(nextTeamId, {
              status: 'active',
            });

            console.log(`➡️ Next team ${nextTeamId} set to active`);

            // ============================================================
            // UPDATE GAME STATE
            // ============================================================

            // Reset question state for new team
            set({
              currentTeamId: nextTeamId,
              currentQuestionNumber: 0,
              currentQuestion: null,
              questionVisible: false,
              optionsVisible: false,
              answerRevealed: false,
              correctOption: null,
              selectedOption: null,
              optionWasCorrect: null,
              lastUpdated: timestamp,
            });

            // Sync to Firebase
            await databaseService.updateGameState({
              currentTeamId: nextTeamId,
              currentQuestionNumber: 0,
              currentQuestion: null,
              questionVisible: false,
              optionsVisible: false,
              answerRevealed: false,
              correctOption: null,
              selectedOption: null,
              optionWasCorrect: null,
            });

            // ============================================================
            // PREVIOUS TEAM STATUS - DO NOTHING
            // ============================================================

            // IMPORTANT: We do NOT modify the previous team's status here!
            // Their status should already be correct:
            // - "completed" (if they finished all questions)
            // - "eliminated" (if they got eliminated)
            // - "active" (if host manually skipped them without completing/eliminating)
            //
            // Modifying the status here creates race conditions with Firebase updates

            console.log(`✅ Moved to next team: ${nextTeamId}`);

            return {
              success: true,
              nextTeamId,
              previousTeamId: currentTeamId,
            };
          } catch (error) {
            console.error('Failed to move to next team:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Skip the current question
         *
         * Clears all question-related UI state and syncs to Firebase so the public
         * display is cleared.
         *
         * IMPORTANT: Does NOT increment currentQuestionNumber.
         * When a question is loaded, currentQuestionNumber is already set to that
         * question's number (via setQuestionNumber inside loadQuestion). Incrementing
         * here would cause the NEXT load to skip a question entirely.
         *
         * The question counter naturally advances on the next loadQuestion call,
         * where nextQuestionNumber = currentQuestionNumber + 1.
         *
         * Does NOT touch team status — handled by the caller
         * (useGameControls › handleSkipQuestion) after this resolves.
         *
         * @returns {Promise<{ success: boolean, error?: string }>}
         */
        skipQuestion: async () => {
          try {
            const timestamp = Date.now();

            // Clear question state locally — counter stays the same
            set({
              currentQuestion: null,
              questionVisible: false,
              optionsVisible: false,
              answerRevealed: false,
              correctOption: null,
              selectedOption: null,
              optionWasCorrect: null,
              lastUpdated: timestamp,
            });

            // Sync cleared state to Firebase so public display is retracted
            await databaseService.updateGameState({
              currentQuestion: null,
              questionVisible: false,
              optionsVisible: false,
              answerRevealed: false,
              correctOption: null,
              selectedOption: null,
              optionWasCorrect: null,
            });

            console.log(
              `⏭️ Question ${get().currentQuestionNumber} skipped — state cleared`,
            );
            return { success: true };
          } catch (error) {
            console.error('Failed to skip question:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Uninitialize game (reset to NOT_STARTED)
         */
        uninitializeGame: async () => {
          try {
            const timestamp = Date.now();

            // Reset all teams first
            const resetTeamsResult = await useTeamsStore
              .getState()
              .resetAllTeamsProgress();

            if (!resetTeamsResult || resetTeamsResult.error) {
              console.warn(
                '⚠️ Failed to reset teams:',
                resetTeamsResult?.error,
              );
            }

            // Reset local state
            set({
              ...DEFAULT_GAME_STATE,
              isDataReady: false, // Mark as not ready after uninit
              lastUpdated: timestamp,
            });

            // Sync to Firebase
            await databaseService.updateGameState(DEFAULT_GAME_STATE);

            console.log('🔄 Game uninitialized and synced to Firebase');
            return { success: true };
          } catch (error) {
            console.error('Failed to uninitialize game:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Load game state from Firebase
         * Fetches fresh data from Firebase and updates local state
         */
        loadFromFirebase: async () => {
          try {
            const gameState = await databaseService.getGameState();

            if (!gameState) {
              console.warn('No game state found in Firebase');
              set({ isDataReady: false });
              return { success: false, error: 'No game state found' };
            }

            // Update local state with Firebase data
            set({
              gameStatus: gameState.gameStatus ?? DEFAULT_GAME_STATE.gameStatus,
              currentTeamId: gameState.currentTeamId || null,
              currentQuestionNumber: gameState.currentQuestionNumber || 0,
              playQueue: gameState.playQueue || [],
              questionSetAssignments: gameState.questionSetAssignments || {},
              currentQuestion: gameState.currentQuestion || null,
              questionVisible: gameState.questionVisible ?? false,
              optionsVisible: gameState.optionsVisible ?? false,
              answerRevealed: gameState.answerRevealed ?? false,
              correctOption: gameState.correctOption ?? null,
              selectedOption: gameState.selectedOption ?? null,
              optionWasCorrect: gameState.optionWasCorrect ?? null,
              initializedAt: gameState.initializedAt || null,
              startedAt: gameState.startedAt || null,
              activeLifeline: gameState.activeLifeline || null,
              lastUpdated: Date.now(),
              isDataReady: true, // Mark as ready after successful load
            });

            console.log('✅ Game state loaded from Firebase:', gameState);
            return { success: true, gameState };
          } catch (error) {
            console.error('Failed to load game state from Firebase:', error);
            set({ isDataReady: false });
            return { success: false, error: error.message };
          }
        },

        /**
         * Reset game to default state (local only, does NOT sync to Firebase)
         * Used for logout/cleanup scenarios
         */
        resetGame: () => {
          set({
            ...DEFAULT_GAME_STATE,
            isDataReady: false,
            lastUpdated: Date.now(),
          });

          console.log('🎮 Game reset to default state (local only)');
        },

        /**
         * Reset app to factory defaults
         * Clears ALL data including question sets from Firebase
         * Syncs to Firebase and resets local state
         *
         * @returns {Promise<Object>} { success: boolean, error?: string }
         */
        resetAppToFactoryDefaults: async () => {
          try {
            console.log('🏭 Resetting app to factory defaults...');

            // Reset database to defaults via Firebase service
            // This clears question sets and resets game state in Firebase
            await databaseService.resetDatabaseToDefaults();

            // Reset local game store
            get().resetGame();

            console.log('✅ App reset to factory defaults');
            return { success: true };
          } catch (error) {
            console.error('Failed to reset app to factory defaults:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Start real-time Firebase listener for game state changes
         * Returns unsubscribe function for cleanup
         *
         * IMPORTANT: This ensures the store always has fresh data from Firebase
         * Call this in components/pages that need real-time game state updates
         */
        startGameListener: () => {
          console.log('🔄 Starting real-time game state listener...');

          const unsubscribe = databaseService.onGameStateChange(
            (firebaseGameState) => {
              if (firebaseGameState) {
                console.log('🔄 Game state updated from Firebase:', {
                  questionVisible: firebaseGameState.questionVisible,
                  answerRevealed: firebaseGameState.answerRevealed,
                  correctOption: firebaseGameState.correctOption,
                  currentQuestionNumber:
                    firebaseGameState.currentQuestionNumber,
                  activeLifeline: firebaseGameState.activeLifeline,
                  questionSetAssignments:
                    firebaseGameState.questionSetAssignments
                      ? 'present'
                      : 'missing',
                });

                // Update local state with Firebase data
                // NOTE: We only update these fields to avoid overwriting local-only state
                set({
                  gameStatus: firebaseGameState.gameStatus,
                  currentTeamId: firebaseGameState.currentTeamId,
                  currentQuestionNumber:
                    firebaseGameState.currentQuestionNumber,
                  playQueue: firebaseGameState.playQueue || [],
                  questionSetAssignments:
                    firebaseGameState.questionSetAssignments || {},
                  currentQuestion: firebaseGameState.currentQuestion,
                  questionVisible: firebaseGameState.questionVisible,
                  optionsVisible: firebaseGameState.optionsVisible,
                  answerRevealed: firebaseGameState.answerRevealed,
                  correctOption: firebaseGameState.correctOption,
                  selectedOption: firebaseGameState.selectedOption,
                  optionWasCorrect: firebaseGameState.optionWasCorrect,
                  initializedAt: firebaseGameState.initializedAt,
                  startedAt: firebaseGameState.startedAt,
                  activeLifeline: firebaseGameState.activeLifeline || null,
                  isDataReady: true, // Mark as ready when receiving Firebase updates
                  lastUpdated: Date.now(),
                  displayFinalResults:
                    firebaseGameState.displayFinalResults ?? false,
                });
              }
            },
          );

          console.log('✅ Game state listener started');
          return unsubscribe;
        },
      }),
      {
        name: `${appName}-game`,
        version: 4, // ← Incremented version for data ready state management

        // ⚠️ REDUCED PERSISTENCE: Only persist essential game configuration
        // Gameplay state is always fetched fresh from Firebase via listener
        partialize: (state) => ({
          gameStatus: state.gameStatus,
          playQueue: state.playQueue,
          questionSetAssignments: state.questionSetAssignments,
          initializedAt: state.initializedAt,
          startedAt: state.startedAt,
          // NOT persisting: isDataReady (always start as false), currentQuestion, questionVisible, etc.
        }),

        onRehydrateStorage: () => (state) => {
          if (state) {
            console.log('🎮 Game store rehydrated from localStorage');

            // Always mark as NOT ready on rehydration - must sync from Firebase
            state.isDataReady = false;

            // Check if localStorage has game config data
            const hasGameConfig =
              state.gameStatus !== DEFAULT_GAME_STATE.gameStatus;

            if (!hasGameConfig) {
              // No local data, auto-load from Firebase
              console.log(
                '🔄 No local game data - auto-loading from Firebase...',
              );

              state.loadFromFirebase().then((result) => {
                if (result.success) {
                  console.log('✅ Game state auto-loaded from Firebase');

                  // If game is in progress, reload current team's question set
                  const { currentTeamId, questionSetAssignments, gameStatus } =
                    useGameStore.getState();

                  const isGameInProgress =
                    gameStatus === GAME_STATUS.ACTIVE ||
                    gameStatus === GAME_STATUS.PAUSED;

                  if (isGameInProgress && currentTeamId) {
                    const questionSetId = questionSetAssignments[currentTeamId];

                    if (questionSetId) {
                      console.log(
                        `📚 Reloading question set for current team: ${questionSetId}`,
                      );

                      useQuestionsStore
                        .getState()
                        .loadQuestionSet(questionSetId, { forceFresh: true })
                        .then((loadResult) => {
                          if (loadResult.success) {
                            console.log(
                              '✅ Question set reloaded fresh from Firebase',
                            );
                          } else {
                            console.warn(
                              '⚠️ Failed to reload question set:',
                              loadResult.error,
                            );
                          }
                        });
                    }
                  }
                } else {
                  console.warn('⚠️ Game state auto-load failed:', result.error);
                }
              });
            } else {
              console.log(
                `🎮 Game state loaded from localStorage: ${state.gameStatus}`,
              );

              // Even with local data, sync from Firebase to ensure freshness
              console.log('🔄 Syncing fresh data from Firebase...');
              state.loadFromFirebase().then((result) => {
                if (result.success) {
                  console.log('✅ Fresh data synced from Firebase');
                } else {
                  console.warn(
                    '⚠️ Failed to sync from Firebase:',
                    result.error,
                  );
                }
              });
            }
          }
        },
      },
    ),
    {
      name: 'game-store',
    },
  ),
);

export default useGameStore;
