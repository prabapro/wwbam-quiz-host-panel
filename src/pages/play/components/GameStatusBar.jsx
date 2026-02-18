// src/pages/play/components/GameStatusBar.jsx

import { Badge } from '@components/ui/badge';
import { formatPrize } from '@utils/gameplay/scoreCalculation';
import { QUESTIONS_PER_SET } from '@constants/config';
import { LIFELINE_TYPE, LIFELINE_META } from '@constants/teamStates';
import { useGameStore } from '@stores/useGameStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { Users, BookOpen, ListOrdered, Trophy } from 'lucide-react';

/**
 * Game Status Bar Component
 *
 * Purpose: Full-width top bar showing all current-team info at a glance.
 *
 * Displays (5 sections):
 * 1. Team name + participants
 * 2. Assigned question set ID
 * 3. Question progress (x / QUESTIONS_PER_SET)
 * 4. Current prize amount
 * 5. Lifeline availability (Phone-a-Friend, 50/50)
 */
export default function GameStatusBar() {
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const currentQuestionNumber = useGameStore(
    (state) => state.currentQuestionNumber,
  );
  const questionSetAssignments = useGameStore(
    (state) => state.questionSetAssignments,
  );

  const teams = useTeamsStore((state) => state.teams);
  const currentTeam = teams[currentTeamId];

  if (!currentTeam) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg border">
        <p className="text-sm text-muted-foreground text-center">
          No active team
        </p>
      </div>
    );
  }

  const currentPrize = currentTeam.currentPrize || 0;
  const assignedSetId = questionSetAssignments?.[currentTeamId] ?? '—';
  const lifelinesAvailable = currentTeam.lifelinesAvailable || {};

  const lifelines = [
    {
      type: LIFELINE_TYPE.PHONE_A_FRIEND,
      meta: LIFELINE_META[LIFELINE_TYPE.PHONE_A_FRIEND],
      available: lifelinesAvailable[LIFELINE_TYPE.PHONE_A_FRIEND] ?? true,
    },
    {
      type: LIFELINE_TYPE.FIFTY_FIFTY,
      meta: LIFELINE_META[LIFELINE_TYPE.FIFTY_FIFTY],
      available: lifelinesAvailable[LIFELINE_TYPE.FIFTY_FIFTY] ?? true,
    },
  ];

  return (
    <div className="p-4 bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Team Name + Members */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">
              Current Team
            </p>
            <p className="text-sm font-bold truncate">{currentTeam.name}</p>
            {currentTeam.participants && (
              <p className="text-xs text-muted-foreground truncate">
                {currentTeam.participants}
              </p>
            )}
          </div>
        </div>

        {/* 2. Assigned Question Set */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg shrink-0">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">
              Question Set
            </p>
            <p className="text-sm font-bold truncate">{assignedSetId}</p>
          </div>
        </div>

        {/* 3. Question Progress */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg shrink-0">
            <ListOrdered className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">
              Progress
            </p>
            <p className="text-sm font-bold">
              {currentQuestionNumber}
              <span className="text-muted-foreground font-normal">
                /{QUESTIONS_PER_SET}
              </span>
            </p>
          </div>
        </div>

        {/* 4. Current Prize */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg shrink-0">
            <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">
              Current Prize
            </p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">
              {formatPrize(currentPrize)}
            </p>
          </div>
        </div>

        {/* 5. Lifelines */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium mb-1.5">
              Lifelines
            </p>
            <div className="flex gap-2">
              {lifelines.map(({ type, meta, available }) => (
                <Badge
                  key={type}
                  variant={available ? 'outline' : 'secondary'}
                  className={`text-xs gap-1 ${
                    available
                      ? 'border-green-500 text-green-700 dark:text-green-400'
                      : 'opacity-40 line-through'
                  }`}>
                  <span>{meta.icon}</span>
                  <span className="hidden sm:inline">{meta.label}</span>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
