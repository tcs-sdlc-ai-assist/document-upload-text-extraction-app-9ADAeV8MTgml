import React from 'react';
import { UploadStatus } from '../types';

interface UploadProgressProps {
  status: UploadStatus;
  progress: number;
  fileName?: string;
  errorMessage?: string;
}

const STATUS_CONFIG: Record<
  UploadStatus,
  { label: string; color: string; bgColor: string; trackColor: string; icon: string }
> = {
  [UploadStatus.Idle]: {
    label: 'Ready to upload',
    color: 'text-neutral-500',
    bgColor: 'bg-neutral-300',
    trackColor: 'bg-neutral-100',
    icon: '📄',
  },
  [UploadStatus.Validating]: {
    label: 'Validating file…',
    color: 'text-primary-600',
    bgColor: 'bg-primary-500',
    trackColor: 'bg-primary-100',
    icon: '🔍',
  },
  [UploadStatus.Extracting]: {
    label: 'Extracting text…',
    color: 'text-secondary-600',
    bgColor: 'bg-secondary-500',
    trackColor: 'bg-secondary-100',
    icon: '⚙️',
  },
  [UploadStatus.Cleaning]: {
    label: 'Cleaning text…',
    color: 'text-accent-600',
    bgColor: 'bg-accent-500',
    trackColor: 'bg-accent-100',
    icon: '✨',
  },
  [UploadStatus.Complete]: {
    label: 'Upload complete!',
    color: 'text-success-600',
    bgColor: 'bg-success-500',
    trackColor: 'bg-success-100',
    icon: '✅',
  },
  [UploadStatus.Error]: {
    label: 'Upload failed',
    color: 'text-error-600',
    bgColor: 'bg-error-500',
    trackColor: 'bg-error-100',
    icon: '❌',
  },
};

function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function UploadProgress({
  status,
  progress,
  fileName,
  errorMessage,
}: UploadProgressProps): React.ReactElement | null {
  if (status === UploadStatus.Idle) {
    return null;
  }

  const config = STATUS_CONFIG[status];
  const clampedProgress = clampProgress(progress);
  const isAnimating =
    status === UploadStatus.Validating ||
    status === UploadStatus.Extracting ||
    status === UploadStatus.Cleaning;

  return (
    <div className="w-full rounded-xl bg-white p-6 shadow-card animate-fade-in" role="status" aria-live="polite">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">
            {config.icon}
          </span>
          <span className={`text-sm font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>
        <span className="text-sm font-semibold text-neutral-700">
          {clampedProgress}%
        </span>
      </div>

      <div
        className={`h-3 w-full overflow-hidden rounded-full ${config.trackColor}`}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Upload progress: ${clampedProgress}%`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${config.bgColor} ${
            isAnimating ? 'animate-pulse' : ''
          }`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      {fileName && (
        <p className="mt-3 truncate text-xs text-neutral-500">
          <span className="font-medium text-neutral-600">File:</span> {fileName}
        </p>
      )}

      {status === UploadStatus.Error && errorMessage && (
        <div className="mt-3 rounded-lg bg-error-50 p-3">
          <p className="text-xs text-error-700">{errorMessage}</p>
        </div>
      )}

      {status === UploadStatus.Complete && (
        <p className="mt-3 text-xs text-success-600">
          Document has been processed and saved successfully.
        </p>
      )}

      <div className="sr-only">
        {config.label} {clampedProgress} percent
        {fileName ? `, file: ${fileName}` : ''}
        {status === UploadStatus.Error && errorMessage ? `, error: ${errorMessage}` : ''}
      </div>
    </div>
  );
}

export default UploadProgress;