// src/components/prizes/PrizeStructureTable.jsx

import { usePrizeStore } from '@stores/usePrizeStore';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { formatPrize, MILESTONE_QUESTIONS } from '@constants/prizeStructure';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { Award } from 'lucide-react';

export default function PrizeStructureTable() {
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Question</TableHead>
            <TableHead>Prize Amount (Rs.)</TableHead>
            <TableHead className="text-right">Formatted</TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {editedPrizeStructure.map((prize, index) => {
            const questionNumber = index + 1;
            const milestone = isMilestone(questionNumber);

            return (
              <TableRow
                key={index}
                className={
                  milestone
                    ? 'bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900'
                    : ''
                }>
                <TableCell className="font-medium">
                  <Badge
                    variant={milestone ? 'default' : 'secondary'}
                    className={
                      milestone
                        ? 'bg-amber-500 hover:bg-amber-600'
                        : 'bg-muted-foreground/20'
                    }>
                    Q{questionNumber}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={prize}
                    onChange={(e) => handlePrizeChange(index, e.target.value)}
                    className="max-w-[200px] font-mono"
                    min="0"
                    step="100"
                  />
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatPrize(prize)}
                </TableCell>
                <TableCell>
                  {milestone && (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Award className="w-4 h-4" />
                      <span className="text-xs">Milestone</span>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
