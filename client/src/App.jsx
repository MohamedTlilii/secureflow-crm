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

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-primary)', gap:20 }}>
      {/* Gradient logo */}
      <div style={{ position:'relative', width:64, height:64, marginBottom:4 }}>
        <div style={{ position:'absolute', inset:0, borderRadius:18, background:'linear-gradient(135deg,#10b981,#3b82f6)', opacity:0.15, filter:'blur(20px)' }}/>
        <div style={{ position:'absolute', inset:0, borderRadius:18, background:'linear-gradient(135deg,#10b981,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 40px rgba(16,185,129,0.4)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        {/* Orbit ring */}
        <div style={{ position:'absolute', inset:-10, borderRadius:'50%', border:'1.5px solid transparent', borderTopColor:'rgba(16,185,129,0.6)', borderRightColor:'rgba(59,130,246,0.3)', animation:'spin 1.2s linear infinite' }}/>
        <div style={{ position:'absolute', inset:-18, borderRadius:'50%', border:'1px solid transparent', borderBottomColor:'rgba(59,130,246,0.4)', borderLeftColor:'rgba(16,185,129,0.2)', animation:'spin 2s linear infinite reverse' }}/>
      </div>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:800, letterSpacing:'-0.4px', color:'var(--text-primary)' }}>QC</div>
        <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.14em', textTransform:'uppercase', marginTop:4, fontWeight:600 }}>Chargement…</div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
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
          style: {
            background: '#0d1b30',
            color: 'var(--text-primary)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '13px',
            fontFamily: 'var(--font-body)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(16px)',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary:'#10b981', secondary:'#fff' } },
          error:   { iconTheme: { primary:'#ef4444', secondary:'#fff' } },
        }} />

        <AppRoutes /> {/* All route definitions live here */}
      </BrowserRouter>
    </AuthProvider>
  );
}