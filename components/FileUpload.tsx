"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export interface FileUploadProps {
  onUploadComplete: (url: string, path: string) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxSize?: number; // in bytes, default: 500MB
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  contentType?:
    | "blog"
    | "rentals"
    | "vehicles"
    | "dealers"
    | "charging"
    | "workshops"
    | "general"; // Content type for organization (default: "general")
}

export interface UploadState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  progress?: number;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  accept = "image/*,video/*",
  maxSize = 500 * 1024 * 1024,
  label = "Upload Media",
  description = "Drag and drop or click to select files",
  className,
  disabled = false,
  contentType,
}: FileUploadProps) {
  const [state, setState] = useState<UploadState>({
    isLoading: false,
    error: null,
    success: false,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      // Validate file size
      if (file.size > maxSize) {
        const sizeInMB = (maxSize / 1024 / 1024).toFixed(2);
        const fileSizeInMB = (file.size / 1024 / 1024).toFixed(2);
        const error = `File size ${fileSizeInMB}MB exceeds maximum of ${sizeInMB}MB`;
        setState({
          isLoading: false,
          error,
          success: false,
        });
        onUploadError?.(error);
        return;
      }

      setState({ isLoading: true, error: null, success: false });

      const formData = new FormData();
      formData.append("file", file);
      if (contentType) {
        formData.append("contentType", contentType);
      }

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Upload failed");
        }

        setState({
          isLoading: false,
          error: null,
          success: true,
        });

        onUploadComplete(data.url, data.path);

        // Reset success state after 3 seconds
        setTimeout(() => {
          setState({
            isLoading: false,
            error: null,
            success: false,
          });
        }, 3000);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        setState({
          isLoading: false,
          error: errorMessage,
          success: false,
        });
        onUploadError?.(errorMessage);
      }
    },
    [maxSize, onUploadComplete, onUploadError, contentType],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget.files;
      if (files && files.length > 0) {
        handleUpload(files[0]);
      }
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [handleUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current?.classList.add("border-emerald-400", "bg-emerald-50");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current?.classList.remove("border-emerald-400", "bg-emerald-50");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current?.classList.remove("border-emerald-400", "bg-emerald-50");

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleUpload(files[0]);
      }
    },
    [handleUpload],
  );

  return (
    <div className={className}>
      <div
        ref={dragRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() =>
          !disabled && !state.isLoading && inputRef.current?.click()
        }
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 p-8 cursor-pointer transition-all",
          state.isLoading && "opacity-70 cursor-wait",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled &&
            !state.isLoading &&
            "hover:border-slate-300 hover:bg-slate-50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled || state.isLoading}
          className="hidden"
        />

        {state.isLoading ? (
          <>
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
            <p className="text-sm font-medium text-slate-700">Uploading...</p>
          </>
        ) : state.success ? (
          <>
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-700">
              Upload successful!
            </p>
          </>
        ) : state.error ? (
          <>
            <AlertCircle className="h-8 w-8 text-red-600" />
            <p className="text-center text-sm font-medium text-red-700">
              {state.error}
            </p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-slate-400" />
            <div className="text-center">
              {label && (
                <p className="text-sm font-medium text-slate-700">{label}</p>
              )}
              {description && (
                <p className="text-xs text-slate-500 mt-1">{description}</p>
              )}
            </div>
          </>
        )}

        {state.error && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              setState({ isLoading: false, error: null, success: false })
            }
            className="mt-2"
          >
            <X className="h-3 w-3 mr-1" />
            Dismiss
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Image Upload Component
 * Specialized component for image uploads with preview
 */
export interface ImageUploadProps extends Omit<FileUploadProps, "accept"> {
  onUrlChange?: (url: string) => void;
}

export function ImageUpload({
  onUploadComplete,
  onUploadError,
  onUrlChange,
  label = "Upload Image",
  description = "PNG, JPG, WebP, or GIF up to 500MB",
  ...props
}: ImageUploadProps) {
  return (
    <FileUpload
      {...props}
      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
      label={label}
      description={description}
      onUploadComplete={(url, path) => {
        onUrlChange?.(url);
        onUploadComplete(url, path);
      }}
      onUploadError={onUploadError}
    />
  );
}

/**
 * Video Upload Component
 * Specialized component for video uploads
 */
export function VideoUpload({
  label = "Upload Video",
  description = "MP4 or WebM up to 500MB",
  ...props
}: Omit<FileUploadProps, "accept">) {
  return (
    <FileUpload
      {...props}
      accept="video/mp4,video/webm,video/mpeg"
      label={label}
      description={description}
    />
  );
}
