// src/components/setup/SetupVerification.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetupVerification } from '@hooks/useSetupVerification';
import { loadSampleData } from '@utils/sampleDataLoader';
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
  DollarSign,
  ArrowRight,
  Sparkles,
  Loader2,
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

/**
 * Check Item Component
 */
const CheckItem = ({ check }) => (
  <div
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
        <p className="text-xs text-muted-foreground">{check.message}</p>
      </div>
    </div>

    <Badge
      variant={getStatusBadgeVariant(check.status)}
      className={`capitalize ${
        check.status === 'pass'
          ? 'bg-green-600 text-white hover:bg-green-700'
          : ''
      }`}>
      {check.status}
    </Badge>
  </div>
);

/**
 * Check Group Component
 */
const CheckGroup = ({ title, icon: Icon, checks, onConfigure }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      </div>
      <Button variant="secondary" size="sm" onClick={onConfigure}>
        Configure
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
    <div className="space-y-2">
      {checks.map((check) => (
        <CheckItem key={check.id} check={check} />
      ))}
    </div>
  </div>
);

export default function SetupVerification({ refreshKey = 0, onRefresh }) {
  const navigate = useNavigate();

  // Use refreshKey from parent (managed in Home.jsx)
  const { isReady, hasWarnings, checks, summary } =
    useSetupVerification(refreshKey);

  // Sample data loading state
  const [isLoadingSampleData, setIsLoadingSampleData] = useState(false);
  const [sampleDataProgress, setSampleDataProgress] = useState('');
  const [sampleDataSuccess, setSampleDataSuccess] = useState(false);
  const [sampleDataError, setSampleDataError] = useState(null);

  // Group checks by category
  const teamsChecks = checks.filter((c) => c.group === 'teams');
  const questionsChecks = checks.filter((c) => c.group === 'questions');
  const prizesChecks = checks.filter((c) => c.group === 'prizes');

  /**
   * Handle sample data loading
   */
  const handleLoadSampleData = async () => {
    setIsLoadingSampleData(true);
    setSampleDataProgress('Starting...');
    setSampleDataError(null);
    setSampleDataSuccess(false);

    try {
      const result = await loadSampleData((progress) => {
        setSampleDataProgress(progress);
      });

      if (result.success) {
        setSampleDataSuccess(true);
        setSampleDataProgress(
          `Loaded ${result.teams.count} teams and ${result.questionSets.count} question sets`,
        );

        // Call parent's refresh callback to trigger re-validation
        if (onRefresh) {
          onRefresh();
        }

        // Clear success message after 5 seconds
        setTimeout(() => {
          setSampleDataSuccess(false);
          setSampleDataProgress('');
        }, 5000);
      } else {
        setSampleDataError(result.error || 'Failed to load sample data');
      }
    } catch (error) {
      console.error('Error loading sample data:', error);
      setSampleDataError(error.message || 'Unexpected error occurred');
    } finally {
      setIsLoadingSampleData(false);
    }
  };

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

          {/* Small Status Badge in Top Right Corner */}
          {isReady && (
            <Badge className="bg-green-600 text-white hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Ready to Initialize
            </Badge>
          )}

          {!isReady && hasWarnings && (
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
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
        {/* Summary Stats - Right after header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.teams}</p>
                <p className="text-sm text-muted-foreground">Teams</p>
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
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.prizeLevels}</p>
                <p className="text-sm text-muted-foreground">Prize Levels</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
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

        {/* Sample Data Success Alert */}
        {sampleDataSuccess && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-200">
              Sample Data Loaded!
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              {sampleDataProgress}
            </AlertDescription>
          </Alert>
        )}

        {/* Sample Data Error Alert */}
        {sampleDataError && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Failed to Load Sample Data</AlertTitle>
            <AlertDescription>{sampleDataError}</AlertDescription>
          </Alert>
        )}

        {/* Setup Incomplete Alert with Sample Data Button */}
        {!isReady && summary.criticalIssues > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Setup Incomplete</AlertTitle>
            <AlertDescription>
              <div className="space-y-3">
                <p>
                  Please resolve {summary.criticalIssues} critical issue
                  {summary.criticalIssues > 1 ? 's' : ''} before initializing
                  the game.
                </p>

                {/* Sample Data Loading Progress */}
                {isLoadingSampleData && (
                  <div className="p-3 bg-destructive/10 rounded-md">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-medium">
                        {sampleDataProgress}
                      </span>
                    </div>
                  </div>
                )}

                {/* Sample Data Button */}
                {!isLoadingSampleData && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadSampleData}
                    className="bg-background hover:bg-muted">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Test with sample data
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings Alert */}
        {!isReady && hasWarnings && summary.criticalIssues === 0 && (
          <Alert
            variant="default"
            className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-200">
              Warnings Detected
            </AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-300">
              There are {summary.warnings} warning
              {summary.warnings > 1 ? 's' : ''}. Review them before proceeding.
            </AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {isReady && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-200">
              All Checks Passed!
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              Your setup is complete and ready. You can now proceed to
              initialize the game.
            </AlertDescription>
          </Alert>
        )}

        {/* Grouped Validation Checks */}
        <div className="space-y-6">
          {/* Teams Group */}
          <CheckGroup
            title="Teams"
            icon={Users}
            checks={teamsChecks}
            onConfigure={() => navigate('/teams')}
          />

          {/* Questions Group */}
          <CheckGroup
            title="Question Sets"
            icon={FileJson}
            checks={questionsChecks}
            onConfigure={() => navigate('/questions')}
          />

          {/* Prizes Group */}
          <CheckGroup
            title="Prize Structure"
            icon={DollarSign}
            checks={prizesChecks}
            onConfigure={() => navigate('/prizes')}
          />
        </div>
      </CardContent>
    </Card>
  );
}
