// src/App.tsx
import { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { Toaster } from 'sonner';
import { ToastContainer } from '@/components/notifications/ToastContainer';
import { RemindersPanel } from '@/components/notifications/RemindersPanel';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import CalendarPage from '@/pages/CalendarPage';
import CampaignsPage from '@/pages/CampaignsPage';
import DialerPage from '@/pages/DialerPage';
import SettingsPage from '@/pages/SettingsPage';
import DiagnosticsPage from '@/pages/DiagnosticsPage';
import { OwnersListPage } from '@/pages/OwnersManagementPage';

// Layout
import DashboardLayout from '@/components/layout/DashboardLayout';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Toaster position="top-right" />
          <ToastContainer />
          <RemindersPanel />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/diagnostics" element={<DiagnosticsPage />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <DashboardLayout />
                </PrivateRoute>
              }
          >
            <Route index element={<DashboardPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="dialer" element={<DialerPage />} />
            <Route path="owners" element={<OwnersListPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
