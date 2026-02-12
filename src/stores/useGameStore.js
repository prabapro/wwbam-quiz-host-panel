// src/stores/useGameStore.js

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  GAME_STATUS,
  DEFAULT_GAME_STATE,
  isValidTransition,
} from '@constants/gameStates';
import { databaseService } from '@services/database.service';

const appName = import.meta.env.VITE_APP_NAME || 'wwbam-quiz-host-panel';

/**
 * Game State Store
 * Manages the current game session state using Zustand
 * Syncs with Firebase Realtime Database
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

        // Current question data (without correct answer for security)
        currentQuestion: null,

        // UI control flags
        questionVisible: false,
        optionsVisible: false,
        answerRevealed: false,

        // Correct option (revealed after lock)
        correctOption: null,

        // Play queue (randomized team order)
        playQueue: [],

        // Question set assignments (teamId -> setId)
        questionSetAssignments: {},

        // Game initialization timestamp
        initializedAt: null,

        // Game start timestamp
        startedAt: null,

        // Last update timestamp
        lastUpdated: null,

        // Loading state for Firebase operations
        isLoading: false,

        // Error state
        error: null,

        // ============================================================
        // ACTIONS
        // ============================================================

        /**
         * NEW: Sync game state FROM Firebase to local store
         * Similar to how teams and prizes stores work
         */
        syncGameStateFromFirebase: async () => {
          set({ isLoading: true, error: null });

          try {
            const firebaseGameState = await databaseService.getGameState();

            if (firebaseGameState) {
              // Update local state with Firebase data
              set({
                gameStatus: firebaseGameState.gameStatus || DEFAULT_GAME_STATE,
                currentTeamId: firebaseGameState.currentTeamId || null,
                currentQuestionNumber:
                  firebaseGameState.currentQuestionNumber || 0,
                currentQuestion: firebaseGameState.currentQuestion || null,
                questionVisible: firebaseGameState.questionVisible || false,
                optionsVisible: firebaseGameState.optionsVisible || false,
                answerRevealed: firebaseGameState.answerRevealed || false,
                correctOption: firebaseGameState.correctOption || null,
                playQueue: firebaseGameState.playQueue || [],
                questionSetAssignments:
                  firebaseGameState.questionSetAssignments || {},
                initializedAt: firebaseGameState.initializedAt || null,
                startedAt: firebaseGameState.startedAt || null,
                lastUpdated: firebaseGameState.lastUpdated || null,
                isLoading: false,
              });

              console.log('✅ Game state synced from Firebase');
              return { success: true, gameState: firebaseGameState };
            } else {
              // No game state in Firebase - use defaults
              set({ isLoading: false });
              console.log('📋 No game state in Firebase - using defaults');
              return { success: true, gameState: null };
            }
          } catch (error) {
            console.error('Failed to sync game state from Firebase:', error);
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
          }
        },

        /**
         * Update game status with validation
         */
        setGameStatus: (newStatus) => {
          const currentStatus = get().gameStatus;

          if (!isValidTransition(currentStatus, newStatus)) {
            console.warn(
              `Invalid game status transition: ${currentStatus} -> ${newStatus}`,
            );
            return;
          }

          set({
            gameStatus: newStatus,
            lastUpdated: Date.now(),
          });

          console.log(`🎮 Game status: ${currentStatus} → ${newStatus}`);
        },

        /**
         * Set current team
         */
        setCurrentTeam: (teamId) => {
          set({
            currentTeamId: teamId,
            lastUpdated: Date.now(),
          });
        },

        /**
         * Set current question number
         */
        setQuestionNumber: (questionNumber) => {
          if (questionNumber < 0 || questionNumber > 20) {
            console.warn(`Invalid question number: ${questionNumber}`);
            return;
          }

          set({
            currentQuestionNumber: questionNumber,
            lastUpdated: Date.now(),
          });
        },

        /**
         * Load question (host view with correct answer)
         */
        loadQuestion: (questionData) => {
          set({
            currentQuestion: questionData,
            questionVisible: false,
            optionsVisible: false,
            answerRevealed: false,
            correctOption: null,
            lastUpdated: Date.now(),
          });

          console.log(`📝 Question loaded: Q${questionData?.number || '?'}`);
        },

        /**
         * Show question to public (without correct answer)
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

            // 2. Update each team's question-set-id in teams node
            Object.entries(questionSetAssignments).forEach(
              ([teamId, setId]) => {
                updates[`teams/${teamId}/question-set-id`] = setId;
                updates[`teams/${teamId}/last-updated`] = Date.now();
              },
            );

            // Perform atomic update to Firebase
            await databaseService.atomicUpdate(updates);

            console.log(
              '🎯 Game initialized and synced to Firebase (game-state + teams):',
              {
                teams: playQueue.length,
                sets: Object.keys(questionSetAssignments).length,
              },
            );

            return { success: true };
          } catch (error) {
            console.error('Failed to initialize game:', error);

            // Rollback local state on Firebase error
            set({
              gameStatus: DEFAULT_GAME_STATE,
              playQueue: [],
              questionSetAssignments: {},
              initializedAt: null,
            });

            return { success: false, error: error.message };
          }
        },

        /**
         * Start event (activate first team)
         * SYNCS TO FIREBASE AUTOMATICALLY
         */
        startEvent: async () => {
          const { playQueue } = get();

          if (playQueue.length === 0) {
            console.warn('Cannot start event: no teams in queue');
            return { success: false, error: 'No teams in queue' };
          }

          const firstTeamId = playQueue[0];

          try {
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
            });

            // Also update first team status to 'active' in teams node
            await databaseService.updateTeam(firstTeamId, {
              status: 'active',
            });

            console.log(`🚀 Event started with team: ${firstTeamId}`);

            return { success: true };
          } catch (error) {
            console.error('Failed to start event:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Move to next team in queue
         */
        nextTeam: () => {
          const { currentTeamId, playQueue } = get();

          const currentIndex = playQueue.indexOf(currentTeamId);

          if (currentIndex === -1) {
            console.warn('Current team not found in queue');
            return;
          }

          // Check if there's a next team
          if (currentIndex >= playQueue.length - 1) {
            // No more teams - game complete
            set({
              gameStatus: GAME_STATUS.COMPLETED,
              currentTeamId: null,
              currentQuestionNumber: 0,
              lastUpdated: Date.now(),
            });

            console.log('🏁 All teams complete - game ended');
            return;
          }

          // Move to next team
          const nextTeamId = playQueue[currentIndex + 1];

          set({
            currentTeamId: nextTeamId,
            currentQuestionNumber: 0,
            currentQuestion: null,
            questionVisible: false,
            optionsVisible: false,
            answerRevealed: false,
            correctOption: null,
            lastUpdated: Date.now(),
          });

          console.log(`➡️ Next team: ${nextTeamId}`);
        },

        /**
         * Pause game
         */
        pauseGame: () => {
          get().setGameStatus(GAME_STATUS.PAUSED);
        },

        /**
         * Resume game
         */
        resumeGame: () => {
          get().setGameStatus(GAME_STATUS.ACTIVE);
        },

        /**
         * Reset game state for new event
         * SYNCS TO FIREBASE AUTOMATICALLY
         * CLEARS BOTH game-state AND teams nodes atomically
         */
        resetGame: async () => {
          try {
            // Get current assignments before clearing
            const { questionSetAssignments } = get();
            const teamIds = Object.keys(questionSetAssignments);

            // Update local state
            set({
              gameStatus: DEFAULT_GAME_STATE,
              currentTeamId: null,
              currentQuestionNumber: 0,
              currentQuestion: null,
              questionVisible: false,
              optionsVisible: false,
              answerRevealed: false,
              correctOption: null,
              playQueue: [],
              questionSetAssignments: {},
              initializedAt: null,
              startedAt: null,
              lastUpdated: Date.now(),
            });

            // Build atomic multi-path update object
            const updates = {};

            // 1. Reset game-state node
            updates['game-state/game-status'] = 'not-started';
            updates['game-state/current-team-id'] = null;
            updates['game-state/current-question-number'] = 0;
            updates['game-state/play-queue'] = [];
            updates['game-state/question-set-assignments'] = {};
            updates['game-state/current-question'] = null;
            updates['game-state/question-visible'] = false;
            updates['game-state/options-visible'] = false;
            updates['game-state/answer-revealed'] = false;
            updates['game-state/correct-option'] = null;
            updates['game-state/initialized-at'] = null;
            updates['game-state/started-at'] = null;
            updates['game-state/last-updated'] = Date.now();

            // 2. Clear question-set-id from each team in teams node
            teamIds.forEach((teamId) => {
              updates[`teams/${teamId}/question-set-id`] = null;
              updates[`teams/${teamId}/last-updated`] = Date.now();
            });

            // Perform atomic update to Firebase
            await databaseService.atomicUpdate(updates);

            console.log(
              '🔄 Game reset to initial state and synced to Firebase (game-state + teams cleared)',
            );

            return { success: true };
          } catch (error) {
            console.error('Failed to reset game:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Uninitialize game (reset to NOT_STARTED state)
         * Clears play queue and assignments from BOTH game-state AND teams
         * SYNCS TO FIREBASE AUTOMATICALLY
         */
        uninitializeGame: async () => {
          const result = await get().resetGame();
          if (result.success) {
            console.log(
              '🔄 Game uninitialized - ready for new initialization (game-state + teams synced)',
            );
          }
          return result;
        },

        /**
         * Get question set ID for current team
         */
        getCurrentTeamQuestionSet: () => {
          const { currentTeamId, questionSetAssignments } = get();
          return questionSetAssignments[currentTeamId] || null;
        },

        /**
         * Get remaining teams in queue
         */
        getRemainingTeams: () => {
          const { currentTeamId, playQueue } = get();
          const currentIndex = playQueue.indexOf(currentTeamId);

          if (currentIndex === -1) {
            return playQueue;
          }

          return playQueue.slice(currentIndex + 1);
        },

        /**
         * Get game summary
         */
        getGameSummary: () => {
          const state = get();

          return {
            status: state.gameStatus,
            currentTeam: state.currentTeamId,
            questionNumber: state.currentQuestionNumber,
            totalTeams: state.playQueue.length,
            remainingTeams: state.getRemainingTeams().length,
            isInitialized: state.gameStatus !== DEFAULT_GAME_STATE,
            isActive: state.gameStatus === GAME_STATUS.ACTIVE,
            isPaused: state.gameStatus === GAME_STATUS.PAUSED,
            isCompleted: state.gameStatus === GAME_STATUS.COMPLETED,
          };
        },

        // ============================================================
        // QUESTION FLOW ACTIONS (Phase 04)
        // ============================================================

        /**
         * Load next question for current team (host view with correct answer)
         * Integrates with useQuestionsStore
         */
        loadNextQuestion: async (questionsStore) => {
          const {
            currentTeamId,
            currentQuestionNumber,
            questionSetAssignments,
          } = get();

          if (!currentTeamId) {
            return { success: false, error: 'No current team' };
          }

          try {
            // Get assigned question set ID for current team
            const assignedSetId = questionSetAssignments[currentTeamId];

            if (!assignedSetId) {
              return {
                success: false,
                error: 'No question set assigned to team',
              };
            }

            // Calculate next question index (0-19)
            const nextQuestionIndex = currentQuestionNumber; // 0-indexed for localStorage

            // Load question from questions store (with correct answer)
            const result = questionsStore.loadHostQuestion(
              assignedSetId,
              nextQuestionIndex,
            );

            if (!result.success) {
              return {
                success: false,
                error: result.error || 'Failed to load question',
              };
            }

            // Update local game state
            set({
              currentQuestion: result.question,
              questionVisible: false,
              optionsVisible: false,
              answerRevealed: false,
              correctOption: null,
              lastUpdated: Date.now(),
            });

            console.log(
              `📝 Question loaded: ${assignedSetId} Q${nextQuestionIndex + 1}`,
            );

            return { success: true, question: result.question };
          } catch (error) {
            console.error('Failed to load question:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Show question to public (push to Firebase WITHOUT correct answer)
         */
        showQuestionToPublic: async () => {
          const { currentQuestion, currentQuestionNumber } = get();

          if (!currentQuestion) {
            return { success: false, error: 'No question loaded' };
          }

          try {
            // Remove correct answer before pushing to Firebase
            const { correctAnswer, ...publicQuestion } = currentQuestion;

            // Push to Firebase
            await databaseService.setCurrentQuestion(
              publicQuestion,
              currentQuestionNumber + 1, // 1-indexed for display
            );

            // Update local state
            set({
              questionVisible: true,
              optionsVisible: true,
              lastUpdated: Date.now(),
            });

            console.log('👁️ Question shown to public (no correct answer)');

            return { success: true };
          } catch (error) {
            console.error('Failed to show question:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Validate answer and trigger appropriate flow
         * Integrates with useQuestionsStore and useTeamsStore
         */
        validateAnswer: async (questionsStore, teamsStore) => {
          const { currentTeamId, currentQuestionNumber } = get();

          if (!currentTeamId) {
            return { success: false, error: 'No current team' };
          }

          try {
            // Validate answer using questions store
            const validationResult = questionsStore.validateSelectedAnswer();

            if (!validationResult.success) {
              return { success: false, error: validationResult.error };
            }

            const { result } = validationResult;
            const { isCorrect } = result;

            // Get current team data
            const currentTeam = teamsStore.teams[currentTeamId];

            if (!currentTeam) {
              return { success: false, error: 'Team not found' };
            }

            // Push correct answer to Firebase (reveal to public)
            const correctOption = result.correctAnswer;
            await databaseService.revealAnswer(correctOption);

            // Update local state
            set({
              answerRevealed: true,
              correctOption,
              lastUpdated: Date.now(),
            });

            console.log(
              `${isCorrect ? '✅' : '❌'} Answer validated: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`,
            );

            return {
              success: true,
              isCorrect,
              correctAnswer: correctOption,
              hasLifelines: Object.values(currentTeam.lifelines || {}).some(
                (v) => v === true,
              ),
              teamLifelines: currentTeam.lifelines,
            };
          } catch (error) {
            console.error('Failed to validate answer:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Handle correct answer flow
         * Updates prize, increments question number, syncs to Firebase
         */
        handleCorrectAnswer: async (teamsStore, prizeStructure) => {
          const { currentTeamId, currentQuestionNumber } = get();

          if (!currentTeamId) {
            return { success: false, error: 'No current team' };
          }

          try {
            // Calculate new prize (question number is 0-indexed, but prize array is also 0-indexed)
            const newPrizeIndex = currentQuestionNumber; // This is the question just answered
            const newPrize = prizeStructure[newPrizeIndex] || 0;

            // Increment question number
            const nextQuestionNumber = currentQuestionNumber + 1;

            // Update team in Firebase
            await teamsStore.updateTeam(currentTeamId, {
              currentPrize: newPrize,
              currentQuestionIndex: nextQuestionNumber,
              questionsAnswered: nextQuestionNumber,
            });

            // Update local state
            set({
              currentQuestionNumber: nextQuestionNumber,
              lastUpdated: Date.now(),
            });

            console.log(
              `💰 Prize updated: Rs.${newPrize} (Q${nextQuestionNumber} complete)`,
            );

            return {
              success: true,
              newPrize,
              nextQuestionNumber,
            };
          } catch (error) {
            console.error('Failed to handle correct answer:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Handle incorrect answer - check lifelines and determine action
         */
        handleIncorrectAnswer: async (teamsStore) => {
          const { currentTeamId } = get();

          if (!currentTeamId) {
            return { success: false, error: 'No current team' };
          }

          try {
            // Get current team
            const currentTeam = teamsStore.teams[currentTeamId];

            if (!currentTeam) {
              return { success: false, error: 'Team not found' };
            }

            // Check for available lifelines
            const lifelines = currentTeam.lifelines || {};
            const hasLifelines = Object.values(lifelines).some(
              (v) => v === true,
            );
            const availableLifelines = Object.keys(lifelines).filter(
              (k) => lifelines[k] === true,
            );

            console.log(
              `❌ Incorrect answer - Lifelines available: ${hasLifelines}`,
            );

            return {
              success: true,
              hasLifelines,
              availableLifelines,
              currentPrize: currentTeam.currentPrize || 0,
            };
          } catch (error) {
            console.error('Failed to handle incorrect answer:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Eliminate team (lock prize, set status to eliminated)
         */
        eliminateTeam: async (teamsStore) => {
          const { currentTeamId } = get();

          if (!currentTeamId) {
            return { success: false, error: 'No current team' };
          }

          try {
            // Get current team
            const currentTeam = teamsStore.teams[currentTeamId];

            if (!currentTeam) {
              return { success: false, error: 'Team not found' };
            }

            // Eliminate team in Firebase (locks prize)
            await databaseService.eliminateTeam(currentTeamId);

            console.log(
              `🚫 Team eliminated: ${currentTeam.name} (Prize: Rs.${currentTeam.currentPrize})`,
            );

            return {
              success: true,
              teamName: currentTeam.name,
              finalPrize: currentTeam.currentPrize || 0,
            };
          } catch (error) {
            console.error('Failed to eliminate team:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Complete current team (all 20 questions answered)
         */
        completeTeam: async (teamsStore) => {
          const { currentTeamId } = get();

          if (!currentTeamId) {
            return { success: false, error: 'No current team' };
          }

          try {
            // Get current team
            const currentTeam = teamsStore.teams[currentTeamId];

            if (!currentTeam) {
              return { success: false, error: 'Team not found' };
            }

            // Update team status to completed
            await teamsStore.updateTeam(currentTeamId, {
              status: 'completed',
              completedAt: Date.now(),
            });

            console.log(
              `🏆 Team completed: ${currentTeam.name} (Final Prize: Rs.${currentTeam.currentPrize})`,
            );

            return {
              success: true,
              teamName: currentTeam.name,
              finalPrize: currentTeam.currentPrize || 0,
            };
          } catch (error) {
            console.error('Failed to complete team:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Move to next team in queue
         */
        moveToNextTeam: async (teamsStore, questionsStore) => {
          const { currentTeamId, playQueue } = get();

          const currentIndex = playQueue.indexOf(currentTeamId);

          if (currentIndex === -1) {
            return { success: false, error: 'Current team not in queue' };
          }

          // Check if there's a next team
          if (currentIndex >= playQueue.length - 1) {
            // No more teams - complete game
            set({
              gameStatus: GAME_STATUS.COMPLETED,
              currentTeamId: null,
              currentQuestionNumber: 0,
              lastUpdated: Date.now(),
            });

            await databaseService.updateGameState({
              gameStatus: 'completed',
              currentTeamId: null,
              currentQuestionNumber: 0,
            });

            console.log('🏁 All teams complete - game ended');

            return { success: true, gameComplete: true };
          }

          // Move to next team
          const nextTeamId = playQueue[currentIndex + 1];

          try {
            // Update next team status to active
            await teamsStore.updateTeam(nextTeamId, {
              status: 'active',
            });

            // Clear question state
            questionsStore.clearHostQuestion();

            // Update local game state
            set({
              currentTeamId: nextTeamId,
              currentQuestionNumber: 0,
              currentQuestion: null,
              questionVisible: false,
              optionsVisible: false,
              answerRevealed: false,
              correctOption: null,
              lastUpdated: Date.now(),
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

            console.log(`➡️ Next team: ${nextTeamId}`);

            return { success: true, nextTeamId };
          } catch (error) {
            console.error('Failed to move to next team:', error);
            return { success: false, error: error.message };
          }
        },

        /**
         * Proceed to next question (after correct answer)
         */
        proceedToNextQuestion: (questionsStore) => {
          // Clear question state in questions store
          questionsStore.clearHostQuestion();

          // Clear local question display state
          set({
            currentQuestion: null,
            questionVisible: false,
            optionsVisible: false,
            answerRevealed: false,
            correctOption: null,
            lastUpdated: Date.now(),
          });

          console.log('🔄 Ready for next question');

          return { success: true };
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

        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.warn(
              '🎮 Game: Failed to hydrate from localStorage:',
              error,
            );
            return;
          }

          if (state) {
            console.log('🎮 Game: Hydrated from localStorage');

            // AUTO-LOAD: Check if game state is empty (fresh browser)
            const hasGameState =
              state.gameStatus &&
              state.gameStatus !== DEFAULT_GAME_STATE &&
              state.playQueue &&
              state.playQueue.length > 0;

            if (!hasGameState) {
              console.log(
                '🎮 Game: Empty state detected - auto-loading from Firebase...',
              );

              // Trigger async load from Firebase
              state.syncGameStateFromFirebase().then((result) => {
                if (result.success) {
                  console.log('🎮 Game: Auto-load complete ✅');
                } else {
                  console.warn('🎮 Game: Auto-load failed ⚠️', result.error);
                }
              });
            } else {
              console.log(
                `🎮 Game: Loaded from localStorage - Status: ${state.gameStatus}`,
              );

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
