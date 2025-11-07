import { Question } from '../../types';
import { useState, useEffect } from 'react';

interface MultipleChoiceQuestionProps {
  question: Question;
  userAnswer?: string;
  onAnswer: (answer: string) => void;
}

export default function MultipleChoiceQuestion({
  question,
  userAnswer,
  onAnswer,
}: MultipleChoiceQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState(userAnswer || '');
  const [showExplanation, setShowExplanation] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(userAnswer || '');
    setShowExplanation(false);
  }, [question.id, userAnswer]);

  const handleSelect = (option: string) => {
    setSelectedAnswer(option);
    onAnswer(option);
    setShowExplanation(true);
  };

  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-4">{question.questionText}</h2>
        <div className="space-y-2">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === question.correctAnswer;
            let bgColor = 'bg-white hover:bg-gray-50';

            if (showExplanation) {
              if (isCorrectOption) {
                bgColor = 'bg-green-100 border-green-500';
              } else if (isSelected && !isCorrectOption) {
                bgColor = 'bg-red-100 border-red-500';
              }
            } else if (isSelected) {
              bgColor = 'bg-blue-50 border-blue-500';
            }

            return (
              <button
                key={index}
                onClick={() => handleSelect(option)}
                disabled={showExplanation}
                className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${bgColor} ${
                  showExplanation ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                  <span>{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {showExplanation && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className={`text-sm font-medium mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
          </div>
          <div className="text-sm text-gray-700 mb-2">
            <strong>Explanation:</strong> {question.explanation}
          </div>
          {question.sourceReference && (
            <div className="text-xs text-gray-500">
              <strong>Source:</strong> {question.sourceReference}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

