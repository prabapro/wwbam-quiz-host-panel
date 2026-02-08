// src/components/questions/QuestionSetCard.jsx

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { FileJson, Trash2, Eye, Calendar } from 'lucide-react';

export default function QuestionSetCard({ questionSet, onDelete, onRefresh }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    if (
      !window.confirm(
        `Delete question set "${questionSet.setName}"?\n\nThis action cannot be undone.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      onDelete(questionSet.setId);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileJson className="w-5 h-5 text-primary shrink-0" />
            <CardTitle className="text-base truncate">
              {questionSet.setName}
            </CardTitle>
          </div>
          <Badge variant="secondary" className="shrink-0">
            Ready
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Set ID:</dt>
            <dd className="font-mono text-xs">{questionSet.setId}</dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-muted-foreground">Questions:</dt>
            <dd className="font-semibold">{questionSet.totalQuestions}</dd>
          </div>

          {questionSet.uploadedAt && (
            <div className="flex justify-between items-center">
              <dt className="text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Uploaded:
              </dt>
              <dd className="text-xs">{formatDate(questionSet.uploadedAt)}</dd>
            </div>
          )}
        </dl>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" disabled>
          <Eye className="w-4 h-4 mr-2" />
          View
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={isDeleting}
          onClick={handleDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
