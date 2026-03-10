// src/pages/play/components/AnswerPad.jsx

import { useAnswerSelection } from '../hooks/useAnswerSelection';
import { useGameStore } from '@stores/useGameStore';
import { useQuestionsStore } from '@stores/useQuestionsStore';
import { Button } from '@components/ui/button';
import { Alert, AlertDescription } from '@components/ui/alert';
import {
  Eye,
  Lock,
  LockKeyhole,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  EyeOff,
  RotateCcw,
  Scissors,
  MousePointerClick,
} from 'lucide-react';
import { cn } from '@lib/utils';

/**
 * AnswerPad Component
 *
 * Host interface for selecting and finalising the team's answer.
 * Sits in the right 1/4-width column of the Play page.
 *
 * ── Phase 1: ANSWER SELECTION ──────────────────────────────────────────────
 *   Four clickable A/B/C/D buttons. "Push to Display" enabled once an option
 *   is chosen. Host can clear selection freely.
 *
 * ── Phase 2: SOFT LOCK (deliberation) ──────────────────────────────────────
 *   Display shows the selected option in amber (audience sees it).
 *   A/B/C/D buttons are disabled — the choice is committed to Firebase.
 *   "Change Answer" returns to Phase 1 (clears Firebase preview).
 *   "Lock Answer" triggers validation + reveal + all team/game updates.
 *
 * ── Phase 3: HARD LOCK (Confirmation) ──────────────────────────────────────
 *   Result shown (correct/incorrect). All controls disabled.
 *   State clears automatically when the next question is loaded.
 */

// ── Constants ──────────────────────────────────────────────────────────────────

const OPTIONS = ['A', 'B', 'C', 'D'];

const PHASE_STEPS = [
  { id: 'selecting', label: 'Answer Selection' },
  { id: 'locked', label: 'Soft Lock' },
  { id: 'confirmed', label: 'Hard Lock' },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

/**
 * Horizontal 3-step phase indicator.
 * Each step represents a completed HOST ACTION, not just the current phase:
 *   Step 0 (Answer Selection) — done once A/B/C/D is clicked
 *   Step 1 (Soft Lock)        — done once "Push to Display" is pressed
 *   Step 2 (Hard Lock)        — done once "Lock Answer" is pressed
 */
function PhaseSteps({ phase, selectedAnswer }) {
  // Step done flags — driven by actions, not phase alone
  const stepDone = [
    !!selectedAnswer, // Answer Selection
    phase === 'locked' || phase === 'confirmed', // Soft Lock
    phase === 'confirmed', // Hard Lock
  ];

  return (
    <div className="flex items-center gap-1 w-full">
      {PHASE_STEPS.map((step, i) => {
        const isDone = stepDone[i];
        const isActive = !isDone && (i === 0 || stepDone[i - 1]);

        return (
          <div key={step.id} className="flex items-center flex-1 gap-1">
            {/* Step pill */}
            <div
              className={cn(
                'flex items-center gap-1.5 flex-1 rounded-md px-2 py-1 text-xs font-medium transition-all duration-200',
                isActive && 'bg-foreground text-background',
                isDone && 'bg-muted text-muted-foreground line-through',
                !isActive && !isDone && 'bg-muted/50 text-muted-foreground/50',
              )}>
              <span
                className={cn(
                  'flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold shrink-0',
                  isActive && 'bg-background/20',
                  isDone && 'bg-muted-foreground/20',
                  !isActive && !isDone && 'bg-muted-foreground/10',
                )}>
                {isDone ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
              </span>
              {step.label}
            </div>

            {/* Connector line */}
            {i < PHASE_STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px w-2 shrink-0 rounded-full transition-all duration-200',
                  stepDone[i]
                    ? 'bg-muted-foreground/40'
                    : 'bg-muted-foreground/20',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Single option button (A / B / C / D).
 * Visual state is driven purely by phase + answer data — no inline style overrides.
 */
function OptionButton({
  option,
  phase,
  selectedAnswer,
  validationResult,
  answerRevealed,
  isEliminated,
  isInteractive,
  onSelect,
}) {
  const isSelected = selectedAnswer === option;
  const isCorrect =
    validationResult?.correctAnswer === option && answerRevealed;
  const isWrong =
    validationResult &&
    !validationResult.isCorrect &&
    isSelected &&
    answerRevealed;

  const buttonClass = cn(
    'h-14 text-lg font-bold border-2 transition-all duration-200 select-none',
    // Eliminated by 50/50
    isEliminated &&
      'opacity-25 cursor-not-allowed line-through decoration-muted-foreground',
    // Phase 3 — correct
    isCorrect &&
      'bg-green-100 dark:bg-green-900/30 border-green-500 ring-2 ring-green-400/60 text-green-800 dark:text-green-200 cursor-default',
    // Phase 3 — wrong
    isWrong &&
      'bg-red-100 dark:bg-red-900/30 border-red-500 ring-2 ring-red-400/60 text-red-800 dark:text-red-200 cursor-default',
    // Phase 2 — locked (committed to Firebase, shown in amber)
    isSelected &&
      phase === 'locked' &&
      !answerRevealed &&
      'bg-amber-100 dark:bg-amber-900/40 border-amber-500 ring-2 ring-amber-400/60 text-amber-900 dark:text-amber-100 cursor-default',
    // Phase 1 — locally selected
    isSelected &&
      phase === 'selecting' &&
      'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 ring-2 ring-yellow-400/60 text-yellow-900 dark:text-yellow-100',
    // Unselected + non-interactive
    !isSelected &&
      !isCorrect &&
      !isWrong &&
      !isEliminated &&
      !isInteractive &&
      'opacity-50 cursor-not-allowed',
    // Unselected + interactive (default hover state)
    !isSelected &&
      isInteractive &&
      !isEliminated &&
      'hover:bg-muted/60 hover:border-foreground/30',
  );

  return (
    <Button
      onClick={() => onSelect(option)}
      disabled={!isInteractive || isEliminated}
      variant="outline"
      size="lg"
      className={buttonClass}>
      {option}
    </Button>
  );
}

/**
 * Single status strip rendered below the action buttons.
 * One message visible at a time — no stacked alerts.
 * Colours kept minimal: muted-foreground for neutral states,
 * green/red only for final correct/incorrect outcomes.
 */
function StatusStrip({
  phase,
  hostQuestion,
  questionVisible,
  selectedAnswer,
  filteredOptions,
  validationResult,
}) {
  // No question loaded
  if (!hostQuestion) {
    return (
      <p className="text-xs text-muted-foreground text-center py-1">
        Load a question to begin
      </p>
    );
  }

  // Question not yet pushed to display
  if (!questionVisible) {
    return (
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-1">
        <EyeOff className="w-3.5 h-3.5 shrink-0" />
        <span>Push to Display before accepting answers</span>
      </div>
    );
  }

  // Phase 1 — 50/50 active, no selection yet
  if (phase === 'selecting' && filteredOptions?.length > 0 && !selectedAnswer) {
    return (
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-1">
        <Scissors className="w-3.5 h-3.5 shrink-0" />
        <span>50/50 active — only {filteredOptions.join(' & ')} available</span>
      </div>
    );
  }

  // Phase 1 — ready, no selection yet
  if (phase === 'selecting' && !selectedAnswer) {
    return (
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-1">
        <MousePointerClick className="w-3.5 h-3.5 shrink-0" />
        <span>Tap A / B / C / D to select the team's answer</span>
      </div>
    );
  }

  // Phase 1 — option selected, ready to push
  if (phase === 'selecting' && selectedAnswer) {
    return (
      <p className="text-xs text-muted-foreground text-center py-1">
        <span className="font-semibold text-foreground">{selectedAnswer}</span>{' '}
        selected — push to display when ready
      </p>
    );
  }

  // Phase 2 — locked / deliberating
  if (phase === 'locked') {
    return (
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-1">
        <Lock className="w-3.5 h-3.5 shrink-0" />
        <span>
          <span className="font-semibold text-foreground">
            {selectedAnswer}
          </span>{' '}
          is live on display — lock in or change
        </span>
      </div>
    );
  }

  // Phase 3 — confirmed correct
  if (phase === 'confirmed' && validationResult?.isCorrect) {
    return (
      <div className="flex items-center justify-center gap-1.5 text-xs text-green-700 dark:text-green-400 py-1">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span className="font-semibold">
          Correct! Load next question to continue.
        </span>
      </div>
    );
  }

  // Phase 3 — confirmed incorrect
  if (
    phase === 'confirmed' &&
    validationResult &&
    !validationResult.isCorrect
  ) {
    return (
      <div className="flex items-center justify-center gap-1.5 text-xs text-red-700 dark:text-red-400 py-1">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span className="font-semibold">Incorrect — team eliminated.</span>
      </div>
    );
  }

  return null;
}

// ── Main Component ─────────────────────────────────────────────────────────────

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

  /** True when a 50/50 has eliminated this option */
  const isEliminatedByFiftyFifty = (option) => {
    if (!filteredOptions || filteredOptions.length === 0) return false;
    return !filteredOptions.includes(option.toUpperCase());
  };

  // Options are interactive only in Phase 1 with question visible
  const optionsInteractive =
    phase === 'selecting' && questionVisible && !answerRevealed;

  return (
    <div className="space-y-4">
      {/* ── Phase stepper ────────────────────────────────────────────────── */}
      <PhaseSteps phase={phase} selectedAnswer={selectedAnswer} />

      {/* ── A / B / C / D grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5">
        {OPTIONS.map((option) => (
          <OptionButton
            key={option}
            option={option}
            phase={phase}
            selectedAnswer={selectedAnswer}
            validationResult={validationResult}
            answerRevealed={answerRevealed}
            isEliminated={isEliminatedByFiftyFifty(option)}
            isInteractive={optionsInteractive}
            onSelect={selectAnswer}
          />
        ))}
      </div>

      {/* ── Action area ──────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {/* Phase 1 — selecting */}
        {phase === 'selecting' && (
          <>
            <Button
              onClick={lockAnswer}
              disabled={!canLock}
              size="lg"
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white transition-colors duration-150">
              <Eye className="w-4 h-4" />
              {isLocking ? 'Sending…' : 'Push to Display'}
            </Button>

            {selectedAnswer && (
              <Button
                onClick={clearSelection}
                disabled={!questionVisible}
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground">
                Clear Selection
              </Button>
            )}
          </>
        )}

        {/* Phase 2 — locked / deliberating */}
        {phase === 'locked' && (
          <>
            <Button
              onClick={confirmAnswer}
              disabled={!canConfirm}
              size="lg"
              className="w-full gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white transition-colors duration-150">
              <LockKeyhole className="w-4 h-4" />
              {isConfirming ? 'Confirming…' : 'Lock Answer'}
            </Button>

            <Button
              onClick={changeAnswer}
              disabled={!canChange}
              variant="outline"
              size="lg"
              className="w-full gap-2">
              <RotateCcw className="w-4 h-4" />
              {isLocking ? 'Clearing…' : 'Change Answer'}
            </Button>
          </>
        )}
      </div>

      {/* ── Error alert ──────────────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Contextual status strip ───────────────────────────────────────  */}
      <div className="border-t pt-2">
        <StatusStrip
          phase={phase}
          hostQuestion={hostQuestion}
          questionVisible={questionVisible}
          selectedAnswer={selectedAnswer}
          filteredOptions={filteredOptions}
          validationResult={validationResult}
        />
      </div>
    </div>
  );
}
