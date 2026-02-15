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

  useEffect(() => {
    if (open && setId) {
      loadQuestionSet();
    }
  }, [open, setId]);

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
            <LoadingSpinner text="Loading question set from Firebase..." />
          </div>
        ) : (
          <>
            {/* Question Navigator */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="text-sm text-muted-foreground">
                Question {currentIndex + 1} of {questionSet.questions.length}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNext}
                  disabled={currentIndex === questionSet.questions.length - 1}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Current Question Display */}
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {currentQuestion?.text}
                    </h3>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {currentQuestion?.difficulty && (
                      <Badge variant="secondary">
                        {currentQuestion.difficulty}
                      </Badge>
                    )}
                    {currentQuestion?.category && (
                      <Badge variant="outline">
                        {currentQuestion.category}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {['A', 'B', 'C', 'D'].map((option) => {
                    const isCorrect = currentQuestion?.correctAnswer === option;

                    return (
                      <div
                        key={option}
                        className={`
                          p-3 rounded-lg border-2 transition-colors
                          ${
                            isCorrect
                              ? 'border-green-500 bg-green-50 dark:bg-green-950'
                              : 'border-border bg-muted/30'
                          }
                        `}>
                        <div className="flex items-start gap-3">
                          <span className="font-bold text-sm shrink-0">
                            {option}.
                          </span>
                          <span className="flex-1">
                            {currentQuestion?.options?.[option]}
                          </span>
                          {isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Correct Answer Indicator */}
                <div className="p-4 bg-green-50 dark:bg-green-950 border-2 border-green-500 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Award className="w-5 h-5" />
                    <span className="font-semibold">
                      Correct Answer: {currentQuestion?.correctAnswer} -{' '}
                      {
                        currentQuestion?.options?.[
                          currentQuestion?.correctAnswer
                        ]
                      }
                    </span>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Question Grid Navigator */}
            <div className="border-t pt-3">
              <div className="text-xs text-muted-foreground mb-2">
                Jump to question:
              </div>
              <div className="grid grid-cols-10 gap-2">
                {questionSet.questions.map((_, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={index === currentIndex ? 'default' : 'outline'}
                    onClick={() => handleQuestionSelect(index)}
                    className="text-xs">
                    {index + 1}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
