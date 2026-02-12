// src/pages/play/components/QuestionPanel.jsx

/**
 * Question Panel Component
 *
 * Purpose: Displays the current question text and answer options
 *
 * Will Display:
 * - Question number
 * - Question text
 * - Four answer options (A, B, C, D)
 * - Correct answer indicator (HOST VIEW ONLY - never synced to Firebase)
 * - Visual states: loading, visible, revealed
 *
 * Data Source:
 * - useQuestionsStore.hostQuestion (includes correct answer)
 * - useGameStore (question visibility flags)
 *
 * States:
 * 1. No question loaded: "Load a question to begin"
 * 2. Question loaded (host view): Show question + correct answer indicator
 * 3. Question visible to public: Show question (synced to Firebase, no answer)
 * 4. Answer revealed: Show question + highlight correct answer
 *
 * TODO: Implement full question display with proper styling
 * - Show question text in large, readable font
 * - Display options A, B, C, D clearly
 * - Visual indicator for correct answer (green checkmark, only in host view)
 * - Handle different visual states (loaded, visible, revealed)
 * - Add animations for state transitions
 */
export default function QuestionPanel() {
  return (
    <div className="space-y-4">
      <div className="p-8 bg-muted/30 rounded-lg border text-center">
        <p className="text-sm text-muted-foreground">
          📝 Question Panel - Coming Soon
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Will display: Question text + Options (A, B, C, D)
        </p>
      </div>

      {/* Placeholder for options display */}
      <div className="grid grid-cols-2 gap-3">
        {['A', 'B', 'C', 'D'].map((option) => (
          <div
            key={option}
            className="p-4 bg-muted/20 rounded-lg border text-center">
            <p className="text-sm font-medium">{option}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
