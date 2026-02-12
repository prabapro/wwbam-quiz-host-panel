// src/components/play/QuestionControlPanel.jsx

import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Alert, AlertDescription } from '@components/ui/alert';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { FileText, Eye, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * Question Control Panel Component
 * Main control interface for question flow during gameplay
 * Contains Load Question, Show Question, Lock Answer buttons
 */
export default function QuestionControlPanel({
  // Question state
  questionLoaded = false,
  questionVisible = false,
  answerSelected = false,
  answerLocked = false,
  answerValidated = false,

  // Question data
  currentQuestion = null,
  selectedAnswer = null,

  // Loading state
  isLoading = false,

  // Action handlers
  onLoadQuestion,
  onShowQuestion,
  onLockAnswer,

  // Disabled states
  canLoadQuestion = true,
  canShowQuestion = false,
  canLockAnswer = false,
}) {
  /**
   * Get current action state label
   */
  const getStateLabel = () => {
    if (answerValidated) {
      return 'Answer Validated';
    }
    if (answerLocked) {
      return 'Answer Locked';
    }
    if (answerSelected) {
      return 'Answer Selected';
    }
    if (questionVisible) {
      return 'Question Visible to Public';
    }
    if (questionLoaded) {
      return 'Question Loaded (Host Only)';
    }
    return 'Ready to Load Question';
  };

  /**
   * Get state badge variant
   */
  const getStateBadgeVariant = () => {
    if (answerValidated) {
      return 'default';
    }
    if (answerLocked || answerSelected) {
      return 'secondary';
    }
    if (questionVisible || questionLoaded) {
      return 'outline';
    }
    return 'outline';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Question Controls</CardTitle>
          <Badge variant={getStateBadgeVariant()}>{getStateLabel()}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Loading State */}
        {isLoading && (
          <Alert>
            <LoadingSpinner size="sm" className="mr-2" />
            <AlertDescription>Processing...</AlertDescription>
          </Alert>
        )}

        {/* Current Question Summary */}
        {currentQuestion && (
          <div className="p-3 bg-muted/30 rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">
              Current Question:
            </p>
            <p className="text-sm font-medium line-clamp-2">
              Q{currentQuestion.number}: {currentQuestion.text}
            </p>
          </div>
        )}

        {/* Selected Answer Display */}
        {answerSelected && selectedAnswer && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Selected Answer:
              </span>
              <Badge className="bg-yellow-500 text-white text-lg px-3">
                {selectedAnswer}
              </Badge>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Load Question Button */}
          <Button
            className="w-full"
            size="lg"
            variant={questionLoaded ? 'outline' : 'default'}
            onClick={onLoadQuestion}
            disabled={!canLoadQuestion || questionLoaded || isLoading}>
            <FileText className="w-4 h-4 mr-2" />
            {questionLoaded ? 'Question Loaded' : 'Load Question'}
          </Button>

          {/* Show Question Button */}
          <Button
            className="w-full"
            size="lg"
            variant={questionVisible ? 'outline' : 'default'}
            onClick={onShowQuestion}
            disabled={!canShowQuestion || questionVisible || isLoading}>
            <Eye className="w-4 h-4 mr-2" />
            {questionVisible ? 'Question Visible' : 'Show Question to Public'}
          </Button>

          {/* Lock Answer Button */}
          <Button
            className="w-full"
            size="lg"
            variant={answerLocked ? 'outline' : 'default'}
            onClick={onLockAnswer}
            disabled={!canLockAnswer || answerLocked || isLoading}>
            {answerLocked ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Answer Locked
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Lock Answer
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div className="space-y-2 text-xs text-muted-foreground">
          {!questionLoaded && canLoadQuestion && (
            <Alert>
              <AlertTriangle className="h-3 w-3" />
              <AlertDescription className="text-xs">
                Step 1: Click "Load Question" to preview the question and
                correct answer (host only)
              </AlertDescription>
            </Alert>
          )}

          {questionLoaded && !questionVisible && (
            <Alert>
              <AlertTriangle className="h-3 w-3" />
              <AlertDescription className="text-xs">
                Step 2: Click "Show Question to Public" to display the question
                on the public screen (without correct answer)
              </AlertDescription>
            </Alert>
          )}

          {questionVisible && !answerSelected && (
            <Alert>
              <AlertTriangle className="h-3 w-3" />
              <AlertDescription className="text-xs">
                Step 3: Select team's answer using the Answer Pad below
              </AlertDescription>
            </Alert>
          )}

          {answerSelected && !answerLocked && (
            <Alert>
              <AlertTriangle className="h-3 w-3" />
              <AlertDescription className="text-xs">
                Step 4: Click "Lock Answer" to validate and reveal the result
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
