import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FILE_TYPE_LABELS } from '../constants';
import type { DocumentEntry } from '../types';

interface DocumentCardProps {
  document: DocumentEntry;
  onDelete?: (id: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const index = Math.min(i, units.length - 1);
  const size = bytes / Math.pow(k, index);
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateText(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength).trimEnd() + '…';
}

function FileTypeIcon({ fileType }: { fileType: string }) {
  if (fileType === 'application/pdf') {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error-50">
        <svg
          className="h-5 w-5 text-error-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
    );
  }

  if (
    fileType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
        <svg
          className="h-5 w-5 text-primary-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-50">
      <svg
        className="h-5 w-5 text-secondary-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    </div>
  );
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const navigate = useNavigate();
  const { metadata, extractedText } = document;

  const fileTypeLabel = useMemo(
    () => FILE_TYPE_LABELS[metadata.fileType] || metadata.fileType,
    [metadata.fileType],
  );

  const formattedSize = useMemo(
    () => formatFileSize(metadata.fileSize),
    [metadata.fileSize],
  );

  const formattedDate = useMemo(
    () => formatTimestamp(metadata.timestamp),
    [metadata.timestamp],
  );

  const previewText = useMemo(
    () => truncateText(extractedText || 'No text extracted.', 150),
    [extractedText],
  );

  const handleViewDetail = useCallback(() => {
    navigate(`/documents/${metadata.id}`);
  }, [navigate, metadata.id]);

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(metadata.id);
    }
  }, [onDelete, metadata.id]);

  return (
    <div className="rounded-xl bg-white p-5 shadow-card transition-shadow hover:shadow-soft animate-fade-in">
      <div className="flex items-start gap-4">
        <FileTypeIcon fileType={metadata.fileType} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-neutral-900">
                {metadata.fileName}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                  {fileTypeLabel}
                </span>
                <span>{formattedSize}</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">{formattedDate}</span>
              </div>
              <p className="mt-1 text-xs text-neutral-500 sm:hidden">
                {formattedDate}
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            {previewText}
          </p>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleViewDetail}
              className="inline-flex items-center rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            >
              <svg
                className="mr-1.5 h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              View
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center rounded-lg bg-error-50 px-3 py-1.5 text-xs font-medium text-error-700 transition-colors hover:bg-error-100 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-1"
              >
                <svg
                  className="mr-1.5 h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentCard;