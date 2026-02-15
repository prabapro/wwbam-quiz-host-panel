// src/pages/play/components/QuestionPanel.jsx

import { useQuestionsStore } from '@stores/useQuestionsStore';
import { useGameStore } from '@stores/useGameStore';
import { Badge } from '@components/ui/badge';
import { Alert, AlertDescription } from '@components/ui/alert';
import { Eye, EyeOff, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@lib/utils';

/**
 * Question Panel Component
 *
 * Purpose: Displays the current question text and answer options
 *
 * Displays:
 * - Question number
 * - Question text
 * - Four answer options (A, B, C, D) - DISPLAY ONLY, non-interactive
 * - Correct answer indicator (HOST VIEW ONLY - always visible to host)
 * - Visual states: loading, visible, revealed
 *
 * States:
 * 1. No question loaded: "Load a question to begin"
 * 2. Question loaded (host view): Correct answer visible to host
 * 3. Question visible to public: Correct answer still visible to host
 * 4. Answer revealed: Correct answer highlighted
 *
 * Note: This is the HOST panel - correct answer is ALWAYS visible here.
 * Public display is separate and reads from Firebase game-state.
 */
export default function QuestionPanel() {
  // Questions Store
  const hostQuestion = useQuestionsStore((state) => state.hostQuestion);

  // Game Store
  const questionVisible = useGameStore((state) => state.questionVisible);
  const answerRevealed = useGameStore((state) => state.answerRevealed);
  const correctOption = useGameStore((state) => state.correctOption);
  const currentQuestionNumber = useGameStore(
    (state) => state.currentQuestionNumber,
  );

  // No question loaded state
  if (!hostQuestion) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription className="text-center">
            <p className="text-muted-foreground">
              No question loaded. Click "Load Question" to begin.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Determine which correct answer to show
  // - Before reveal: hostQuestion.correctAnswer (from question-sets)
  // - After reveal: correctOption from Firebase (synced to public)
  const displayCorrectAnswer = answerRevealed
    ? correctOption
    : hostQuestion.correctAnswer;

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            Question {currentQuestionNumber}
          </Badge>

          {/* Visibility Status */}
          {questionVisible ? (
            <Badge variant="default" className="gap-1.5">
              <Eye className="w-3 h-3" />
              Visible to Public
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1.5">
              <EyeOff className="w-3 h-3" />
              Host View Only
            </Badge>
          )}

          {/* Answer Revealed Status */}
          {answerRevealed && (
            <Badge variant="destructive" className="gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              Answer Revealed
            </Badge>
          )}
        </div>
      </div>

      {/* Question Text */}
      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
        <p className="text-lg font-semibold leading-relaxed">
          {hostQuestion.text}
        </p>
      </div>

      {/* Display Only Notice */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Info className="w-3.5 h-3.5" />
        <span className="font-medium">
          Display Only - Use Answer Pad below to select answers
        </span>
      </div>

      {/* Answer Options - Non-Interactive Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
        {Object.entries(hostQuestion.options).map(([option, text]) => {
          // Normalize both sides for case-insensitive comparison
          const isCorrect =
            option.toUpperCase() === displayCorrectAnswer?.toUpperCase();
          // Host ALWAYS sees correct answer (this is host panel, not public display)
          const showCorrectIndicator = true;

          return (
            <div
              key={option}
              className={cn(
                'p-4 rounded-lg border-2 border-dashed transition-all duration-300',
                // Non-interactive styling - grayed out
                'cursor-not-allowed select-none',
                // Correct answer styling (always visible to host)
                isCorrect && showCorrectIndicator
                  ? 'bg-green-50/50 dark:bg-green-950/10 border-green-400/50 dark:border-green-700/50'
                  : 'bg-gray-50/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700',
                // Revealed answer gets extra emphasis
                isCorrect &&
                  answerRevealed &&
                  'ring-2 ring-green-500/30 shadow-md',
              )}>
              <div className="flex items-start gap-3">
                {/* Option Letter */}
                <div
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm uppercase',
                    isCorrect && showCorrectIndicator
                      ? 'bg-green-500/70 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
                  )}>
                  {option.toUpperCase()}
                </div>

                {/* Option Text */}
                <div className="flex-1 pt-0.5">
                  <p
                    className={cn(
                      'text-sm leading-relaxed',
                      isCorrect && showCorrectIndicator
                        ? 'font-semibold text-green-800 dark:text-green-200'
                        : 'text-gray-600 dark:text-gray-400',
                    )}>
                    {text}
                  </p>
                </div>

                {/* Correct Answer Indicator */}
                {isCorrect && showCorrectIndicator && (
                  <div className="flex-shrink-0">
                    {answerRevealed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600/80 dark:text-green-400/80" />
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-green-100/70 dark:bg-green-900/20 border-green-500/50 text-green-700 dark:text-green-300 text-xs">
                        ✓ Correct
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Host View Warning (when not visible to public) */}
      {!questionVisible && !answerRevealed && (
        <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700">
          <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>🔒 Host View Only:</strong> This question is not yet visible
            to the public. Click "Push to Display" to display it.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
