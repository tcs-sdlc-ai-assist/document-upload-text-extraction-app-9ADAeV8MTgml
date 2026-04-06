import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationToast } from './components/NotificationToast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { HistoryPage } from './pages/HistoryPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ROUTES } from './constants';

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <NotificationToast />
            <Routes>
              {/* Public routes */}
              <Route path={ROUTES.login} element={<LoginPage />} />
              <Route path={ROUTES.signup} element={<SignupPage />} />

              {/* Protected routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path={ROUTES.dashboard} element={<DashboardPage />} />
                <Route path={ROUTES.upload} element={<UploadPage />} />
                <Route path={ROUTES.history} element={<HistoryPage />} />
                <Route path={ROUTES.documentDetail} element={<DocumentDetailPage />} />
              </Route>

              {/* Default redirect */}
              <Route path="/" element={<Navigate to={ROUTES.dashboard} replace />} />

              {/* 404 */}
              <Route path={ROUTES.notFound} element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;