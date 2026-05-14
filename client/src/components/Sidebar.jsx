import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Kanban, LogOut, Database, Building2, Wallet, Fuel } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to:'/',                 icon:LayoutDashboard, label:'Dashboard',           color:'#38bdf8' },
  { to:'/commissions',      icon:Wallet,          label:'Commissions',         color:'#10b981' },
  { to:'/solution-express', icon:Building2,       label:'Solution Express',    color:'#818cf8' },
  { to:'/pipeline',         icon:Kanban,          label:'Pipeline',            color:'#c084fc' },
  { to:'/essence',          icon:Fuel,            label:'Indemnité Carburant', color:'#fb923c' },
  { to:'/database',         icon:Database,        label:'Base de données',     color:'#f472b6' },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

export default function Sidebar() {
  const { user, logout }  = useAuth();
  const navigate          = useNavigate();
  const isMobile          = useIsMobile();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => { logout(); toast.success('Déconnecté'); navigate('/login'); };

  const w = expanded ? '240px' : '70px';
  document.documentElement.style.setProperty('--sidebar-w', isMobile ? '0px' : w);

  // ── MOBILE — bottom nav ──────────────────────────────────────────────────
  if (isMobile) {
    return (
      <nav style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:200,
        background:'rgba(2,8,16,0.97)',
        borderTop:'1px solid rgba(59,130,246,0.12)',
        backdropFilter:'blur(28px)',
        display:'flex', alignItems:'center',
        padding:'6px 2px 14px',
        boxShadow:'0 -8px 40px rgba(0,0,0,0.45)'
      }}>
        {NAV.map(({ to, icon: Icon, label, color }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            padding:'6px 2px', borderRadius:10,
            color: isActive ? color : 'rgba(139,154,184,0.7)',
            textDecoration:'none',
            transition:'color 0.2s',
            position:'relative'
          })}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <div style={{
                    position:'absolute', top:-6, left:'50%', transform:'translateX(-50%)',
                    width:20, height:2.5, borderRadius:2,
                    background:`linear-gradient(90deg,${color},${color}aa)`,
                    boxShadow:`0 0 10px ${color}99`
                  }}/>
                )}
                <div style={{
                  width:34, height:34, borderRadius:9,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: isActive ? `${color}1a` : 'transparent',
                  transition:'background 0.2s, transform 0.2s',
                  transform: isActive ? 'scale(1.12)' : 'scale(1)'
                }}>
                  <Icon size={18} style={{ filter: isActive ? `drop-shadow(0 0 5px ${color}99)` : 'none', transition:'filter 0.2s' }}/>
                </div>
                <span style={{ fontSize:9, fontWeight: isActive ? 700 : 500, letterSpacing:0.2, opacity: isActive ? 1 : 0.7, transition:'opacity 0.2s' }}>
                  {label.split(' ')[0]}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    );
  }

  // ── DESKTOP — collapsible sidebar ────────────────────────────────────────
  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        width: w,
        background:'rgba(2,8,16,0.98)',
        borderRight:'1px solid rgba(255,255,255,0.06)',
        position:'fixed', top:0, left:0, bottom:0,
        display:'flex', flexDirection:'column',
        zIndex:100,
        transition:'width 0.35s cubic-bezier(0.4,0,0.2,1)',
        overflow:'hidden',
        backdropFilter:'blur(24px)',
        boxShadow: expanded
          ? '6px 0 48px rgba(0,0,0,0.45), 2px 0 0 rgba(59,130,246,0.06)'
          : '4px 0 20px rgba(0,0,0,0.35)'
      }}>

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div style={{
        padding:'18px 17px 16px',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        display:'flex', alignItems:'center', gap:11,
        flexShrink:0
      }}>
        {/* Mini logo — hexagone + courbe + goutte (identique à la Login) */}
        <div style={{
          minWidth:36, height:36, borderRadius:10,
          background:'linear-gradient(145deg,#041612 0%,#073322 55%,#041612 100%)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: expanded
            ? '0 0 24px rgba(18,183,106,0.55), 0 0 50px rgba(18,183,106,0.18)'
            : '0 0 12px rgba(18,183,106,0.32)',
          flexShrink:0,
          transition:'box-shadow 0.35s ease',
          position:'relative', overflow:'hidden'
        }}>
          <svg viewBox="0 0 100 100" width="22" height="22" style={{ overflow:'visible' }}>
            <defs>
              <linearGradient id="sb_lg1" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#12b76a"/>
                <stop offset="100%" stopColor="#61DAFB"/>
              </linearGradient>
              <linearGradient id="sb_lg2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#61DAFB" stopOpacity="0.95"/>
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.75"/>
              </linearGradient>
            </defs>
            {/* Hexagone externe */}
            <polygon points="94,50 72,88 28,88 6,50 28,12 72,12"
              fill="none" stroke="url(#sb_lg1)" strokeWidth="3.5" strokeLinejoin="round"/>
            {/* Courbe commission */}
            <polyline points="22,76 36,61 50,49 64,37 77,24"
              fill="none" stroke="url(#sb_lg1)" strokeWidth="4"
              strokeLinecap="round" strokeLinejoin="round"/>
            {/* Goutte carburant */}
            <path d="M77,14 C77,14 70,22 70,27 C70,30.9 73.1,34 77,34 C80.9,34 84,30.9 84,27 C84,22 77,14 77,14Z"
              fill="url(#sb_lg2)"/>
          </svg>
        </div>

        {/* Texte — visible seulement en expanded */}
        <div style={{
          opacity: expanded ? 1 : 0,
          transform: expanded ? 'translateX(0)' : 'translateX(-8px)',
          transition:'opacity 0.25s ease, transform 0.25s ease',
          pointerEvents: expanded ? 'auto' : 'none',
          whiteSpace:'nowrap', overflow:'hidden'
        }}>
          <div style={{
            fontFamily:'var(--font-display)', fontWeight:800, fontSize:13.5,
            letterSpacing:'-0.3px',
            background:'linear-gradient(135deg,#e8fff5 0%,#12b76a 30%,#61DAFB 70%,#a78bfa 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'
          }}>
            SecureFlow
          </div>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav style={{ flex:1, padding:'12px 9px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto', overflowX:'hidden' }}>
        {NAV.map(({ to, icon: Icon, label, color }, idx) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            display:'flex', alignItems:'center', gap:14,
            padding:'10px 13px', borderRadius:10,
            color: isActive ? color : 'var(--text-secondary)',
            background: isActive ? `${color}14` : 'transparent',
            borderLeft: `2px solid ${isActive ? color : 'transparent'}`,
            fontSize:13, fontWeight: isActive ? 600 : 400,
            transition:'all 0.18s ease',
            textDecoration:'none',
            boxShadow: isActive ? `inset 0 0 24px ${color}0a` : 'none',
            willChange:'background, color',
          })}>
            {({ isActive }) => (
              <>
                <div style={{
                  minWidth:18, display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0,
                  filter: isActive ? `drop-shadow(0 0 5px ${color}aa)` : 'none',
                  transition:'filter 0.2s, transform 0.2s',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)'
                }}>
                  <Icon size={18}/>
                </div>
                <span style={{
                  opacity: expanded ? 1 : 0,
                  transform: expanded ? 'translateX(0)' : 'translateX(-6px)',
                  transition:`opacity 0.22s ease ${idx * 0.025}s, transform 0.22s ease ${idx * 0.025}s`,
                  whiteSpace:'nowrap', overflow:'hidden',
                  pointerEvents: expanded ? 'auto' : 'none'
                }}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User + Logout ─────────────────────────────────────────────────── */}
      <div style={{ padding:'12px 9px', borderTop:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>

        {/* Avatar card */}
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'9px 11px', borderRadius:10,
          background:'rgba(16,185,129,0.06)',
          border:`1px solid ${expanded ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.1)'}`,
          marginBottom:6,
          transition:'border-color 0.25s, box-shadow 0.25s',
          boxShadow: expanded ? '0 2px 16px rgba(16,185,129,0.1)' : 'none',
          overflow:'hidden'
        }}>
          <img src="/logo.jpg" alt="Logo"
            style={{ minWidth:30, height:30, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'1.5px solid rgba(16,185,129,0.3)' }}/>
          <div style={{
            flex:1, minWidth:0,
            opacity: expanded ? 1 : 0,
            transform: expanded ? 'translateX(0)' : 'translateX(-6px)',
            transition:'opacity 0.22s ease 0.05s, transform 0.22s ease 0.05s',
            pointerEvents: expanded ? 'auto' : 'none'
          }}>
            <div style={{ fontSize:12.5, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'var(--text-primary)' }}>{user?.name}</div>
            <div style={{ fontSize:10.5, color:'var(--text-muted)', textTransform:'capitalize', marginTop:1 }}>{user?.role}</div>
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          style={{
            width:'100%', display:'flex', alignItems:'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap:12, padding:'9px 13px', borderRadius:10,
            background:'transparent', border:'1px solid transparent',
            color:'var(--text-secondary)', cursor:'pointer',
            fontSize:13, fontWeight:500,
            transition:'background 0.18s, color 0.18s, border-color 0.18s',
            overflow:'hidden'
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.color='#ef4444'; e.currentTarget.style.borderColor='rgba(239,68,68,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.borderColor='transparent'; }}>
          <LogOut size={16} style={{ flexShrink:0 }}/>
          <span style={{
            opacity: expanded ? 1 : 0,
            transform: expanded ? 'translateX(0)' : 'translateX(-6px)',
            transition:'opacity 0.22s ease 0.05s, transform 0.22s ease 0.05s',
            whiteSpace:'nowrap'
          }}>
            Déconnexion
          </span>
        </button>
      </div>
    </aside>
  );
}
