// src/components/play/HostQuestionView.jsx

import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Alert, AlertDescription } from '@components/ui/alert';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

/**
 * Host Question View Component
 * Displays question with all options and correct answer highlighted
 * This view is FOR HOST ONLY - never shown to public
 */
export default function HostQuestionView({
  question = null,
  questionVisible = false,
  answerRevealed = false,
}) {
  if (!question) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p>No question loaded</p>
            <p className="text-sm mt-2">Click "Load Question" to begin</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { number, text, options, correctAnswer } = question;

  /**
   * Get option badge color based on correctness
   */
  const getOptionBadgeVariant = (option) => {
    if (option === correctAnswer) {
      return 'default'; // Will style as green
    }
    return 'outline';
  };

  /**
   * Get option container classes
   */
  const getOptionClasses = (option) => {
    const baseClasses = 'p-4 rounded-lg border transition-all';

    if (option === correctAnswer) {
      return `${baseClasses} bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700`;
    }

    return `${baseClasses} bg-muted/30 border-muted`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Question {number}</CardTitle>

          <div className="flex items-center gap-2">
            {/* Visibility Status */}
            {questionVisible ? (
              <Badge className="bg-green-600">
                <Eye className="w-3 h-3 mr-1" />
                Visible to Public
              </Badge>
            ) : (
              <Badge variant="secondary">
                <EyeOff className="w-3 h-3 mr-1" />
                Host Only
              </Badge>
            )}

            {/* Answer Revealed Status */}
            {answerRevealed && (
              <Badge className="bg-blue-600">Answer Revealed</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Host Only Warning */}
        <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
          <AlertDescription className="text-orange-800 dark:text-orange-200 font-medium">
            🔒 HOST VIEW ONLY - Correct answer is visible below
          </AlertDescription>
        </Alert>

        {/* Question Text */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Question:
          </h3>
          <p className="text-xl font-medium leading-relaxed">{text}</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Options:
          </h3>

          <div className="space-y-2">
            {['A', 'B', 'C', 'D'].map((option) => (
              <div key={option} className={getOptionClasses(option)}>
                <div className="flex items-start gap-3">
                  {/* Option Letter Badge */}
                  <Badge
                    variant={getOptionBadgeVariant(option)}
                    className={`
                      flex-shrink-0 w-8 h-8 flex items-center justify-center text-base font-bold
                      ${
                        option === correctAnswer
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : ''
                      }
                    `}>
                    {option}
                  </Badge>

                  {/* Option Text */}
                  <span className="flex-1 pt-1">{options[option]}</span>

                  {/* Correct Answer Indicator */}
                  {option === correctAnswer && (
                    <div className="flex items-center gap-1 text-green-700 dark:text-green-400 flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-bold">CORRECT</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Correct Answer Summary */}
        <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg dark:bg-green-950 dark:border-green-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-700 dark:text-green-400" />
            <span className="font-medium text-green-800 dark:text-green-200">
              Correct Answer:
            </span>
            <Badge className="bg-green-600 text-white text-lg px-3">
              {correctAnswer}
            </Badge>
            <span className="text-sm text-green-700 dark:text-green-300">
              {options[correctAnswer]}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
