// src/pages/Play/components/TeamStatusCard.jsx

/**
 * Team Status Card Component
 *
 * Purpose: Display detailed status for the currently active team
 *
 * Will Display:
 * - Team name + participants
 * - Current question progress (X/20)
 * - Current prize amount
 * - Lifelines status (available/used)
 * - Questions answered correctly
 * - Team status badge (active/eliminated/completed)
 *
 * Visual States:
 * - Active: Blue border, "Playing" badge
 * - Eliminated: Red border, "Eliminated" badge
 * - Completed: Green border, "Winner" badge
 *
 * Data Source:
 * - useGameStore.currentTeamId
 * - useTeamsStore (team data by ID)
 * - usePrizeStore (for prize formatting)
 *
 * TODO: Implement detailed team status display
 * - Show team info (name, participants)
 * - Display progress bar or visual indicator
 * - Show current prize with formatting
 * - Show lifeline status (icons with checkmarks/crosses)
 * - Add color-coded status badge
 * - Real-time updates when team data changes
 * - Add milestone indicators (every 5th question)
 */
export default function TeamStatusCard() {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted/30 rounded-lg border">
        <p className="text-sm font-semibold mb-2">Current Team</p>
        <p className="text-xs text-muted-foreground">
          Will show: Name, Participants, Progress, Prize
        </p>
      </div>

      <div className="p-4 bg-muted/30 rounded-lg border">
        <p className="text-sm font-semibold mb-2">Progress</p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Questions:</span>
          <span>0/20</span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-muted-foreground">Prize:</span>
          <span>Rs.0</span>
        </div>
      </div>

      <div className="p-4 bg-muted/30 rounded-lg border">
        <p className="text-sm font-semibold mb-2">Lifelines</p>
        <div className="flex gap-2">
          <span className="text-sm">📞 ✅</span>
          <span className="text-sm">✂️ ✅</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Detailed team status coming soon
      </p>
    </div>
  );
}
