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
 * Persisted to localStorage and synced to Firebase
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
         * Reveal correct answer
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
         * Set current team
         */
        setCurrentTeam: (teamId) => {
          set({
            currentTeamId: teamId,
            lastUpdated: Date.now(),
          });

          console.log(`👥 Current team set: ${teamId}`);
        },

        /**
         * Set game status
         */
        setGameStatus: (status) => {
          set({
            gameStatus: status,
            lastUpdated: Date.now(),
          });

          console.log(`🎮 Game status changed: ${status}`);
        },

        /**
         * Initialize game
         * Creates play queue and assigns question sets to teams
         * Syncs to Firebase and updates local state
         * @param {Array} playQueue - Array of team IDs in play order
         * @param {Object} questionSetAssignments - { teamId: questionSetId }
         * @returns {Promise<Object>} { success: boolean, error?: string }
         */
        initializeGame: async (playQueue, questionSetAssignments) => {
          try {
            const timestamp = Date.now();

            // Update local state first
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

            console.log('🎮 Game initialized and synced to Firebase');
            return { success: true };
          } catch (error) {
            console.error('Failed to initialize game:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Uninitialize game
         * Resets game to NOT_STARTED state and clears play queue
         * Also resets all teams to their initial state
         * Syncs to Firebase and updates local state
         * @returns {Promise<Object>} { success: boolean, error?: string }
         */
        uninitializeGame: async () => {
          try {
            const timestamp = Date.now();

            // ✅ STEP 1: Reset all teams to initial state FIRST
            // This must happen before updating game state
            const resetTeamsResult = await useTeamsStore
              .getState()
              .resetAllTeamsProgress();

            if (!resetTeamsResult || resetTeamsResult.error) {
              console.warn(
                '⚠️ Failed to reset teams, continuing anyway:',
                resetTeamsResult?.error,
              );
            }

            // ✅ STEP 2: Update local game state - reset to NOT_STARTED
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

            // ✅ STEP 3: Sync game state to Firebase
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
            console.log('👥 All teams reset to initial state');
            return { success: true };
          } catch (error) {
            console.error('Failed to uninitialize game:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Start game
         * Sets game to ACTIVE status and assigns first team
         * Syncs to Firebase and updates local state
         * @param {string} firstTeamId - ID of the first team to play
         * @returns {Promise<Object>} { success: boolean, error?: string }
         */
        startGame: async (firstTeamId) => {
          try {
            const timestamp = Date.now();

            // Update local game state
            set({
              gameStatus: GAME_STATUS.ACTIVE,
              currentTeamId: firstTeamId,
              startedAt: timestamp,
              lastUpdated: timestamp,
            });

            // Sync game state to Firebase
            await databaseService.updateGameState({
              gameStatus: GAME_STATUS.ACTIVE,
              currentTeamId: firstTeamId,
              startedAt: timestamp,
            });

            // Update current team status to 'active'
            await databaseService.updateTeam(firstTeamId, {
              status: 'active',
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
         * Sets game status to PAUSED
         * Syncs to Firebase and updates local state
         * @returns {Promise<Object>} { success: boolean, error?: string }
         */
        pauseGame: async () => {
          try {
            const timestamp = Date.now();

            set({
              gameStatus: GAME_STATUS.PAUSED,
              lastUpdated: timestamp,
            });

            await databaseService.updateGameState({
              gameStatus: GAME_STATUS.PAUSED,
            });

            console.log('⏸️ Game paused and synced to Firebase');
            return { success: true };
          } catch (error) {
            console.error('Failed to pause game:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Resume game
         * Sets game status back to ACTIVE from PAUSED
         * Syncs to Firebase and updates local state
         * @returns {Promise<Object>} { success: boolean, error?: string }
         */
        resumeGame: async () => {
          try {
            const timestamp = Date.now();

            set({
              gameStatus: GAME_STATUS.ACTIVE,
              lastUpdated: timestamp,
            });

            await databaseService.updateGameState({
              gameStatus: GAME_STATUS.ACTIVE,
            });

            console.log('▶️ Game resumed and synced to Firebase');
            return { success: true };
          } catch (error) {
            console.error('Failed to resume game:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Complete game
         * Sets game status to COMPLETED and clears current question state
         * Syncs to Firebase and updates local state
         * @returns {Promise<Object>} { success: boolean, error?: string }
         */
        completeGame: async () => {
          try {
            const timestamp = Date.now();

            // ✅ Update local state - set to COMPLETED and clear question state
            set({
              gameStatus: GAME_STATUS.COMPLETED,
              currentTeamId: null, // ← Clear current team
              currentQuestion: null, // ← Clear question
              questionVisible: false, // ← Hide question
              optionsVisible: false, // ← Hide options
              answerRevealed: false, // ← Reset reveal state
              correctOption: null, // ← Clear correct option
              lastUpdated: timestamp,
            });

            // ✅ Sync to Firebase - update all fields
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
         * Syncs to Firebase and updates local state
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

            // ✅ FIX: Don't change status of teams in terminal states (completed/eliminated)
            // Only teams that are 'active' should be set to 'waiting'
            // This preserves the completed/eliminated status when moving to next team
            if (currentTeamId) {
              // Get current team from Teams store to check their status
              const currentTeamState =
                useTeamsStore.getState().teams[currentTeamId];
              const currentStatus = currentTeamState?.status;

              // Terminal states that should NOT be changed
              const isTerminalState =
                currentStatus === 'completed' || currentStatus === 'eliminated';

              if (!isTerminalState && currentStatus === 'active') {
                // Team was active but didn't complete/eliminate - set to waiting
                await databaseService.updateTeam(currentTeamId, {
                  status: 'waiting',
                });
                console.log(`👥 Previous team ${currentTeamId} set to waiting`);
              } else if (isTerminalState) {
                // Terminal state - preserve it
                console.log(
                  `👥 Previous team ${currentTeamId} status preserved: ${currentStatus}`,
                );
              }
            }

            // Set next team to active
            await databaseService.updateTeam(nextTeamId, {
              status: 'active',
            });

            console.log(`👥 Moved to next team: ${nextTeamId}`);
            return { success: true, nextTeamId };
          } catch (error) {
            console.error('Failed to move to next team:', error);
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
         * Clears ALL data including question sets
         * Syncs to Firebase
         * @returns {Promise<Object>} { success: boolean, error?: string }
         */
        resetAppToFactoryDefaults: async () => {
          try {
            console.log('🏭 Resetting app to factory defaults...');

            // Reset database to defaults via Firebase service
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
         * Auto-load game state from Firebase (for Browser B scenario)
         */
        autoLoadFromFirebase: async () => {
          try {
            console.log('🔄 Auto-loading game state from Firebase...');

            const gameState = await databaseService.getGameState();

            if (!gameState) {
              console.warn('⚠️ No game state found in Firebase');
              return { success: false, error: 'No game state in Firebase' };
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
            console.error('Failed to auto-load from Firebase:', error);
            return { success: false, error: error.message };
          }
        },
      }),
      {
        name: `${appName}-game`,
        version: 1,

        // Persist most fields except transient UI state
        partialize: (state) => ({
          gameStatus: state.gameStatus,
          currentTeamId: state.currentTeamId,
          currentQuestionNumber: state.currentQuestionNumber,
          playQueue: state.playQueue,
          questionSetAssignments: state.questionSetAssignments,
          initializedAt: state.initializedAt,
          startedAt: state.startedAt,
        }),

        onRehydrateStorage: () => (state) => {
          if (state) {
            console.log('🎮 Game store rehydrated from localStorage');

            // Check if localStorage is empty and needs to sync from Firebase
            const hasLocalStorageData = state.gameStatus !== DEFAULT_GAME_STATE;

            if (!hasLocalStorageData) {
              // Auto-load from Firebase if no local data
              console.log(
                '🔄 No local data found. Auto-loading from Firebase...',
              );
              state.autoLoadFromFirebase().then((result) => {
                if (result.success) {
                  console.log('🎮 Game: Auto-load complete ✅');

                  // ✅ After auto-loading, reload current team's question set from Firebase
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
                        .loadQuestionSet(questionSetId)
                        .then((loadResult) => {
                          if (loadResult.success) {
                            console.log(
                              '✅ Question set loaded for current team',
                            );
                          } else {
                            console.warn(
                              '⚠️ Failed to load question set:',
                              loadResult.error,
                            );
                          }
                        });
                    }
                  }
                } else {
                  console.warn('⚠️ Game: Auto-load failed:', result.error);
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
