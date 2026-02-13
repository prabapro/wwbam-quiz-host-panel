// src/pages/play/components/AnswerPad.jsx

import { useAnswerSelection } from '../hooks/useAnswerSelection';
import { useGameStore } from '@stores/useGameStore';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Alert, AlertDescription } from '@components/ui/alert';
import { Lock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
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
 * - "Lock Answer" triggers validation against localStorage correct answer
 * - Automatic result determination (correct/incorrect)
 *
 * States:
 * 1. Disabled: No question visible yet
 * 2. Active: Question visible, awaiting team's answer selection
 * 3. Selected: One option selected (yellow highlight)
 * 4. Locked: Answer validated and locked (no changes allowed)
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

  // Answer options
  const options = ['A', 'B', 'C', 'D'];

  // Is answer pad disabled?
  const isDisabled = !questionVisible || answerRevealed || isLocking;

  // Handle lock answer
  const handleLockAnswer = async () => {
    try {
      await lockAnswer();
    } catch (err) {
      console.error('Failed to lock answer:', err);
    }
  };

  return (
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
      <div className="grid grid-cols-2 gap-4">
        {options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrect =
            validationResult?.correctAnswer === option && answerRevealed;
          const isIncorrect =
            validationResult &&
            !validationResult.isCorrect &&
            selectedAnswer === option &&
            answerRevealed;

          return (
            <Button
              key={option}
              onClick={() => selectAnswer(option)}
              disabled={isDisabled || !!validationResult}
              variant="outline"
              size="lg"
              className={cn(
                'h-20 text-2xl font-bold transition-all duration-200',
                // Default state
                'border-2 hover:scale-105',
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
                // Disabled state
                isDisabled && !isSelected && 'opacity-50 cursor-not-allowed',
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
          disabled={isLocking}
          className="w-full">
          Clear Selection
        </Button>
      )}

      {/* Lock Answer Button */}
      <Button
        onClick={handleLockAnswer}
        disabled={!canLock}
        size="lg"
        className={cn(
          'w-full gap-2 transition-all duration-200',
          canLock && 'animate-pulse',
        )}>
        <Lock className="w-4 h-4" />
        {isLocking ? 'Locking...' : 'Lock Answer'}
      </Button>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Instruction Messages */}
      {!questionVisible && (
        <Alert>
          <AlertDescription className="text-xs text-muted-foreground text-center">
            Show question to public before accepting answers
          </AlertDescription>
        </Alert>
      )}

      {questionVisible && !selectedAnswer && !validationResult && (
        <Alert>
          <AlertDescription className="text-xs text-muted-foreground text-center">
            Click option (A/B/C/D) to select team's answer, then lock to
            validate
          </AlertDescription>
        </Alert>
      )}

      {selectedAnswer && !validationResult && (
        <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700">
          <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
            <strong>{selectedAnswer}</strong> selected. Click "Lock Answer" to
            validate (cannot be changed after locking)
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
