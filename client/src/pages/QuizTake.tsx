import { useEffect, useState } from 'react';
import type React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizzes } from '../lib/api';
import { Quiz, Question } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import MultipleChoiceQuestion from '../components/quiz/MultipleChoiceQuestion';
import FlashcardQuestion from '../components/quiz/FlashcardQuestion';

export default function QuizTake() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    if (id) {
      loadQuiz();
    }
  }, [id]);

  const loadQuiz = async () => {
    try {
      const response = await quizzes.getById(id!);
      setQuiz(response.data);
      // Initialize answers from existing user answers if quiz is not completed
      // For completed quizzes (retakes), start fresh with empty answers
      if (response.data.questions && !response.data.completedAt) {
        const existingAnswers: Record<string, string> = {};
        let lastAnsweredIndex = 0;
        response.data.questions.forEach((q: Question, index: number) => {
          if (q.userAnswer) {
            existingAnswers[q.id] = q.userAnswer;
            lastAnsweredIndex = index;
          }
        });
        setAnswers(existingAnswers);
        // Resume at the first unanswered question, or the last answered question if all are answered
        if (Object.keys(existingAnswers).length < response.data.questions.length) {
          // Find first unanswered question
          const firstUnanswered = response.data.questions.findIndex((q: Question) => !q.userAnswer);
          if (firstUnanswered !== -1) {
            setCurrentIndex(firstUnanswered);
          }
        } else {
          // All questions answered, start at last question
          setCurrentIndex(lastAnsweredIndex);
        }
      } else {
        // Clear answers for retakes
        setAnswers({});
        setCurrentIndex(0);
      }
    } catch (error: any) {
      console.error('Failed to load quiz:', error);
      let errorMessage = 'Failed to load quiz';
      
      if (!error.response) {
        errorMessage = 'Unable to connect to server. Please ensure the backend is running.';
      } else if (error.response.status === 404) {
        errorMessage = 'Quiz not found. It may have been deleted or you may not have permission to view it.';
      } else if (error.response.status === 401) {
        errorMessage = 'Please log in to view this quiz.';
      } else {
        errorMessage = error.response.data?.error || error.message || 'Failed to load quiz';
      }
      
      alert(errorMessage);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    console.log('handleNext called', { currentIndex, totalQuestions: quiz?.questions?.length });
    if (!quiz?.questions) {
      console.log('No quiz questions');
      return;
    }
    if (currentIndex >= quiz.questions.length - 1) {
      console.log('Already at last question');
      return;
    }
    console.log('Updating currentIndex from', currentIndex, 'to', currentIndex + 1);
    setCurrentIndex((prev) => {
      const next = prev + 1;
      console.log('State update: Moving to index', next);
      return next;
    });
  };

  const handlePrevious = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (currentIndex <= 0) return;
    setCurrentIndex((prev) => prev - 1);
  };

  const handleExit = async () => {
    if (!quiz || !id) return;

    // Save progress before exiting
    try {
      if (Object.keys(answers).length > 0) {
        await quizzes.saveProgress(id, answers);
      }
    } catch (error: any) {
      console.error('Failed to save progress:', error);
      // Continue with exit even if save fails
    }

    // Navigate back to course detail page
    if (quiz.courseId) {
      navigate(`/courses/${quiz.courseId}`);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async () => {
    if (!quiz || !id || !quiz.questions) return;

    if (Object.keys(answers).length < quiz.questions.length) {
      if (!confirm('You have not answered all questions. Submit anyway?')) {
        return;
      }
    }

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      await quizzes.submit(id, answers, timeSpent);
      navigate(`/quizzes/${id}/results`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to submit quiz');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading quiz...</div>;
  }

  if (!quiz || !quiz.questions) {
    return <div className="min-h-screen flex items-center justify-center">Quiz not found</div>;
  }

  const currentQuestion = quiz.questions[currentIndex];
  const progress = ((currentIndex + 1) / quiz.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">{quiz.course?.name || 'Quiz'}</h1>
              {quiz.completedAt && (
                <p className="text-sm text-blue-600 mt-1">Retaking quiz - Previous score: {quiz.score ? Math.round(quiz.score) : 'N/A'}%</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {answeredCount} / {quiz.questions.length} answered
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowExitDialog(true)}
                style={{ cursor: 'pointer' }}
              >
                Exit Quiz
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-4xl" style={{ position: 'relative', overflow: 'visible' }}>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Question {currentIndex + 1} of {quiz.questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <Card className="mb-6" style={{ overflow: 'visible' }}>
          <CardContent className="p-6" style={{ overflow: 'visible' }}>
            {quiz.quizType === 'MULTIPLE_CHOICE' ? (
              <MultipleChoiceQuestion
                key={currentQuestion.id}
                question={currentQuestion}
                userAnswer={answers[currentQuestion.id]}
                onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
              />
            ) : (
              <FlashcardQuestion
                key={currentQuestion.id}
                question={currentQuestion}
                userAnswer={answers[currentQuestion.id]}
                onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
                onAnswerSelected={handleNext}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center gap-4 mt-6 relative" style={{ zIndex: 1000, pointerEvents: 'auto', justifyContent: 'flex-start' }}>
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>

          {currentIndex === quiz.questions.length - 1 ? (
            <Button type="button" onClick={handleSubmit}>
              Submit Quiz
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Next button clicked - event:', e);
                console.log('Current state:', { currentIndex, totalQuestions: quiz?.questions?.length });
                handleNext();
              }}
              disabled={!quiz?.questions || currentIndex >= quiz.questions.length - 1}
            >
              Next
            </Button>
          )}
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit Quiz?</DialogTitle>
            <DialogDescription>
              Are you sure you want to exit this quiz? Your progress will be saved, and you can resume later.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowExitDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleExit}
            >
              Exit Quiz
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

