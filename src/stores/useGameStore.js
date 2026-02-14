// src/stores/useGameStore.js

import { create } from 'zustand';
import { databaseService } from '@services/database.service';
import { devtools, persist } from 'zustand/middleware';
import { GAME_STATUS, DEFAULT_GAME_STATE } from '@constants/gameStates';
import { localStorageService } from '@services/localStorage.service';
import { QUESTIONS_PER_SET } from '@constants/config';
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

          console.log(`✅ Correct answer revealed: ${correctOption}`);
        },

        /**
         * Update options visibility (for 50/50)
         */
        setOptionsVisible: (visible) => {
          set({
            optionsVisible: visible,
            lastUpdated: Date.now(),
          });
        },

        /**
         * Clear current question
         */
        clearQuestion: () => {
          set({
            currentQuestion: null,
            questionVisible: false,
            optionsVisible: false,
            answerRevealed: false,
            correctOption: null,
            lastUpdated: Date.now(),
          });

          console.log('🧹 Question cleared');
        },

        /**
         * Initialize game with play queue and assignments
         * SYNCS TO FIREBASE AUTOMATICALLY
         */
        initializeGame: async (playQueue, questionSetAssignments) => {
          try {
            // Update local state first
            set({
              gameStatus: GAME_STATUS.INITIALIZED,
              playQueue,
              questionSetAssignments,
              initializedAt: Date.now(),
              lastUpdated: Date.now(),
            });

            // Build atomic multi-path update object
            const updates = {};

            // 1. Update game-state node
            updates['game-state/game-status'] = 'initialized';
            updates['game-state/play-queue'] = playQueue;
            updates['game-state/question-set-assignments'] =
              questionSetAssignments;
            updates['game-state/initialized-at'] = Date.now();
            updates['game-state/last-updated'] = Date.now();

            // 2. Update each team's question-set-id
            playQueue.forEach((teamId) => {
              const questionSetId = questionSetAssignments[teamId];
              updates[`teams/${teamId}/question-set-id`] = questionSetId;
            });

            // Atomic update to Firebase
            await databaseService.atomicUpdate(updates);

            console.log('🎮 Game initialized and synced to Firebase');

            return { success: true };
          } catch (error) {
            console.error('Failed to initialize game:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Start event (first team begins)
         * SYNCS TO FIREBASE AUTOMATICALLY
         */
        startEvent: async () => {
          try {
            const { playQueue } = get();

            if (!playQueue || playQueue.length === 0) {
              throw new Error('Play queue is empty. Initialize game first.');
            }

            const firstTeamId = playQueue[0];

            // Update local state
            set({
              gameStatus: GAME_STATUS.ACTIVE,
              currentTeamId: firstTeamId,
              currentQuestionNumber: 0,
              startedAt: Date.now(),
              lastUpdated: Date.now(),
            });

            // Sync to Firebase
            await databaseService.updateGameState({
              gameStatus: 'active',
              currentTeamId: firstTeamId,
              currentQuestionNumber: 0,
              startedAt: Date.now(),
              lastUpdated: Date.now(),
            });

            console.log(`🎮 Event started - First team: ${firstTeamId}`);

            return { success: true, currentTeamId: firstTeamId };
          } catch (error) {
            console.error('Failed to start event:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Move to next team in queue
         * SYNCS TO FIREBASE AUTOMATICALLY
         */
        nextTeam: async () => {
          try {
            const { playQueue, currentTeamId } = get();

            const currentIndex = playQueue.indexOf(currentTeamId);

            if (currentIndex === -1) {
              throw new Error('Current team not found in play queue');
            }

            if (currentIndex === playQueue.length - 1) {
              throw new Error('Already at last team');
            }

            const nextTeamId = playQueue[currentIndex + 1];

            // Update local state
            set({
              currentTeamId: nextTeamId,
              currentQuestionNumber: 0,
              lastUpdated: Date.now(),
            });

            // Sync to Firebase
            await databaseService.updateGameState({
              currentTeamId: nextTeamId,
              currentQuestionNumber: 0,
              lastUpdated: Date.now(),
            });

            console.log(`➡️ Next team: ${nextTeamId}`);

            return { success: true, nextTeamId };
          } catch (error) {
            console.error('Failed to move to next team:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Skip current question
         * SYNCS TO FIREBASE AUTOMATICALLY
         */
        skipQuestion: async () => {
          try {
            const { currentQuestionNumber } = get();

            if (currentQuestionNumber >= QUESTIONS_PER_SET) {
              throw new Error('Already at last question');
            }

            const nextQuestionNumber = currentQuestionNumber + 1;

            // Update local state
            set({
              currentQuestionNumber: nextQuestionNumber,
              lastUpdated: Date.now(),
            });

            // Sync to Firebase
            await databaseService.updateGameState({
              currentQuestionNumber: nextQuestionNumber,
              lastUpdated: Date.now(),
            });

            console.log(`⏭️ Question skipped to: ${nextQuestionNumber}`);

            return { success: true, nextQuestionNumber };
          } catch (error) {
            console.error('Failed to skip question:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Pause game
         * SYNCS TO FIREBASE AUTOMATICALLY
         */
        pauseGame: async () => {
          try {
            set({
              gameStatus: GAME_STATUS.PAUSED,
              lastUpdated: Date.now(),
            });

            await databaseService.updateGameState({
              gameStatus: 'paused',
              lastUpdated: Date.now(),
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
         * SYNCS TO FIREBASE AUTOMATICALLY
         */
        resumeGame: async () => {
          try {
            set({
              gameStatus: GAME_STATUS.ACTIVE,
              lastUpdated: Date.now(),
            });

            await databaseService.updateGameState({
              gameStatus: 'active',
              lastUpdated: Date.now(),
            });

            console.log('▶️ Game resumed');

            return { success: true };
          } catch (error) {
            console.error('Failed to resume game:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * End game
         * SYNCS TO FIREBASE AUTOMATICALLY
         */
        endGame: async () => {
          try {
            set({
              gameStatus: GAME_STATUS.COMPLETED,
              lastUpdated: Date.now(),
            });

            await databaseService.updateGameState({
              gameStatus: 'completed',
              lastUpdated: Date.now(),
            });

            console.log('🏁 Game ended');

            return { success: true };
          } catch (error) {
            console.error('Failed to end game:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Uninitialize game (reset to NOT_STARTED)
         * SYNCS TO FIREBASE AUTOMATICALLY
         */
        uninitializeGame: async () => {
          try {
            // Reset local state
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

            // Sync to Firebase
            await databaseService.updateGameState({
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

            console.log('🔄 Game uninitialized');

            return { success: true };
          } catch (error) {
            console.error('Failed to uninitialize game:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Reset app to factory defaults
         * DESTRUCTIVE - Deletes all data
         * Orchestrates complete cleanup:
         * 1. Reset Firebase database to defaults
         * 2. Clear question sets from localStorage
         * 3. Clear game store state
         */
        resetAppToFactoryDefaults: async () => {
          try {
            console.log('🏭 Starting factory reset...');

            // 1. Reset Firebase database to defaults
            // This includes game-state, teams (empty), prize-structure, config
            await databaseService.resetDatabaseToDefaults();

            // 2. Clear question sets from localStorage
            localStorageService.clearAllQuestionSets();
            console.log('🗑️ Question sets cleared from localStorage');

            // 3. Clear game store state (triggers localStorage clear via persist)
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
              lastUpdated: null,
            });

            console.log('✅ Factory reset completed successfully');

            return { success: true };
          } catch (error) {
            console.error('❌ Factory reset failed:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Auto-load game state from Firebase
         * Used when Browser B opens and needs to sync with Browser A
         */
        autoLoadFromFirebase: async () => {
          try {
            console.log('📡 Auto-loading game state from Firebase...');

            const gameState = await databaseService.getGameState();

            if (!gameState) {
              console.warn('No game state found in Firebase');
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
              lastUpdated: gameState.lastUpdated || null,
            });

            console.log('✅ Game state auto-loaded from Firebase');

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

                  // ✅ FIX: After auto-loading, reload current team's question set into memory
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

                      const loadResult = useQuestionsStore
                        .getState()
                        .loadQuestionSet(questionSetId);

                      if (loadResult.success) {
                        console.log(
                          `✅ Question set ${questionSetId} reloaded into memory`,
                        );
                      } else {
                        console.warn(
                          `⚠️ Failed to reload question set: ${loadResult.error}`,
                        );
                      }
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

              // ✅ FIX: If game is in progress, reload the current team's question set
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

                  const loadResult = useQuestionsStore
                    .getState()
                    .loadQuestionSet(questionSetId);

                  if (loadResult.success) {
                    console.log(
                      `✅ Question set ${questionSetId} reloaded into memory`,
                    );
                  } else {
                    console.warn(
                      `⚠️ Failed to reload question set: ${loadResult.error}`,
                    );
                  }
                }
              }

              // Sync local state to Firebase (original behavior for Browser A)
              console.log(
                '🔄 Syncing hydrated state to Firebase (game-state + teams)...',
              );

              const updates = {};
              updates['game-state/game-status'] = state.gameStatus;
              updates['game-state/current-team-id'] = state.currentTeamId;
              updates['game-state/current-question-number'] =
                state.currentQuestionNumber;
              updates['game-state/play-queue'] = state.playQueue;
              updates['game-state/question-set-assignments'] =
                state.questionSetAssignments;

              // Also sync team question-set-id
              if (state.questionSetAssignments) {
                Object.entries(state.questionSetAssignments).forEach(
                  ([teamId, setId]) => {
                    updates[`teams/${teamId}/question-set-id`] = setId;
                  },
                );
              }

              databaseService
                .atomicUpdate(updates)
                .then(() => {
                  console.log(
                    '✅ State synced to Firebase on load (game-state + teams)',
                  );
                })
                .catch((error) => {
                  console.error('Failed to sync state on load:', error);
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
