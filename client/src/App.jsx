import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Database from './pages/Database'
import Sidebar from './components/Sidebar';
import SolutionExpress from './pages/SolutionExpress';
import Commissions from './pages/Commissions';
import Essence from './pages/Essence';

import './index.css';

// ─── Protected Layout ─────────────────────────────────────────────────────────
// Wraps any page that requires the user to be logged in.
// - If auth is still loading → show a centered spinner
// - If no user → redirect to /login
// - If user exists → render Sidebar + the page content (children)
const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth(); // Pull auth state from context

  // Show a spinning loader while auth state is being determined
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-primary)' }}>
      {/* Spinner: styled with CSS variables, animated with 'spin' keyframe from index.css */}
      <div style={{ width:32, height:32, border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    </div>
  );

  // Not logged in → kick to login page (replace prevents back-button loop)
  if (!user) return <Navigate to="/login" replace />;

  // Logged in → render the full app shell: sidebar + page
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
};

// ─── App Routes ───────────────────────────────────────────────────────────────
// Defines all routes in the app.
// useAuth() here is used to redirect already-logged-in users away from /login
const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      {/* /login → if already logged in, go home; otherwise show Login page */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* / → Dashboard (protected) */}
      <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />

      {/* /commissions → Commissions page (protected) */}
      <Route path="/commissions" element={<ProtectedLayout><Commissions /></ProtectedLayout>} />

      {/* /solution-express → SolutionExpress page (protected) */}
      <Route path="/solution-express" element={<ProtectedLayout><SolutionExpress /></ProtectedLayout>} />

      {/* /pipeline → Pipeline page (protected) */}
      <Route path="/pipeline" element={<ProtectedLayout><Pipeline /></ProtectedLayout>} />


      <Route path="/essence" element={<ProtectedLayout><Essence /></ProtectedLayout>} />

      {/* /database → Database page (protected) */}
      <Route path="/database" element={<ProtectedLayout><Database /></ProtectedLayout>} />

      {/* Any unknown route → redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// ─── App Root ─────────────────────────────────────────────────────────────────
// The root component that bootstraps the entire app:
// AuthProvider → supplies auth state to all components via context
// BrowserRouter → enables client-side routing
// Toaster     → global toast notification system (top-right, styled with CSS vars)
// AppRoutes   → renders the correct page based on the current URL
export default function App() {
  return (
    <AuthProvider> {/* Makes user/loading/login/logout available everywhere */}
      <BrowserRouter> {/* Enables <Route>, <Link>, <Navigate> etc. */}

        {/* Global toast config — change position or style here to affect all toasts */}
        <Toaster position="top-right" toastOptions={{
          style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: '13px' }
        }} />

        <AppRoutes /> {/* All route definitions live here */}
      </BrowserRouter>
    </AuthProvider>
  );
}