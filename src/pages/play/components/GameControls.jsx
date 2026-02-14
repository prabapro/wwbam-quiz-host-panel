// src/pages/play/components/GameControls.jsx

import { useGameControls } from '../hooks/useGameControls';
import { Button } from '@components/ui/button';
import { Alert, AlertDescription } from '@components/ui/alert';
import {
  FileText,
  Eye,
  EyeOff,
  Users,
  SkipForward,
  Pause,
  Play,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@lib/utils';

/**
 * Game Controls Component
 *
 * Purpose: Main control buttons for managing question flow and game progression
 *
 * Control Buttons (Stacked full-width for narrow column):
 * 1. "Load Question X" - Fetch next question from localStorage (dynamic label)
 * 2. "Show Question" - Push question to Firebase (visible to public)
 * 3. "Hide Question" - Retract question from public view
 * 4. "Next Team" - Move to next team in queue (after elimination/completion)
 * 5. "Skip Question" - Skip current question (error handling)
 * 6. "Pause Game" - Pause game state
 * 7. "Resume Game" - Resume from pause
 *
 * Flow:
 * Load Q1 → Show → Answer & Lock → Load Q2 → Show → Answer & Lock → ...
 */
export default function GameControls() {
  // Game Controls Hook
  const {
    canLoadQuestion,
    canShowQuestion,
    canHideQuestion,
    canNextTeam,
    canSkipQuestion,
    canPause,
    canResume,
    nextQuestionNumber,
    isLoading,
    error,
    handleLoadQuestion,
    handleShowQuestion,
    handleHideQuestion,
    handleNextTeam,
    handleSkipQuestion,
    handlePause,
    handleResume,
  } = useGameControls();

  return (
    <div className="space-y-3">
      {/* Primary Controls - Stacked Full Width */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Question Controls
        </p>

        {/* Load Question - Dynamic Label - Full Width */}
        <Button
          onClick={handleLoadQuestion}
          disabled={!canLoadQuestion || isLoading}
          variant="default"
          size="lg"
          className={cn(
            'w-full gap-2 transition-all',
            canLoadQuestion && 'ring-2 ring-blue-500 animate-pulse',
          )}>
          <FileText className="w-4 h-4" />
          {isLoading ? 'Loading...' : `Load Question ${nextQuestionNumber}`}
        </Button>

        {/* Show Question - Full Width */}
        <Button
          onClick={handleShowQuestion}
          disabled={!canShowQuestion || isLoading}
          variant="outline"
          size="lg"
          className={cn(
            'w-full gap-2 transition-all',
            canShowQuestion && 'ring-2 ring-green-500/50',
          )}>
          <Eye className="w-4 h-4" />
          {isLoading ? 'Showing...' : 'Show Question'}
        </Button>

        {/* Hide Question - Full Width */}
        <Button
          onClick={handleHideQuestion}
          disabled={!canHideQuestion || isLoading}
          variant="outline"
          size="lg"
          className="w-full gap-2">
          <EyeOff className="w-4 h-4" />
          Hide Question
        </Button>
      </div>

      {/* Navigation Controls - Stacked Full Width */}
      <div className="space-y-2 pt-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Team Navigation
        </p>

        {/* Next Team - Full Width */}
        <Button
          onClick={handleNextTeam}
          disabled={!canNextTeam || isLoading}
          variant={canNextTeam ? 'default' : 'outline'}
          size="lg"
          className={cn(
            'w-full gap-2 transition-all',
            canNextTeam && 'animate-pulse ring-2 ring-blue-500',
          )}>
          <Users className="w-4 h-4" />
          Next Team
        </Button>

        {/* Skip Question - Full Width */}
        <Button
          onClick={handleSkipQuestion}
          disabled={!canSkipQuestion || isLoading}
          variant="ghost"
          size="sm"
          className="w-full gap-2 text-muted-foreground">
          <SkipForward className="w-4 h-4" />
          Skip Question
        </Button>
      </div>

      {/* Game State Controls - Stacked Full Width */}
      <div className="space-y-2 pt-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Game State
        </p>

        {/* Pause - Full Width */}
        <Button
          onClick={handlePause}
          disabled={!canPause || isLoading}
          variant="outline"
          size="sm"
          className="w-full gap-2">
          <Pause className="w-4 h-4" />
          Pause
        </Button>

        {/* Resume - Full Width */}
        <Button
          onClick={handleResume}
          disabled={!canResume || isLoading}
          variant="outline"
          size="sm"
          className="w-full gap-2">
          <Play className="w-4 h-4" />
          Resume
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mt-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Helpful Hints */}
      <div className="p-3 bg-muted/50 rounded-lg border border-dashed mt-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>💡 Flow:</strong>
          <br />
          Load → Show → Lock Answer → Next
        </p>
      </div>
    </div>
  );
}
