// src/components/prizes/PrizeStructureEditor.jsx

import { useState } from 'react';
import { usePrizeStore } from '@stores/usePrizeStore';
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
import { formatPrize } from '@constants/prizeStructure';

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
  const useDefaultStructure = usePrizeStore(
    (state) => state.useDefaultStructure,
  );
  const discardChanges = usePrizeStore((state) => state.discardChanges);
  const addPrizeLevel = usePrizeStore((state) => state.addPrizeLevel);
  const removePrizeLevel = usePrizeStore((state) => state.removePrizeLevel);
  const validatePrizeStructure = usePrizeStore(
    (state) => state.validatePrizeStructure,
  );
  const getPrizeSummary = usePrizeStore((state) => state.getPrizeSummary);

  const gameStatus = useGameStore((state) => state.gameStatus);
  const isGameActive = gameStatus === 'active' || gameStatus === 'initialized';

  const validation = validatePrizeStructure();
  const summary = getPrizeSummary();

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
    useDefaultStructure();
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
              Total Prize Pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatPrize(summary.totalPrizePool)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Minimum Prize
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatPrize(summary.minPrize)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Maximum Prize
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatPrize(summary.maxPrize)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Actions</CardTitle>
            {hasUnsavedChanges && (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800">
                Unsaved Changes
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || !validation.isValid || isSyncing}
              className="flex-1 sm:flex-none">
              <Save className="w-4 h-4 mr-2" />
              {isSyncing ? 'Saving...' : 'Save to Firebase'}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowDefaultConfirm(true)}
              disabled={isSyncing}>
              <Download className="w-4 h-4 mr-2" />
              Use Default
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowDiscardConfirm(true)}
              disabled={!hasUnsavedChanges || isSyncing}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Discard Changes
            </Button>

            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={addPrizeLevel}
                disabled={isSyncing}>
                <Plus className="w-4 h-4 mr-2" />
                Add Level
              </Button>

              <Button
                variant="outline"
                onClick={removePrizeLevel}
                disabled={editedPrizeStructure.length <= 1 || isSyncing}>
                <Minus className="w-4 h-4 mr-2" />
                Remove Level
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {!validation.isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Validation Errors:</strong>
            <ul className="mt-2 list-disc list-inside">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* View Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Prize Structure</CardTitle>
            <div className="flex gap-2">
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
          </div>
        </CardHeader>
        <CardContent>
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
