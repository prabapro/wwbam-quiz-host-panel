// src/components/play/WrongAnswerDialog.jsx

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Alert, AlertDescription } from '@components/ui/alert';
import { XCircle, AlertTriangle, Phone, Scissors } from 'lucide-react';
import { LIFELINE_META } from '@constants/teamStates';
import { formatPrize } from '@constants/prizeStructure';

/**
 * Wrong Answer Dialog Component
 * Shown when team answers incorrectly
 * Offers choice: Use Lifeline or Eliminate Team
 */
export default function WrongAnswerDialog({
  open = false,
  teamName = '',
  selectedAnswer = null,
  correctAnswer = null,
  availableLifelines = [],
  currentPrize = 0,
  hasLifelines = false,
  onOfferLifeline,
  onEliminateTeam,
  onClose,
}) {
  /**
   * Get lifeline icon
   */
  const getLifelineIcon = (lifelineType) => {
    if (lifelineType === 'phone-a-friend') {
      return <Phone className="w-5 h-5" />;
    }
    if (lifelineType === 'fifty-fifty') {
      return <Scissors className="w-5 h-5" />;
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-100 dark:bg-red-900 rounded-full">
              <XCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <DialogTitle className="text-center text-2xl text-red-700 dark:text-red-400">
            ❌ Incorrect Answer
          </DialogTitle>

          <DialogDescription className="text-center text-base">
            {teamName} selected the wrong answer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Answer Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Selected Answer (Wrong) */}
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border-2 border-red-300 dark:border-red-700">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Selected Answer
                </p>
                <Badge
                  variant="destructive"
                  className="text-3xl px-6 py-2 bg-red-600">
                  {selectedAnswer}
                </Badge>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Incorrect
                </p>
              </div>
            </div>

            {/* Correct Answer */}
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-300 dark:border-green-700">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Correct Answer
                </p>
                <Badge className="text-3xl px-6 py-2 bg-green-600">
                  {correctAnswer}
                </Badge>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Should have been
                </p>
              </div>
            </div>
          </div>

          {/* Current Prize at Risk */}
          <Alert className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <div className="flex items-center justify-between">
                <span className="font-medium">Prize at Risk:</span>
                <span className="text-xl font-bold">
                  {formatPrize(currentPrize)}
                </span>
              </div>
            </AlertDescription>
          </Alert>

          {/* Lifelines Available Section */}
          {hasLifelines ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-center">
                Available Lifelines - Give Team a Second Chance?
              </h3>

              <div className="grid grid-cols-1 gap-2">
                {availableLifelines.map((lifelineType) => {
                  const meta = LIFELINE_META[lifelineType];

                  return (
                    <div
                      key={lifelineType}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                      <div className="p-2 bg-primary/10 rounded-full">
                        {getLifelineIcon(lifelineType)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{meta.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {meta.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        Available
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                No lifelines remaining. Team must be eliminated.
              </AlertDescription>
            </Alert>
          )}

          {/* Decision Prompt */}
          <div className="p-4 bg-muted/50 rounded-lg border-2">
            <p className="text-center font-medium">
              {hasLifelines
                ? 'Host Decision: Offer a lifeline or eliminate team?'
                : 'Team will be eliminated with current prize locked.'}
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {hasLifelines ? (
            <>
              {/* Eliminate Team Button */}
              <Button
                variant="destructive"
                className="flex-1"
                onClick={onEliminateTeam}>
                <XCircle className="w-4 h-4 mr-2" />
                Eliminate Team
              </Button>

              {/* Offer Lifeline Button */}
              <Button className="flex-1" onClick={onOfferLifeline}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Offer Lifeline
              </Button>
            </>
          ) : (
            <Button
              variant="destructive"
              className="w-full"
              onClick={onEliminateTeam}>
              <XCircle className="w-4 h-4 mr-2" />
              Eliminate Team ({formatPrize(currentPrize)} Locked)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
