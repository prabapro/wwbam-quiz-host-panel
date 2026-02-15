// src/pages/play/components/GameStatusBar.jsx

import { Badge } from '@components/ui/badge';
import { formatPrize } from '@utils/gameplay/scoreCalculation';
import { QUESTIONS_PER_SET } from '@/constants/config';
import { useGameStore } from '@stores/useGameStore';
import { Users, ListOrdered, Trophy, Clock } from 'lucide-react';
import { useTeamsStore } from '@stores/useTeamsStore';

/**
 * Game Status Bar Component
 *
 * Purpose: Top status bar showing current game state at a glance
 *
 * Displays:
 * - Current team name
 * - Question number (e.g., "Question 5/20")
 * - Current prize amount
 * - Game status indicator
 *
 * Example: "🎮 Team Alpha | Question 5/20 | Prize: Rs.2,500"
 */
export default function GameStatusBar() {
  // Game Store
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const currentQuestionNumber = useGameStore(
    (state) => state.currentQuestionNumber,
  );
  const gameStatus = useGameStore((state) => state.gameStatus);

  // Teams Store
  const teams = useTeamsStore((state) => state.teams);
  const currentTeam = teams[currentTeamId];

  // Current prize (from team data)
  const currentPrize = currentTeam?.currentPrize || 0;

  // If no current team, show empty state
  if (!currentTeam) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg border">
        <p className="text-sm text-muted-foreground text-center">
          No active team
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Current Team */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">
              Current Team
            </p>
            <p className="text-sm font-bold truncate">{currentTeam.name}</p>
          </div>
        </div>

        {/* Question Progress */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <ListOrdered className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">
              Question
            </p>
            <p className="text-sm font-bold">
              {currentQuestionNumber}/{QUESTIONS_PER_SET}
            </p>
          </div>
        </div>

        {/* Current Prize */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
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

        {/* Game Status */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">Status</p>
            <Badge
              variant={gameStatus === 'active' ? 'default' : 'secondary'}
              className="text-xs">
              {gameStatus === 'active' ? '▶️ Active' : '⏸️ Paused'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
