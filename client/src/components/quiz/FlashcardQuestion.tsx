import { Question } from '../../types';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';

interface FlashcardQuestionProps {
  question: Question;
  userAnswer?: string;
  onAnswer: (rating: string) => void;
}

export default function FlashcardQuestion({
  question,
  userAnswer,
  onAnswer,
}: FlashcardQuestionProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [rating, setRating] = useState<string | null>(userAnswer || null);

  // Reset state when question changes
  useEffect(() => {
    setShowAnswer(false);
    setRating(userAnswer || null);
  }, [question.id, userAnswer]);

  const handleRating = (rate: string) => {
    setRating(rate);
    onAnswer(rate);
  };

  return (
    <div className="space-y-6">
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-8">{question.questionText}</h2>
          {!showAnswer && (
            <Button onClick={() => setShowAnswer(true)}>
              Show Answer
            </Button>
          )}
        </div>
      </div>

      {showAnswer && (
        <div className="space-y-4">
          <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="text-sm text-blue-700 mb-2">Answer:</div>
            <div className="text-lg font-medium">{question.correctAnswer}</div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-700 mb-2">
              <strong>Explanation:</strong> {question.explanation}
            </div>
            {question.sourceReference && (
              <div className="text-xs text-gray-500">
                <strong>Source:</strong> {question.sourceReference}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-center">
            {(['Again', 'Hard', 'Good', 'Easy'] as const).map((rate) => (
              <Button
                key={rate}
                variant={rating === rate ? 'default' : 'outline'}
                onClick={() => handleRating(rate)}
                className="min-w-[80px]"
              >
                {rate}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

