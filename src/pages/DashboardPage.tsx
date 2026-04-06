import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHistory } from '../services/DocumentService';
import { DocumentCard } from '../components/DocumentCard';
import { deleteDocument } from '../services/DocumentService';
import { ROUTES } from '../constants';
import type { DocumentEntry } from '../types';

const RECENT_UPLOADS_COUNT = 5;

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = React.useState<DocumentEntry[]>([]);

  const userId = user?.username ?? '';

  React.useEffect(() => {
    if (userId) {
      const docs = getHistory(userId);
      setDocuments(docs);
    }
  }, [userId]);

  const totalDocuments = documents.length;

  const recentDocuments = useMemo(() => {
    const sorted = [...documents].sort(
      (a, b) => b.metadata.timestamp - a.metadata.timestamp
    );
    return sorted.slice(0, RECENT_UPLOADS_COUNT);
  }, [documents]);

  const fileTypeCounts = useMemo(() => {
    const counts: Record<string, number> = { PDF: 0, DOCX: 0, TXT: 0 };
    for (const doc of documents) {
      const type = doc.metadata.fileType;
      if (type === 'application/pdf') {
        counts.PDF += 1;
      } else if (
        type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        counts.DOCX += 1;
      } else if (type === 'text/plain') {
        counts.TXT += 1;
      }
    }
    return counts;
  }, [documents]);

  const totalSize = useMemo(() => {
    const bytes = documents.reduce((sum, doc) => sum + doc.metadata.fileSize, 0);
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.min(
      Math.floor(Math.log(bytes) / Math.log(k)),
      units.length - 1
    );
    const size = bytes / Math.pow(k, i);
    return `${size.toFixed(1)} ${units[i]}`;
  }, [documents]);

  const handleDelete = (id: string) => {
    const success = deleteDocument(id, userId);
    if (success) {
      setDocuments((prev) => prev.filter((d) => d.metadata.id !== id));
    }
  };

  const handleNavigateUpload = () => {
    navigate(ROUTES.upload);
  };

  const handleNavigateHistory = () => {
    navigate(ROUTES.history);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-neutral-500">
          Welcome back{user ? `, ${user.username}` : ''}. Here&apos;s an overview of your documents.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={handleNavigateUpload}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
            />
          </svg>
          Upload Document
        </button>
        <button
          type="button"
          onClick={handleNavigateHistory}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          View History
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
              <svg
                className="h-5 w-5 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Total Documents</p>
              <p className="text-2xl font-bold text-neutral-900">{totalDocuments}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-100">
              <svg
                className="h-5 w-5 text-secondary-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Total Size</p>
              <p className="text-2xl font-bold text-neutral-900">{totalSize}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100">
              <svg
                className="h-5 w-5 text-accent-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-neutral-500">File Types</p>
              <div className="mt-1 flex gap-2 text-xs font-medium">
                <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">
                  PDF: {fileTypeCounts.PDF}
                </span>
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">
                  DOCX: {fileTypeCounts.DOCX}
                </span>
                <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700">
                  TXT: {fileTypeCounts.TXT}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
              <svg
                className="h-5 w-5 text-success-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Status</p>
              <p className="text-lg font-semibold text-success-600">All Processed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Uploads */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Recent Uploads</h2>
          {totalDocuments > RECENT_UPLOADS_COUNT && (
            <button
              type="button"
              onClick={handleNavigateHistory}
              className="text-sm font-medium text-primary-600 transition hover:text-primary-700"
            >
              View all →
            </button>
          )}
        </div>

        {recentDocuments.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9.75m3 0H9.75m0 0v3m0-3v-3m-3.375-3H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
            <h3 className="mt-4 text-sm font-semibold text-neutral-900">
              No documents yet
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Get started by uploading your first document.
            </p>
            <button
              type="button"
              onClick={handleNavigateUpload}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Upload Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentDocuments.map((doc) => (
              <DocumentCard
                key={doc.metadata.id}
                document={doc}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;