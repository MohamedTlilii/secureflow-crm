import { useState, useEffect } from 'react'; // Ajouté useEffect pour les logs
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Kanban, MessageSquare, Shield, LogOut, Database, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/prospects', icon: Users, label: 'Prospects' },
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/google-alerts', icon: Bell, label: 'Google Alerts' }, // ← ajoute ici
  { to: '/database', icon: Database, label: 'Base de données' },
    

];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  // // 🧪 TEST 1 : Vérifier l'objet utilisateur complet au chargement
  // useEffect(() => {
  //   console.log("=== DEBUG USER ===");
  //   console.log("Objet user complet :", user);
  //   console.log("Valeur de l'avatar :", user?.avatar ? `"${user.avatar}"` : "VIDE ou UNDEFINED");
  // }, [user]);

  const handleLogout = () => {
    logout();
    toast.success('Déconnecté');
    navigate('/login');
  };

  const initials = user ? (user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)) : 'AS';
  const width = isHovered ? '240px' : '70px';
  document.documentElement.style.setProperty('--sidebar-w', width);

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: width,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        display: 'flex', flexDirection: 'column',
        padding: '0',
        zIndex: 100,
        transition: 'width 0.3s ease',
        overflow: 'hidden'
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 17px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          minWidth: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--accent), #6b46fa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px var(--accent-glow)'
        }}>
          <Shield size={18} color="#fff" />
        </div>
        {isHovered && (
          <div className="animate-fade">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px' }}>SecureFlow</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}> </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 15,
            padding: '10px 15px', borderRadius: 8,
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: isActive ? 'var(--bg-hover)' : 'transparent',
            borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            fontSize: 13, fontWeight: 500,
            transition: 'all 0.15s', textDecoration: 'none'
          })}>
            <Icon size={18} style={{minWidth: 18}} />
            {isHovered && <span className="animate-fade">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 8 }}>
          
          {/* 🧪 TEST 2 : On affiche l'image seulement si user.avatar contient une URL */}
          {user?.avatar && user.avatar.trim() !== "" ? (
            <img 
              src={user.avatar} 
              alt="Avatar"
              // onLoad={() => console.log("✅ Image chargée avec succès")}
              // onError={() => console.log("❌ Erreur de chargement de l'URL :", user.avatar)}
              style={{ minWidth: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div className="avatar av-blue" style={{ minWidth: 32, height: 32, fontSize: 12 }}>
              {initials}
            </div>
          )}

          {isHovered && (
            <div style={{ flex: 1, minWidth: 0 }} className="animate-fade">
              <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role}</div>
            </div>
          )}
        </div>
        <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: isHovered ? 'flex-start' : 'center', color: 'var(--text-secondary)', padding: '10px' }}>
          <LogOut size={16} />
          {isHovered && <span style={{marginLeft: 12}}>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
