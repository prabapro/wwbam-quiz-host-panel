// src/components/play/AnswerPad.jsx

import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Check } from 'lucide-react';

/**
 * Answer Pad Component
 * Displays A/B/C/D answer selection buttons
 * Highlights selected answer and correct answer when revealed
 */
export default function AnswerPad({
  selectedAnswer = null,
  correctAnswer = null,
  answerRevealed = false,
  disabled = false,
  onSelectAnswer,
}) {
  const options = ['A', 'B', 'C', 'D'];

  /**
   * Get button variant based on state
   */
  const getButtonVariant = (option) => {
    // Answer revealed - show correct in green
    if (answerRevealed && option === correctAnswer) {
      return 'default'; // Will be styled green
    }

    // Answer revealed - show incorrect selection in red
    if (
      answerRevealed &&
      option === selectedAnswer &&
      option !== correctAnswer
    ) {
      return 'destructive';
    }

    // Selected but not yet validated
    if (!answerRevealed && option === selectedAnswer) {
      return 'secondary'; // Highlighted
    }

    return 'outline';
  };

  /**
   * Get button classes based on state
   */
  const getButtonClasses = (option) => {
    const baseClasses = 'h-20 text-2xl font-bold relative transition-all';

    // Correct answer revealed
    if (answerRevealed && option === correctAnswer) {
      return `${baseClasses} bg-green-600 hover:bg-green-700 text-white border-green-700`;
    }

    // Wrong answer revealed
    if (
      answerRevealed &&
      option === selectedAnswer &&
      option !== correctAnswer
    ) {
      return `${baseClasses} bg-red-600 hover:bg-red-700 text-white border-red-700`;
    }

    // Selected but not validated
    if (!answerRevealed && option === selectedAnswer) {
      return `${baseClasses} bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600`;
    }

    return baseClasses;
  };

  /**
   * Handle answer selection
   */
  const handleSelect = (option) => {
    if (disabled || answerRevealed) {
      return;
    }

    onSelectAnswer(option);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Select Answer</CardTitle>
          {selectedAnswer && !answerRevealed && (
            <Badge className="bg-yellow-500 text-white">
              Selected: {selectedAnswer}
            </Badge>
          )}
          {answerRevealed && (
            <Badge className="bg-green-600 text-white">
              Correct: {correctAnswer}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {options.map((option) => {
            const isSelected = option === selectedAnswer;
            const isCorrect = answerRevealed && option === correctAnswer;
            const isWrong =
              answerRevealed && isSelected && option !== correctAnswer;

            return (
              <Button
                key={option}
                variant={getButtonVariant(option)}
                className={getButtonClasses(option)}
                onClick={() => handleSelect(option)}
                disabled={disabled || answerRevealed}>
                {/* Option Letter */}
                <span className="text-3xl">{option}</span>

                {/* Checkmark for correct answer */}
                {isCorrect && (
                  <Check className="absolute right-3 top-3 w-6 h-6" />
                )}

                {/* X for wrong answer */}
                {isWrong && (
                  <span className="absolute right-3 top-3 text-2xl">✕</span>
                )}
              </Button>
            );
          })}
        </div>

        {/* Help Text */}
        {!answerRevealed && !disabled && (
          <p className="text-sm text-muted-foreground text-center mt-4">
            {selectedAnswer
              ? 'Click a different option to change your selection, or click "Lock Answer" to confirm.'
              : 'Click an option (A, B, C, or D) to select your answer.'}
          </p>
        )}

        {disabled && !answerRevealed && (
          <p className="text-sm text-muted-foreground text-center mt-4">
            Load and show a question to enable answer selection.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
