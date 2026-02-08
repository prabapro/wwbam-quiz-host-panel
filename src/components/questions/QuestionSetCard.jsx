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
import QuestionSetViewer from './QuestionSetViewer';
import { FileJson, Trash2, Eye, Calendar, AlertTriangle } from 'lucide-react';

// eslint-disable-next-line no-unused-vars
export default function QuestionSetCard({ questionSet, onDelete, onRefresh }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    setShowDeleteConfirm(false);

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
    <>
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
                <dd className="text-xs">
                  {formatDate(questionSet.uploadedAt)}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setShowViewer(true)}>
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isDeleting}
            onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Question Set Viewer Modal */}
      <QuestionSetViewer
        setId={questionSet.setId}
        open={showViewer}
        onOpenChange={setShowViewer}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Question Set?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{questionSet.setName}"?
              <br />
              <br />
              This action cannot be undone. The question set will be permanently
              removed from your browser's storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
