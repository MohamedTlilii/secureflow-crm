// ════════════════════════════════════════════════════════════════════════════
// client/src/components/Sidebar.jsx
// ════════════════════════════════════════════════════════════════════════════
// RESPONSIVE  : Mobile (< 768px) → bottom nav bar / Desktop → sidebar collapsible
// DESIGN      : Glassmorphism, gradient actif, glow icônes, avatar animé
// ANIMATIONS  : hover scale icônes, active glow, expand/collapse smooth
// LOGIQUE     : Toutes les fonctionnalités originales intactes
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Kanban, Shield, LogOut, Database, Building2, Wallet,Fuel } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ════════════════════════════════════════════════════════════════════════════
// NAVIGATION — pour ajouter une page : { to, icon, label, color }
// ════════════════════════════════════════════════════════════════════════════
const NAV = [
  { to:'/',                 icon:LayoutDashboard, label:'Dashboard',        color:'#15a5d9' },
  { to:'/commissions',      icon:Wallet,          label:'Commissions',      color:'#12b76a' },
  { to:'/solution-express', icon:Building2,       label:'Solution Express', color:'#2215d4' },
  { to:'/pipeline',         icon:Kanban,          label:'Pipeline',         color:'#ad19b3' },
  { to:'/essence',          icon:Fuel,          label:'Essence',          color:'#e89613' },
  { to:'/database',         icon:Database,        label:'Base de données',  color:'#e2287f' },
];

// ════════════════════════════════════════════════════════════════════════════
// HOOK : useIsMobile — breakpoint 768px
// ════════════════════════════════════════════════════════════════════════════
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const isMobile         = useIsMobile();
  const [isHovered, setIsHovered] = useState(false); // Expand/collapse desktop

  // ── Logout ────────────────────────────────────────────────────────────
  const handleLogout = () => { logout(); toast.success('Déconnecté'); navigate('/login'); };

  // ── Initiales avatar ──────────────────────────────────────────────────
  const initials = user
    ? (user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2))
    : 'AS';

  // ── Largeur sidebar desktop ───────────────────────────────────────────
  const width = isHovered ? '240px' : '70px';
  document.documentElement.style.setProperty('--sidebar-w', isMobile ? '0px' : width);

  // ════════════════════════════════════════════════════════════════════════
  // MOBILE — Bottom navigation bar
  // ════════════════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <nav style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:200,
        background:'var(--bg-card)',
        borderTop:'1px solid var(--border)',
        backdropFilter:'blur(20px)',
        display:'flex', alignItems:'center',
        padding:'8px 4px 12px', // padding-bottom pour safe area iPhone
        boxShadow:'0 -4px 24px rgba(0,0,0,0.15)'
      }}>
        {NAV.map(({ to, icon: Icon, label, color }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            padding:'6px 4px', borderRadius:10,
            color: isActive ? color : 'var(--text-muted)',
            textDecoration:'none', transition:'all 0.2s',
            position:'relative'
          })}>
            {({ isActive }) => (
              <>
                {/* Point indicateur actif */}
                {isActive && (
                  <div style={{
                    position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
                    width:24, height:3, borderRadius:2,
                    background:color, boxShadow:`0 0 8px ${color}`
                  }}/>
                )}
                {/* Fond coloré si actif */}
                <div style={{
                  width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center',
                  background: isActive ? `${color}18` : 'transparent',
                  transition:'all 0.2s',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)'
                }}>
                  <Icon size={20}/>
                </div>
                <span style={{ fontSize:9, fontWeight: isActive ? 700 : 500, letterSpacing:0.3 }}>
                  {label.split(' ')[0]}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // DESKTOP — Sidebar collapsible 70px → 240px
  // ════════════════════════════════════════════════════════════════════════
  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width,
        background:'var(--bg-secondary)',
        borderRight:'1px solid var(--border)',
        position:'fixed', top:0, left:0, bottom:0,
        display:'flex', flexDirection:'column',
        zIndex:100,
        transition:'width 0.3s ease',
        overflow:'hidden',
        boxShadow: isHovered ? '4px 0 24px rgba(0,0,0,0.1)' : 'none'
      }}>

      {/* ── Logo ── */}
      <div style={{
        padding:'22px 17px 20px', borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'center', gap:12
      }}>
        {/* Icône logo avec glow */}
        <div style={{
          minWidth:36, height:36, borderRadius:10,
          background:'linear-gradient(135deg,var(--accent),#6b46fa)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: isHovered ? '0 0 20px var(--accent-glow)' : '0 0 10px var(--accent-glow)',
          flexShrink:0, transition:'box-shadow 0.3s'
        }}>
          <Shield size={18} color="#fff"/>
        </div>
        {/* Nom app — visible seulement quand expanded */}
        {isHovered && (
          <div className="animate-fade">
            <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:15, letterSpacing:'-0.3px' }}>SecureFlow</div>
            {/* <div style={{ fontSize:11, color:'var(--text-muted)' }}>CRM Sécurité</div> */}
          </div>
        )}
      </div>
 
      {/* ── Navigation ── */}
      <nav style={{ flex:1, padding:'14px 10px', display:'flex', flexDirection:'column', gap:3 }}>
        {NAV.map(({ to, icon: Icon, label, color }, idx) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            display:'flex', alignItems:'center', gap:14,
            padding:'10px 13px', borderRadius:10,
            color: isActive ? color : 'var(--text-secondary)',
            background: isActive ? `${color}12` : 'transparent',
            borderLeft: isActive ? `2px solid ${color}` : '2px solid transparent',
            fontSize:13, fontWeight: isActive ? 600 : 500,
            transition:'all 0.18s', textDecoration:'none',
            // Glow subtil si actif
            boxShadow: isActive ? `inset 0 0 20px ${color}08` : 'none',
            // Animation décalée à l'apparition
            animationDelay:`${idx * 0.05}s`
          })}>
            {({ isActive }) => (
              <>
                {/* Icône avec scale au hover */}
                <div style={{
                  minWidth:18, display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'transform 0.2s',
                  filter: isActive ? `drop-shadow(0 0 4px ${color}80)` : 'none'
                }}>
                  <Icon size={18} style={{ flexShrink:0 }}/>
                </div>
                {/* Label — visible seulement quand expanded */}
                {isHovered && <span className="animate-fade">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Section utilisateur ── */}
      <div style={{ padding:'14px 10px', borderTop:'1px solid var(--border)' }}>

        {/* Card avatar + infos */}
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'10px', borderRadius:10,
          background:'var(--bg-card)', border:'1px solid var(--border)',
          marginBottom:8, transition:'all 0.2s',
          boxShadow: isHovered ? '0 2px 12px rgba(0,0,0,0.08)' : 'none'
        }}>
          {/* Avatar image ou initiales */}
          {user?.avatar && user.avatar.includes('http') ? (
            <img src={user.avatar} alt="Avatar"
              onError={e => e.target.style.display='none'}
              style={{ minWidth:32, height:32, borderRadius:'50%', objectFit:'cover', flexShrink:0 }}/>
          ) : (
            <div className="avatar av-blue" style={{ minWidth:32, height:32, fontSize:12, flexShrink:0 }}>{initials}</div>
          )}
          {/* Nom + rôle */}
          {isHovered && (
            <div style={{ flex:1, minWidth:0 }} className="animate-fade">
              <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'capitalize' }}>{user?.role}</div>
            </div>
          )}
        </div>

        {/* Bouton déconnexion */}
        <button onClick={handleLogout} className="btn btn-ghost"
          style={{
            width:'100%', justifyContent: isHovered?'flex-start':'center',
            color:'var(--text-secondary)', padding:'10px', borderRadius:10,
            transition:'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(240,68,56,0.08)'; e.currentTarget.style.color='#f04438'; }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-secondary)'; }}>
          <LogOut size={16}/>
          {isHovered && <span style={{ marginLeft:12 }}>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
