import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { FullPageLoader } from '@/components/ui/LoadingState';
import { DesktopNav } from '@/components/layout/DesktopNav';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { GroupsPage } from '@/pages/GroupsPage';
import { CreateGroupPage } from '@/pages/CreateGroupPage';
import { JoinGroupPage } from '@/pages/JoinGroupPage';
import { GroupDetailPage } from '@/pages/GroupDetailPage';
import { AddExpensePage } from '@/pages/AddExpensePage';
import { ActivityPage } from '@/pages/ActivityPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { MemberDetailPage } from '@/pages/MemberDetailPage';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-100">
      <div className="flex">
        <DesktopNav />
        <main className="flex-1 pb-20 lg:pb-6 min-h-screen">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignupPage />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/groups" element={<ProtectedRoute><AppLayout><GroupsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/groups/new" element={<ProtectedRoute><AppLayout><CreateGroupPage /></AppLayout></ProtectedRoute>} />
      <Route path="/groups/join" element={<ProtectedRoute><AppLayout><JoinGroupPage /></AppLayout></ProtectedRoute>} />
      <Route path="/groups/:id" element={<ProtectedRoute><AppLayout><GroupDetailPage /></AppLayout></ProtectedRoute>} />
      <Route path="/groups/:id/add-expense" element={<ProtectedRoute><AppLayout><AddExpensePage /></AppLayout></ProtectedRoute>} />
      <Route path="/groups/:id/members/:memberId" element={<ProtectedRoute><AppLayout><MemberDetailPage /></AppLayout></ProtectedRoute>} />
      <Route path="/add-expense" element={<ProtectedRoute><AppLayout><AddExpensePage /></AppLayout></ProtectedRoute>} />
      <Route path="/activity" element={<ProtectedRoute><AppLayout><ActivityPage /></AppLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><AppLayout><NotificationsPage /></AppLayout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
