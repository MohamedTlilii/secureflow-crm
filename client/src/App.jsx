import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GoogleAlerts from './pages/GoogleAlerts';
import Pipeline from './pages/Pipeline';
import Database from './pages/Database'
import Sidebar from './components/Sidebar';
import SolutionExpress from './pages/SolutionExpress';

import './index.css';

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-primary)' }}>
      <div style={{ width:32, height:32, border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/google-alerts" element={<ProtectedLayout><GoogleAlerts /></ProtectedLayout>} />
      <Route path="/solution-express" element={<ProtectedLayout><SolutionExpress /></ProtectedLayout>} />

      <Route path="/pipeline" element={<ProtectedLayout><Pipeline /></ProtectedLayout>} />
      <Route path="/database" element={<ProtectedLayout><Database /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: '13px' }
        }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
