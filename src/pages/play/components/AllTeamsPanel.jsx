// src/pages/play/components/AllTeamsPanel.jsx

import { useState } from 'react';
import { Badge } from '@components/ui/badge';
import { ScrollArea } from '@components/ui/scroll-area';
import { formatPrize } from '@utils/gameplay/scoreCalculation';
import {
  LIFELINE_TYPE,
  LIFELINE_META,
  getTeamStatusMeta,
} from '@constants/teamStates';
import { useGameStore } from '@stores/useGameStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import {
  ChevronDown,
  ChevronRight,
  Phone,
  BookOpen,
  Users,
  Trophy,
  ListOrdered,
} from 'lucide-react';
import { cn } from '@lib/utils';

/**
 * AllTeamsPanel Component
 *
 * Purpose: Scrollable, collapsible table of all teams in playing order.
 *
 * Collapsed row shows:
 * - Play position (#)
 * - Team name
 * - Status badge
 *
 * Expanded row shows:
 * - Participants
 * - Phone-a-Friend contact
 * - Assigned question set
 * - Questions answered + current prize
 * - Lifeline availability
 *
 * Data sources:
 * - useGameStore: playQueue, questionSetAssignments, currentTeamId
 * - useTeamsStore: teams
 */
export default function AllTeamsPanel() {
  const [expandedTeamId, setExpandedTeamId] = useState(null);

  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const playQueue = useGameStore((state) => state.playQueue);
  const questionSetAssignments = useGameStore(
    (state) => state.questionSetAssignments,
  );

  const teams = useTeamsStore((state) => state.teams);

  if (!playQueue || playQueue.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No teams in queue
      </p>
    );
  }

  const toggleExpand = (teamId) => {
    setExpandedTeamId((prev) => (prev === teamId ? null : teamId));
  };

  return (
    <ScrollArea className="h-64 pr-2">
      <div className="space-y-1">
        {playQueue.map((teamId, index) => {
          const team = teams[teamId];
          if (!team) return null;

          const isActive = teamId === currentTeamId;
          const isExpanded = expandedTeamId === teamId;
          const statusMeta = getTeamStatusMeta(team.status);
          const assignedSetId = questionSetAssignments?.[teamId] ?? '—';
          const lifelinesAvailable = team.lifelinesAvailable || {};

          const lifelines = [
            {
              type: LIFELINE_TYPE.PHONE_A_FRIEND,
              meta: LIFELINE_META[LIFELINE_TYPE.PHONE_A_FRIEND],
              available:
                lifelinesAvailable[LIFELINE_TYPE.PHONE_A_FRIEND] ?? true,
            },
            {
              type: LIFELINE_TYPE.FIFTY_FIFTY,
              meta: LIFELINE_META[LIFELINE_TYPE.FIFTY_FIFTY],
              available: lifelinesAvailable[LIFELINE_TYPE.FIFTY_FIFTY] ?? true,
            },
          ];

          return (
            <div
              key={teamId}
              className={cn(
                'rounded-lg border transition-all duration-150',
                isActive
                  ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-border bg-muted/20 hover:bg-muted/40',
              )}>
              {/* Collapsed Row — always visible */}
              <button
                onClick={() => toggleExpand(teamId)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left">
                {/* Position */}
                <span
                  className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0',
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-muted-foreground/20 text-muted-foreground',
                  )}>
                  {index + 1}
                </span>

                {/* Team Name */}
                <span className="flex-1 text-sm font-medium truncate">
                  {team.name}
                </span>

                {/* Status + Prize */}
                <div className="flex flex-col items-end shrink-0 min-w-0">
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      statusMeta.textColor,
                      statusMeta.darkTextColor,
                    )}>
                    {statusMeta.icon} {statusMeta.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatPrize(team.currentPrize || 0)}
                  </span>
                </div>

                {/* Expand Toggle */}
                <span className="text-muted-foreground shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </span>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-border/50 space-y-2">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    {/* Participants */}
                    {team.participants && (
                      <div className="col-span-2 flex items-start gap-1.5">
                        <Users className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <dt className="text-muted-foreground">Members</dt>
                          <dd className="font-medium">{team.participants}</dd>
                        </div>
                      </div>
                    )}

                    {/* Contact */}
                    {team.contact && (
                      <div className="flex items-start gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <dt className="text-muted-foreground">Contact</dt>
                          <dd className="font-medium font-mono">
                            {team.contact}
                          </dd>
                        </div>
                      </div>
                    )}

                    {/* Question Set */}
                    <div className="flex items-start gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <dt className="text-muted-foreground">Question Set</dt>
                        <dd className="font-medium">{assignedSetId}</dd>
                      </div>
                    </div>

                    {/* Questions Answered */}
                    <div className="flex items-start gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <dt className="text-muted-foreground">Questions</dt>
                        <dd className="font-medium">
                          {team.questionsAnswered || 0} answered
                        </dd>
                      </div>
                    </div>

                    {/* Current Prize */}
                    <div className="flex items-start gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <dt className="text-muted-foreground">Prize</dt>
                        <dd className="font-medium text-green-600 dark:text-green-400">
                          {formatPrize(team.currentPrize || 0)}
                        </dd>
                      </div>
                    </div>

                    {/* Lifelines */}
                    <div className="col-span-2">
                      <dt className="text-muted-foreground mb-1">Lifelines</dt>
                      <dd className="flex gap-1.5">
                        {lifelines.map(({ type, meta, available }) => (
                          <Badge
                            key={type}
                            variant={available ? 'outline' : 'secondary'}
                            className={cn(
                              'text-xs gap-1',
                              available
                                ? 'border-green-500 text-green-700 dark:text-green-400'
                                : 'opacity-40 line-through',
                            )}>
                            {meta.icon} {meta.label}
                          </Badge>
                        ))}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
