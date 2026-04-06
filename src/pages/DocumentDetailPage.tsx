import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getDocumentById, deleteDocument } from '../services/DocumentService';
import { FILE_TYPE_LABELS, ROUTES } from '../constants';
import type { DocumentEntry } from '../types';

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const index = Math.min(i, units.length - 1);
  const size = bytes / Math.pow(k, index);
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [document, setDocument] = useState<DocumentEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id || !user) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    try {
      const doc = getDocumentById(id, user.username);
      if (doc) {
        setDocument(doc);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Failed to load document:', error);
      setNotFound(true);
      addNotification('error', 'Failed to load document.');
    } finally {
      setLoading(false);
    }
  }, [id, user, addNotification]);

  const fileTypeLabel = useMemo(() => {
    if (!document) return '';
    return FILE_TYPE_LABELS[document.metadata.fileType] || document.metadata.fileType;
  }, [document]);

  const formattedSize = useMemo(() => {
    if (!document) return '';
    return formatFileSize(document.metadata.fileSize);
  }, [document]);

  const formattedDate = useMemo(() => {
    if (!document) return '';
    return formatTimestamp(document.metadata.timestamp);
  }, [document]);

  const wordCount = useMemo(() => {
    if (!document || !document.extractedText) return 0;
    return document.extractedText.trim().split(/\s+/).filter(Boolean).length;
  }, [document]);

  const handleBack = useCallback(() => {
    navigate(ROUTES.history);
  }, [navigate]);

  const handleDelete = useCallback(() => {
    if (!document || !user) return;

    try {
      const success = deleteDocument(document.metadata.id, user.username);
      if (success) {
        addNotification('success', `"${document.metadata.fileName}" has been deleted.`);
        navigate(ROUTES.history);
      } else {
        addNotification('error', 'Failed to delete document.');
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      addNotification('error', 'An error occurred while deleting the document.');
    } finally {
      setShowDeleteConfirm(false);
    }
  }, [document, user, navigate, addNotification]);

  const handleCopyText = useCallback(() => {
    if (!document) return;

    navigator.clipboard.writeText(document.extractedText).then(
      () => {
        addNotification('success', 'Text copied to clipboard.');
      },
      () => {
        addNotification('error', 'Failed to copy text to clipboard.');
      }
    );
  }, [document, addNotification]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-neutral-500 text-sm">Loading document...</p>
        </div>
      </div>
    );
  }

  if (notFound || !document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">Document Not Found</h2>
          <p className="text-neutral-500 text-sm">
            The document you're looking for doesn't exist or has been deleted.
          </p>
        </div>
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to History
        </button>
      </div>
    );
  }

  const { metadata, extractedText } = document;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to History
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary-700">{fileTypeLabel}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 break-all">
                {metadata.fileName}
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                Uploaded {formattedDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy Text
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-error-600 bg-white border border-error-300 rounded-lg hover:bg-error-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Metadata Card */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-5 mb-6">
        <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider mb-4">
          Document Details
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-neutral-500 mb-1">File Type</p>
            <p className="text-sm font-medium text-neutral-800">{fileTypeLabel}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">File Size</p>
            <p className="text-sm font-medium text-neutral-800">{formattedSize}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Word Count</p>
            <p className="text-sm font-medium text-neutral-800">{wordCount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Document ID</p>
            <p className="text-sm font-medium text-neutral-800 font-mono truncate" title={metadata.id}>
              {metadata.id.slice(0, 8)}...
            </p>
          </div>
        </div>
      </div>

      {/* Extracted Text */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider">
            Extracted Text
          </h2>
          <span className="text-xs text-neutral-400">
            {extractedText.length.toLocaleString()} characters
          </span>
        </div>
        {extractedText.trim() ? (
          <div className="bg-neutral-50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
            <pre className="text-sm text-neutral-800 whitespace-pre-wrap break-words font-sans leading-relaxed">
              {extractedText}
            </pre>
          </div>
        ) : (
          <div className="bg-neutral-50 rounded-lg p-8 text-center">
            <p className="text-sm text-neutral-500">No text was extracted from this document.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full mx-4 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-error-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Delete Document</h3>
                <p className="text-sm text-neutral-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-neutral-600 mb-6">
              Are you sure you want to delete{' '}
              <span className="font-medium text-neutral-800">"{metadata.fileName}"</span>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-error-600 rounded-lg hover:bg-error-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentDetailPage;