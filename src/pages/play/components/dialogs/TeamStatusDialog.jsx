// src/pages/play/components/dialogs/TeamStatusDialog.jsx

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Trophy, XCircle, Users, ArrowRight } from 'lucide-react';
import { cn } from '@lib/utils';
import { formatPrize } from '@utils/gameplay/scoreCalculation';
import { TEAM_STATUS } from '@constants/teamStates';

/**
 * TeamStatusDialog Component
 *
 * Purpose: Auto-opens when a team reaches a terminal state (eliminated or completed).
 * Serves as both a notification and the deliberate "proceed to next team" gate.
 *
 * Behaviours:
 * - Cannot be dismissed by clicking outside — host must take an explicit action
 * - Shows team outcome (eliminated/completed) with final prize
 * - Shows next team name if one exists
 * - Single CTA: "Next Team" (or "Acknowledge" if it's the last team in queue)
 *
 * @param {boolean}  props.open          - Whether dialog is visible
 * @param {string}   props.teamName      - Current team's name
 * @param {string}   props.teamStatus    - TEAM_STATUS.ELIMINATED | TEAM_STATUS.COMPLETED
 * @param {number}   props.finalPrize    - Team's final prize amount
 * @param {string}   [props.nextTeamName]- Name of the next team (if any)
 * @param {boolean}  props.isLastTeam    - True if no more teams in queue
 * @param {Function} props.onProceed     - Called when host clicks proceed / acknowledge
 * @param {boolean}  props.isLoading     - Disable action while transitioning
 */
export default function TeamStatusDialog({
  open,
  teamName,
  teamStatus,
  finalPrize,
  nextTeamName,
  isLastTeam = false,
  onProceed,
  isLoading = false,
}) {
  const isEliminated = teamStatus === TEAM_STATUS.ELIMINATED;
  const isCompleted = teamStatus === TEAM_STATUS.COMPLETED;

  return (
    <Dialog
      open={open}
      // Prevent accidental dismiss — host must use the action button
      onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="sr-only">Team Status Update</DialogTitle>
          <DialogDescription className="sr-only">
            {isEliminated
              ? `${teamName} has been eliminated with a final prize of ${formatPrize(finalPrize)}.`
              : `${teamName} has completed their round with a final prize of ${formatPrize(finalPrize)}.`}
          </DialogDescription>
        </DialogHeader>

        {/* Status Hero */}
        <div
          className={cn(
            'flex flex-col items-center gap-3 py-6 rounded-lg',
            isEliminated
              ? 'bg-red-50 dark:bg-red-950/30'
              : 'bg-green-50 dark:bg-green-950/30',
          )}>
          {isEliminated ? (
            <XCircle className="w-14 h-14 text-red-500" />
          ) : (
            <Trophy className="w-14 h-14 text-yellow-500" />
          )}

          <div className="text-center space-y-1">
            <p className="text-lg font-bold">{teamName}</p>
            <Badge
              variant={isEliminated ? 'destructive' : 'default'}
              className={cn(
                'text-sm px-3 py-0.5',
                isCompleted && 'bg-green-600 hover:bg-green-600',
              )}>
              {isEliminated ? '❌ Eliminated' : '✅ Completed'}
            </Badge>
          </div>

          {/* Final Prize */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
              Final Prize
            </p>
            <p
              className={cn(
                'text-2xl font-bold font-mono',
                isEliminated
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400',
              )}>
              {formatPrize(finalPrize)}
            </p>
          </div>
        </div>

        {/* Next Team Preview */}
        {!isLastTeam && nextTeamName && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Users className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Up next</p>
              <p className="text-sm font-semibold">{nextTeamName}</p>
            </div>
          </div>
        )}

        {isLastTeam && (
          <p className="text-sm text-center text-muted-foreground">
            This was the last team in the queue.
          </p>
        )}

        <DialogFooter>
          <Button
            onClick={onProceed}
            disabled={isLoading}
            className="w-full gap-2"
            size="lg">
            <ArrowRight className="w-4 h-4" />
            {isLoading
              ? 'Loading...'
              : isLastTeam
                ? 'View Final Results'
                : 'Next Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
