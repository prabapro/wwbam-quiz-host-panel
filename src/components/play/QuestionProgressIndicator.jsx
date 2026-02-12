// src/components/play/QuestionProgressIndicator.jsx

import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Progress } from '@components/ui/progress';
import { Trophy, Target } from 'lucide-react';
import {
  MILESTONE_QUESTIONS,
  isMilestoneQuestion,
} from '@constants/prizeStructure';
import { formatPrize } from '@constants/prizeStructure';

/**
 * Question Progress Indicator Component
 * Shows current question number, progress bar, and prize ladder
 */
export default function QuestionProgressIndicator({
  currentQuestionNumber = 0,
  totalQuestions = 20,
  currentPrize = 0,
  prizeStructure = [],
  questionsAnswered = 0,
}) {
  const progressPercentage = (currentQuestionNumber / totalQuestions) * 100;

  /**
   * Get prize ladder items in reverse order (highest first)
   */
  const getPrizeLadder = () => {
    return prizeStructure
      .map((prize, index) => ({
        questionNumber: index + 1,
        prize,
        isMilestone: isMilestoneQuestion(index + 1),
        isCompleted: index + 1 <= questionsAnswered,
        isCurrent: index + 1 === currentQuestionNumber,
        isNext: index + 1 === currentQuestionNumber + 1,
      }))
      .reverse(); // Show highest prize first
  };

  const ladder = getPrizeLadder();

  return (
    <div className="space-y-4">
      {/* Current Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Question Progress
            </CardTitle>
            <Badge variant="outline" className="text-lg font-bold">
              {currentQuestionNumber} / {totalQuestions}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{questionsAnswered} answered</span>
              <span>{totalQuestions - currentQuestionNumber} remaining</span>
            </div>
          </div>

          {/* Current Prize */}
          <div className="p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium">Current Prize</span>
              </div>
              <span className="text-2xl font-bold text-primary">
                {formatPrize(currentPrize)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prize Ladder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prize Ladder</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
            {ladder.map(
              ({
                questionNumber,
                prize,
                isMilestone,
                isCompleted,
                isCurrent,
                isNext,
              }) => (
                <div
                  key={questionNumber}
                  className={`
                  flex items-center justify-between p-2 rounded-lg border transition-all
                  ${
                    isCurrent
                      ? 'bg-primary/10 border-primary/50 shadow-sm scale-105'
                      : isNext
                        ? 'bg-muted/30 border-muted'
                        : isCompleted
                          ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                          : 'bg-background border-muted/30'
                  }
                  ${isMilestone ? 'font-bold' : ''}
                `}>
                  {/* Question Number */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-sm
                      ${
                        isCurrent
                          ? 'bg-primary text-primary-foreground'
                          : isCompleted
                            ? 'bg-green-600 text-white'
                            : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      {questionNumber}
                    </div>

                    {/* Milestone Badge */}
                    {isMilestone && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200">
                        Milestone
                      </Badge>
                    )}

                    {/* Current Indicator */}
                    {isCurrent && (
                      <Badge className="text-xs bg-primary">Playing</Badge>
                    )}
                  </div>

                  {/* Prize Amount */}
                  <span
                    className={`
                    text-sm
                    ${isCurrent ? 'text-primary font-bold' : ''}
                    ${isCompleted ? 'text-green-700 dark:text-green-400' : ''}
                    ${!isCompleted && !isCurrent ? 'text-muted-foreground' : ''}
                  `}>
                    {formatPrize(prize)}
                  </span>
                </div>
              ),
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
