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
 * Manages game flow, team rotation, and question navigation.
 *
 * Key behaviors:
 * - isDataReady: set true after the first successful Firebase sync. The Play page
 *   blocks rendering until this is confirmed (via ensureDataReady).
 * - questionSetAssignments guard: the real-time listener never overwrites a populated
 *   assignment map with an empty one. Phone-a-Friend resume triggers 3 rapid Firebase
 *   writes which can briefly emit a snapshot where assignments appear absent.
 * - Eager pre-load: nextTeam() non-blockingly pre-fetches the next team's question
 *   set so it is cached before the host clicks "Load Question 1".
 * - syncQuestionSets(): manual mid-game recovery that re-fetches all assignments and
 *   reloads every question set. Exposed via GameControls "Sync" button.
 *
 * Only essential game config is persisted to localStorage. All gameplay state
 * is fetched fresh from Firebase on mount.
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
         * Ensure critical game data is loaded and ready.
         * If not ready, triggers fresh sync from Firebase.
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
         * Push final results flag to Firebase to trigger public display of final results
         */
        pushFinalResults: async () => {
          await databaseService.updateGameState({ displayFinalResults: true });
          set({ displayFinalResults: true, lastUpdated: Date.now() });
        },

        /**
         * Move to next team in play queue.
         * Sets the next team to active and resets all question-related state.
         *
         * Does NOT modify the previous team's status — that must be set before calling
         * this (via completeTeam or eliminateTeam). Changing it here would create a
         * race condition with outstanding Firebase updates.
         *
         * Non-blockingly pre-fetches the next team's question set so it is cached
         * before the host clicks "Load Question 1".
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

            // Activate next team
            await useTeamsStore.getState().updateTeam(nextTeamId, {
              status: 'active',
            });

            console.log(`➡️ Next team ${nextTeamId} set to active`);

            // Reset question state for the new team and sync to Firebase
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

            console.log(`✅ Moved to next team: ${nextTeamId}`);

            // Eagerly fetch the next team's question set so it is warm in memory
            // by the time the host clicks "Load Question 1". Failures are logged only
            // — the lazy path inside loadQuestion() acts as a fallback.
            const nextTeamQuestionSetId =
              get().questionSetAssignments[nextTeamId];

            if (nextTeamQuestionSetId) {
              useQuestionsStore
                .getState()
                .loadQuestionSet(nextTeamQuestionSetId, { forceFresh: true })
                .then((result) => {
                  if (result.success) {
                    console.log(
                      `📚 Pre-loaded question set "${nextTeamQuestionSetId}" for next team ${nextTeamId}`,
                    );
                  } else {
                    console.warn(
                      `⚠️ Failed to pre-load question set "${nextTeamQuestionSetId}" for team ${nextTeamId}:`,
                      result.error,
                    );
                  }
                });
            } else {
              console.warn(
                `⚠️ nextTeam: no question set assignment found for ${nextTeamId} — skipping pre-load`,
              );
            }

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
         * Clear all question-related UI state and sync to Firebase so the
         * public display is retracted.
         *
         * Does NOT increment currentQuestionNumber — the number is set when
         * loadQuestion() is called, so incrementing here would cause the next
         * load to skip a question.
         *
         * Does NOT change team status — the caller (useGameControls › handleSkipQuestion)
         * is responsible for that after this resolves.
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
         * Sync question set assignments from Firebase and pre-load all question
         * sets for every team in the play queue.
         *
         * USE CASE: Mid-game recovery when the host sees the
         * "question set not assigned" error without needing to reload the page
         * or reinitialize the game. Exposed to the UI via GameControls.
         *
         * Flow:
         * 1. Fetch fresh game-state from Firebase (includes questionSetAssignments)
         * 2. Update local store with fresh assignments (guards against empty map)
         * 3. Deduplicate question set IDs across play queue
         * 4. Force-refresh every question set from Firebase
         * 5. Return success/failure with counts
         *
         * @returns {Promise<{ success: boolean, setsLoaded: number, error?: string }>}
         */
        syncQuestionSets: async () => {
          console.log(
            '🔄 Syncing question set assignments from Firebase (manual)...',
          );

          try {
            // 1. Fetch fresh game state from Firebase
            const firebaseGameState = await databaseService.getGameState();

            if (!firebaseGameState) {
              return {
                success: false,
                setsLoaded: 0,
                error: 'Could not reach Firebase. Check your connection.',
              };
            }

            const freshAssignments = firebaseGameState.questionSetAssignments;

            if (
              !freshAssignments ||
              Object.keys(freshAssignments).length === 0
            ) {
              return {
                success: false,
                setsLoaded: 0,
                error:
                  'No question set assignments found in Firebase. Has the game been initialized?',
              };
            }

            // 2. Update local store (always trust a non-empty result from Firebase)
            set({ questionSetAssignments: freshAssignments });
            console.log(
              `✅ Question set assignments refreshed: ${Object.keys(freshAssignments).length} teams`,
            );

            // 3. Collect unique set IDs from the play queue
            const { playQueue } = get();

            const uniqueSetIds = [
              ...new Set(
                playQueue
                  .map((teamId) => freshAssignments[teamId])
                  .filter(Boolean),
              ),
            ];

            if (uniqueSetIds.length === 0) {
              return {
                success: false,
                setsLoaded: 0,
                error:
                  'Play queue teams have no matching question set assignments.',
              };
            }

            console.log(
              `📚 Pre-loading ${uniqueSetIds.length} question set(s): ${uniqueSetIds.join(', ')}`,
            );

            // 4. Force-refresh all question sets in parallel
            const loadResults = await Promise.allSettled(
              uniqueSetIds.map((setId) =>
                useQuestionsStore
                  .getState()
                  .loadQuestionSet(setId, { forceFresh: true }),
              ),
            );

            const successCount = loadResults.filter(
              (r) => r.status === 'fulfilled' && r.value?.success,
            ).length;

            const failureCount = uniqueSetIds.length - successCount;

            if (failureCount > 0) {
              console.warn(
                `⚠️ ${failureCount}/${uniqueSetIds.length} question sets failed to load`,
              );
            }

            console.log(
              `✅ Sync complete: ${successCount}/${uniqueSetIds.length} question sets loaded`,
            );

            return {
              success: successCount > 0,
              setsLoaded: successCount,
              error:
                failureCount > 0
                  ? `${failureCount} set(s) could not be loaded from Firebase.`
                  : undefined,
            };
          } catch (error) {
            console.error('Failed to sync question sets:', error);
            return { success: false, setsLoaded: 0, error: error.message };
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
         * Load game state from Firebase.
         * Fetches fresh data from Firebase and updates local state.
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
         * Reset app to factory defaults.
         * Clears ALL data including question sets from Firebase.
         * Syncs to Firebase and resets local state.
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
         * Start real-time Firebase listener for game state changes.
         * Returns an unsubscribe function — call it on component unmount.
         *
         * Guards questionSetAssignments against being overwritten with an empty map.
         * The Phone-a-Friend resume flow triggers 3 rapid sequential Firebase writes
         * (clearLifelineTimer → clearActiveLifeline → resumeGame), each firing the
         * onValue callback. If the incoming snapshot has empty assignments but local
         * ones are populated, the local values are preserved to prevent a mid-game wipe.
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

                // Guard: never silently overwrite a populated questionSetAssignments
                // with an empty map. If Firebase sends a snapshot where assignments
                // are absent or empty, keep the existing local value.
                const incomingAssignments =
                  firebaseGameState.questionSetAssignments;
                const currentAssignments = get().questionSetAssignments;

                const safeAssignments =
                  incomingAssignments &&
                  Object.keys(incomingAssignments).length > 0
                    ? incomingAssignments
                    : currentAssignments &&
                        Object.keys(currentAssignments).length > 0
                      ? currentAssignments
                      : {};

                if (
                  incomingAssignments &&
                  Object.keys(incomingAssignments).length === 0 &&
                  Object.keys(currentAssignments || {}).length > 0
                ) {
                  console.warn(
                    '⚠️ Firebase sent empty questionSetAssignments — preserving local assignments to prevent data loss',
                  );
                }

                // Sync Firebase-owned fields only — local-only flags (isSyncingData, etc.) are untouched
                set({
                  gameStatus: firebaseGameState.gameStatus,
                  currentTeamId: firebaseGameState.currentTeamId,
                  currentQuestionNumber:
                    firebaseGameState.currentQuestionNumber,
                  playQueue: firebaseGameState.playQueue || [],
                  questionSetAssignments: safeAssignments,
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
        version: 4,

        // Only essential game config is persisted. Gameplay state (current question,
        // visibility flags, etc.) is always fetched fresh from Firebase on mount.
        partialize: (state) => ({
          gameStatus: state.gameStatus,
          playQueue: state.playQueue,
          questionSetAssignments: state.questionSetAssignments,
          initializedAt: state.initializedAt,
          startedAt: state.startedAt,
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
                }
              });
            }
          }
        },
      },
    ),
  ),
);

export default useGameStore;
