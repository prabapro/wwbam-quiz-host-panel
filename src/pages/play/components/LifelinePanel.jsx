// src/pages/Play/components/LifelinePanel.jsx

/**
 * Lifeline Panel Component
 *
 * Purpose: Display and manage team's available lifelines
 *
 * Lifeline Types:
 * 1. Phone-a-Friend: Team calls someone for help (3 minutes)
 * 2. 50/50: Remove two incorrect answers, leaving one correct and one incorrect
 *
 * Functionality:
 * - Display lifeline buttons with icons
 * - Show available/used status for each lifeline
 * - Phone-a-Friend: Activate timer, pause game, mark as used
 * - 50/50: Filter options (remove 2 incorrect), mark as used
 * - Disable buttons after use (one-time use per game)
 * - Update Firebase when lifeline used
 *
 * States:
 * - Available: Button enabled, full color
 * - Used: Button disabled, greyed out, with checkmark
 * - In-Use: Phone-a-Friend timer running
 *
 * Data Source:
 * - useTeamsStore (current team's lifelines status)
 * - useQuestionsStore.applyFiftyFifty() for 50/50 logic
 * - useGameStore for game state updates
 *
 * TODO: Implement lifeline controls
 * - Create button for each lifeline type
 * - Show icon + label + status indicator
 * - Handle Phone-a-Friend activation (timer, pause)
 * - Handle 50/50 activation (filter options)
 * - Disable buttons after use
 * - Sync status to Firebase (via databaseService.useLifeline)
 * - Add confirmation dialog for lifeline use
 */
export default function LifelinePanel() {
  return (
    <div className="space-y-4">
      {/* Phone-a-Friend */}
      <button
        disabled
        className="w-full p-4 rounded-lg border-2 border-dashed bg-muted/20 text-muted-foreground cursor-not-allowed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📞</span>
            <div className="text-left">
              <p className="font-semibold">Phone-a-Friend</p>
              <p className="text-xs">Call someone for help (3 min)</p>
            </div>
          </div>
          <span className="text-sm">Coming Soon</span>
        </div>
      </button>

      {/* 50/50 */}
      <button
        disabled
        className="w-full p-4 rounded-lg border-2 border-dashed bg-muted/20 text-muted-foreground cursor-not-allowed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✂️</span>
            <div className="text-left">
              <p className="font-semibold">50/50</p>
              <p className="text-xs">Remove two incorrect answers</p>
            </div>
          </div>
          <span className="text-sm">Coming Soon</span>
        </div>
      </button>

      <p className="text-xs text-muted-foreground text-center">
        Will show: Available ✅ | Used ❌ | In-Use ⏱️
      </p>
    </div>
  );
}
