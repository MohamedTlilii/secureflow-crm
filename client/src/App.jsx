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
import Parametres from './pages/Parametres';

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
        <div style={{ position:'absolute', inset:0, borderRadius:18, background:'linear-gradient(145deg,#041612 0%,#073322 55%,#041612 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 40px rgba(16,185,129,0.4)' }}>
          <svg viewBox="0 0 100 100" width="44" height="44" style={{ overflow:'visible' }}>
            <defs>
              <linearGradient id="spl1" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#12b76a"/>
                <stop offset="100%" stopColor="#61DAFB"/>
              </linearGradient>
              <linearGradient id="spl2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#61DAFB" stopOpacity="0.95"/>
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.75"/>
              </linearGradient>
              <linearGradient id="spl3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#12b76a" stopOpacity="0.18"/>
                <stop offset="100%" stopColor="#12b76a" stopOpacity="0.02"/>
              </linearGradient>
              <filter id="spgw" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <polygon points="94,50 72,88 28,88 6,50 28,12 72,12" fill="none" stroke="url(#spl1)" strokeWidth="1.6" filter="url(#spgw)"/>
            <polygon points="80,50 65,76 35,76 20,50 35,24 65,24" fill="none" stroke="rgba(18,183,106,0.13)" strokeWidth="0.8"/>
            <polygon points="22,80 22,76 36,61 50,49 64,37 77,24 77,80" fill="url(#spl3)"/>
            <polyline points="22,76 36,61 50,49 64,37 77,24" fill="none" stroke="url(#spl1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#spgw)"/>
            {[[22,76],[36,61],[50,49],[64,37]].map(([x,y], i) => (
              <circle key={i} cx={x} cy={y} r="3" fill="#12b76a" filter="url(#spgw)"/>
            ))}
            <path d="M77,14 C77,14 70,22 70,27 C70,30.9 73.1,34 77,34 C80.9,34 84,30.9 84,27 C84,22 77,14 77,14Z" fill="url(#spl2)" filter="url(#spgw)"/>
            <path d="M74,17.5 C74,17.5 72.5,22 72.5,25" fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
        {/* Orbit ring */}
        <div style={{ position:'absolute', inset:-10, borderRadius:'50%', border:'1.5px solid transparent', borderTopColor:'rgba(16,185,129,0.6)', borderRightColor:'rgba(59,130,246,0.3)', animation:'spin 1.2s linear infinite' }}/>
        <div style={{ position:'absolute', inset:-18, borderRadius:'50%', border:'1px solid transparent', borderBottomColor:'rgba(59,130,246,0.4)', borderLeftColor:'rgba(16,185,129,0.2)', animation:'spin 2s linear infinite reverse' }}/>
      </div>
      <div style={{ textAlign:'center' }}>
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

      {/* /parametres → Settings page (protected) */}
      <Route path="/parametres" element={<ProtectedLayout><Parametres /></ProtectedLayout>} />

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