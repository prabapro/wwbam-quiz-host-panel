// src/pages/Play.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import LoadingSpinner from '@components/common/LoadingSpinner';

// Play components
import QuestionControlPanel from '@components/play/QuestionControlPanel';
import HostQuestionView from '@components/play/HostQuestionView';
import AnswerPad from '@components/play/AnswerPad';
import QuestionProgressIndicator from '@components/play/QuestionProgressIndicator';
import CorrectAnswerFeedback from '@components/play/CorrectAnswerFeedback';
import WrongAnswerDialog from '@components/play/WrongAnswerDialog';

// Stores
import { useGameStore } from '@stores/useGameStore';
import { useQuestionsStore } from '@stores/useQuestionsStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { usePrizeStore } from '@stores/usePrizeStore';

// Utils
import { isFinalQuestion } from '@utils/questionFlow';
import { ArrowLeft, Users, Trophy } from 'lucide-react';
import { GAME_STATUS } from '@constants/gameStates';
import { TOTAL_QUESTIONS } from '@constants/config';

export default function Play() {
  const navigate = useNavigate();

  // ============================================================
  // STORE STATE
  // ============================================================

  // Game Store
  const gameStatus = useGameStore((state) => state.gameStatus);
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const currentQuestionNumber = useGameStore(
    (state) => state.currentQuestionNumber,
  );
  const currentQuestion = useGameStore((state) => state.currentQuestion);
  const questionVisible = useGameStore((state) => state.questionVisible);
  const answerRevealed = useGameStore((state) => state.answerRevealed);
  const correctOption = useGameStore((state) => state.correctOption);

  // Game Actions
  const loadNextQuestion = useGameStore((state) => state.loadNextQuestion);
  const showQuestionToPublic = useGameStore(
    (state) => state.showQuestionToPublic,
  );
  const validateAnswer = useGameStore((state) => state.validateAnswer);
  const handleCorrectAnswer = useGameStore(
    (state) => state.handleCorrectAnswer,
  );
  const handleIncorrectAnswer = useGameStore(
    (state) => state.handleIncorrectAnswer,
  );
  const eliminateTeam = useGameStore((state) => state.eliminateTeam);
  const completeTeam = useGameStore((state) => state.completeTeam);
  const moveToNextTeam = useGameStore((state) => state.moveToNextTeam);
  const proceedToNextQuestion = useGameStore(
    (state) => state.proceedToNextQuestion,
  );

  // Questions Store
  const questionsStore = useQuestionsStore();
  const selectedAnswer = useQuestionsStore((state) => state.selectedAnswer);
  const selectAnswer = useQuestionsStore((state) => state.selectAnswer);

  // Teams Store
  const teamsStore = useTeamsStore();
  const currentTeam = teamsStore.teams[currentTeamId];

  // Prize Store
  const prizeStructure = usePrizeStore((state) => state.prizeStructure);

  // ============================================================
  // LOCAL STATE
  // ============================================================

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Flow state
  const [showCorrectFeedback, setShowCorrectFeedback] = useState(false);
  const [showWrongDialog, setShowWrongDialog] = useState(false);
  const [previousPrize, setPreviousPrize] = useState(0);

  // Wrong answer dialog data
  const [wrongAnswerData, setWrongAnswerData] = useState(null);

  // ============================================================
  // DERIVED STATE
  // ============================================================

  const questionLoaded = !!currentQuestion;
  const answerSelected = !!selectedAnswer;
  const answerLocked = answerRevealed;
  const answerValidated = answerRevealed;

  const canLoadQuestion = !questionLoaded && !isLoading;
  const canShowQuestion = questionLoaded && !questionVisible && !isLoading;
  const canLockAnswer =
    questionVisible && answerSelected && !answerLocked && !isLoading;

  const isFinal = isFinalQuestion(currentQuestionNumber + 1, TOTAL_QUESTIONS);

  // ============================================================
  // EFFECTS
  // ============================================================

  // Check if game is active
  useEffect(() => {
    if (gameStatus !== GAME_STATUS.ACTIVE) {
      console.warn('Game not active, redirecting to home');
      // Could redirect or show warning
    }
  }, [gameStatus]);

  // ============================================================
  // HANDLERS
  // ============================================================

  /**
   * Load Question Handler
   */
  const handleLoadQuestion = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loadNextQuestion(questionsStore);

      if (!result.success) {
        throw new Error(result.error || 'Failed to load question');
      }

      console.log('✅ Question loaded successfully');
    } catch (err) {
      console.error('Load question error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Show Question Handler
   */
  const handleShowQuestion = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await showQuestionToPublic();

      if (!result.success) {
        throw new Error(result.error || 'Failed to show question');
      }

      console.log('✅ Question shown to public');
    } catch (err) {
      console.error('Show question error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Lock Answer Handler (triggers validation)
   */
  const handleLockAnswer = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Save previous prize for feedback display
      setPreviousPrize(currentTeam?.currentPrize || 0);

      // Validate answer
      const result = await validateAnswer(questionsStore, teamsStore);

      if (!result.success) {
        throw new Error(result.error || 'Failed to validate answer');
      }

      const { isCorrect, hasLifelines, availableLifelines } = result;

      if (isCorrect) {
        // CORRECT ANSWER FLOW
        console.log('✅ Correct answer!');

        // Update prize and progress
        const updateResult = await handleCorrectAnswer(
          teamsStore,
          prizeStructure,
        );

        if (!updateResult.success) {
          throw new Error(updateResult.error || 'Failed to update prize');
        }

        // Show success feedback
        setShowCorrectFeedback(true);
      } else {
        // INCORRECT ANSWER FLOW
        console.log('❌ Incorrect answer');

        // Get incorrect answer details
        const incorrectResult = await handleIncorrectAnswer(teamsStore);

        if (!incorrectResult.success) {
          throw new Error(
            incorrectResult.error || 'Failed to handle incorrect answer',
          );
        }

        // Show wrong answer dialog
        setWrongAnswerData({
          teamName: currentTeam?.name || 'Unknown Team',
          selectedAnswer,
          correctAnswer: correctOption,
          availableLifelines: incorrectResult.availableLifelines || [],
          currentPrize: incorrectResult.currentPrize || 0,
          hasLifelines: incorrectResult.hasLifelines,
        });

        setShowWrongDialog(true);
      }
    } catch (err) {
      console.error('Lock answer error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Next Question Handler (after correct answer)
   */
  const handleNextQuestion = async () => {
    setShowCorrectFeedback(false);

    // Check if this was the final question
    if (isFinal) {
      // Complete team and move to next
      await handleCompleteAndNextTeam();
      return;
    }

    // Clear question state and prepare for next
    proceedToNextQuestion(questionsStore);

    console.log('🔄 Ready for next question');
  };

  /**
   * Complete team and move to next
   */
  const handleCompleteAndNextTeam = async () => {
    setIsLoading(true);

    try {
      // Mark team as completed
      await completeTeam(teamsStore);

      // Move to next team
      const result = await moveToNextTeam(teamsStore, questionsStore);

      if (result.gameComplete) {
        // All teams done - redirect to home
        console.log('🏁 All teams completed!');
        navigate('/');
        return;
      }

      console.log('✅ Team completed, moved to next team');
    } catch (err) {
      console.error('Error completing team:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Eliminate Team Handler
   */
  const handleEliminateTeam = async () => {
    setShowWrongDialog(false);
    setIsLoading(true);

    try {
      // Eliminate team
      await eliminateTeam(teamsStore);

      // Move to next team
      const result = await moveToNextTeam(teamsStore, questionsStore);

      if (result.gameComplete) {
        console.log('🏁 All teams completed!');
        navigate('/');
        return;
      }

      console.log('✅ Team eliminated, moved to next team');
    } catch (err) {
      console.error('Error eliminating team:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Offer Lifeline Handler (Phase 05)
   */
  const handleOfferLifeline = () => {
    setShowWrongDialog(false);
    // TODO: Phase 05 - Implement lifeline flow
    console.log('🎁 Lifeline offer - To be implemented in Phase 05');
    alert('Lifeline functionality will be implemented in Phase 05');
  };

  // ============================================================
  // RENDER GUARDS
  // ============================================================

  // Game not active - show appropriate message
  if (gameStatus !== GAME_STATUS.ACTIVE) {
    const message =
      gameStatus === GAME_STATUS.INITIALIZED
        ? 'Game is initialized but not started. Click "Play Game" from the homepage to start.'
        : gameStatus === GAME_STATUS.PAUSED
          ? 'Game is paused. Resume from controls to continue.'
          : gameStatus === GAME_STATUS.COMPLETED
            ? 'Game has been completed. Reset to start a new game.'
            : 'Game is not active. Please initialize and start the game first.';

    return (
      <main className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <p className="text-xl text-muted-foreground">{message}</p>
              <p className="text-sm text-muted-foreground">
                Current Status: <Badge variant="outline">{gameStatus}</Badge>
              </p>
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!currentTeam) {
    return (
      <main className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" text="Loading team data..." />
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================

  return (
    <main className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Game Play</h1>
            <p className="text-muted-foreground">
              Question {currentQuestionNumber + 1} of {TOTAL_QUESTIONS}
            </p>
          </div>

          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit to Home
          </Button>
        </div>

        {/* Current Team Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Current Team
              </CardTitle>
              <Badge className="bg-primary">Playing</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold">{currentTeam.name}</p>
                <p className="text-sm text-muted-foreground">
                  {currentTeam.participants}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <span className="text-2xl font-bold">
                    Rs.{(currentTeam.currentPrize || 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Current Prize</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Question + Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Correct Answer Feedback (replaces question view when shown) */}
            {showCorrectFeedback ? (
              <CorrectAnswerFeedback
                previousPrize={previousPrize}
                newPrize={currentTeam.currentPrize || 0}
                questionNumber={currentQuestionNumber}
                totalQuestions={TOTAL_QUESTIONS}
                onNextQuestion={handleNextQuestion}
                isFinalQuestion={isFinal}
              />
            ) : (
              <>
                {/* Host Question View */}
                <HostQuestionView
                  question={currentQuestion}
                  questionVisible={questionVisible}
                  answerRevealed={answerRevealed}
                />

                {/* Question Control Panel */}
                <QuestionControlPanel
                  questionLoaded={questionLoaded}
                  questionVisible={questionVisible}
                  answerSelected={answerSelected}
                  answerLocked={answerLocked}
                  answerValidated={answerValidated}
                  currentQuestion={currentQuestion}
                  selectedAnswer={selectedAnswer}
                  isLoading={isLoading}
                  onLoadQuestion={handleLoadQuestion}
                  onShowQuestion={handleShowQuestion}
                  onLockAnswer={handleLockAnswer}
                  canLoadQuestion={canLoadQuestion}
                  canShowQuestion={canShowQuestion}
                  canLockAnswer={canLockAnswer}
                />

                {/* Answer Pad */}
                <AnswerPad
                  selectedAnswer={selectedAnswer}
                  correctAnswer={correctOption}
                  answerRevealed={answerRevealed}
                  disabled={!questionVisible || answerLocked}
                  onSelectAnswer={selectAnswer}
                />
              </>
            )}
          </div>

          {/* Right Column: Progress */}
          <div className="lg:col-span-1">
            <QuestionProgressIndicator
              currentQuestionNumber={currentQuestionNumber + 1}
              totalQuestions={TOTAL_QUESTIONS}
              currentPrize={currentTeam.currentPrize || 0}
              prizeStructure={prizeStructure}
              questionsAnswered={currentTeam.questionsAnswered || 0}
            />
          </div>
        </div>
      </div>

      {/* Wrong Answer Dialog */}
      {wrongAnswerData && (
        <WrongAnswerDialog
          open={showWrongDialog}
          onClose={() => setShowWrongDialog(false)}
          teamName={wrongAnswerData.teamName}
          selectedAnswer={wrongAnswerData.selectedAnswer}
          correctAnswer={wrongAnswerData.correctAnswer}
          availableLifelines={wrongAnswerData.availableLifelines}
          currentPrize={wrongAnswerData.currentPrize}
          hasLifelines={wrongAnswerData.hasLifelines}
          onOfferLifeline={handleOfferLifeline}
          onEliminateTeam={handleEliminateTeam}
        />
      )}
    </main>
  );
}
