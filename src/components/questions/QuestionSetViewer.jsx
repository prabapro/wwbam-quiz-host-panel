// src/components/questions/QuestionSetViewer.jsx

import { useState, useEffect } from 'react';
import { localStorageService } from '@services/localStorage.service';
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
import { ChevronLeft, ChevronRight, CheckCircle2, Award } from 'lucide-react';

export default function QuestionSetViewer({ setId, open, onOpenChange }) {
  const [questionSet, setQuestionSet] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && setId) {
      loadQuestionSet();
    }
  }, [open, setId]);

  const loadQuestionSet = () => {
    setIsLoading(true);
    const set = localStorageService.getQuestionSet(setId);

    if (set) {
      setQuestionSet(set);
      setCurrentIndex(0);
    }

    setIsLoading(false);
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
              Unable to load the question set. It may have been deleted.
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
            Viewing {questionSet?.totalQuestions} questions • Set ID:{' '}
            {questionSet?.setId}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading questions...</p>
          </div>
        ) : (
          <>
            {/* Question Navigator - Grid Layout (10 per row) */}
            <div className="border-b pb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Question Navigator
                </h3>
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} / {questionSet.questions.length}
                </span>
              </div>

              {/* Grid: 10 buttons per row */}
              <div className="grid grid-cols-10 gap-2">
                {questionSet.questions.map((q, idx) => (
                  <Button
                    key={q.id}
                    variant={idx === currentIndex ? 'default' : 'outline'}
                    size="sm"
                    className="w-full"
                    onClick={() => handleQuestionSelect(idx)}>
                    {idx + 1}
                  </Button>
                ))}
              </div>
            </div>

            {/* Question Display */}
            {currentQuestion && (
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6">
                  {/* Question Header */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        Question {currentQuestion.number}
                      </Badge>
                      {currentQuestion.difficulty && (
                        <Badge variant="secondary">
                          {currentQuestion.difficulty}
                        </Badge>
                      )}
                      {currentQuestion.category && (
                        <Badge variant="secondary">
                          {currentQuestion.category}
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold leading-relaxed">
                      {currentQuestion.text}
                    </h3>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      Options:
                    </p>

                    {['A', 'B', 'C', 'D'].map((option) => {
                      const isCorrect =
                        currentQuestion.correctAnswer === option;

                      return (
                        <div
                          key={option}
                          className={`
                            p-4 rounded-lg border-2 transition-colors
                            ${
                              isCorrect
                                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                : 'border-border bg-muted/30'
                            }
                          `}>
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`
                                font-bold text-lg
                                ${isCorrect ? 'text-green-600 dark:text-green-400' : ''}
                              `}>
                                {option}:
                              </span>

                              {isCorrect && (
                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                              )}
                            </div>

                            <span
                              className={`
                              flex-1
                              ${isCorrect ? 'text-green-900 dark:text-green-100 font-medium' : ''}
                            `}>
                              {currentQuestion.options[option]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Correct Answer Indicator - Purple/Violet */}
                  <div className="p-4 bg-violet-50 dark:bg-violet-950 border-2 border-violet-500 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      <span className="font-semibold text-violet-900 dark:text-violet-100">
                        Correct Answer: {currentQuestion.correctAnswer}
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                Question {currentIndex + 1} of {questionSet.questions.length}
              </span>

              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentIndex === questionSet.questions.length - 1}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
