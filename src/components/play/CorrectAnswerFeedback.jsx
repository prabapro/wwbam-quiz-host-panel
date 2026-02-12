// src/components/play/CorrectAnswerFeedback.jsx

import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { CheckCircle2, ArrowRight, Trophy } from 'lucide-react';
import { formatPrize } from '@constants/prizeStructure';

/**
 * Correct Answer Feedback Component
 * Shows success animation, new prize amount, and next question button
 */
export default function CorrectAnswerFeedback({
  previousPrize = 0,
  newPrize = 0,
  questionNumber = 0,
  totalQuestions = 20,
  onNextQuestion,
  isFinalQuestion = false,
}) {
  const prizeIncrease = newPrize - previousPrize;
  const isMilestone = [5, 10, 15, 20].includes(questionNumber);

  return (
    <Card className="border-green-500 shadow-lg animate-in fade-in zoom-in duration-500">
      <CardHeader className="bg-green-50 dark:bg-green-950 border-b border-green-200 dark:border-green-800">
        <div className="text-center space-y-4">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="p-4 bg-green-600 rounded-full animate-bounce">
              <CheckCircle2 className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Success Title */}
          <CardTitle className="text-3xl text-green-800 dark:text-green-200">
            {isFinalQuestion
              ? '🎉 Perfect! All Questions Complete!'
              : '✅ Correct Answer!'}
          </CardTitle>

          {/* Milestone Badge */}
          {isMilestone && !isFinalQuestion && (
            <Badge className="bg-yellow-500 text-white text-lg px-4 py-1">
              🏆 Milestone Reached!
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Prize Update */}
        <div className="space-y-4">
          {/* Previous Prize */}
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">Previous Prize</p>
            <p className="text-2xl font-medium text-muted-foreground line-through">
              {formatPrize(previousPrize)}
            </p>
          </div>

          {/* Prize Increase Arrow */}
          <div className="flex justify-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
              <ArrowRight className="w-6 h-6 text-green-700 dark:text-green-400 rotate-90" />
            </div>
          </div>

          {/* New Prize */}
          <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border-2 border-green-300 dark:border-green-700">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-600" />
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  New Prize Amount
                </p>
              </div>
              <p className="text-5xl font-bold text-green-700 dark:text-green-300 animate-pulse">
                {formatPrize(newPrize)}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                +{formatPrize(prizeIncrease)} earned
              </p>
            </div>
          </div>
        </div>

        {/* Progress Info */}
        <div className="text-center space-y-2 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm font-medium">
            {isFinalQuestion
              ? 'Congratulations! Team has completed all questions!'
              : `Question ${questionNumber} of ${totalQuestions} Complete`}
          </p>
          {!isFinalQuestion && (
            <p className="text-xs text-muted-foreground">
              {totalQuestions - questionNumber} questions remaining
            </p>
          )}
        </div>

        {/* Next Question Button */}
        {!isFinalQuestion && (
          <Button
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={onNextQuestion}>
            <ArrowRight className="w-5 h-5 mr-2" />
            Load Next Question
          </Button>
        )}

        {/* Final Question - Next Team Button */}
        {isFinalQuestion && (
          <Button
            size="lg"
            className="w-full bg-primary hover:bg-primary/90"
            onClick={onNextQuestion}>
            <ArrowRight className="w-5 h-5 mr-2" />
            Complete Team & Move to Next Team
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
