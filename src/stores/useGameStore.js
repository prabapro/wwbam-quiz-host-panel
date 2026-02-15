// src/stores/useGameStore.js

import { create } from 'zustand';
import { databaseService } from '@services/database.service';
import { devtools, persist } from 'zustand/middleware';
import { GAME_STATUS, DEFAULT_GAME_STATE } from '@constants/gameStates';
import { useQuestionsStore } from './useQuestionsStore';

const appName = import.meta.env.VITE_APP_NAME || 'wwbam-quiz-host-panel';

/**
 * Game State Store
 * Manages game flow, team rotation, question navigation
 * Persisted to localStorage and synced to Firebase
 */
export const useGameStore = create()(
  devtools(
    persist(
      // eslint-disable-next-line no-unused-vars
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
         * Start game
         * Sets game to ACTIVE status and assigns first team
         * Syncs to Firebase and updates local state
         * @param {string} firstTeamId - ID of the first team to play
         * @returns {Promise<Object>} { success: boolean, error?: string }
         */
        startGame: async (firstTeamId) => {
          try {
            const timestamp = Date.now();

            // Update local state first
            set({
              gameStatus: GAME_STATUS.ACTIVE,
              currentTeamId: firstTeamId,
              startedAt: timestamp,
              lastUpdated: timestamp,
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
         * Reset game to default state
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

          console.log('🎮 Game reset to default state');
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

            // Check if this is Browser B (no localStorage, needs to sync from Firebase)
            const hasLocalStorageData = state.gameStatus !== DEFAULT_GAME_STATE;

            if (!hasLocalStorageData) {
              // Browser B: Auto-load from Firebase
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
                              `✅ Question set ${questionSetId} reloaded from Firebase`,
                            );
                          } else {
                            console.warn(
                              `⚠️ Failed to reload question set: ${loadResult.error}`,
                            );
                          }
                        });
                    }
                  }
                } else {
                  console.warn('🎮 Game: Auto-load failed ⚠️', result.error);
                }
              });
            } else {
              // Browser A: Has local data, sync to Firebase
              console.log(
                `🎮 Game: Loaded from localStorage - Status: ${state.gameStatus}`,
              );

              // ✅ If game is in progress, reload the current team's question set from Firebase
              const { currentTeamId, questionSetAssignments, gameStatus } =
                state;

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
                          `✅ Question set ${questionSetId} reloaded from Firebase`,
                        );
                      } else {
                        console.warn(
                          `⚠️ Failed to reload question set: ${loadResult.error}`,
                        );
                      }
                    });
                }
              }
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
