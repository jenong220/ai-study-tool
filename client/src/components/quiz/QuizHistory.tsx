import { Quiz } from '../../types';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { formatTime } from '../../lib/utils';

interface QuizHistoryProps {
  quizzes: Quiz[];
}

export default function QuizHistory({ quizzes }: QuizHistoryProps) {
  const navigate = useNavigate();

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No quizzes yet. Generate your first quiz to get started!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quizzes.map((quiz) => (
        <Card
          key={quiz.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => {
            if (quiz.completedAt) {
              navigate(`/quizzes/${quiz.id}/results`);
            } else {
              navigate(`/quizzes/${quiz.id}`);
            }
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-sm font-medium">
                    {quiz.quizType === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Flashcard'}
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                    {quiz.difficulty}
                  </span>
                  {quiz.completedAt && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                      Completed
                    </span>
                  )}
                  {!quiz.completedAt && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                      In Progress
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {quiz.questionCount} questions
                  {quiz.topicFocus && ` • ${quiz.topicFocus}`}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Created {new Date(quiz.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right ml-4">
                {quiz.completedAt && quiz.score !== null && (
                  <div className="mb-2">
                    <div className="text-2xl font-bold" style={{ color: quiz.score >= 70 ? '#10B981' : '#EF4444' }}>
                      {Math.round(quiz.score)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {quiz.timeSpent ? formatTime(quiz.timeSpent) : 'N/A'}
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (quiz.completedAt) {
                      navigate(`/quizzes/${quiz.id}/results`);
                    } else {
                      navigate(`/quizzes/${quiz.id}`);
                    }
                  }}
                >
                  {quiz.completedAt ? 'View Results' : 'Continue'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

