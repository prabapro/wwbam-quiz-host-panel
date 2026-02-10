// src/components/game/PlayQueueDisplay.jsx

import { ScrollArea } from '@components/ui/scroll-area';
import { Badge } from '@components/ui/badge';
import { Users, FileJson, ArrowRight } from 'lucide-react';

/**
 * Play Queue Display Component
 * Reusable component for showing team play order with question set assignments
 * Used in InitializeGameModal and GameControlPanel
 */
export default function PlayQueueDisplay({
  playQueuePreview,
  currentTeamId = null,
  maxHeight = '400px',
  showHeader = true,
}) {
  if (!playQueuePreview || playQueuePreview.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No play queue generated yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showHeader && (
        <div className="flex items-center justify-between pb-2 border-b">
          <h3 className="text-sm font-semibold">Play Order</h3>
          <Badge variant="outline">{playQueuePreview.length} Teams</Badge>
        </div>
      )}

      <ScrollArea style={{ maxHeight }} className="pr-4">
        <div className="space-y-2">
          {playQueuePreview.map((item) => {
            const isCurrentTeam = item.teamId === currentTeamId;

            return (
              <div
                key={item.teamId}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border
                  transition-colors duration-200
                  ${
                    isCurrentTeam
                      ? 'bg-primary/10 border-primary/50 shadow-sm'
                      : 'bg-muted/30 border-muted hover:bg-muted/50'
                  }
                `}>
                {/* Position Number */}
                <div
                  className={`
                  flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm flex-shrink-0
                  ${
                    isCurrentTeam
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted-foreground/20 text-muted-foreground'
                  }
                `}>
                  {item.position}
                </div>

                {/* Team Info */}
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Users className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.teamName}</p>
                    {item.teamParticipants && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.teamParticipants}
                      </p>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                {/* Question Set Info */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileJson className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">
                    {item.questionSetName}
                  </span>
                </div>

                {/* Current Team Badge */}
                {isCurrentTeam && (
                  <Badge className="bg-primary hover:bg-primary flex-shrink-0">
                    Playing
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
