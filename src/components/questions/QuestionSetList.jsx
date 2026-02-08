// src/components/questions/QuestionSetList.jsx

import QuestionSetCard from './QuestionSetCard';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { FileJson } from 'lucide-react';

export default function QuestionSetList({
  questionSets,
  isLoading,
  onDelete,
  onRefresh,
}) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading question sets..." />
      </div>
    );
  }

  // Empty state
  if (!questionSets || questionSets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileJson className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Question Sets</h3>
        <p className="text-muted-foreground mb-4">
          Upload your first question set to get started
        </p>
      </div>
    );
  }

  // Grid of question sets
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Uploaded Question Sets ({questionSets.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {questionSets.map((set) => (
          <QuestionSetCard
            key={set.setId}
            questionSet={set}
            onDelete={onDelete}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
}
