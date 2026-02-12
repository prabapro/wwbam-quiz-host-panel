// src/pages/play/components/AnswerPad.jsx

/**
 * Answer Pad Component
 *
 * Purpose: Host interface for selecting team's answer choice
 *
 * Will Display:
 * - Four clickable buttons (A, B, C, D)
 * - Selected answer highlighting
 * - "Lock Answer" button (enabled only after selection)
 *
 * Functionality:
 * - Team verbally announces answer (e.g., "We choose B")
 * - Host clicks corresponding button (B)
 * - Button highlights in yellow (local state, not synced)
 * - Host can change selection before locking
 * - "Lock Answer" triggers validation against localStorage correct answer
 * - Automatic result determination (correct/incorrect)
 *
 * States:
 * 1. Disabled: No question visible yet
 * 2. Active: Question visible, awaiting team's answer selection
 * 3. Selected: One option selected (yellow highlight)
 * 4. Locked: Answer validated and locked (no changes allowed)
 *
 * Data Source:
 * - useQuestionsStore.selectedAnswer (current selection)
 * - useQuestionsStore.hostQuestion.correctAnswer (for validation)
 * - useGameStore (question visibility state)
 *
 * TODO: Implement interactive answer pad
 * - Create A/B/C/D button grid (2x2 layout)
 * - Handle click to select answer (update local state)
 * - Highlight selected answer (yellow/active state)
 * - Enable "Lock Answer" button only when answer selected
 * - Trigger validation on lock
 * - Display validation result (correct/incorrect)
 * - Disable all controls after lock
 */
export default function AnswerPad() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Select team's answer:
      </p>

      {/* Answer button grid */}
      <div className="grid grid-cols-2 gap-4">
        {['A', 'B', 'C', 'D'].map((option) => (
          <button
            key={option}
            disabled
            className="p-6 rounded-lg border-2 border-dashed bg-muted/20 text-muted-foreground cursor-not-allowed transition-all">
            <span className="text-2xl font-bold">{option}</span>
          </button>
        ))}
      </div>

      {/* Lock Answer Button */}
      <button
        disabled
        className="w-full p-4 rounded-lg bg-muted/20 border border-dashed text-muted-foreground cursor-not-allowed">
        🔒 Lock Answer (Coming Soon)
      </button>

      <p className="text-xs text-muted-foreground text-center">
        Will allow: Click to select → Lock to validate → Show result
      </p>
    </div>
  );
}
