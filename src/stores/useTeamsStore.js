// src/stores/useTeamsStore.js

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  TEAM_STATUS,
  DEFAULT_TEAM_STATUS,
  isValidTeamTransition,
  LIFELINE_TYPE,
} from '@constants/teamStates';

const appName = import.meta.env.VITE_APP_NAME || 'wwbam-quiz-host-panel';

/**
 * Teams Store
 * Manages all team data including statuses, prizes, progress, and lifelines
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

        // ============================================================
        // ACTIONS
        // ============================================================

        /**
         * Add a new team
         */
        addTeam: (teamData) => {
          const { teams } = get();
          const teamId = teamData.id || `team-${Date.now()}`;

          // Check if team already exists
          if (teams[teamId]) {
            console.warn(`Team ${teamId} already exists`);
            return { success: false, error: 'Team already exists' };
          }

          const newTeam = {
            id: teamId,
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

          set({
            teams: {
              ...teams,
              [teamId]: newTeam,
            },
          });

          console.log(`✅ Team added: ${teamId} (${newTeam.name})`);

          return { success: true, teamId, team: newTeam };
        },

        /**
         * Update team data
         */
        updateTeam: (teamId, updates) => {
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
          });

          console.log(`✅ Team updated: ${teamId}`);

          return { success: true, team: updatedTeam };
        },

        /**
         * Delete a team
         */
        deleteTeam: (teamId) => {
          const { teams } = get();

          if (!teams[teamId]) {
            console.warn(`Team ${teamId} not found`);
            return { success: false, error: 'Team not found' };
          }

          const { [teamId]: removed, ...remainingTeams } = teams;

          set({ teams: remainingTeams });

          console.log(`✅ Team deleted: ${teamId}`);

          return { success: true };
        },

        /**
         * Set team status
         */
        setTeamStatus: (teamId, status) => {
          return get().updateTeam(teamId, { status });
        },

        /**
         * Set team's current prize
         */
        setTeamPrize: (teamId, prize) => {
          return get().updateTeam(teamId, { currentPrize: prize });
        },

        /**
         * Increment questions answered
         */
        incrementQuestionsAnswered: (teamId) => {
          const { teams } = get();

          if (!teams[teamId]) {
            return { success: false, error: 'Team not found' };
          }

          const questionsAnswered = (teams[teamId].questionsAnswered || 0) + 1;
          const currentQuestionIndex =
            (teams[teamId].currentQuestionIndex || 0) + 1;

          return get().updateTeam(teamId, {
            questionsAnswered,
            currentQuestionIndex,
          });
        },

        /**
         * Use a lifeline
         */
        useLifeline: (teamId, lifelineType) => {
          const { teams } = get();

          if (!teams[teamId]) {
            console.warn(`Team ${teamId} not found`);
            return { success: false, error: 'Team not found' };
          }

          // Check if lifeline is available
          if (!teams[teamId].lifelines[lifelineType]) {
            console.warn(`Lifeline ${lifelineType} already used`);
            return { success: false, error: 'Lifeline already used' };
          }

          const updatedLifelines = {
            ...teams[teamId].lifelines,
            [lifelineType]: false,
          };

          const result = get().updateTeam(teamId, {
            lifelines: updatedLifelines,
          });

          console.log(`🎯 ${teamId} used lifeline: ${lifelineType}`);

          return result;
        },

        /**
         * Eliminate team
         */
        eliminateTeam: (teamId) => {
          const result = get().updateTeam(teamId, {
            status: TEAM_STATUS.ELIMINATED,
            eliminatedAt: Date.now(),
          });

          console.log(`❌ Team eliminated: ${teamId}`);

          return result;
        },

        /**
         * Mark team as completed
         */
        completeTeam: (teamId) => {
          const result = get().updateTeam(teamId, {
            status: TEAM_STATUS.COMPLETED,
            completedAt: Date.now(),
          });

          console.log(`🏆 Team completed: ${teamId}`);

          return result;
        },

        /**
         * Assign question set to team
         */
        assignQuestionSet: (teamId, questionSetId) => {
          return get().updateTeam(teamId, { questionSetId });
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
        resetTeamProgress: (teamId) => {
          return get().updateTeam(teamId, {
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
        resetAllTeamsProgress: () => {
          const { teams } = get();
          const teamIds = Object.keys(teams);

          teamIds.forEach((teamId) => {
            get().resetTeamProgress(teamId);
          });

          console.log('🔄 All teams progress reset');
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
            console.warn('👥 Teams: Failed to hydrate from localStorage:', error);
            return;
          }

          if (state) {
            console.log('👥 Teams: Hydrated from localStorage');
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
