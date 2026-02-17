// src/pages/play/components/dialogs/GameCompletedDialog.jsx

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Trophy, Home, Medal } from 'lucide-react';
import { cn } from '@lib/utils';
import { formatPrize } from '@utils/gameplay/scoreCalculation';
import { TEAM_STATUS } from '@constants/teamStates';

/**
 * Sort and rank teams for the results leaderboard.
 * Completed teams ranked by prize (desc), then eliminated teams below.
 *
 * @param {Object} teams - Teams object from store { teamId: teamData }
 * @returns {Array} Sorted team entries
 */
function rankTeams(teams) {
  if (!teams) return [];

  return Object.entries(teams)
    .map(([id, team]) => ({ id, ...team }))
    .sort((a, b) => {
      // Completed teams first, sorted by prize desc
      if (
        a.status === TEAM_STATUS.COMPLETED &&
        b.status !== TEAM_STATUS.COMPLETED
      )
        return -1;
      if (
        a.status !== TEAM_STATUS.COMPLETED &&
        b.status === TEAM_STATUS.COMPLETED
      )
        return 1;
      return (b.currentPrize ?? 0) - (a.currentPrize ?? 0);
    });
}

/**
 * Medal icon for top 3 positions
 */
function PositionBadge({ position }) {
  if (position === 0)
    return (
      <span className="text-lg" aria-label="1st place">
        🥇
      </span>
    );
  if (position === 1)
    return (
      <span className="text-lg" aria-label="2nd place">
        🥈
      </span>
    );
  if (position === 2)
    return (
      <span className="text-lg" aria-label="3rd place">
        🥉
      </span>
    );
  return (
    <span className="text-sm font-bold text-muted-foreground w-6 text-center">
      {position + 1}
    </span>
  );
}

/**
 * GameCompletedDialog Component
 *
 * Purpose: Shown when all teams have finished (game status = COMPLETED).
 * Displays a leaderboard of all teams sorted by final prize.
 *
 * Behaviours:
 * - Cannot be dismissed accidentally — host must use the action button
 * - Shows ranked leaderboard with team names and final prizes
 * - CTA navigates back to the home dashboard
 *
 * @param {boolean}  props.open         - Whether dialog is visible
 * @param {Object}   props.teams        - All teams object from store
 * @param {Function} props.onGoHome     - Called when host clicks "Back to Dashboard"
 */
export default function GameCompletedDialog({ open, teams, onGoHome }) {
  const rankedTeams = rankTeams(teams);
  const winner = rankedTeams[0];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Game Completed!
          </DialogTitle>
          {winner && (
            <DialogDescription className="text-center">
              🎉 Congratulations to <strong>{winner.name}</strong> — top prize
              winner!
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Leaderboard */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {rankedTeams.map((team, index) => {
            const isCompleted = team.status === TEAM_STATUS.COMPLETED;

            return (
              <div
                key={team.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  index === 0
                    ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
                    : 'bg-muted/40',
                )}>
                {/* Position */}
                <div className="w-7 flex items-center justify-center shrink-0">
                  <PositionBadge position={index} />
                </div>

                {/* Team Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{team.name}</p>
                  <Badge
                    variant={isCompleted ? 'default' : 'destructive'}
                    className={cn(
                      'text-xs mt-0.5',
                      isCompleted && 'bg-green-600 hover:bg-green-600',
                    )}>
                    {isCompleted ? 'Completed' : 'Eliminated'}
                  </Badge>
                </div>

                {/* Prize */}
                <p
                  className={cn(
                    'text-sm font-bold font-mono shrink-0',
                    isCompleted
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-muted-foreground',
                  )}>
                  {formatPrize(team.currentPrize ?? 0)}
                </p>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button onClick={onGoHome} className="w-full gap-2" size="lg">
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
