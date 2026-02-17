// src/pages/play/components/AnswerPad.jsx

import { useAnswerSelection } from '../hooks/useAnswerSelection';
import { useGameStore } from '@stores/useGameStore';
import { useQuestionsStore } from '@stores/useQuestionsStore';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Alert, AlertDescription } from '@components/ui/alert';
import { Lock, CheckCircle2, XCircle, AlertTriangle, Eye } from 'lucide-react';
import { cn } from '@lib/utils';

/**
 * Answer Pad Component
 *
 * Purpose: Host interface for selecting team's answer choice
 *
 * Displays:
 * - Four clickable buttons (A, B, C, D)
 * - Selected answer highlighting
 * - "Lock Answer" button (enabled only after selection)
 *
 * Functionality:
 * - Team verbally announces answer (e.g., "We choose B")
 * - Host clicks corresponding button (B)
 * - Button highlights in yellow (local state, not synced)
 * - Host can change selection before locking
 * - "Lock Answer" triggers validation against correct answer
 * - Automatic result determination (correct/incorrect)
 *
 * States:
 * 1. Question loaded but not visible: Low opacity (applied at Card level), disabled
 * 2. Question visible to public: Full opacity with ring animation (at Card level), active
 * 3. Selected: One option selected (yellow highlight)
 * 4. Locked: Answer validated and locked (no changes allowed)
 * 5. 50/50 active: Eliminated options visually crossed out and disabled
 */
export default function AnswerPad() {
  // Answer Selection Hook
  const {
    selectedAnswer,
    validationResult,
    isLocking,
    canLock,
    error,
    selectAnswer,
    clearSelection,
    lockAnswer,
  } = useAnswerSelection();

  // Game Store (for question visibility)
  const questionVisible = useGameStore((state) => state.questionVisible);
  const answerRevealed = useGameStore((state) => state.answerRevealed);

  // Questions Store
  const hostQuestion = useQuestionsStore((state) => state.hostQuestion);
  const filteredOptions = useQuestionsStore((state) => state.filteredOptions);

  // All answer options
  const options = ['A', 'B', 'C', 'D'];

  // Is the answer pad globally disabled?
  const isDisabled = !questionVisible || answerRevealed || isLocking;

  // Is question loaded but not yet visible?
  const isWaitingForVisibility = !!hostQuestion && !questionVisible;

  /**
   * Check if a specific option has been eliminated by 50/50
   * filteredOptions is an array of REMAINING uppercase options e.g. ['B', 'C']
   * An option is eliminated if filteredOptions exists AND the option is not in it
   */
  const isEliminatedByFiftyFifty = (option) => {
    if (!filteredOptions || filteredOptions.length === 0) return false;
    return !filteredOptions.includes(option.toUpperCase());
  };

  // Handle lock answer
  const handleLockAnswer = async () => {
    try {
      await lockAnswer();
    } catch (err) {
      console.error('Failed to lock answer:', err);
    }
  };

  return (
    <div className="relative">
      {/* Waiting for Visibility Badge */}
      {isWaitingForVisibility && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
          <Badge className="gap-1.5 text-xs shadow-lg bg-orange-500 hover:bg-orange-600 text-white border-orange-600">
            <Eye className="w-3 h-3" />
            Waiting for Question
          </Badge>
        </div>
      )}

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            Select team's answer:
          </p>

          {/* Selected Answer Badge */}
          {selectedAnswer && !validationResult && (
            <Badge variant="outline" className="gap-1.5">
              Selected: <span className="font-bold">{selectedAnswer}</span>
            </Badge>
          )}

          {/* Validation Result Badge */}
          {validationResult && (
            <Badge
              variant={validationResult.isCorrect ? 'default' : 'destructive'}
              className="gap-1.5">
              {validationResult.isCorrect ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Correct!
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3" />
                  Incorrect
                </>
              )}
            </Badge>
          )}
        </div>

        {/* Answer Button Grid */}
        <div className="grid grid-cols-2 gap-3">
          {options.map((option) => {
            const isSelected = selectedAnswer === option;
            const isCorrect =
              validationResult?.correctAnswer === option && answerRevealed;
            const isIncorrect =
              validationResult &&
              !validationResult.isCorrect &&
              selectedAnswer === option &&
              answerRevealed;
            const isEliminated = isEliminatedByFiftyFifty(option);

            return (
              <Button
                key={option}
                onClick={() => selectAnswer(option)}
                disabled={isDisabled || !!validationResult || isEliminated}
                variant="outline"
                size="lg"
                className={cn(
                  'h-16 text-xl font-bold transition-all duration-200',
                  'border-2 hover:scale-105',
                  // Eliminated by 50/50
                  isEliminated &&
                    'opacity-30 cursor-not-allowed line-through hover:scale-100',
                  // Selected state (before lock)
                  isSelected &&
                    !validationResult &&
                    'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 dark:border-yellow-600 ring-2 ring-yellow-500 text-yellow-900 dark:text-yellow-100',
                  // Correct answer (after lock and reveal)
                  isCorrect &&
                    'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600 ring-2 ring-green-500 text-green-900 dark:text-green-100',
                  // Incorrect answer (after lock and reveal)
                  isIncorrect &&
                    'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-600 ring-2 ring-red-500 text-red-900 dark:text-red-100',
                  // Generic disabled state (not eliminated)
                  isDisabled &&
                    !isSelected &&
                    !isEliminated &&
                    'opacity-50 cursor-not-allowed',
                )}>
                <span>{option}</span>
              </Button>
            );
          })}
        </div>

        {/* Clear Selection Button (when answer selected but not locked) */}
        {selectedAnswer && !validationResult && (
          <Button
            onClick={clearSelection}
            variant="ghost"
            size="sm"
            disabled={isLocking || !questionVisible}
            className="w-full">
            Clear Selection
          </Button>
        )}

        {/* Lock Answer Button */}
        <Button
          onClick={handleLockAnswer}
          disabled={!canLock}
          size="lg"
          className="w-full gap-2 transition-all duration-200">
          <Lock className="w-4 h-4" />
          {isLocking ? 'Locking...' : 'Lock Answer'}
        </Button>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Instruction Messages */}
        {!hostQuestion && (
          <Alert>
            <AlertDescription className="text-xs text-muted-foreground text-center">
              Load a question to begin
            </AlertDescription>
          </Alert>
        )}

        {isWaitingForVisibility && (
          <Alert className="bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-700">
            <AlertDescription className="text-xs text-orange-800 dark:text-orange-200 text-center">
              <strong>👁️ Push to Display to public</strong> before accepting
              answers
            </AlertDescription>
          </Alert>
        )}

        {questionVisible && !selectedAnswer && !validationResult && (
          <Alert className="bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700">
            <AlertDescription className="text-xs text-green-800 dark:text-green-200 text-center">
              {filteredOptions?.length > 0 ? (
                <>
                  <strong>✂️ 50/50 Active</strong> — only{' '}
                  {filteredOptions.join(' & ')} are available
                </>
              ) : (
                <>
                  <strong>✓ Ready!</strong> Click option (A/B/C/D) to select
                  team's answer
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {selectedAnswer && !validationResult && (
          <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700">
            <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
              <strong>{selectedAnswer}</strong> selected. Click "Lock Answer" to
              validate
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
