// src/stores/useGameStore.js

import { create } from 'zustand';
import { databaseService } from '@services/database.service';
import { devtools, persist } from 'zustand/middleware';
import { GAME_STATUS, DEFAULT_GAME_STATE } from '@constants/gameStates';
import { useQuestionsStore } from './useQuestionsStore';
import { useTeamsStore } from './useTeamsStore';

const appName = import.meta.env.VITE_APP_NAME || 'wwbam-quiz-host-panel';

/**
 * Game State Store
 * Manages game flow, team rotation, question navigation
 *
 * UPDATED: Added real-time Firebase listener for game state sync
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
        gameStatus: DEFAULT_GAME_STATE,

        // Current team playing
        currentTeamId: null,

        // Current question number (1-20)
        currentQuestionNumber: 0,

        // Play queue (array of team IDs in order)
        playQueue: [],

        // Question set assignments: { teamId: questionSetId }
        questionSetAssignments: {},

        // Current question data (synced to Firebase for public display)
        // NOTE: This is the PUBLIC question WITHOUT correct answer
        currentQuestion: null,
        questionVisible: false,
        optionsVisible: false,
        answerRevealed: false,
        correctOption: null,

        // Timestamps
        initializedAt: null,
        startedAt: null,
        lastUpdated: null,

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
        revealAnswer: (correctOption) => {
          set({
            answerRevealed: true,
            correctOption,
            lastUpdated: Date.now(),
          });

          console.log(`✅ Answer revealed: ${correctOption}`);
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
            });

            // Sync to Firebase
            await databaseService.updateGameState({
              gameStatus: GAME_STATUS.INITIALIZED,
              playQueue,
              questionSetAssignments,
              initializedAt: timestamp,
            });

            console.log('🎲 Game initialized and synced to Firebase');
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
            });

            console.log('🏁 Game completed and synced to Firebase');
            return { success: true };
          } catch (error) {
            console.error('Failed to complete game:', error);
            return { success: false, error: error.message };
          }
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
              gameStatus: GAME_STATUS.NOT_STARTED,
              currentTeamId: null,
              currentQuestionNumber: 0,
              playQueue: [],
              questionSetAssignments: {},
              currentQuestion: null,
              questionVisible: false,
              optionsVisible: false,
              answerRevealed: false,
              correctOption: null,
              initializedAt: null,
              startedAt: null,
              lastUpdated: timestamp,
            });

            // Sync to Firebase
            await databaseService.updateGameState({
              gameStatus: GAME_STATUS.NOT_STARTED,
              currentTeamId: null,
              currentQuestionNumber: 0,
              playQueue: [],
              questionSetAssignments: {},
              currentQuestion: null,
              questionVisible: false,
              optionsVisible: false,
              answerRevealed: false,
              correctOption: null,
              initializedAt: null,
              startedAt: null,
            });

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
              return { success: false, error: 'No game state found' };
            }

            // Update local state with Firebase data
            set({
              gameStatus: gameState.gameStatus || DEFAULT_GAME_STATE,
              currentTeamId: gameState.currentTeamId || null,
              currentQuestionNumber: gameState.currentQuestionNumber || 0,
              playQueue: gameState.playQueue || [],
              questionSetAssignments: gameState.questionSetAssignments || {},
              currentQuestion: gameState.currentQuestion || null,
              questionVisible: gameState.questionVisible || false,
              optionsVisible: gameState.optionsVisible || false,
              answerRevealed: gameState.answerRevealed || false,
              correctOption: gameState.correctOption || null,
              initializedAt: gameState.initializedAt || null,
              startedAt: gameState.startedAt || null,
              lastUpdated: Date.now(),
            });

            console.log('✅ Game state loaded from Firebase:', gameState);
            return { success: true, gameState };
          } catch (error) {
            console.error('Failed to load game state from Firebase:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Reset game to default state (local only, does NOT sync to Firebase)
         * Used for logout/cleanup scenarios
         */
        resetGame: () => {
          set({
            gameStatus: DEFAULT_GAME_STATE,
            currentTeamId: null,
            currentQuestionNumber: 0,
            playQueue: [],
            questionSetAssignments: {},
            currentQuestion: null,
            questionVisible: false,
            optionsVisible: false,
            answerRevealed: false,
            correctOption: null,
            initializedAt: null,
            startedAt: null,
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
                  initializedAt: firebaseGameState.initializedAt,
                  startedAt: firebaseGameState.startedAt,
                  lastUpdated: Date.now(),
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
        version: 2, // Incremented version for new sync strategy

        // ⚠️ REDUCED PERSISTENCE: Only persist essential game configuration
        // Gameplay state is always fetched fresh from Firebase via listener
        partialize: (state) => ({
          gameStatus: state.gameStatus,
          playQueue: state.playQueue,
          questionSetAssignments: state.questionSetAssignments,
          initializedAt: state.initializedAt,
          startedAt: state.startedAt,
          // NOT persisting: currentQuestion, questionVisible, answerRevealed, etc.
          // These are always fetched fresh from Firebase
        }),

        onRehydrateStorage: () => (state) => {
          if (state) {
            console.log('🎮 Game store rehydrated from localStorage');

            // Check if localStorage has game config data
            const hasGameConfig = state.gameStatus !== DEFAULT_GAME_STATE;

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
