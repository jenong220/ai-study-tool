import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizzes } from '../lib/api';
import { Quiz } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatTime } from '../lib/utils';

export default function QuizResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadResults();
    }
  }, [id]);

  const loadResults = async () => {
    try {
      const response = await quizzes.getResults(id!);
      setQuiz(response.data);
    } catch (error) {
      console.error('Failed to load results:', error);
      alert('Failed to load quiz results');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading results...</div>;
  }

  if (!quiz || !quiz.questions) {
    return <div className="min-h-screen flex items-center justify-center">Results not found</div>;
  }

  const correctCount = quiz.questions.filter((q) => q.answeredCorrectly).length;
  const score = quiz.score || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-4xl">
        {/* Score Summary */}
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <div className="text-6xl font-bold mb-2" style={{ color: score >= 70 ? '#10B981' : '#EF4444' }}>
              {Math.round(score)}%
            </div>
            <div className="text-xl text-gray-600 mb-4">
              {correctCount} out of {quiz.questions.length} correct
            </div>
            {quiz.timeSpent && (
              <div className="text-sm text-gray-500">
                Time: {formatTime(quiz.timeSpent)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Question Review */}
        <Card>
          <CardHeader>
            <CardTitle>Question Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {quiz.questions.map((question, index) => (
                <div
                  key={question.id}
                  className={`p-4 rounded-lg border-2 ${
                    question.answeredCorrectly
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-3">
                    <span className="font-semibold">Q{index + 1}:</span>
                    <span className="flex-1">{question.questionText}</span>
                    {question.answeredCorrectly ? (
                      <span className="text-green-700 font-medium">✓ Correct</span>
                    ) : (
                      <span className="text-red-700 font-medium">✗ Incorrect</span>
                    )}
                  </div>

                  {question.questionType === 'MULTIPLE_CHOICE' && (
                    <div className="ml-6 space-y-1">
                      {question.options.map((option, optIndex) => {
                        const isCorrect = option === question.correctAnswer;
                        const isSelected = option === question.userAnswer;
                        return (
                          <div
                            key={optIndex}
                            className={`p-2 rounded ${
                              isCorrect
                                ? 'bg-green-100 font-medium'
                                : isSelected
                                ? 'bg-red-100'
                                : 'bg-gray-50'
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}. {option}
                            {isCorrect && ' (Correct)'}
                            {isSelected && !isCorrect && ' (Your answer)'}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {question.questionType === 'FLASHCARD' && (
                    <div className="ml-6 space-y-2">
                      <div className="p-2 bg-green-100 rounded">
                        <strong>Correct Answer:</strong> {question.correctAnswer}
                      </div>
                      {question.userAnswer && (
                        <div className="p-2 bg-gray-100 rounded">
                          <strong>Your Rating:</strong> {question.userAnswer}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 ml-6 p-3 bg-gray-50 rounded">
                    <div className="text-sm">
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                    {question.sourceReference && (
                      <div className="text-xs text-gray-500 mt-1">
                        <strong>Source:</strong> {question.sourceReference}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(`/courses/${quiz.courseId}`)}
          >
            Back to Course
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/quizzes/${id}`)}
          >
            Retake Quiz
          </Button>
          <Button
            onClick={() => navigate(`/courses/${quiz.courseId}`)}
          >
            Generate New Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}

