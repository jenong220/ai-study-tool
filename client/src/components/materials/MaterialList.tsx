import { Material } from '../../types';
import { materials } from '../../lib/api';
import { Button } from '../ui/button';

interface MaterialListProps {
  materials: Material[];
  onDelete: () => void;
  onUpdate: () => void;
}

export default function MaterialList({ materials, onDelete, onUpdate }: MaterialListProps) {
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      await materials.delete(id);
      onDelete();
    } catch (error) {
      alert('Failed to delete material');
    }
  };

  if (materials.length === 0) {
    return <div className="text-center py-8 text-gray-500">No materials yet. Upload your first material!</div>;
  }

  return (
    <div className="space-y-3">
      {materials.map((material) => (
        <div
          key={material.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium">{material.name}</div>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded">{material.type}</span>
              {material.wordCount && (
                <span className="text-xs text-gray-500">{material.wordCount.toLocaleString()} words</span>
              )}
            </div>
            {material.url && (
              <a
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {material.url}
              </a>
            )}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(material.id)}
          >
            Delete
          </Button>
        </div>
      ))}
    </div>
  );
}

