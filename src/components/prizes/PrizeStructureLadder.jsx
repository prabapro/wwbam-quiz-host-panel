// src/components/prizes/PrizeStructureLadder.jsx

import { usePrizeStore } from '@stores/usePrizeStore';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { formatPrize, MILESTONE_QUESTIONS } from '@constants/prizeStructure';
import { Award } from 'lucide-react';

export default function PrizeStructureLadder() {
  const editedPrizeStructure = usePrizeStore(
    (state) => state.editedPrizeStructure,
  );
  const updatePrizeValue = usePrizeStore((state) => state.updatePrizeValue);

  const handlePrizeChange = (index, value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      updatePrizeValue(index, numValue);
    }
  };

  // Determine if a question is a milestone
  const isMilestone = (questionNumber) => {
    return MILESTONE_QUESTIONS.includes(questionNumber);
  };

  return (
    <div className="space-y-2">
      {/* Render in reverse order (highest prize at top) */}
      {[...editedPrizeStructure]
        .map((prize, index) => ({
          prize,
          originalIndex: index,
          questionNumber: index + 1,
        }))
        .reverse()
        .map(({ prize, originalIndex, questionNumber }) => {
          const milestone = isMilestone(questionNumber);

          return (
            <div
              key={originalIndex}
              className={`
                flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                ${
                  milestone
                    ? 'bg-amber-50 border-amber-300 dark:bg-amber-950 dark:border-amber-800'
                    : 'bg-muted/30 border-border'
                }
              `}>
              {/* Question Number */}
              <div className="flex items-center gap-2 min-w-[100px]">
                <Badge
                  variant={milestone ? 'default' : 'secondary'}
                  className={
                    milestone
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-muted-foreground/20'
                  }>
                  Q{questionNumber}
                </Badge>
                {milestone && <Award className="w-4 h-4 text-amber-600" />}
              </div>

              {/* Prize Input */}
              <div className="flex-1">
                <Input
                  type="number"
                  value={prize}
                  onChange={(e) =>
                    handlePrizeChange(originalIndex, e.target.value)
                  }
                  className="font-mono text-right"
                  min="0"
                  step="100"
                />
              </div>

              {/* Formatted Display */}
              <div className="min-w-[120px] text-right">
                <span
                  className={`text-lg font-bold ${milestone ? 'text-amber-700 dark:text-amber-300' : ''}`}>
                  {formatPrize(prize)}
                </span>
              </div>
            </div>
          );
        })}

      {/* Legend */}
      <div className="pt-4 border-t">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Milestone Questions</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-muted-foreground/20">
              Q
            </Badge>
            <span>Regular Questions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
