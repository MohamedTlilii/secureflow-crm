import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Kanban, LogOut, Database, Building2, Wallet, Fuel, Settings, Calendar, TrendingUp, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';

const NAV = [
  { to:'/',                 icon:LayoutDashboard, label:'Dashboard',           color:'#38bdf8' },
  { to:'/commissions',      icon:Wallet,          label:'Commissions',         color:'#10b981' },
  { to:'/solution-express', icon:Building2,       label:'Solution Express',    color:'#818cf8' },
  { to:'/pipeline',         icon:Kanban,          label:'Pipeline',            color:'#c084fc' },
  { to:'/essence',          icon:Fuel,            label:'Indemnité Carburant', color:'#fb923c' },
  { to:'/database',         icon:Database,        label:'Base de données',     color:'#f472b6' },
  { to:'/parametres',       icon:Settings,        label:'Paramètres',          color:'#a78bfa' },
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
  const [expanded, setExpanded]           = useState(false);
  const [showProfile, setShowProfile]     = useState(false);
  const [stats, setStats]                 = useState(null);
  const [showAnniv, setShowAnniv]         = useState(false);
  const avatarRef                         = useRef(null);
  const panelRef                          = useRef(null);

  const handleLogout = () => { logout(); toast.success('Déconnecté'); navigate('/login'); };

  // Fermer sidebar quand le modal anniv est ouvert
  useEffect(() => { if (showAnniv) setExpanded(false); }, [showAnniv]);

  // Félicitations anniversaire — une seule fois par an
  useEffect(() => {
    const today = new Date();
    if (today.getMonth() !== 5 || today.getDate() !== 15) return; // 15 juin uniquement
    const key = `sf_anniv_${today.getFullYear()}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    setTimeout(() => setShowAnniv(true), 1200); // petit délai au chargement
  }, []);

  // Reset cache stats à chaque fermeture pour toujours avoir des données fraîches
  useEffect(() => { if (!showProfile) setStats(null); }, [showProfile]);

  // Fermer le panel au clic extérieur (ni avatar, ni panel)
  useEffect(() => {
    if (!showProfile) return;
    const handler = (e) => {
      if (
        avatarRef.current && !avatarRef.current.contains(e.target) &&
        panelRef.current  && !panelRef.current.contains(e.target)
      ) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showProfile]);

  const DEBUT = new Date('2025-06-15');

  // Charger les stats SE quand on ouvre le panel
  useEffect(() => {
    if (!showProfile || stats) return;
    api.get('/api/solution-express').then(res => {
      const fiches = res.data || [];
      if (!fiches.length) { setStats({}); return; }
      const totalPaye  = fiches.filter(f => f.commissionPayee).reduce((s, f) => s + (f.commissionTotale || 0), 0);
      const enAttente  = fiches.filter(f => !f.commissionPayee && (f.commissionTotale || 0) > 0).reduce((s, f) => s + (f.commissionTotale || 0), 0);
      setStats({ total: fiches.length, totalPaye, enAttente });
    }).catch(() => setStats({}));
  }, [showProfile]);

  const fmtDebut = (d) =>
    d.toLocaleDateString('fr-CA', { day:'numeric', month:'long', year:'numeric' });

  const anciennete = () => {
    const diff = Math.floor((Date.now() - DEBUT) / 86400000);
    if (diff < 30)  return { label:`${diff} jour${diff>1?'s':''}`,      suffix:"d'activité" };
    if (diff < 365) return { label:`${Math.floor(diff/30)} mois`,        suffix:"d'activité" };
    const y = Math.floor(diff/365);
    return { label:`${y} ans`, suffix:'dans le poste' };
  };

  const w = (expanded && !showAnniv) ? '240px' : '70px';
  document.documentElement.style.setProperty('--sidebar-w', isMobile ? '0px' : w);

  // ── MOBILE — top header + bottom nav + profile panel ────────────────────
  if (isMobile) {
    return (
      <>
        {/* ── Top header mobile ── */}
        <header style={{
          position:'fixed', top:0, left:0, right:0, zIndex:200,
          background:'rgba(2,8,16,0.97)',
          borderBottom:'1px solid rgba(59,130,246,0.12)',
          backdropFilter:'blur(28px)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 16px',
          height:56,
          boxShadow:'0 4px 24px rgba(0,0,0,0.45)'
        }}>
          {/* Logo mark + nom app */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:34, height:34, borderRadius:10,
              background:'linear-gradient(145deg,#041612 0%,#073322 55%,#041612 100%)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 14px rgba(18,183,106,0.38)',
              flexShrink:0
            }}>
              <svg viewBox="0 0 100 100" width="19" height="19" style={{ overflow:'visible' }}>
                <defs>
                  <linearGradient id="mh_lg1" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#12b76a"/>
                    <stop offset="100%" stopColor="#61DAFB"/>
                  </linearGradient>
                  <linearGradient id="mh_lg2" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#61DAFB" stopOpacity="0.95"/>
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.75"/>
                  </linearGradient>
                </defs>
                <polygon points="94,50 72,88 28,88 6,50 28,12 72,12"
                  fill="none" stroke="url(#mh_lg1)" strokeWidth="3.5" strokeLinejoin="round"/>
                <polyline points="22,76 36,61 50,49 64,37 77,24"
                  fill="none" stroke="url(#mh_lg1)" strokeWidth="4"
                  strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M77,14 C77,14 70,22 70,27 C70,30.9 73.1,34 77,34 C80.9,34 84,30.9 84,27 C84,22 77,14 77,14Z"
                  fill="url(#mh_lg2)"/>
              </svg>
            </div>
            <div style={{
              fontFamily:'var(--font-display)', fontWeight:800, fontSize:15,
              letterSpacing:'-0.3px',
              background:'linear-gradient(135deg,#e8fff5 0%,#12b76a 30%,#61DAFB 70%,#a78bfa 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'
            }}>
              SecureFlow
            </div>
          </div>

          {/* Avatar + nom + rôle — CLIQUABLE → ouvre le panel profil */}
          <div ref={avatarRef} onClick={() => setShowProfile(p => !p)}
            style={{
              display:'flex', alignItems:'center', gap:9, minWidth:0,
              padding:'5px 8px', borderRadius:10, cursor:'pointer',
              background: showProfile ? 'rgba(18,183,106,0.12)' : 'transparent',
              border:`1px solid ${showProfile ? 'rgba(18,183,106,0.35)' : 'transparent'}`,
              transition:'all 0.2s',
            }}>
            <div style={{ textAlign:'right', minWidth:0, overflow:'hidden' }}>
              <div style={{ fontSize:12.5, fontWeight:700, color:'var(--text-primary)', lineHeight:1.25, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:130 }}>{user?.name}</div>
              <div style={{ fontSize:10.5, color:'#12b76a', fontWeight:600, textTransform:'capitalize', lineHeight:1.25 }}>{user?.role}</div>
            </div>
            <img src="/logo.jpg" alt="Logo"
              style={{ width:33, height:33, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:`2px solid ${showProfile ? 'rgba(18,183,106,0.6)' : 'rgba(16,185,129,0.35)'}`, boxShadow: showProfile ? '0 0 14px rgba(18,183,106,0.4)' : '0 0 10px rgba(18,183,106,0.25)', transition:'all 0.2s' }}/>
          </div>
        </header>

        {/* ── Panel profil mobile — apparaît sous le header, coin droit ── */}
        {showProfile && (
          <div ref={panelRef} style={{
            position:'fixed', top:66, right:12,
            width:250, maxWidth:'calc(100vw - 24px)',
            background:'rgba(3,8,26,0.98)',
            border:'1px solid rgba(18,183,106,0.25)',
            borderRadius:16,
            boxShadow:'0 8px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(18,183,106,0.08)',
            backdropFilter:'blur(32px)',
            overflow:'hidden',
            animation:'profileSlideDown 0.22s cubic-bezier(0.34,1.56,0.64,1) both',
            zIndex:300
          }}>
            {/* Header panel */}
            <div style={{ background:'linear-gradient(135deg,rgba(18,183,106,0.12),transparent)', padding:'16px 14px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:11 }}>
              <img src="/logo.jpg" alt="Logo" style={{ width:44, height:44, borderRadius:11, objectFit:'cover', border:'2px solid rgba(18,183,106,0.4)', boxShadow:'0 0 16px rgba(18,183,106,0.25)', flexShrink:0 }}/>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ fontSize:13.5, fontWeight:700, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
                <div style={{ fontSize:11, color:'#12b76a', fontWeight:600, textTransform:'capitalize', marginTop:2 }}>{user?.role}</div>
              </div>
              <button onClick={() => setShowProfile(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:4, borderRadius:6, flexShrink:0, display:'flex', alignItems:'center' }}
                onTouchStart={e=>e.currentTarget.style.color='#fff'}
                onTouchEnd={e=>e.currentTarget.style.color='rgba(255,255,255,0.3)'}>
                <X size={14}/>
              </button>
            </div>

            {/* Stats */}
            <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:9 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:'rgba(18,183,106,0.06)', border:'1px solid rgba(18,183,106,0.12)' }}>
                <div style={{ width:30, height:30, borderRadius:8, background:'rgba(18,183,106,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Calendar size={14} color="#12b76a"/>
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>Actif depuis</div>
                  <div style={{ fontSize:12, color:'var(--text-primary)', fontWeight:700, marginTop:2 }}>{fmtDebut(DEBUT)}</div>
                  <div style={{ fontSize:10.5, color:'#12b76a', marginTop:1 }}>{anciennete().label} {anciennete().suffix}</div>
                </div>
              </div>

              {stats && (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { label:'✓ Payé',        value:`${(stats.totalPaye||0).toFixed(0)} TND`,  color:'#12b76a', bg:'rgba(18,183,106,0.06)',  border:'rgba(18,183,106,0.15)' },
                    { label:'⏳ En attente', value:`${(stats.enAttente||0).toFixed(0)} TND`, color:'#f79009', bg:'rgba(247,144,9,0.06)',   border:'rgba(247,144,9,0.15)'  },
                  ].map(s => (
                    <div key={s.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:9, background:s.bg, border:`1px solid ${s.border}` }}>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>{s.label}</div>
                      <div style={{ fontSize:14, fontWeight:800, color:s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bouton déconnexion dans le panel mobile */}
              <button onClick={handleLogout}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px', borderRadius:10, marginTop:2, border:'1px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.06)', color:'#ef4444', cursor:'pointer', fontSize:13, fontWeight:600, transition:'all 0.18s' }}
                onTouchStart={e => { e.currentTarget.style.background='rgba(239,68,68,0.14)'; }}
                onTouchEnd={e => { e.currentTarget.style.background='rgba(239,68,68,0.06)'; }}>
                <LogOut size={15}/> Déconnexion
              </button>
            </div>
          </div>
        )}

        {/* ── Bottom nav ── */}
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

        {/* ── Modal anniversaire mobile ── */}
        {showAnniv && (() => {
          const years = new Date().getFullYear() - 2025;
          return (
            <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)' }}>
              <div style={{ position:'relative', background:'rgba(3,8,26,0.98)', borderRadius:24, maxWidth:380, width:'100%', overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(18,183,106,0.2)' }}>
                <div style={{ background:'linear-gradient(135deg,rgba(18,183,106,0.18),rgba(247,144,9,0.1),transparent)', padding:'32px 24px 20px', textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize:48, marginBottom:10 }}>🎉</div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#f79009', textTransform:'uppercase', letterSpacing:2, marginBottom:8 }}>Félicitations</div>
                  <h2 style={{ margin:'0 0 6px', fontSize:20, fontWeight:800, background:'linear-gradient(135deg,#e8fff5,#12b76a,#f79009)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{user?.name} !</h2>
                  <div style={{ fontSize:32, fontWeight:900, color:'#12b76a', margin:'10px 0 4px' }}>{years} ans</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)' }}>dans le poste 🚀</div>
                </div>
                <div style={{ padding:'20px 24px 24px', textAlign:'center' }}>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.7, marginBottom:20 }}>
                    Continue comme ça, c'est du solide. <span style={{ color:'#12b76a', fontWeight:600 }}>💪</span>
                  </div>
                  <button onClick={() => setShowAnniv(false)}
                    style={{ width:'100%', padding:'13px', borderRadius:14, border:'none', cursor:'pointer', fontSize:14, fontWeight:700, background:'linear-gradient(135deg,#12b76a,#0ea472)', color:'#fff', boxShadow:'0 4px 20px rgba(18,183,106,0.35)' }}>
                    Merci 🙏
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        <style>{`
          @keyframes profileSlideDown {
            from { opacity:0; transform:translateY(-10px) scale(0.97); }
            to   { opacity:1; transform:translateY(0)    scale(1);    }
          }
        `}</style>
      </>
    );
  }

  // ── DESKTOP — collapsible sidebar ────────────────────────────────────────
  return (
    <>
    <aside
      onMouseEnter={() => { if (!showAnniv) setExpanded(true); }}
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
        <div ref={avatarRef} onClick={() => setShowProfile(p => !p)}
          style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'9px 11px', borderRadius:10,
            background: showProfile ? 'rgba(18,183,106,0.1)' : 'rgba(16,185,129,0.06)',
            border:`1px solid ${showProfile ? 'rgba(18,183,106,0.35)' : expanded ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.1)'}`,
            marginBottom:6,
            transition:'all 0.2s',
            boxShadow: showProfile ? '0 0 20px rgba(18,183,106,0.15)' : expanded ? '0 2px 16px rgba(16,185,129,0.1)' : 'none',
            overflow:'hidden',
            cursor:'pointer',
          }}
          onMouseEnter={e => { if(!showProfile){ e.currentTarget.style.background='rgba(18,183,106,0.09)'; e.currentTarget.style.borderColor='rgba(18,183,106,0.25)'; }}}
          onMouseLeave={e => { if(!showProfile){ e.currentTarget.style.background='rgba(16,185,129,0.06)'; e.currentTarget.style.borderColor=expanded?'rgba(16,185,129,0.18)':'rgba(16,185,129,0.1)'; }}}>
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
            <div style={{ fontSize:10.5, color:'#12b76a', fontWeight:600, textTransform:'capitalize', marginTop:1 }}>{user?.role}</div>
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

      <style>{`
        @keyframes profileSlideUp {
          from { opacity:0; transform:translateY(10px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
      `}</style>
    </aside>

    {/* ── Profile panel — fixed, indépendant de la sidebar ────────────── */}
    {showProfile && (
      <div ref={panelRef} style={{
        position:'fixed', bottom:88, left:9, width:222, maxWidth:'calc(100vw - 18px)',
        background:'rgba(3,8,26,0.98)',
        border:'1px solid rgba(18,183,106,0.25)',
        borderRadius:16,
        boxShadow:'0 -8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(18,183,106,0.08)',
        backdropFilter:'blur(32px)',
        overflow:'hidden',
        animation:'profileSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1) both',
        zIndex:300
      }}>
        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,rgba(18,183,106,0.12),transparent)', padding:'18px 16px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:12 }}>
          <img src="/logo.jpg" alt="Logo" style={{ width:46, height:46, borderRadius:12, objectFit:'cover', border:'2px solid rgba(18,183,106,0.4)', boxShadow:'0 0 16px rgba(18,183,106,0.25)', flexShrink:0 }}/>
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontSize:13.5, fontWeight:700, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize:11, color:'#12b76a', fontWeight:600, textTransform:'capitalize', marginTop:2 }}>{user?.role}</div>
          </div>
          <button onClick={() => setShowProfile(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:4, borderRadius:6, flexShrink:0, display:'flex', alignItems:'center' }}
            onMouseEnter={e=>e.currentTarget.style.color='#fff'}
            onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.3)'}>
            <X size={13}/>
          </button>
        </div>

        {/* Stats */}
        <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:'rgba(18,183,106,0.06)', border:'1px solid rgba(18,183,106,0.12)' }}>
            <div style={{ width:30, height:30, borderRadius:8, background:'rgba(18,183,106,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Calendar size={14} color="#12b76a"/>
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>Actif depuis</div>
              <div style={{ fontSize:12.5, color:'var(--text-primary)', fontWeight:700, marginTop:2 }}>{fmtDebut(DEBUT)}</div>
              <div style={{ fontSize:10.5, color:'#12b76a', marginTop:1 }}>{anciennete().label} {anciennete().suffix}</div>
            </div>
          </div>

          {stats && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label:'✓ Payé',        value:`${(stats.totalPaye||0).toFixed(0)} TND`,  color:'#12b76a', bg:'rgba(18,183,106,0.06)',  border:'rgba(18,183,106,0.15)' },
                { label:'⏳ En attente', value:`${(stats.enAttente||0).toFixed(0)} TND`, color:'#f79009', bg:'rgba(247,144,9,0.06)',   border:'rgba(247,144,9,0.15)'  },
              ].map(s => (
                <div key={s.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:9, background:s.bg, border:`1px solid ${s.border}` }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>{s.label}</div>
                  <div style={{ fontSize:14, fontWeight:800, color:s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}

    {/* ── Modal félicitations anniversaire ─────────────────────────────── */}
    {showAnniv && (() => {
      const years = new Date().getFullYear() - 2025;
      return (
        <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', animation:'annexFadeIn 0.3s ease both' }}>
          <div style={{ position:'relative', background:'rgba(3,8,26,0.98)', borderRadius:24, maxWidth:420, width:'100%', overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(18,183,106,0.2)', animation:'annexPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}>

            {/* Confettis CSS */}
            <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
              {['#12b76a','#f79009','#818cf8','#38bdf8','#f04438','#a764f8'].map((c,i) => (
                <div key={i} style={{ position:'absolute', top:'-10%', left:`${10+i*15}%`, width:8, height:8, borderRadius:i%2?'50%':3, background:c, animation:`confetti${i} ${1.8+i*0.3}s ease-in ${i*0.15}s infinite`, opacity:0.8 }}/>
              ))}
            </div>

            {/* Header doré */}
            <div style={{ background:'linear-gradient(135deg,rgba(18,183,106,0.18),rgba(247,144,9,0.1),transparent)', padding:'36px 28px 24px', textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize:52, marginBottom:12, animation:'bounceEmoji 1s ease infinite alternate' }}>🎉</div>
              <div style={{ fontSize:11, fontWeight:700, color:'#f79009', textTransform:'uppercase', letterSpacing:2, marginBottom:8 }}>Félicitations</div>
              <h2 style={{ margin:'0 0 6px', fontSize:22, fontWeight:800, background:'linear-gradient(135deg,#e8fff5,#12b76a,#f79009)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                {user?.name} !
              </h2>
              <div style={{ fontSize:15, color:'rgba(255,255,255,0.75)', fontWeight:500 }}>
                Aujourd'hui tu célèbres
              </div>
              <div style={{ fontSize:32, fontWeight:900, color:'#12b76a', margin:'10px 0 4px', textShadow:'0 0 30px rgba(18,183,106,0.5)' }}>
                {years} ans
              </div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)' }}>dans le poste 🚀</div>
            </div>

            {/* Corps */}
            <div style={{ padding:'22px 28px 28px', textAlign:'center' }}>
              <div style={{ fontSize:13.5, color:'rgba(255,255,255,0.65)', lineHeight:1.7, marginBottom:22 }}>
                Une année de terrain, de clients, de commissions et de persévérance.<br/>
                <span style={{ color:'#12b76a', fontWeight:600 }}>Continue comme ça, c'est du solide. 💪</span>
              </div>
              <button onClick={() => setShowAnniv(false)}
                style={{ width:'100%', padding:'13px', borderRadius:14, border:'none', cursor:'pointer', fontSize:14, fontWeight:700, background:'linear-gradient(135deg,#12b76a,#0ea472)', color:'#fff', boxShadow:'0 4px 20px rgba(18,183,106,0.35)', transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform='scale(1.02)'; e.currentTarget.style.boxShadow='0 6px 28px rgba(18,183,106,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='scale(1)';    e.currentTarget.style.boxShadow='0 4px 20px rgba(18,183,106,0.35)'; }}>
                Merci 🙏
              </button>
            </div>
          </div>

          <style>{`
            @keyframes annexFadeIn { from{opacity:0} to{opacity:1} }
            @keyframes annexPop    { from{opacity:0;transform:scale(0.8) translateY(30px)} to{opacity:1;transform:scale(1) translateY(0)} }
            @keyframes bounceEmoji { from{transform:translateY(0)} to{transform:translateY(-8px)} }
            @keyframes confetti0 { 0%{transform:translateY(0) rotate(0deg);opacity:0.8} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }
            @keyframes confetti1 { 0%{transform:translateY(0) rotate(0deg);opacity:0.8} 100%{transform:translateY(110vh) rotate(-540deg);opacity:0} }
            @keyframes confetti2 { 0%{transform:translateY(0) rotate(0deg);opacity:0.8} 100%{transform:translateY(110vh) rotate(900deg);opacity:0} }
            @keyframes confetti3 { 0%{transform:translateY(0) rotate(0deg);opacity:0.8} 100%{transform:translateY(110vh) rotate(-720deg);opacity:0} }
            @keyframes confetti4 { 0%{transform:translateY(0) rotate(0deg);opacity:0.8} 100%{transform:translateY(110vh) rotate(540deg);opacity:0} }
            @keyframes confetti5 { 0%{transform:translateY(0) rotate(0deg);opacity:0.8} 100%{transform:translateY(110vh) rotate(-900deg);opacity:0} }
          `}</style>
        </div>
      );
    })()}
    </>
  );
}
