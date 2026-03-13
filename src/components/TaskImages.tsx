'use client';

import { useState, useEffect, useRef } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';

interface TaskImageData {
  id: string;
  url: string;
  filename: string;
  created_at: string;
}

interface TaskImagesProps {
  taskId: string;
}

export function TaskImages({ taskId }: TaskImagesProps) {
  const [images, setImages] = useState<TaskImageData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/tasks/${taskId}/images`)
      .then(res => res.json())
      .then(data => setImages(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load images'));
  }, [taskId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/tasks/${taskId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Upload failed');
        return;
      }

      const data = await res.json();
      setImages(prev => [...prev, data]);
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-mc-text-secondary">
          Images {images.length > 0 && `(${images.length})`}
        </h3>
        <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-mc-accent hover:bg-mc-accent/10 rounded cursor-pointer transition-colors">
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ImagePlus className="w-3.5 h-3.5" />
          )}
          {uploading ? 'Uploading...' : 'Add Image'}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jfif,image/pjpeg"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {images.length === 0 && !error && (
        <p className="text-xs text-mc-text-secondary">
          No images attached. Add screenshots, mockups, or reference images.
        </p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 p-2">
          {images.map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt={img.filename}
              className="w-full rounded object-cover aspect-square"
            />
          ))}
        </div>
      )}
    </div>
  );
}
