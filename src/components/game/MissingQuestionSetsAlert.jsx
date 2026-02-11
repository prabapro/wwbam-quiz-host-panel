// src/components/game/MissingQuestionSetsAlert.jsx

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { ScrollArea } from '@components/ui/scroll-area';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Upload,
  ArrowRight,
} from 'lucide-react';

/**
 * Missing Question Sets Alert Component
 * Shown when game is initialized on a new browser/machine but required question sets
 * are missing from localStorage. Guides user to upload the specific required sets.
 *
 * @param {Object} props
 * @param {Object} props.requiredQuestionSetsValidation - Validation result from hook
 * @param {Function} props.onContinue - Callback when all sets are found and user clicks continue
 */
export default function MissingQuestionSetsAlert({
  requiredQuestionSetsValidation,
  onContinue,
}) {
  const navigate = useNavigate();

  const {
    allFound,
    requiredSetIds,
    missingSetIds,
    foundSetIds,
    missingCount,
    foundCount,
  } = requiredQuestionSetsValidation;

  /**
   * Handle navigate to question management page
   */
  const handleUploadQuestions = () => {
    navigate('/questions');
  };

  /**
   * Get status icon for each set ID
   */
  const getSetStatusIcon = (setId) => {
    if (foundSetIds.includes(setId)) {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  /**
   * Get status badge variant
   */
  const getSetStatusBadge = (setId) => {
    if (foundSetIds.includes(setId)) {
      return (
        <Badge className="bg-green-600 text-white hover:bg-green-700">
          Found
        </Badge>
      );
    }
    return <Badge variant="destructive">Missing</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              Game Initialized - Question Sets Required
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              This game has been initialized on another browser. Please upload
              the required question sets to continue.
            </p>
          </div>

          {/* Overall Status Badge */}
          {allFound ? (
            <Badge className="bg-green-600 text-white hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              All Sets Found
            </Badge>
          ) : (
            <Badge
              variant="destructive"
              className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              <AlertTriangle className="w-4 h-4 mr-1" />
              {missingCount} Missing
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Explanation Alert */}
        <Alert
          variant="default"
          className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertTitle className="text-orange-800 dark:text-orange-200">
            Why am I seeing this?
          </AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            The game was initialized on a different browser or device. Question
            sets are stored locally in each browser, so you need to upload them
            here to access the initialized game state.
          </AlertDescription>
        </Alert>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold">{requiredSetIds.length}</p>
              <p className="text-sm text-muted-foreground">Required Sets</p>
            </div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {foundCount}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Found
              </p>
            </div>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {missingCount}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">Missing</p>
            </div>
          </div>
        </div>

        {/* Required Question Sets List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b">
            <h3 className="text-sm font-semibold">Required Question Set IDs</h3>
            <Badge variant="outline">{requiredSetIds.length} Total</Badge>
          </div>

          <ScrollArea className="max-h-[300px] pr-4">
            <div className="space-y-2">
              {requiredSetIds.map((setId) => {
                const isFound = foundSetIds.includes(setId);

                return (
                  <div
                    key={setId}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border
                      ${
                        isFound
                          ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                          : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                      }
                    `}>
                    {/* Status Icon + Set ID */}
                    <div className="flex items-center gap-3 flex-1">
                      {getSetStatusIcon(setId)}
                      <div>
                        <p className="font-mono text-sm font-medium">{setId}</p>
                        <p className="text-xs text-muted-foreground">
                          {isFound
                            ? 'Available in localStorage'
                            : 'Not found in localStorage'}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {getSetStatusBadge(setId)}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Action Instructions */}
        <Alert>
          <Upload className="h-4 w-4" />
          <AlertTitle>Next Steps</AlertTitle>
          <AlertDescription>
            {allFound ? (
              <span>
                ✓ All required question sets are now available. You can continue
                to the game control panel.
              </span>
            ) : (
              <>
                Upload the missing question set files (
                <span className="font-mono font-semibold">
                  {missingSetIds.join(', ')}
                </span>
                ) to the Question Management page. Make sure the set IDs in your
                uploaded files match exactly.
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!allFound && (
            <Button
              className="flex-1"
              size="lg"
              onClick={handleUploadQuestions}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Question Sets
            </Button>
          )}

          {allFound && (
            <Button
              className="flex-1"
              size="lg"
              onClick={onContinue}
              disabled={!allFound}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Continue to Game Control Panel
            </Button>
          )}
        </div>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground text-center">
          {allFound
            ? 'All required question sets have been found. The game is ready to continue.'
            : 'The component will update automatically as you upload the required question sets.'}
        </p>
      </CardContent>
    </Card>
  );
}
