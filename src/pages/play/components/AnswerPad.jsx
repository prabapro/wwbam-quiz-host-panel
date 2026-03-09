// src/pages/play/components/AnswerPad.jsx

import { useAnswerSelection } from '../hooks/useAnswerSelection';
import { useGameStore } from '@stores/useGameStore';
import { useQuestionsStore } from '@stores/useQuestionsStore';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Alert, AlertDescription } from '@components/ui/alert';
import {
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@lib/utils';

/**
 * AnswerPad Component
 *
 * Host interface for selecting and finalising the team's answer.
 *
 * ── Phase 1: SELECTING ──────────────────────────────────────────────────────
 *   Four clickable A/B/C/D buttons. "Lock Answer" enabled once an option is
 *   chosen. Host can clear selection freely.
 *
 * ── Phase 2: LOCKED (deliberation) ─────────────────────────────────────────
 *   Display shows the selected option in amber (audience sees it).
 *   A/B/C/D buttons are disabled — the choice is committed to Firebase.
 *   "Change Answer" returns to Phase 1 (clears Firebase preview).
 *   "Confirm Answer" triggers validation + reveal + all team/game updates.
 *
 * ── Phase 3: CONFIRMED ──────────────────────────────────────────────────────
 *   Result shown (correct/incorrect). All controls disabled.
 *   State clears automatically when the next question is loaded.
 */
export default function AnswerPad() {
  const {
    selectedAnswer,
    validationResult,
    isLocking,
    isConfirming,
    phase,
    error,
    canLock,
    canConfirm,
    canChange,
    selectAnswer,
    clearSelection,
    lockAnswer,
    changeAnswer,
    confirmAnswer,
  } = useAnswerSelection();

  const questionVisible = useGameStore((state) => state.questionVisible);
  const answerRevealed = useGameStore((state) => state.answerRevealed);
  const hostQuestion = useQuestionsStore((state) => state.hostQuestion);
  const filteredOptions = useQuestionsStore((state) => state.filteredOptions);

  const OPTIONS = ['A', 'B', 'C', 'D'];
  const isWaitingForVisibility = !!hostQuestion && !questionVisible;

  /** True when a 50/50 has eliminated this option */
  const isEliminatedByFiftyFifty = (option) => {
    if (!filteredOptions || filteredOptions.length === 0) return false;
    return !filteredOptions.includes(option.toUpperCase());
  };

  // Option buttons are interactive only in Phase 1
  const optionsInteractive =
    phase === 'selecting' && questionVisible && !answerRevealed;

  const getOptionStyle = (option) => {
    const isSelected = selectedAnswer === option;
    const isEliminated = isEliminatedByFiftyFifty(option);
    const isCorrect =
      validationResult?.correctAnswer === option && answerRevealed;
    const isWrong =
      validationResult &&
      !validationResult.isCorrect &&
      selectedAnswer === option &&
      answerRevealed;

    return cn(
      'h-16 text-xl font-bold transition-all duration-200 border-2',
      // Eliminated by 50/50
      isEliminated &&
        'opacity-30 cursor-not-allowed line-through hover:scale-100',
      // Phase 1: selected (local only, not yet in Firebase)
      isSelected &&
        phase === 'selecting' &&
        'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 dark:border-yellow-600 ring-2 ring-yellow-500 text-yellow-900 dark:text-yellow-100',
      // Phase 2: locked — show which option is committed to Firebase
      isSelected &&
        phase === 'locked' &&
        'bg-amber-100 dark:bg-amber-900/40 border-amber-500 dark:border-amber-500 ring-2 ring-amber-500 text-amber-900 dark:text-amber-100 cursor-not-allowed hover:scale-100',
      // Phase 3: correct answer
      isCorrect &&
        'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600 ring-2 ring-green-500 text-green-900 dark:text-green-100',
      // Phase 3: wrong answer
      isWrong &&
        'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-600 ring-2 ring-red-500 text-red-900 dark:text-red-100',
      // Disabled and unselected
      !optionsInteractive &&
        !isSelected &&
        !isEliminated &&
        'opacity-50 cursor-not-allowed',
    );
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
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {phase === 'selecting' && "Select team's answer:"}
            {phase === 'locked' && 'Answer locked — deliberating:'}
            {phase === 'confirmed' && 'Answer confirmed:'}
          </p>

          {/* Phase badge */}
          {phase === 'selecting' && selectedAnswer && (
            <Badge variant="outline" className="gap-1.5">
              Selected: <span className="font-bold">{selectedAnswer}</span>
            </Badge>
          )}

          {phase === 'locked' && (
            <Badge className="gap-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 border-amber-400">
              <Lock className="w-3 h-3" />
              Locked: {selectedAnswer}
            </Badge>
          )}

          {phase === 'confirmed' && validationResult && (
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

        {/* ── A/B/C/D Option Grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {OPTIONS.map((option) => {
            const isEliminated = isEliminatedByFiftyFifty(option);

            return (
              <Button
                key={option}
                onClick={() => selectAnswer(option)}
                disabled={!optionsInteractive || isEliminated}
                variant="outline"
                size="lg"
                className={cn('hover:scale-105', getOptionStyle(option))}>
                {option}
              </Button>
            );
          })}
        </div>

        {/* ── Phase 1 controls ─────────────────────────────────────────── */}
        {phase === 'selecting' && (
          <>
            {selectedAnswer && (
              <Button
                onClick={clearSelection}
                variant="ghost"
                size="sm"
                disabled={!questionVisible}
                className="w-full">
                Clear Selection
              </Button>
            )}

            <Button
              onClick={lockAnswer}
              disabled={!canLock}
              size="lg"
              className="w-full gap-2 transition-all duration-200">
              <Lock className="w-4 h-4" />
              {isLocking ? 'Locking...' : 'Lock Answer'}
            </Button>
          </>
        )}

        {/* ── Phase 2 controls (deliberation) ──────────────────────────── */}
        {phase === 'locked' && (
          <div className="space-y-2">
            {/* Change Answer — secondary, goes back to Phase 1 */}
            <Button
              onClick={changeAnswer}
              disabled={!canChange}
              variant="outline"
              size="sm"
              className="w-full gap-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30">
              <RotateCcw className="w-3.5 h-3.5" />
              {isLocking ? 'Clearing...' : 'Change Answer'}
            </Button>

            {/* Confirm Answer — primary, triggers full reveal + team update */}
            <Button
              onClick={confirmAnswer}
              disabled={!canConfirm}
              size="lg"
              className="w-full gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white transition-all duration-200">
              <ShieldCheck className="w-4 h-4" />
              {isConfirming ? 'Confirming...' : 'Confirm Answer'}
            </Button>
          </div>
        )}

        {/* ── Error Alert ───────────────────────────────────────────────── */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* ── Contextual guidance messages ─────────────────────────────── */}
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

        {phase === 'selecting' && questionVisible && !selectedAnswer && (
          <Alert className="bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700">
            <AlertDescription className="text-xs text-green-800 dark:text-green-200 text-center">
              {filteredOptions?.length > 0 ? (
                <>
                  <strong>✂️ 50/50 Active</strong> — only{' '}
                  {filteredOptions.join(' & ')} available
                </>
              ) : (
                <>
                  <strong>✓ Ready!</strong> Click A/B/C/D to select team's
                  answer
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {phase === 'selecting' && selectedAnswer && (
          <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700">
            <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
              <strong>{selectedAnswer}</strong> selected — click "Lock Answer"
              to send to display
            </AlertDescription>
          </Alert>
        )}

        {phase === 'locked' && (
          <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-400 dark:border-amber-600">
            <AlertDescription className="text-xs text-amber-800 dark:text-amber-200 text-center">
              <strong>🔒 {selectedAnswer} is showing on display.</strong>{' '}
              Discuss, then <strong>Confirm</strong> to reveal or{' '}
              <strong>Change</strong> to go back.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
