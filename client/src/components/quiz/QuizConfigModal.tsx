import { useState } from 'react';
import { Material } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface QuizConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: Material[];
  onGenerate: (config: any) => void;
}

export default function QuizConfigModal({ isOpen, onClose, materials, onGenerate }: QuizConfigModalProps) {
  const [quizType, setQuizType] = useState<'MULTIPLE_CHOICE' | 'FLASHCARD'>('MULTIPLE_CHOICE');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'MIXED'>('MIXED');
  const [questionCount, setQuestionCount] = useState(10);
  const [topicFocus, setTopicFocus] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onGenerate({
        quizType,
        difficulty,
        questionCount,
        topicFocus: topicFocus || undefined,
        materialIds: selectedMaterials.length > 0 ? selectedMaterials : undefined,
      });
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setLoading(false);
    }
  };

  const toggleMaterial = (materialId: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Quiz</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Quiz Type</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={quizType === 'MULTIPLE_CHOICE' ? 'default' : 'outline'}
                onClick={() => setQuizType('MULTIPLE_CHOICE')}
              >
                Multiple Choice
              </Button>
              <Button
                type="button"
                variant={quizType === 'FLASHCARD' ? 'default' : 'outline'}
                onClick={() => setQuizType('FLASHCARD')}
              >
                Flashcard
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <div className="flex gap-2">
              {(['EASY', 'MEDIUM', 'HARD', 'MIXED'] as const).map((diff) => (
                <Button
                  key={diff}
                  type="button"
                  variant={difficulty === diff ? 'default' : 'outline'}
                  onClick={() => setDifficulty(diff)}
                >
                  {diff}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Number of Questions (5-25)
            </label>
            <Input
              type="number"
              min={5}
              max={25}
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Topic Focus (optional)</label>
            <Input
              value={topicFocus}
              onChange={(e) => setTopicFocus(e.target.value)}
              placeholder="e.g., Machine Learning Basics"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Select Materials (optional - uses all if none selected)
            </label>
            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
              {materials.map((material) => (
                <label key={material.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMaterials.includes(material.id)}
                    onChange={() => toggleMaterial(material.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{material.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Quiz'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

