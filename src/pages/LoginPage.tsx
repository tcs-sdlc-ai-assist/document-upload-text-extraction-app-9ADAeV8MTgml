import React, { useState, useCallback, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { APP_NAME, ROUTES, PASSWORD_RULES } from '../constants';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { addNotification } = useNotifications();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.dashboard, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateForm = useCallback((): boolean => {
    let valid = true;
    setUsernameError('');
    setPasswordError('');
    setFormError('');

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setUsernameError('Username is required.');
      valid = false;
    } else if (trimmedUsername.length < 3) {
      setUsernameError('Username must be at least 3 characters.');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    } else if (password.length < PASSWORD_RULES.minLength) {
      setPasswordError(`Password must be at least ${PASSWORD_RULES.minLength} characters.`);
      valid = false;
    }

    return valid;
  }, [username, password]);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      setFormError('');

      try {
        const success = login(username.trim(), password);

        if (success) {
          addNotification('success', 'Login successful. Welcome back!');
          navigate(ROUTES.dashboard, { replace: true });
        } else {
          setFormError('Invalid username or password. Please try again.');
          addNotification('error', 'Login failed. Invalid credentials.');
        }
      } catch (_err) {
        setFormError('An unexpected error occurred. Please try again.');
        addNotification('error', 'An unexpected error occurred during login.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [username, password, validateForm, login, navigate, addNotification],
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900">
            Sign in to {APP_NAME}
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            Upload, extract, and manage your documents
          </p>
        </div>

        {/* Form */}
        <div className="rounded-xl bg-white p-8 shadow-card">
          {formError && (
            <div
              className="mb-6 rounded-lg bg-error-50 border border-error-500/20 p-4 text-sm text-error-700"
              role="alert"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-error-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{formError}</span>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Username Field */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-sm font-medium text-neutral-700"
              >
                Username
              </label>
              <div className="mt-1">
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (usernameError) setUsernameError('');
                    if (formError) setFormError('');
                  }}
                  disabled={isSubmitting}
                  className={`block w-full rounded-lg border px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-neutral-100 ${
                    usernameError
                      ? 'border-error-500 focus:border-error-500 focus:ring-error-500/30'
                      : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/30'
                  }`}
                  placeholder="Enter your username"
                  aria-invalid={!!usernameError}
                  aria-describedby={usernameError ? 'login-username-error' : undefined}
                />
              </div>
              {usernameError && (
                <p id="login-username-error" className="mt-1.5 text-sm text-error-600" role="alert">
                  {usernameError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-neutral-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                    if (formError) setFormError('');
                  }}
                  disabled={isSubmitting}
                  className={`block w-full rounded-lg border px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-neutral-100 ${
                    passwordError
                      ? 'border-error-500 focus:border-error-500 focus:ring-error-500/30'
                      : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/30'
                  }`}
                  placeholder="Enter your password"
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'login-password-error' : undefined}
                />
              </div>
              {passwordError && (
                <p id="login-password-error" className="mt-1.5 text-sm text-error-600" role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-primary-400"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Signing in…</span>
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Signup Link */}
        <p className="text-center text-sm text-neutral-500">
          Don&apos;t have an account?{' '}
          <Link
            to={ROUTES.signup}
            className="font-semibold text-primary-600 hover:text-primary-500 transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;