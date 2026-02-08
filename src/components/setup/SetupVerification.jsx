// src/components/setup/SetupVerification.jsx

import { useNavigate } from 'react-router-dom';
import { useSetupVerification } from '@hooks/useSetupVerification';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Users,
  FileJson,
  ArrowRight,
} from 'lucide-react';

/**
 * Get status icon component
 */
const getStatusIcon = (status) => {
  const iconClass = 'w-5 h-5';

  switch (status) {
    case 'pass':
      return <CheckCircle2 className={`${iconClass} text-green-600`} />;
    case 'fail':
      return <XCircle className={`${iconClass} text-red-600`} />;
    case 'warning':
      return <AlertTriangle className={`${iconClass} text-yellow-600`} />;
    case 'info':
      return <Info className={`${iconClass} text-blue-600`} />;
    default:
      return <Info className={`${iconClass} text-gray-600`} />;
  }
};

/**
 * Get status badge variant
 */
const getStatusBadgeVariant = (status) => {
  switch (status) {
    case 'pass':
      return 'default';
    case 'fail':
      return 'destructive';
    case 'warning':
      return 'secondary';
    default:
      return 'outline';
  }
};

export default function SetupVerification() {
  const navigate = useNavigate();
  const { isReady, hasWarnings, checks, summary } = useSetupVerification();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl mb-2">Setup Verification</CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete all checks before initializing the game
            </p>
          </div>

          {/* Ready Badge */}
          {isReady && (
            <Badge className="bg-green-600 text-white hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Ready to Initialize
            </Badge>
          )}

          {!isReady && hasWarnings && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Warnings
            </Badge>
          )}

          {!isReady && !hasWarnings && (
            <Badge variant="destructive">
              <XCircle className="w-4 h-4 mr-1" />
              Incomplete Setup
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.teams}</p>
                <p className="text-sm text-muted-foreground">Teams Configured</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileJson className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.questionSets}</p>
                <p className="text-sm text-muted-foreground">Question Sets</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                summary.criticalIssues === 0 
                  ? 'bg-green-100 dark:bg-green-900' 
                  : 'bg-red-100 dark:bg-red-900'
              }`}>
                {summary.criticalIssues === 0 ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.criticalIssues}</p>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Checks */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Validation Checks
          </h3>
          <div className="space-y-2">
            {checks.map((check) => (
              <div
                key={check.id}
                className={`
                  flex items-center justify-between p-3 rounded-lg border
                  ${
                    check.status === 'pass'
                      ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                      : check.status === 'fail'
                        ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                        : check.status === 'warning'
                          ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
                          : 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                  }
                `}>
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(check.status)}
                  <div>
                    <p className="font-medium text-sm">{check.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {check.message}
                    </p>
                  </div>
                </div>

                <Badge variant={getStatusBadgeVariant(check.status)} className="capitalize">
                  {check.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Action Alerts */}
        {!isReady && summary.criticalIssues > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Setup Incomplete</AlertTitle>
            <AlertDescription>
              Please resolve {summary.criticalIssues} critical issue
              {summary.criticalIssues > 1 ? 's' : ''} before initializing the
              game.
            </AlertDescription>
          </Alert>
        )}

        {isReady && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-200">
              All Checks Passed!
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              Your setup is complete and ready. You can now proceed to initialize
              the game.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Navigation Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/teams')}>
            <Users className="w-4 h-4 mr-2" />
            Manage Teams
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>

          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/questions')}>
            <FileJson className="w-4 h-4 mr-2" />
            Manage Questions
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
