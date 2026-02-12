// src/pages/Play/components/GameControls.jsx

/**
 * Game Controls Component
 *
 * Purpose: Main control buttons for managing question flow and game progression
 *
 * Control Buttons:
 * 1. "Load Question" - Fetch next question from localStorage (host view only)
 * 2. "Show Question" - Push question to Firebase (visible to public)
 * 3. "Hide Question" - Retract question from public view
 * 4. "Next Question" - Move to next question (after correct answer)
 * 5. "Next Team" - Move to next team in queue (after elimination/completion)
 * 6. "Skip Question" - Skip current question (error handling)
 * 7. "Pause Game" - Pause game state
 * 8. "Resume Game" - Resume from pause
 *
 * Button States (Smart State Management):
 * - Load Question: Enabled when no question loaded OR after question complete
 * - Show Question: Enabled only when question loaded (host view) but not visible
 * - Lock Answer: Enabled only when team has selected answer
 * - Next Question: Enabled only after correct answer validated
 * - Next Team: Enabled only after team eliminated or completed
 *
 * Data Source:
 * - useGameStore (game status, question visibility flags)
 * - useQuestionsStore (load, show, clear question actions)
 * - Custom hook useGameControls for button state logic
 *
 * TODO: Implement full game control panel
 * - Create all control buttons with proper icons
 * - Implement smart button state management
 * - Connect to store actions (loadQuestion, showQuestion, etc.)
 * - Add confirmation dialogs for destructive actions (skip, next team)
 * - Show loading states during async operations
 * - Add keyboard shortcuts for common actions
 * - Display control hints/tooltips
 */
export default function GameControls() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Game control buttons
      </p>

      {/* Primary Controls */}
      <div className="grid grid-cols-2 gap-3">
        <button
          disabled
          className="p-3 rounded-lg border-2 border-dashed bg-muted/20 text-muted-foreground cursor-not-allowed">
          📥 Load Question
        </button>
        <button
          disabled
          className="p-3 rounded-lg border-2 border-dashed bg-muted/20 text-muted-foreground cursor-not-allowed">
          👁️ Show Question
        </button>
        <button
          disabled
          className="p-3 rounded-lg border-2 border-dashed bg-muted/20 text-muted-foreground cursor-not-allowed">
          ➡️ Next Question
        </button>
        <button
          disabled
          className="p-3 rounded-lg border-2 border-dashed bg-muted-foreground/20 text-muted-foreground cursor-not-allowed">
          👥 Next Team
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="grid grid-cols-3 gap-2">
        <button
          disabled
          className="p-2 rounded-lg border border-dashed bg-muted/20 text-xs text-muted-foreground cursor-not-allowed">
          🙈 Hide
        </button>
        <button
          disabled
          className="p-2 rounded-lg border border-dashed bg-muted/20 text-xs text-muted-foreground cursor-not-allowed">
          ⏭️ Skip
        </button>
        <button
          disabled
          className="p-2 rounded-lg border border-dashed bg-muted/20 text-xs text-muted-foreground cursor-not-allowed">
          ⏸️ Pause
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Will implement: Smart state management + async actions
      </p>
    </div>
  );
}
