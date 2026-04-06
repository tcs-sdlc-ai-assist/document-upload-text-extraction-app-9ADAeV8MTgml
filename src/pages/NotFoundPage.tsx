import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 text-center">
      <div className="animate-fade-in">
        <h1 className="text-8xl font-bold text-primary-600">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-neutral-800">
          Page Not Found
        </h2>
        <p className="mt-2 max-w-md text-neutral-500">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to={ROUTES.dashboard}
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white shadow-soft transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;