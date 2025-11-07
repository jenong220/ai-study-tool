import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { materials } from '../../lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface UploadMaterialProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  onSuccess: () => void;
}

export default function UploadMaterial({ isOpen, onClose, courseId, onSuccess }: UploadMaterialProps) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        setName(acceptedFiles[0].name);
      }
    },
    onDropRejected: () => {
      setError('File must be PDF or DOCX and under 10MB');
    },
  });

  const handleFileUpload = async () => {
    if (!file) return;

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      await materials.upload(courseId, formData);
      setFile(null);
      setName('');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Upload failed';
      setError(errorMessage);
      if (!err.response) {
        setError('Unable to connect to server. Please ensure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUrlAdd = async () => {
    if (!url) return;

    setError('');
    setLoading(true);

    try {
      await materials.addUrl(courseId, url, name || url);
      setUrl('');
      setName('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Material</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={uploadType === 'file' ? 'default' : 'outline'}
              onClick={() => setUploadType('file')}
            >
              Upload File
            </Button>
            <Button
              type="button"
              variant={uploadType === 'url' ? 'default' : 'outline'}
              onClick={() => setUploadType('url')}
            >
              Add URL
            </Button>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          {uploadType === 'file' ? (
            <>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
                  isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="mb-2">Drag & drop a file here, or click to select</p>
                    <p className="text-sm text-gray-500">PDF or DOCX, max 10MB</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name (optional)</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Leave empty to use filename"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleFileUpload} disabled={!file || loading}>
                  {loading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">URL *</label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  type="url"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name (optional)</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Leave empty to use URL"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleUrlAdd} disabled={!url || loading}>
                  {loading ? 'Adding...' : 'Add URL'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

