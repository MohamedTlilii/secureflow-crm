// ════════════════════════════════════════════════════════════════════════════
// client/src/components/Sidebar.jsx
// Collapsible sidebar: 70px (icons only) → 240px (icons + labels) on hover.
// Updates --sidebar-w CSS variable so main-content shifts automatically.
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Kanban, Shield, LogOut, Database, Building2, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ── Navigation items ─────────────────────────────────────────────────────────
// To add a new page: add an object here with { to, icon, label, color }
// icon  → any Lucide icon component
// color → active state color for that nav item (border + text)
const NAV = [
  { to: '/',                 icon: LayoutDashboard, label: 'Dashboard',        color: '#15a5d9' },
  { to: '/commissions',      icon: Wallet,          label: 'Commissions',      color: '#12b76a' },
  { to: '/solution-express', icon: Building2,       label: 'Solution Express', color: '#2215d4' },
  { to: '/pipeline',         icon: Kanban,          label: 'Pipeline',         color: '#ad19b3' },
  { to: '/database',         icon: Database,        label: 'Base de données',  color: '#e2287f' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();   // user = logged-in user object, logout = clears token
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false); // Controls expanded/collapsed state

  // ── Logout handler ────────────────────────────────────────────────────────
  // Logs out, shows toast, then redirects to /login
  const handleLogout = () => { logout(); toast.success('Déconnecté'); navigate('/login'); };

  // ── User initials ─────────────────────────────────────────────────────────
  // Shown in avatar when no image URL is available.
  // e.g. "Adam Smith" → "AS" | Fallback: "AS" if no user
  const initials = user ? (user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)) : 'AS';

  // ── Sidebar width ─────────────────────────────────────────────────────────
  // Collapsed: 70px (icons only) | Expanded: 240px (icons + labels)
  // Also updates --sidebar-w on <html> so .main-content margin shifts in sync
  const width = isHovered ? '240px' : '70px'; // ← Change these values to resize the sidebar
  document.documentElement.style.setProperty('--sidebar-w', width);

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}  // Expand on hover
      onMouseLeave={() => setIsHovered(false)} // Collapse on mouse leave
      style={{
        width,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        position: 'fixed', top: 0, left: 0, bottom: 0, // Full-height fixed sidebar
        display: 'flex', flexDirection: 'column',
        zIndex: 100,                        // Sits above page content
        transition: 'width 0.3s ease',     // Must match transition in .main-content (index.css)
        overflow: 'hidden'                  // Hides labels when collapsed
      }}
    >

      {/* ── Logo ─────────────────────────────────────────────────────────────
          Always shows the Shield icon. Brand name + subtitle appear only when expanded.
          Edit font, size, or subtitle text here. */}
      <div style={{ padding: '24px 17px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          minWidth: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--accent), #6b46fa)', // Logo gradient — edit colors here
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px var(--accent-glow)', flexShrink: 0
        }}>
          <Shield size={18} color="#fff" /> {/* Logo icon — swap with any Lucide icon */}
        </div>
        {isHovered && (
          <div className="animate-fade">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px' }}>SecureFlow</div> {/* App name — edit here */}
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CRM Sécurité</div> {/* Subtitle — edit here */}
          </div>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────────
          Loops over NAV array above. Active route gets colored border + text.
          end={to==='/'} prevents Dashboard from matching all routes. */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ to, icon: Icon, label, color }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 15,
            padding: '10px 15px', borderRadius: 8,
            color: isActive ? (color || 'var(--text-primary)') : 'var(--text-secondary)',
            background: isActive ? 'var(--bg-hover)' : 'transparent',
            borderLeft: isActive ? `2px solid ${color || 'var(--accent)'}` : '2px solid transparent', // Active indicator — change thickness here
            fontSize: 13, fontWeight: 500,
            transition: 'all 0.15s', textDecoration: 'none'
          })}>
            <Icon size={18} style={{ minWidth: 18, flexShrink: 0 }} /> {/* Icon size — edit here */}
            {isHovered && <span className="animate-fade">{label}</span>} {/* Label hidden when collapsed */}
          </NavLink>
        ))}
      </nav>

      {/* ── User Section ─────────────────────────────────────────────────────
          Shows avatar (image or initials), name, role when expanded.
          Logout button always visible, label shown only when expanded. */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>

        {/* User card — avatar + name + role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 8 }}>

          {/* If user has a valid image URL → show image, else → show initials avatar */}
          {user?.avatar && user.avatar.includes('http') ? (
            <img
              src={user.avatar} alt="Avatar"
              onError={e => e.target.style.display = 'none'} // Hide broken image → falls through to initials
              style={{ minWidth: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div className="avatar av-blue" style={{ minWidth: 32, height: 32, fontSize: 12 }}>{initials}</div>
            // Avatar color class — change av-blue to av-teal, av-amber etc. (defined in index.css)
          )}

          {/* Name + role — only visible when expanded */}
          {isHovered && (
            <div style={{ flex: 1, minWidth: 0 }} className="animate-fade">
              <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
              {/* user.role comes from the backend — edit textTransform here if needed */}
            </div>
          )}
        </div>

        {/* Logout button — icon centered when collapsed, icon+label when expanded */}
        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: isHovered ? 'flex-start' : 'center', color: 'var(--text-secondary)', padding: '10px' }}
        >
          <LogOut size={16} />
          {isHovered && <span style={{ marginLeft: 12 }}>Déconnexion</span>} {/* Logout label — edit text here */}
        </button>
      </div>
    </aside>
  );
}