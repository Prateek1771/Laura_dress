'use client';

import { useRef, useState } from 'react';

const MAX_EDGE = 1024;

// Downscale to <=1024px long edge and re-encode as JPEG. Same approach Feature 12 reuses.
async function resize(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  const blob: Blob = await new Promise((res) =>
    canvas.toBlob((b) => res(b!), 'image/jpeg', 0.85),
  );
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
}

interface ImageUploaderProps {
  existing: string[];
  onExistingChange: (urls: string[]) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export function ImageUploader({ existing, onExistingChange, files, onFilesChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const previews = files.map((f) => ({ key: f.name + f.size, url: URL.createObjectURL(f) }));

  async function addFiles(list: FileList | null) {
    if (!list || !list.length) return;
    setBusy(true);
    try {
      const resized = await Promise.all(Array.from(list).map(resize));
      onFilesChange([...files, ...resized]);
    } finally {
      setBusy(false);
    }
  }

  const isPrimary = (index: number, source: 'existing' | 'file') =>
    existing.length ? source === 'existing' && index === 0 : source === 'file' && index === 0;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">Images</span>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer items-center justify-center rounded-[--radius-card] border border-dashed px-4 py-6 text-sm transition-colors ${
          dragging ? 'border-primary bg-primary-soft' : 'border-border text-ink-muted hover:bg-surface-soft'
        }`}
      >
        {busy ? 'Processing…' : 'Drag images here or click to upload'}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void addFiles(e.target.files)}
        />
      </div>

      {(existing.length > 0 || previews.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {existing.map((url, i) => (
            <Thumb
              key={url}
              url={url}
              primary={isPrimary(i, 'existing')}
              onRemove={() => onExistingChange(existing.filter((_, j) => j !== i))}
            />
          ))}
          {previews.map((p, i) => (
            <Thumb
              key={p.key}
              url={p.url}
              primary={isPrimary(i, 'file')}
              onRemove={() => onFilesChange(files.filter((_, j) => j !== i))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Thumb({ url, primary, onRemove }: { url: string; primary: boolean; onRemove: () => void }) {
  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-[--radius-input] border border-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" />
      {primary && (
        <span className="absolute bottom-0 left-0 right-0 bg-primary/80 py-0.5 text-center text-[9px] font-semibold uppercase tracking-wide text-white">
          Primary
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove image"
        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-xs text-white"
      >
        ×
      </button>
    </div>
  );
}
