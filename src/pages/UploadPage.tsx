import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DropZone } from '../components/DropZone';
import { UploadProgress } from '../components/UploadProgress';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { uploadAndExtract } from '../services/DocumentService';
import { UploadStatus } from '../types';
import type { DocumentEntry } from '../types';
import type { UploadProgress as UploadProgressType } from '../services/DocumentService';

export function UploadPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(UploadStatus.Idle);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [completedDocument, setCompletedDocument] = useState<DocumentEntry | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const isProcessing = uploadStatus === UploadStatus.Validating ||
    uploadStatus === UploadStatus.Extracting ||
    uploadStatus === UploadStatus.Cleaning;

  const abortRef = useRef(false);

  const resetState = useCallback(() => {
    setUploadStatus(UploadStatus.Idle);
    setProgress(0);
    setStatusMessage('');
    setExtractedText('');
    setCompletedDocument(null);
    setErrorMessage('');
    setSelectedFile(null);
    abortRef.current = false;
  }, []);

  const handleProgressUpdate = useCallback((progressInfo: UploadProgressType) => {
    const statusMap: Record<string, UploadStatus> = {
      idle: UploadStatus.Idle,
      validating: UploadStatus.Validating,
      extracting: UploadStatus.Extracting,
      cleaning: UploadStatus.Cleaning,
      complete: UploadStatus.Complete,
      error: UploadStatus.Error,
    };

    const mappedStatus = statusMap[progressInfo.status] || UploadStatus.Idle;
    setUploadStatus(mappedStatus);
    setProgress(progressInfo.progress);
    setStatusMessage(progressInfo.message);
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!user) {
      addNotification('error', 'You must be logged in to upload documents.');
      return;
    }

    abortRef.current = false;
    setSelectedFile(file);
    setExtractedText('');
    setCompletedDocument(null);
    setErrorMessage('');
    setUploadStatus(UploadStatus.Validating);
    setProgress(0);
    setStatusMessage('Validating file...');

    try {
      const result = await uploadAndExtract(file, user.username, handleProgressUpdate);

      if (abortRef.current) {
        return;
      }

      if (result.success && result.document) {
        setUploadStatus(UploadStatus.Complete);
        setProgress(100);
        setStatusMessage('Upload complete!');
        setExtractedText(result.document.extractedText);
        setCompletedDocument(result.document);
        addNotification('success', `Successfully extracted text from "${file.name}".`);
      } else {
        const errMsg = result.error || 'An unknown error occurred during processing.';
        setUploadStatus(UploadStatus.Error);
        setProgress(0);
        setStatusMessage(errMsg);
        setErrorMessage(errMsg);
        addNotification('error', errMsg);
      }
    } catch (err) {
      if (abortRef.current) {
        return;
      }
      const errMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setUploadStatus(UploadStatus.Error);
      setProgress(0);
      setStatusMessage(errMsg);
      setErrorMessage(errMsg);
      addNotification('error', errMsg);
    }
  }, [user, addNotification, handleProgressUpdate]);

  const handleFileSelected = useCallback((file: File) => {
    processFile(file);
  }, [processFile]);

  const handleRetry = useCallback(() => {
    if (selectedFile) {
      processFile(selectedFile);
    }
  }, [selectedFile, processFile]);

  const handleUploadAnother = useCallback(() => {
    resetState();
  }, [resetState]);

  const handleViewDocument = useCallback(() => {
    if (completedDocument) {
      navigate(`/documents/${completedDocument.metadata.id}`);
    }
  }, [completedDocument, navigate]);

  const handleViewHistory = useCallback(() => {
    navigate('/history');
  }, [navigate]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          Upload Document
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Upload a PDF, DOCX, or TXT file to extract its text content.
        </p>
      </div>

      {/* Drop Zone */}
      {uploadStatus === UploadStatus.Idle && (
        <div className="animate-slide-up">
          <DropZone onFileSelected={handleFileSelected} disabled={false} />
        </div>
      )}

      {/* Upload Progress */}
      {uploadStatus !== UploadStatus.Idle && (
        <div className="animate-slide-up">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-card p-6">
            {selectedFile && (
              <div className="mb-4 flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-primary-600 dark:text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
            )}

            <UploadProgress
              status={uploadStatus}
              progress={progress}
              message={statusMessage}
            />

            {/* Error State with Retry */}
            {uploadStatus === UploadStatus.Error && (
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Retry
                </button>
                <button
                  type="button"
                  onClick={handleUploadAnother}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
                >
                  Upload Different File
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Extracted Text Preview */}
      {uploadStatus === UploadStatus.Complete && extractedText && (
        <div className="animate-slide-up">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Extracted Text
              </h2>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {extractedText.length.toLocaleString()} characters
              </span>
            </div>

            <div className="relative">
              <div className="max-h-96 overflow-y-auto rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-4">
                <pre className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap break-words font-mono leading-relaxed">
                  {extractedText}
                </pre>
              </div>

              {extractedText.length > 2000 && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-neutral-50 dark:from-neutral-900 to-transparent rounded-b-lg pointer-events-none" />
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {completedDocument && (
                <button
                  type="button"
                  onClick={handleViewDocument}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  View Document
                </button>
              )}
              <button
                type="button"
                onClick={handleUploadAnother}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Upload Another
              </button>
              <button
                type="button"
                onClick={handleViewHistory}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                View History
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(extractedText).then(() => {
                    addNotification('success', 'Text copied to clipboard.');
                  }).catch(() => {
                    addNotification('error', 'Failed to copy text to clipboard.');
                  });
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="animate-fade-in text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Please wait while your document is being processed...
          </p>
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const index = Math.min(i, units.length - 1);
  const size = bytes / Math.pow(k, index);
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export default UploadPage;