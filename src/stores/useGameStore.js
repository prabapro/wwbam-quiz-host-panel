// src/stores/useGameStore.js

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  GAME_STATUS,
  DEFAULT_GAME_STATE,
  isValidTransition,
} from '@constants/gameStates';

const appName = import.meta.env.VITE_APP_NAME || 'wwbam-quiz-host-panel';

/**
 * Game State Store
 * Manages the current game session state using Zustand
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

        // ============================================================
        // ACTIONS
        // ============================================================

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
         */
        initializeGame: (playQueue, questionSetAssignments) => {
          set({
            gameStatus: GAME_STATUS.INITIALIZED,
            playQueue,
            questionSetAssignments,
            initializedAt: Date.now(),
            lastUpdated: Date.now(),
          });

          console.log('🎯 Game initialized:', {
            teams: playQueue.length,
            sets: Object.keys(questionSetAssignments).length,
          });
        },

        /**
         * Start event (activate first team)
         */
        startEvent: () => {
          const { playQueue } = get();

          if (playQueue.length === 0) {
            console.warn('Cannot start event: no teams in queue');
            return;
          }

          const firstTeamId = playQueue[0];

          set({
            gameStatus: GAME_STATUS.ACTIVE,
            currentTeamId: firstTeamId,
            currentQuestionNumber: 0,
            startedAt: Date.now(),
            lastUpdated: Date.now(),
          });

          console.log(`🚀 Event started with team: ${firstTeamId}`);
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
         */
        resetGame: () => {
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

          console.log('🔄 Game reset to initial state');
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
            console.warn('🎮 Game: Failed to hydrate from localStorage:', error);
            return;
          }

          if (state) {
            console.log('🎮 Game: Hydrated from localStorage');
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
