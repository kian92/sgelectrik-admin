"use client";

import { useState } from "react";
import { GripVertical, X } from "lucide-react";

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export interface GalleryGridProps {
  images: string[];
  onReorder: (images: string[]) => void;
  onRemove: (index: number) => void;
  className?: string;
}

/**
 * Drag-and-drop reorderable grid of gallery image thumbnails.
 */
export function GalleryGrid({ images, onReorder, onRemove, className }: GalleryGridProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...images];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    onReorder(next);
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2", className)}>
      {images.map((url, index) => (
        <div
          key={`${url}-${index}`}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragEnter={() => setOverIndex(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(index)}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
          className={cn(
            "group relative rounded-lg overflow-hidden bg-slate-100 aspect-video cursor-grab active:cursor-grabbing transition-opacity",
            dragIndex === index && "opacity-40",
            overIndex === index && dragIndex !== null && dragIndex !== index &&
              "ring-2 ring-emerald-400",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`Gallery ${index + 1}`}
            className="w-full h-full object-cover pointer-events-none"
          />
          <div className="absolute top-1.5 left-1.5 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-3 w-3" />
          </div>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
            aria-label={`Remove gallery image ${index + 1}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
