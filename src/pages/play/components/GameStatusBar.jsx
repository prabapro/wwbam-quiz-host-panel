// src/pages/Play/components/GameStatusBar.jsx

/**
 * Game Status Bar Component
 *
 * Purpose: Top status bar showing current game state at a glance
 *
 * Will Display:
 * - Current team name
 * - Question number (e.g., "Question 5/20")
 * - Current prize amount
 * - Timer (if enabled)
 * - Game status indicator
 *
 * Example: "🎮 Team Alpha | Question 5/20 | Prize: Rs.2,500 | ⏱️ 00:45"
 *
 * TODO: Implement full status bar with real-time updates
 * - Pull from useGameStore (currentTeamId, currentQuestionNumber)
 * - Pull from useTeamsStore (team name, current prize)
 * - Pull from usePrizeStore (prize formatting)
 * - Add timer display (if timer feature enabled)
 * - Style as sticky bar or prominent card
 */
export default function GameStatusBar() {
  return (
    <div className="p-4 bg-muted/30 rounded-lg border text-center">
      <p className="text-sm text-muted-foreground">
        📊 Game Status Bar - Coming Soon
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Will show: Team | Question # | Prize | Timer
      </p>
    </div>
  );
}
