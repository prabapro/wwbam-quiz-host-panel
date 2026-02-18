// src/pages/play/components/dialogs/GameCompletedDialog.jsx

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Trophy, Home } from 'lucide-react';
import { cn } from '@lib/utils';
import { formatPrize } from '@utils/gameplay/scoreCalculation';
import { TEAM_STATUS } from '@constants/teamStates';

/**
 * Sort and rank teams for the results leaderboard, supporting shared places.
 *
 * Rules:
 * - Completed teams rank above eliminated teams
 * - Within each group, teams are sorted by prize descending
 * - Teams with equal prize share the same place number
 * - Teams sharing a place are ordered alphabetically (ascending) by name
 * - Place numbers skip correctly after ties (e.g. 1, 1, 3, 4…)
 *
 * @param {Object} teams - Teams object from store { teamId: teamData }
 * @returns {Array<{ id, place, ...teamData }>} Sorted and ranked team entries
 */
function rankTeams(teams) {
  if (!teams) return [];

  const entries = Object.entries(teams).map(([id, team]) => ({ id, ...team }));

  // Primary sort: completed before eliminated, then prize desc, then name asc
  entries.sort((a, b) => {
    const aCompleted = a.status === TEAM_STATUS.COMPLETED;
    const bCompleted = b.status === TEAM_STATUS.COMPLETED;

    if (aCompleted && !bCompleted) return -1;
    if (!aCompleted && bCompleted) return 1;

    const prizeDiff = (b.currentPrize ?? 0) - (a.currentPrize ?? 0);
    if (prizeDiff !== 0) return prizeDiff;

    return a.name.localeCompare(b.name);
  });

  // Assign shared place numbers
  // Place is 1-based; ties keep the same place, next distinct rank skips accordingly
  let place = 1;
  return entries.map((team, index) => {
    if (index === 0) {
      return { ...team, place };
    }

    const prev = entries[index - 1];
    const sameStatus =
      (team.status === TEAM_STATUS.COMPLETED) ===
      (prev.status === TEAM_STATUS.COMPLETED);
    const samePrize = (team.currentPrize ?? 0) === (prev.currentPrize ?? 0);

    if (!sameStatus || !samePrize) {
      place = index + 1;
    }

    return { ...team, place };
  });
}

/**
 * Medal emoji for top 3 places, supporting shared medals.
 *
 * @param {number} place - 1-based rank (shared ranks supported)
 */
function PositionBadge({ place }) {
  if (place === 1)
    return (
      <span className="text-lg" aria-label="1st place">
        🥇
      </span>
    );
  if (place === 2)
    return (
      <span className="text-lg" aria-label="2nd place">
        🥈
      </span>
    );
  if (place === 3)
    return (
      <span className="text-lg" aria-label="3rd place">
        🥉
      </span>
    );
  return (
    <span className="text-sm font-bold text-muted-foreground w-6 text-center">
      {place}
    </span>
  );
}

/**
 * GameCompletedDialog Component
 *
 * Purpose: Shown when all teams have finished (game status = COMPLETED).
 * Displays a leaderboard of all teams sorted by final prize with shared ranking.
 *
 * Behaviours:
 * - Cannot be dismissed accidentally — host must use the action button
 * - Shows ranked leaderboard with shared places for equal scores
 * - All joint-first teams receive the gold highlight background
 * - Multiple teams can share the same medal (2× 🥇, 3× 🥈, etc.)
 * - Teams sharing a place are ordered alphabetically
 *
 * @param {boolean}  props.open     - Whether dialog is visible
 * @param {Object}   props.teams    - All teams object from store
 * @param {Function} props.onGoHome - Called when host clicks "Back to Dashboard"
 */
export default function GameCompletedDialog({ open, teams, onGoHome }) {
  const rankedTeams = rankTeams(teams);

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
        </DialogHeader>

        {/* Leaderboard */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {rankedTeams.map((team) => {
            const isCompleted = team.status === TEAM_STATUS.COMPLETED;
            const isTopSpot = team.place === 1;

            return (
              <div
                key={team.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  isTopSpot
                    ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
                    : 'bg-muted/40',
                )}>
                {/* Position */}
                <div className="w-7 flex items-center justify-center shrink-0">
                  <PositionBadge place={team.place} />
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
