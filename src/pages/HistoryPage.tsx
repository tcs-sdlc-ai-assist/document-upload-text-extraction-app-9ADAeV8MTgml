import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getHistory, deleteDocument } from '../services/DocumentService';
import { DocumentCard } from '../components/DocumentCard';
import type { DocumentEntry } from '../types';

export function HistoryPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDocuments = useCallback(() => {
    try {
      if (!user) {
        setDocuments([]);
        setIsLoading(false);
        return;
      }
      const history = getHistory(user.username);
      setDocuments(history);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load document history.';
      addNotification('error', message);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, addNotification]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) {
      return documents;
    }
    const query = searchQuery.trim().toLowerCase();
    return documents.filter((doc) =>
      doc.metadata.fileName.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteConfirmId(id);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteConfirmId || !user) return;

    try {
      const success = deleteDocument(deleteConfirmId, user.username);
      if (success) {
        setDocuments((prev) =>
          prev.filter((doc) => doc.metadata.id !== deleteConfirmId)
        );
        addNotification('success', 'Document deleted successfully.');
      } else {
        addNotification('error', 'Failed to delete document. It may have already been removed.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred while deleting the document.';
      addNotification('error', message);
    } finally {
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, user, addNotification]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmId(null);
  }, []);

  const deleteTargetName = useMemo(() => {
    if (!deleteConfirmId) return '';
    const doc = documents.find((d) => d.metadata.id === deleteConfirmId);
    return doc ? doc.metadata.fileName : 'this document';
  }, [deleteConfirmId, documents]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-neutral-500 text-sm">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Document History</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Browse and manage your uploaded documents.
        </p>
      </div>

      {documents.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by filename..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              aria-label="Search documents by filename"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label="Clear search"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          {searchQuery.trim() && (
            <p className="mt-2 text-xs text-neutral-500">
              Showing {filteredDocuments.length} of {documents.length} document{documents.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-neutral-700 mb-1">No documents yet</h2>
          <p className="text-sm text-neutral-500 text-center max-w-sm">
            Upload your first document to get started. Supported formats include PDF, DOCX, and TXT files.
          </p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-neutral-700 mb-1">No matching documents</h2>
          <p className="text-sm text-neutral-500 text-center max-w-sm">
            No documents match &ldquo;{searchQuery.trim()}&rdquo;. Try a different search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.metadata.id}
              document={doc}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <div className="bg-white rounded-xl shadow-soft p-6 mx-4 max-w-sm w-full animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-error-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 id="delete-confirm-title" className="text-lg font-semibold text-neutral-900">
                Delete Document
              </h2>
            </div>
            <p className="text-sm text-neutral-600 mb-6">
              Are you sure you want to delete <span className="font-medium text-neutral-800">{deleteTargetName}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-error-600 rounded-lg hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-error-500 transition-colors"
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

export default HistoryPage;