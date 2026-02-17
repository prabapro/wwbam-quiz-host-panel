// src/components/prizes/PrizeStructureEditor.jsx

import { useState } from 'react';
import { usePrizeStore } from '@stores/usePrizeStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { useGameStore } from '@stores/useGameStore';
import PrizeStructureLadder from './PrizeStructureLadder';
import PrizeStructureTable from './PrizeStructureTable';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Alert, AlertDescription } from '@components/ui/alert';
import { Badge } from '@components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@components/ui/alert-dialog';
import {
  Save,
  RotateCcw,
  Download,
  Plus,
  Minus,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { formatPrize, getTotalPrizePool } from '@constants/prizeStructure';

export default function PrizeStructureEditor({ onSaveSuccess }) {
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showDefaultConfirm, setShowDefaultConfirm] = useState(false);
  const [activeView, setActiveView] = useState('ladder'); // 'ladder' or 'table'

  const editedPrizeStructure = usePrizeStore(
    (state) => state.editedPrizeStructure,
  );
  const hasUnsavedChanges = usePrizeStore((state) => state.hasUnsavedChanges);
  const isSyncing = usePrizeStore((state) => state.isSyncing);

  const savePrizeStructure = usePrizeStore((state) => state.savePrizeStructure);

  // Renamed from useDefaultStructure → applyDefaultStructure to avoid
  // violating React's rules-of-hooks (names starting with "use" are treated as hooks)
  const applyDefaultStructure = usePrizeStore(
    (state) => state.useDefaultStructure,
  );

  const discardChanges = usePrizeStore((state) => state.discardChanges);
  const addPrizeLevel = usePrizeStore((state) => state.addPrizeLevel);
  const removePrizeLevel = usePrizeStore((state) => state.removePrizeLevel);
  const validatePrizeStructure = usePrizeStore(
    (state) => state.validatePrizeStructure,
  );
  const getPrizeSummary = usePrizeStore((state) => state.getPrizeSummary);

  // Get team count for total prize pool calculation
  const teams = useTeamsStore((state) => state.teams);
  const teamCount = Object.keys(teams).length;

  const gameStatus = useGameStore((state) => state.gameStatus);
  const isGameActive = gameStatus === 'active' || gameStatus === 'initialized';

  const validation = validatePrizeStructure();
  const summary = getPrizeSummary();

  // Calculate total prize pool based on team count
  const totalPrizePool =
    teamCount > 0
      ? getTotalPrizePool(teamCount, editedPrizeStructure)
      : summary.maxPrizePerTeam;

  const handleSave = async () => {
    if (!validation.isValid) {
      return;
    }

    const result = await savePrizeStructure();

    if (result.success && onSaveSuccess) {
      onSaveSuccess();
    }
  };

  const handleUseDefault = () => {
    applyDefaultStructure();
    setShowDefaultConfirm(false);
  };

  const handleDiscardChanges = () => {
    discardChanges();
    setShowDiscardConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configure the prize structure for the competition. Changes will be
          saved to Firebase and synced to all displays. You can customize the
          number of questions and prize values.
        </AlertDescription>
      </Alert>

      {/* Active Game Warning */}
      {isGameActive && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Game is currently active.</strong> Changes to prize
            structure will take effect immediately. Use caution.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalQuestions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {teamCount > 0
                ? `Total Prize Pool (${teamCount} teams)`
                : 'Max Prize Per Team'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrize(totalPrizePool)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Prize
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatPrize(summary.maxPrize)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Starting Prize
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatPrize(summary.minPrize)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Validation Error */}
      {!validation.isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validation.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={activeView === 'ladder' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('ladder')}>
            Ladder View
          </Button>
          <Button
            variant={activeView === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('table')}>
            Table View
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Add / Remove Level */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => addPrizeLevel(0)}
            disabled={isGameActive}>
            <Plus className="w-4 h-4 mr-1" />
            Add Level
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => removePrizeLevel(editedPrizeStructure.length - 1)}
            disabled={isGameActive || editedPrizeStructure.length <= 1}>
            <Minus className="w-4 h-4 mr-1" />
            Remove Level
          </Button>

          {/* Use Default */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDefaultConfirm(true)}
            disabled={isGameActive}>
            <Download className="w-4 h-4 mr-1" />
            Use Default
          </Button>

          {/* Discard */}
          {hasUnsavedChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiscardConfirm(true)}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Discard
            </Button>
          )}

          {/* Save */}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || !validation.isValid || isSyncing}>
            <Save className="w-4 h-4 mr-1" />
            {isSyncing ? 'Saving...' : 'Save Changes'}
          </Button>

          {/* Unsaved indicator */}
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="text-xs">
              Unsaved
            </Badge>
          )}
        </div>
      </div>

      {/* Prize Structure View */}
      <Card>
        <CardContent className="pt-6">
          {activeView === 'ladder' ? (
            <PrizeStructureLadder />
          ) : (
            <PrizeStructureTable />
          )}
        </CardContent>
      </Card>

      {/* Discard Changes Confirmation */}
      <AlertDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to discard all unsaved changes? This will
              reset the prize structure to the last saved version from Firebase.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardChanges}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Use Default Confirmation */}
      <AlertDialog
        open={showDefaultConfirm}
        onOpenChange={setShowDefaultConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Use Default Prize Structure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current prize structure with the default
              20-level structure. Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUseDefault}>
              Use Default
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
