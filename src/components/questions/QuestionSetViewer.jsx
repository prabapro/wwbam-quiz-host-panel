// src/components/questions/QuestionSetViewer.jsx

import { useState, useEffect } from 'react';
import { databaseService } from '@services/database.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { ScrollArea } from '@components/ui/scroll-area';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { ChevronLeft, ChevronRight, CheckCircle2, Award } from 'lucide-react';

export default function QuestionSetViewer({ setId, open, onOpenChange }) {
  const [questionSet, setQuestionSet] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Moved loadQuestionSet inline to satisfy react-hooks/exhaustive-deps.
  // The function only uses setId (already in the dep array) and local setters.
  useEffect(() => {
    if (!open || !setId) return;

    const loadQuestionSet = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const set = await databaseService.getQuestionSet(setId);

        if (set) {
          setQuestionSet(set);
          setCurrentIndex(0);
        } else {
          setError('Question set not found');
        }
      } catch (err) {
        console.error('Failed to load question set:', err);
        setError('Failed to load question set from Firebase');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestionSet();
  }, [open, setId]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (questionSet && currentIndex < questionSet.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleQuestionSelect = (index) => {
    setCurrentIndex(index);
  };

  if (!questionSet && !isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Question Set Not Found</DialogTitle>
            <DialogDescription>
              {error ||
                'Unable to load the question set. It may have been deleted.'}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = questionSet?.questions[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{questionSet?.setName}</DialogTitle>
          <DialogDescription>
            Viewing{' '}
            {questionSet?.totalQuestions || questionSet?.questions?.length}{' '}
            questions • Set ID: {questionSet?.setId}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" text="Loading questions..." />
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            {/* Question Navigation Sidebar + Content */}
            <div className="flex gap-4 flex-1 min-h-0">
              {/* Question Number List */}
              <ScrollArea className="w-20 shrink-0 border rounded-lg">
                <div className="p-2 space-y-1">
                  {questionSet?.questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuestionSelect(index)}
                      className={`w-full text-xs py-1.5 px-2 rounded text-center transition-colors ${
                        index === currentIndex
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'hover:bg-muted text-muted-foreground'
                      }`}>
                      {index + 1}
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {/* Question Content */}
              <ScrollArea className="flex-1">
                {currentQuestion && (
                  <div className="space-y-4 pr-2">
                    {/* Question Header */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Question {currentIndex + 1}
                      </Badge>
                      <Badge variant="secondary" className="font-mono text-xs">
                        ID: {currentQuestion.id}
                      </Badge>
                    </div>

                    {/* Question Text */}
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="font-medium text-base leading-relaxed">
                        {currentQuestion.text}
                      </p>
                    </div>

                    {/* Options */}
                    <div className="space-y-2">
                      {['a', 'b', 'c', 'd'].map((option) => {
                        const isCorrect =
                          currentQuestion.correctAnswer?.toLowerCase() ===
                          option;
                        const optionText =
                          typeof currentQuestion.options === 'object'
                            ? currentQuestion.options[option]
                            : null;

                        if (!optionText) return null;

                        return (
                          <div
                            key={option}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                              isCorrect
                                ? 'bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700'
                                : 'bg-background border-border'
                            }`}>
                            <span
                              className={`font-bold uppercase w-6 text-center shrink-0 ${
                                isCorrect
                                  ? 'text-green-600'
                                  : 'text-muted-foreground'
                              }`}>
                              {option}
                            </span>
                            <span className="text-sm flex-1">{optionText}</span>
                            {isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Correct Answer */}
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <Award className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Correct Answer:{' '}
                        <span className="uppercase font-bold">
                          {currentQuestion.correctAnswer}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between pt-2 border-t shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentIndex === 0}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {questionSet?.questions.length}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={
                  !questionSet ||
                  currentIndex === questionSet.questions.length - 1
                }>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
