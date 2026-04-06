import React, { useState, useCallback, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { APP_NAME, ROUTES, PASSWORD_RULES } from '../constants';

export function SignupPage() {
  const { signup, isAuthenticated } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    navigate(ROUTES.dashboard, { replace: true });
  }

  const validateForm = useCallback((): boolean => {
    let valid = true;

    setUsernameError('');
    setPasswordError('');
    setConfirmPasswordError('');

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setUsernameError('Username is required.');
      valid = false;
    } else if (trimmedUsername.length < 3) {
      setUsernameError('Username must be at least 3 characters.');
      valid = false;
    } else if (trimmedUsername.length > 32) {
      setUsernameError('Username must be at most 32 characters.');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    } else if (password.length < PASSWORD_RULES.minLength) {
      setPasswordError(`Password must be at least ${PASSWORD_RULES.minLength} characters.`);
      valid = false;
    } else if (password.length > PASSWORD_RULES.maxLength) {
      setPasswordError(`Password must be at most ${PASSWORD_RULES.maxLength} characters.`);
      valid = false;
    } else if (!PASSWORD_RULES.pattern.test(password)) {
      setPasswordError(PASSWORD_RULES.message);
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.');
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      valid = false;
    }

    return valid;
  }, [username, password, confirmPassword]);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);

      try {
        const success = signup(username.trim(), password);

        if (success) {
          addNotification('success', 'Account created successfully! Welcome to ' + APP_NAME + '.');
          navigate(ROUTES.dashboard, { replace: true });
        } else {
          setUsernameError('Username is already taken. Please choose a different one.');
        }
      } catch {
        addNotification('error', 'An unexpected error occurred during signup. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [username, password, validateForm, signup, addNotification, navigate],
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="rounded-2xl bg-white p-8 shadow-soft">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-primary-600">{APP_NAME}</h1>
            <p className="mt-2 text-sm text-neutral-500">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="username" className="mb-1 block text-sm font-medium text-neutral-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (usernameError) setUsernameError('');
                }}
                disabled={isSubmitting}
                className={`block w-full rounded-lg border px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  usernameError
                    ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
                    : 'border-neutral-300 focus:border-primary-500'
                } disabled:cursor-not-allowed disabled:bg-neutral-100`}
                placeholder="Choose a username"
              />
              {usernameError && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {usernameError}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                disabled={isSubmitting}
                className={`block w-full rounded-lg border px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  passwordError
                    ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
                    : 'border-neutral-300 focus:border-primary-500'
                } disabled:cursor-not-allowed disabled:bg-neutral-100`}
                placeholder="Create a password"
              />
              {passwordError && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-neutral-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) setConfirmPasswordError('');
                }}
                disabled={isSubmitting}
                className={`block w-full rounded-lg border px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  confirmPasswordError
                    ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
                    : 'border-neutral-300 focus:border-primary-500'
                } disabled:cursor-not-allowed disabled:bg-neutral-100`}
                placeholder="Re-enter your password"
              />
              {confirmPasswordError && (
                <p className="mt-1 text-xs text-error-600" role="alert">
                  {confirmPasswordError}
                </p>
              )}
            </div>

            <div className="pt-1">
              <p className="text-xs text-neutral-400">
                {PASSWORD_RULES.message}
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
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
                  Creating account…
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500">
              Already have an account?{' '}
              <Link
                to={ROUTES.login}
                className="font-medium text-primary-600 transition-colors hover:text-primary-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;