import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Kanban, MessageSquare, Shield, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/prospects', icon: Users, label: 'Prospects' },
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Déconnecté');
    navigate('/login');
  };

  const initials = user ? (user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)) : 'AS';

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      position: 'fixed', top: 0, left: 0, bottom: 0,
      display: 'flex', flexDirection: 'column',
      padding: '0',
      zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent), #6b46fa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px var(--accent-glow)'
          }}>
            <Shield size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px' }}>SecureFlow</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>CRM Sécurité</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 8,
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: isActive ? 'var(--bg-hover)' : 'transparent',
            borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            fontSize: 13, fontWeight: 500,
            transition: 'all 0.15s', textDecoration: 'none'
          })}>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 8 }}>
          <div className="avatar av-blue" style={{ width: 32, height: 32, fontSize: 12 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--text-secondary)', fontSize: 13 }}>
          <LogOut size={14} /> Déconnexion
        </button>
      </div>
    </aside>
  );
}
