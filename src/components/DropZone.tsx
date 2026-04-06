import React, { useState, useRef, useCallback, type DragEvent, type ChangeEvent, type KeyboardEvent } from 'react';
import { SUPPORTED_FILE_EXTENSIONS, MAX_FILE_SIZE_MB, FILE_TYPE_LABELS, SUPPORTED_FILE_TYPES } from '../constants';

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFileSelected, disabled = false }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const acceptString = SUPPORTED_FILE_EXTENSIONS.join(',');

  const supportedLabels = SUPPORTED_FILE_TYPES.map((type) => FILE_TYPE_LABELS[type] || type).join(', ');

  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      dragCounterRef.current += 1;
      if (dragCounterRef.current === 1) {
        setIsDragOver(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDragOver(false);
      }
    },
    [disabled],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      e.dataTransfer.dropEffect = 'copy';
    },
    [disabled],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);
      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onFileSelected(files[0]);
      }
    },
    [disabled, onFileSelected],
  );

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelected(files[0]);
      }
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onFileSelected],
  );

  const handleBrowseClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    },
    [disabled],
  );

  const baseClasses =
    'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';

  const stateClasses = disabled
    ? 'border-neutral-200 bg-neutral-50 cursor-not-allowed opacity-60'
    : isDragOver
      ? 'border-primary-500 bg-primary-50 cursor-copy'
      : 'border-neutral-300 bg-white hover:border-primary-400 hover:bg-primary-50/50 cursor-pointer';

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Drop zone for file upload. Drag and drop a file here or press Enter to browse."
      aria-disabled={disabled}
      className={`${baseClasses} ${stateClasses}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
      onClick={handleBrowseClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptString}
        onChange={handleFileInputChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
      />

      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
        <svg
          className={`h-7 w-7 ${isDragOver ? 'text-primary-600' : 'text-primary-500'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
      </div>

      {isDragOver ? (
        <p className="mb-1 text-base font-semibold text-primary-700 animate-fade-in">
          Drop your file here
        </p>
      ) : (
        <>
          <p className="mb-1 text-base font-semibold text-neutral-700">
            Drag &amp; drop your file here
          </p>
          <p className="mb-3 text-sm text-neutral-500">
            or{' '}
            <span className="font-medium text-primary-600 underline underline-offset-2">
              browse files
            </span>
          </p>
        </>
      )}

      <p className="text-xs text-neutral-400">
        Supported formats: {supportedLabels} &middot; Max size: {MAX_FILE_SIZE_MB}MB
      </p>
    </div>
  );
}

export default DropZone;