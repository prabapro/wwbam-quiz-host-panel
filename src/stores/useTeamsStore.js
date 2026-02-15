// src/stores/useTeamsStore.js

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  TEAM_STATUS,
  DEFAULT_TEAM_STATUS,
  isValidTeamTransition,
  LIFELINE_TYPE,
} from '@constants/teamStates';
import { databaseService } from '@services/database.service';

const appName = import.meta.env.VITE_APP_NAME || 'wwbam-quiz-host-panel';

/**
 * Teams Store
 * Manages all team data including statuses, prizes, progress, and lifelines
 * Syncs with Firebase Realtime Database
 */
export const useTeamsStore = create()(
  devtools(
    persist(
      (set, get) => ({
        // ============================================================
        // STATE
        // ============================================================

        // Teams object: { teamId: teamData }
        teams: {},

        // Loading state for Firebase operations
        isLoading: false,

        // Error state
        error: null,

        // ============================================================
        // ACTIONS
        // ============================================================

        /**
         * Add a new team (syncs with Firebase)
         */
        addTeam: async (teamData) => {
          set({ isLoading: true, error: null });

          try {
            // Create team in Firebase first - Firebase generates the ID
            const firebaseTeamId = await databaseService.createTeam({
              name: teamData.name,
              participants: teamData.participants,
              contact: teamData.contact,
            });

            // Use the Firebase-generated ID for local state
            const newTeam = {
              id: firebaseTeamId, // ← Use Firebase ID
              name: teamData.name,
              participants: teamData.participants || '',
              contact: teamData.contact || '',
              status: DEFAULT_TEAM_STATUS,
              currentPrize: 0,
              questionSetId: null,
              currentQuestionIndex: 0,
              questionsAnswered: 0,
              lifelines: {
                [LIFELINE_TYPE.PHONE_A_FRIEND]: true,
                [LIFELINE_TYPE.FIFTY_FIFTY]: true,
              },
              createdAt: Date.now(),
              lastUpdated: Date.now(),
            };

            // Update local state with Firebase ID
            set((state) => ({
              teams: {
                ...state.teams,
                [firebaseTeamId]: newTeam, // ← Use Firebase ID
              },
              isLoading: false,
            }));

            console.log(`✅ Team added: ${firebaseTeamId} (${newTeam.name})`);

            return { success: true, teamId: firebaseTeamId, team: newTeam };
          } catch (error) {
            console.error('Failed to add team:', error);
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
          }
        },

        /**
         * Update team data (syncs with Firebase)
         */
        updateTeam: async (teamId, updates) => {
          const { teams } = get();

          if (!teams[teamId]) {
            console.warn(`Team ${teamId} not found`);
            return { success: false, error: 'Team not found' };
          }

          // Validate status transition if status is being updated
          if (updates.status) {
            const currentStatus = teams[teamId].status;
            const newStatus = updates.status;

            if (!isValidTeamTransition(currentStatus, newStatus)) {
              console.warn(
                `Invalid team status transition: ${currentStatus} -> ${newStatus}`,
              );
              return { success: false, error: 'Invalid status transition' };
            }
          }

          set({ isLoading: true, error: null });

          try {
            // Sync to Firebase first
            await databaseService.updateTeam(teamId, updates);

            // Then update local state
            const updatedTeam = {
              ...teams[teamId],
              ...updates,
              lastUpdated: Date.now(),
            };

            set({
              teams: {
                ...teams,
                [teamId]: updatedTeam,
              },
              isLoading: false,
            });

            console.log(`✅ Team updated: ${teamId}`);

            return { success: true, team: updatedTeam };
          } catch (error) {
            console.error('Failed to update team:', error);
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
          }
        },

        /**
         * Delete a team (syncs with Firebase)
         */
        deleteTeam: async (teamId) => {
          const { teams } = get();

          if (!teams[teamId]) {
            console.warn(`Team ${teamId} not found`);
            return { success: false, error: 'Team not found' };
          }

          set({ isLoading: true, error: null });

          try {
            // Delete from Firebase
            await databaseService.deleteTeam(teamId);

            // Remove from local state
            // eslint-disable-next-line no-unused-vars
            const { [teamId]: removed, ...remainingTeams } = teams;

            set({ teams: remainingTeams, isLoading: false });

            console.log(`✅ Team deleted: ${teamId}`);

            return { success: true };
          } catch (error) {
            console.error('Failed to delete team:', error);
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
          }
        },

        /**
         * Delete all teams from Firebase (for factory reset)
         */
        deleteAllTeamsFromFirebase: async () => {
          set({ isLoading: true, error: null });

          try {
            // Delete all teams from Firebase
            await databaseService.deleteAllTeams();

            // Clear local state (triggers localStorage clear via persist)
            set({ teams: {}, isLoading: false });

            console.log('✅ All teams deleted from Firebase and localStorage');

            return { success: true };
          } catch (error) {
            console.error('Failed to delete all teams:', error);
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
          }
        },

        /**
         * Sync teams from Firebase to local state
         */
        syncTeamsFromFirebase: async () => {
          set({ isLoading: true, error: null });

          try {
            const firebaseTeams = await databaseService.getTeams();

            if (firebaseTeams) {
              set({ teams: firebaseTeams, isLoading: false });
              console.log('✅ Teams synced from Firebase');
              return { success: true, teams: firebaseTeams };
            } else {
              set({ teams: {}, isLoading: false });
              return { success: true, teams: {} };
            }
          } catch (error) {
            console.error('Failed to sync teams from Firebase:', error);
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
          }
        },

        /**
         * Listen to Firebase teams changes (real-time sync)
         */
        startTeamsListener: () => {
          const unsubscribe = databaseService.onTeamsChange((firebaseTeams) => {
            if (firebaseTeams) {
              set({ teams: firebaseTeams });
              console.log('🔄 Teams updated from Firebase');
            }
          });

          // Return unsubscribe function
          return unsubscribe;
        },

        /**
         * Use lifeline
         */
        useLifeline: (teamId, lifelineType) => {
          const { teams } = get();
          const team = teams[teamId];

          if (!team) {
            console.warn(`Team ${teamId} not found`);
            return { success: false, error: 'Team not found' };
          }

          if (!team.lifelines[lifelineType]) {
            console.warn(
              `Lifeline ${lifelineType} not available for ${teamId}`,
            );
            return {
              success: false,
              error: 'Lifeline not available',
            };
          }

          return get().updateTeam(teamId, {
            lifelines: {
              ...team.lifelines,
              [lifelineType]: false,
            },
          });
        },

        /**
         * Move to next question
         */
        moveToNextQuestion: async (teamId, prizeWon) => {
          const { teams } = get();
          const team = teams[teamId];

          if (!team) {
            console.warn(`Team ${teamId} not found`);
            return { success: false, error: 'Team not found' };
          }

          return await get().updateTeam(teamId, {
            currentQuestionIndex: team.currentQuestionIndex + 1,
            questionsAnswered: team.questionsAnswered + 1,
            currentPrize: prizeWon,
          });
        },

        /**
         * Eliminate team (wrong answer or quit)
         */
        eliminateTeam: async (teamId, finalPrize) => {
          const result = await get().updateTeam(teamId, {
            status: TEAM_STATUS.ELIMINATED,
            currentPrize: finalPrize,
            eliminatedAt: Date.now(),
          });

          console.log(`❌ Team eliminated: ${teamId}`);

          return result;
        },

        /**
         * Mark team as completed (won maximum prize)
         * @param {string} teamId - Team ID
         * @param {number} finalPrize - Final prize amount
         * @param {number} finalQuestionNumber - Final question number answered
         * @returns {Promise<Object>} Update result
         */
        completeTeam: async (teamId, finalPrize, finalQuestionNumber) => {
          const result = await get().updateTeam(teamId, {
            currentPrize: finalPrize,
            status: TEAM_STATUS.COMPLETED,
            completedAt: Date.now(),
            questionsAnswered: finalQuestionNumber,
            currentQuestionIndex: finalQuestionNumber,
          });

          console.log(
            `🏆 Team completed: ${teamId} with ${finalQuestionNumber} questions answered`,
          );

          return result;
        },

        /**
         * Assign question set to team
         */
        assignQuestionSet: async (teamId, questionSetId) => {
          return await get().updateTeam(teamId, { questionSetId });
        },

        /**
         * Get team by ID
         */
        getTeam: (teamId) => {
          const { teams } = get();
          return teams[teamId] || null;
        },

        /**
         * Get all teams as array
         */
        getTeamsArray: () => {
          const { teams } = get();
          return Object.values(teams);
        },

        /**
         * Get teams by status
         */
        getTeamsByStatus: (status) => {
          const { teams } = get();
          return Object.values(teams).filter((team) => team.status === status);
        },

        /**
         * Get active team
         */
        getActiveTeam: () => {
          const { teams } = get();
          return (
            Object.values(teams).find(
              (team) => team.status === TEAM_STATUS.ACTIVE,
            ) || null
          );
        },

        /**
         * Get waiting teams
         */
        getWaitingTeams: () => {
          return get().getTeamsByStatus(TEAM_STATUS.WAITING);
        },

        /**
         * Get eliminated teams
         */
        getEliminatedTeams: () => {
          return get().getTeamsByStatus(TEAM_STATUS.ELIMINATED);
        },

        /**
         * Get completed teams
         */
        getCompletedTeams: () => {
          return get().getTeamsByStatus(TEAM_STATUS.COMPLETED);
        },

        /**
         * Check if team has lifeline available
         */
        hasLifeline: (teamId, lifelineType) => {
          const team = get().getTeam(teamId);
          return team?.lifelines[lifelineType] || false;
        },

        /**
         * Get team's available lifelines
         */
        getAvailableLifelines: (teamId) => {
          const team = get().getTeam(teamId);

          if (!team) return [];

          return Object.entries(team.lifelines)
            .filter(([, available]) => available)
            .map(([type]) => type);
        },

        /**
         * Reset team progress (for new game)
         */
        resetTeamProgress: async (teamId) => {
          return await get().updateTeam(teamId, {
            status: DEFAULT_TEAM_STATUS,
            currentPrize: 0,
            currentQuestionIndex: 0,
            questionsAnswered: 0,
            questionSetId: null,
            lifelines: {
              [LIFELINE_TYPE.PHONE_A_FRIEND]: true,
              [LIFELINE_TYPE.FIFTY_FIFTY]: true,
            },
            eliminatedAt: null,
            completedAt: null,
          });
        },

        /**
         * Reset all teams progress
         */
        resetAllTeamsProgress: async () => {
          const { teams } = get();
          const teamIds = Object.keys(teams);

          try {
            for (const teamId of teamIds) {
              await get().resetTeamProgress(teamId);
            }

            console.log('🔄 All teams progress reset');
            return { success: true }; // ✅ Add return value
          } catch (error) {
            console.error('Failed to reset teams progress:', error);
            return { success: false, error: error.message }; // ✅ Return error
          }
        },
        /**
         * Clear all teams
         */
        clearAllTeams: () => {
          set({ teams: {} });
          console.log('🧹 All teams cleared');
        },

        /**
         * Get teams summary
         */
        getTeamsSummary: () => {
          const teams = get().getTeamsArray();

          return {
            total: teams.length,
            waiting: teams.filter((t) => t.status === TEAM_STATUS.WAITING)
              .length,
            active: teams.filter((t) => t.status === TEAM_STATUS.ACTIVE).length,
            eliminated: teams.filter((t) => t.status === TEAM_STATUS.ELIMINATED)
              .length,
            completed: teams.filter((t) => t.status === TEAM_STATUS.COMPLETED)
              .length,
            totalPrizeDistributed: teams.reduce(
              (sum, t) => sum + (t.currentPrize || 0),
              0,
            ),
          };
        },
      }),
      {
        name: `${appName}-teams`,
        version: 1,

        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.warn(
              '👥 Teams: Failed to hydrate from localStorage:',
              error,
            );
            return;
          }

          if (state) {
            console.log('👥 Teams: Hydrated from localStorage');

            // AUTO-LOAD: Check if teams are empty (cleared localStorage or first load)
            const hasTeams = state.teams && Object.keys(state.teams).length > 0;

            if (!hasTeams) {
              console.log(
                '👥 Teams: Empty state detected - auto-loading from Firebase...',
              );

              // Trigger async load - don't await to avoid blocking rehydration
              state.syncTeamsFromFirebase().then((result) => {
                if (result.success) {
                  console.log('👥 Teams: Auto-load complete ✅');
                } else {
                  console.warn('👥 Teams: Auto-load failed ⚠️', result.error);
                }
              });
            } else {
              console.log(
                `👥 Teams: ${Object.keys(state.teams).length} team(s) loaded from localStorage`,
              );
            }
          }
        },
      },
    ),
    {
      name: 'teams-store',
    },
  ),
);

export default useTeamsStore;
