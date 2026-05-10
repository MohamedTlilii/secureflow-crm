// ════════════════════════════════════════════════════════════════════════════
// client/src/pages/Login.jsx — ULTRA DESIGN 5D
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Étoiles générées (distribution par angle d'or — pas de random au render) ──
const STARS = Array.from({ length: 90 }, (_, i) => ({
  id: i,
  x: (i * 137.508) % 100,
  y: (i * 97.31)   % 100,
  size: i % 4 === 0 ? 2.5 : i % 3 === 0 ? 1.8 : 1.2,
  delay: (i * 0.17) % 5,
  dur:   2 + (i % 4),
  opacity: 0.4 + (i % 5) * 0.12,
}));

// ── Particules flottantes colorées ──────────────────────────────────────────
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x:   (i * 157.3) % 100,
  y:   (i * 83.7)  % 100,
  dur: 7 + (i % 9),
  del: (i * 0.35)  % 6,
  sz:  i % 4 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
  col: i % 3 === 0 ? 'rgba(99,102,241,0.7)'
     : i % 3 === 1 ? 'rgba(167,139,250,0.6)'
     :               'rgba(16,185,129,0.5)',
}));

const WORDS = ['Sécurisé','Intelligent','Précis','Rapide','Fiable','Puissant','Connecté','Performant','Blindé','Infaillible'];

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const [mounted, setMounted] = useState(false);
  const [tilt, setTilt]       = useState({ x: 0, y: 0 });
  const [scan, setScan]       = useState('');
  const [btnPulse, setBtnPulse] = useState(false);
  const [wordIdx,  setWordIdx]  = useState(0);

  const cardWrapRef = useRef(null);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setWordIdx(i => (i + 1) % WORDS.length), 1300);
    return () => clearInterval(t);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── 3D tilt au mouvement de la souris ──────────────────────────────────
  const onMouseMove = (e) => {
    const rect = cardWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2; // -1 → 1
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    setTilt({ x, y });
  };
  const onMouseLeave = () => setTilt({ x: 0, y: 0 });

  // ── Focus avec effet scanner ────────────────────────────────────────────
  const onFocus = (field) => {
    setFocused(field);
    setScan(field);
    setTimeout(() => setScan(''), 700);
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setBtnPulse(true);
    setTimeout(() => setBtnPulse(false), 600);
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Bienvenue !');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // ── Styles dynamiques ───────────────────────────────────────────────────
  const tiltTransform = `rotateX(${-tilt.y * 11}deg) rotateY(${tilt.x * 11}deg)`;
  const tiltTransition = (tilt.x === 0 && tilt.y === 0)
    ? 'transform 0.9s cubic-bezier(0.23,1,0.32,1)'
    : 'transform 0.08s ease';

  const inputStyle = (field, color) => ({
    width: '100%',
    padding: '13px 44px 13px 42px',
    borderRadius: 13,
    fontSize: 14,
    outline: 'none',
    fontFamily: 'var(--font-body)',
    boxSizing: 'border-box',
    background: focused === field ? `${color}10` : 'rgba(255,255,255,0.04)',
    color: '#fff',
    border: focused === field
      ? `1.5px solid ${color}`
      : '1.5px solid rgba(255,255,255,0.09)',
    boxShadow: focused === field
      ? `0 0 0 4px ${color}20, 0 0 30px ${color}15, inset 0 1px 0 rgba(255,255,255,0.06)`
      : 'inset 0 1px 0 rgba(255,255,255,0.03)',
    transition: 'all 0.35s cubic-bezier(0.23,1,0.32,1)',
    letterSpacing: field === 'password' && !focused ? '2px' : '0',
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 40%, #0c0618 0%, #030712 45%, #010d1f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden',
    }}>

      {/* ══ ÉTOILES ══════════════════════════════════════════════════════════ */}
      {STARS.map(s => (
        <div key={s.id} style={{
          position: 'absolute',
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          borderRadius: '50%',
          background: '#fff',
          opacity: 0,
          pointerEvents: 'none',
          animation: `starBlink ${s.dur}s ${s.delay}s ease-in-out infinite`,
        }}/>
      ))}

      {/* ══ PARTICULES FLOTTANTES ════════════════════════════════════════════ */}
      {PARTICLES.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.sz, height: p.sz,
          borderRadius: '50%',
          background: p.col,
          pointerEvents: 'none',
          filter: 'blur(0.8px)',
          animation: `particleDrift ${p.dur}s ${p.del}s ease-in-out infinite`,
        }}/>
      ))}

      {/* ══ ORBES DE FOND ════════════════════════════════════════════════════ */}
      <div style={{ position:'absolute', top:'5%',  left:'10%',  width:500, height:450, background:'radial-gradient(ellipse,rgba(99,102,241,0.15) 0%,transparent 70%)',  borderRadius:'50%', animation:'orbDrift1 9s  ease-in-out infinite',        pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'3%',right:'8%', width:600, height:450, background:'radial-gradient(ellipse,rgba(124,58,237,0.10) 0%,transparent 70%)',  borderRadius:'50%', animation:'orbDrift2 12s 1.5s ease-in-out infinite',    pointerEvents:'none' }}/>
      <div style={{ position:'absolute', top:'50%', right:'15%', width:350, height:350, background:'radial-gradient(ellipse,rgba(16,185,129,0.07) 0%,transparent 70%)',  borderRadius:'50%', animation:'orbDrift3 10s 3s   ease-in-out infinite',    pointerEvents:'none' }}/>

      {/* ══ GRILLE DE POINTS ═════════════════════════════════════════════════ */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:'radial-gradient(rgba(99,102,241,0.07) 1px, transparent 1px)',
        backgroundSize:'44px 44px',
      }}/>

      {/* ══ LIGNES DIAGONALES SUBTILES ═══════════════════════════════════════ */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none', opacity:0.03,
        backgroundImage:'repeating-linear-gradient(45deg, rgba(99,102,241,1) 0px, rgba(99,102,241,1) 1px, transparent 1px, transparent 60px)',
      }}/>

      {/* ══ CONTENEUR PRINCIPAL ══════════════════════════════════════════════ */}
      <div style={{
        width:'100%', maxWidth:450, position:'relative', zIndex:1,
        opacity:   mounted ? 1 : 0,
        transform: mounted ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.96)',
        transition:'opacity 0.8s cubic-bezier(0.23,1,0.32,1), transform 0.8s cubic-bezier(0.23,1,0.32,1)',
      }}>

        {/* ── LOGO 5D ───────────────────────────────────────────────────── */}
        <div style={{ textAlign:'center', marginBottom:28 }}>

          {/* Shield — spin continu style React icon */}
          <div style={{ position:'relative', margin:'0 auto 4px', width:68 }}>
            <div style={{
              width:68, height:68, borderRadius:22,
              background:'linear-gradient(135deg,#4f46e5 0%,#6d28d9 40%,#7c3aed 70%,#a78bfa 100%)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 40px rgba(99,102,241,1.0), 0 0 90px rgba(124,58,237,0.75), 0 0 170px rgba(99,102,241,0.35)',
              animation:'logoSpin 6s linear infinite, logoPulse 3s ease-in-out infinite',
            }}>
              <Shield size={30} color="#fff" style={{ filter:'drop-shadow(0 0 8px rgba(255,255,255,0.8))' }}/>
            </div>
            <div style={{
              position:'absolute', bottom:-12, left:'50%', transform:'translateX(-50%)',
              width:90, height:14,
              background:'radial-gradient(ellipse,rgba(99,102,241,0.6) 0%,transparent 70%)',
              filter:'blur(7px)', pointerEvents:'none',
            }}/>
          </div>

          {/* ── MOT ANIMÉ RAPIDE ───────────────────────────────────────── */}
          <div style={{
            height:34, marginTop:18, overflow:'hidden',
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          }}>
            {/* Tiret gauche */}
            <span style={{ width:28, height:1.5, background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.5))', display:'inline-block', flexShrink:0 }}/>

            <span key={wordIdx} style={{
              display:'inline-block',
              fontSize:14, fontWeight:800, letterSpacing:3,
              textTransform:'uppercase',
              background:'linear-gradient(135deg,#e0e7ff 0%,#a5b4fc 40%,#818cf8 70%,#7c3aed 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
              animation:'wordFlash 1.3s cubic-bezier(0.23,1,0.32,1) forwards',
              whiteSpace:'nowrap',
            }}>
              {WORDS[wordIdx]}
            </span>

            {/* Tiret droit */}
            <span style={{ width:28, height:1.5, background:'linear-gradient(90deg,rgba(99,102,241,0.5),transparent)', display:'inline-block', flexShrink:0 }}/>
          </div>
        </div>

        {/* ── CARD 3D TILT ──────────────────────────────────────────────── */}
        {/* Perspective parent */}
        <div style={{ perspective:'1400px', perspectiveOrigin:'50% 50%' }}>

          {/* Wrapper de l'effet de bordure animée */}
          <div
            ref={cardWrapRef}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{
              position:'relative',
              borderRadius:26,
              padding:'1.5px',
              background:'conic-gradient(from 180deg at 50% 50%, #4f46e5, #7c3aed, #ec4899, #f59e0b, #10b981, #6366f1, #4f46e5)',
              animation:'borderHue 6s linear infinite',
              transform: tiltTransform,
              transition: tiltTransition,
              transformStyle:'preserve-3d',
            }}
          >
            {/* Card intérieure */}
            <div style={{
              background:'rgba(6,8,28,0.93)',
              borderRadius:25,
              padding:'34px 30px 30px',
              backdropFilter:'blur(40px)',
              position:'relative',
              overflow:'hidden',
            }}>

              {/* Lumière qui suit la souris (hologramme) */}
              <div style={{
                position:'absolute', inset:0, borderRadius:25, pointerEvents:'none',
                background:`radial-gradient(ellipse 60% 50% at ${50 + tilt.x * 35}% ${50 + tilt.y * 35}%, rgba(99,102,241,0.09) 0%, transparent 70%)`,
                transition:'background 0.08s ease',
              }}/>

              {/* Reflet holographique diagonal */}
              <div style={{
                position:'absolute', inset:0, borderRadius:25, pointerEvents:'none',
                background:`linear-gradient(${135 + tilt.x * 20}deg, rgba(255,255,255,0.025) 0%, transparent 50%, rgba(124,58,237,0.02) 100%)`,
                transition:'background 0.1s ease',
              }}/>

              {/* Lignes circuit subtiles */}
              <div style={{
                position:'absolute', top:0, left:0, right:0, height:1,
                background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.4),transparent)',
                pointerEvents:'none',
              }}/>
              <div style={{
                position:'absolute', bottom:0, left:0, right:0, height:1,
                background:'linear-gradient(90deg,transparent,rgba(124,58,237,0.3),transparent)',
                pointerEvents:'none',
              }}/>

              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:22, position:'relative', zIndex:1 }}>

                {/* ════ INPUT EMAIL ════ */}
                <div style={{ animation:'fadeSlideUp 0.5s 0.15s ease both' }}>
                  <label style={{
                    fontSize:10, fontWeight:700,
                    color:'rgba(165,180,252,0.6)',
                    textTransform:'uppercase', letterSpacing:1.5,
                    display:'flex', alignItems:'center', gap:6, marginBottom:9,
                  }}>
                    <span style={{ width:16, height:1, background:'rgba(99,102,241,0.5)', display:'inline-block' }}/>
                    Email
                    <span style={{ width:16, height:1, background:'rgba(99,102,241,0.5)', display:'inline-block' }}/>
                  </label>

                  <div style={{ position:'relative' }}>
                    {/* Icône */}
                    <Mail size={15} style={{
                      position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
                      color: focused==='email' ? '#6366f1' : 'rgba(255,255,255,0.22)',
                      transition:'all 0.3s',
                      filter: focused==='email' ? 'drop-shadow(0 0 5px #6366f1)' : 'none',
                      zIndex:2,
                    }}/>

                    {/* Scanner qui sweap au focus */}
                    {scan === 'email' && (
                      <div style={{ position:'absolute', inset:0, borderRadius:13, overflow:'hidden', pointerEvents:'none', zIndex:3 }}>
                        <div style={{
                          position:'absolute', top:0, bottom:0, width:60,
                          background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.6),transparent)',
                          animation:'scanSweep 0.65s cubic-bezier(0.4,0,0.2,1) forwards',
                        }}/>
                      </div>
                    )}

                    <input
                      style={inputStyle('email','#6366f1')}
                      type="email" placeholder="contact@exemple.ca"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      onFocus={() => onFocus('email')}
                      onBlur={() => setFocused('')}
                      required
                    />

                    {/* Coins lumineux au focus */}
                    {focused === 'email' && <CornerAccents color="#6366f1"/>}

                    {/* Indicateur de frappe */}
                    {focused === 'email' && form.email && (
                      <div style={{
                        position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                        width:6, height:6, borderRadius:'50%',
                        background:'#6366f1',
                        boxShadow:'0 0 8px #6366f1',
                        animation:'dotPulse 1s ease-in-out infinite',
                      }}/>
                    )}
                  </div>
                </div>

                {/* ════ INPUT MOT DE PASSE ════ */}
                <div style={{ animation:'fadeSlideUp 0.5s 0.25s ease both' }}>
                  <label style={{
                    fontSize:10, fontWeight:700,
                    color:'rgba(196,181,253,0.6)',
                    textTransform:'uppercase', letterSpacing:1.5,
                    display:'flex', alignItems:'center', gap:6, marginBottom:9,
                  }}>
                    <span style={{ width:16, height:1, background:'rgba(167,139,250,0.5)', display:'inline-block' }}/>
                    Mot de passe
                    <span style={{ width:16, height:1, background:'rgba(167,139,250,0.5)', display:'inline-block' }}/>
                  </label>

                  <div style={{ position:'relative' }}>
                    <Lock size={15} style={{
                      position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
                      color: focused==='password' ? '#a78bfa' : 'rgba(255,255,255,0.22)',
                      transition:'all 0.3s',
                      filter: focused==='password' ? 'drop-shadow(0 0 5px #a78bfa)' : 'none',
                      zIndex:2,
                    }}/>

                    {scan === 'password' && (
                      <div style={{ position:'absolute', inset:0, borderRadius:13, overflow:'hidden', pointerEvents:'none', zIndex:3 }}>
                        <div style={{
                          position:'absolute', top:0, bottom:0, width:60,
                          background:'linear-gradient(90deg,transparent,rgba(167,139,250,0.6),transparent)',
                          animation:'scanSweep 0.65s cubic-bezier(0.4,0,0.2,1) forwards',
                        }}/>
                      </div>
                    )}

                    <input
                      style={inputStyle('password','#a78bfa')}
                      type={showPw ? 'text' : 'password'} placeholder="••••••••"
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      onFocus={() => onFocus('password')}
                      onBlur={() => setFocused('')}
                      required minLength={6}
                    />

                    {focused === 'password' && <CornerAccents color="#a78bfa"/>}

                    {/* Eye toggle */}
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      style={{
                        position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                        background:'none', border:'none', cursor:'pointer',
                        color:'rgba(255,255,255,0.25)', padding:4, borderRadius:6,
                        transition:'all 0.2s', display:'flex', zIndex:2,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color='#a78bfa'; e.currentTarget.style.filter='drop-shadow(0 0 4px #a78bfa)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.25)'; e.currentTarget.style.filter='none'; }}>
                      {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                </div>

                {/* ════ BOUTON SUBMIT ════ */}
                <div style={{ animation:'fadeSlideUp 0.5s 0.35s ease both', position:'relative' }}>

                  {/* Anneau de pulse au click */}
                  {btnPulse && (
                    <div style={{
                      position:'absolute', inset:-4, borderRadius:18,
                      border:'2px solid rgba(99,102,241,0.7)',
                      animation:'btnRing 0.6s ease-out forwards',
                      pointerEvents:'none',
                    }}/>
                  )}

                  <button type="submit" disabled={loading}
                    style={{
                      width:'100%', padding:'16px', borderRadius:14,
                      fontSize:14, fontWeight:800, letterSpacing:0.4,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      border:'none', marginTop:2,
                      background: loading
                        ? 'rgba(255,255,255,0.06)'
                        : 'linear-gradient(135deg,#4f46e5 0%,#6d28d9 50%,#7c3aed 100%)',
                      color: loading ? 'rgba(255,255,255,0.35)' : '#fff',
                      boxShadow: loading ? 'none'
                        : '0 4px 28px rgba(99,102,241,0.55), 0 0 60px rgba(99,102,241,0.18)',
                      transition:'all 0.35s cubic-bezier(0.23,1,0.32,1)',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                      position:'relative', overflow:'hidden',
                    }}
                    onMouseEnter={e => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
                        e.currentTarget.style.boxShadow = '0 10px 40px rgba(99,102,241,0.75), 0 0 80px rgba(99,102,241,0.3)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 28px rgba(99,102,241,0.55), 0 0 60px rgba(99,102,241,0.18)';
                    }}>

                    {/* Shimmer */}
                    {!loading && (
                      <div style={{
                        position:'absolute', inset:0,
                        background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.18) 50%,transparent 100%)',
                        animation:'shimmer 2.8s ease-in-out infinite',
                      }}/>
                    )}

                    {/* Lueur de fond du bouton */}
                    {!loading && (
                      <div style={{
                        position:'absolute', inset:0, borderRadius:14,
                        background:'linear-gradient(135deg,rgba(255,255,255,0.06) 0%,transparent 60%)',
                        pointerEvents:'none',
                      }}/>
                    )}

                    {loading ? (
                      <>
                        <div style={{
                          width:18, height:18,
                          border:'2.5px solid rgba(255,255,255,0.15)',
                          borderTopColor:'rgba(255,255,255,0.7)',
                          borderRadius:'50%',
                          animation:'spin 0.7s linear infinite',
                        }}/>
                        Authentification en cours...
                      </>
                    ) : (
                      <>Accéder au système <ArrowRight size={16}/></>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* ── Pied de page ───────────────────────────────────────────────── */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:16,
          marginTop:24, animation:'fadeSlideUp 0.5s 0.5s ease both',
        }}>
          {/* Badge chiffrement */}
          <div style={{
            display:'flex', alignItems:'center', gap:5,
            padding:'5px 11px', borderRadius:20,
            border:'1px solid rgba(99,102,241,0.2)',
            background:'rgba(99,102,241,0.06)',
          }}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4.5" stroke="rgba(99,102,241,0.7)" strokeWidth="1"/>
              <circle cx="5" cy="5" r="2" fill="rgba(99,102,241,0.6)"/>
            </svg>
            <span style={{ fontSize:10, fontWeight:600, color:'rgba(165,180,252,0.6)', letterSpacing:1, textTransform:'uppercase' }}>256-bit SSL</span>
          </div>

          {/* Séparateur */}
          <div style={{ width:3, height:3, borderRadius:'50%', background:'rgba(255,255,255,0.12)' }}/>

          {/* Badge session */}
          <div style={{
            display:'flex', alignItems:'center', gap:5,
            padding:'5px 11px', borderRadius:20,
            border:'1px solid rgba(167,139,250,0.2)',
            background:'rgba(167,139,250,0.06)',
          }}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <path d="M5 1 L5 5 L7.5 7" stroke="rgba(167,139,250,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
              <circle cx="5" cy="5" r="4.5" stroke="rgba(167,139,250,0.4)" strokeWidth="1"/>
            </svg>
            <span style={{ fontSize:10, fontWeight:600, color:'rgba(196,181,253,0.6)', letterSpacing:1, textTransform:'uppercase' }}>Session 30j</span>
          </div>

          {/* Séparateur */}
          <div style={{ width:3, height:3, borderRadius:'50%', background:'rgba(255,255,255,0.12)' }}/>

          {/* Badge accès privé */}
          <div style={{
            display:'flex', alignItems:'center', gap:5,
            padding:'5px 11px', borderRadius:20,
            border:'1px solid rgba(16,185,129,0.2)',
            background:'rgba(16,185,129,0.05)',
          }}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <rect x="2" y="4.5" width="6" height="5" rx="1" stroke="rgba(16,185,129,0.7)" strokeWidth="1"/>
              <path d="M3.5 4.5V3a1.5 1.5 0 013 0v1.5" stroke="rgba(16,185,129,0.7)" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize:10, fontWeight:600, color:'rgba(110,231,183,0.6)', letterSpacing:1, textTransform:'uppercase' }}>Accès privé</span>
          </div>
        </div>
      </div>

      {/* ══ KEYFRAMES ════════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes starBlink {
          0%,100%{ opacity:0;   transform:scale(0.7); }
          50%    { opacity:0.85;transform:scale(1.3); }
        }
        @keyframes particleDrift {
          0%  { transform:translateY(0)   translateX(0)    scale(1);   opacity:0.45; }
          33% { transform:translateY(-22px)translateX(12px) scale(1.3); opacity:0.75; }
          66% { transform:translateY(-10px)translateX(-9px) scale(0.85);opacity:0.5;  }
          100%{ transform:translateY(0)   translateX(0)    scale(1);   opacity:0.45; }
        }
        @keyframes orbDrift1 {
          0%,100%{ transform:translate(0,0)   scale(1);   }
          50%    { transform:translate(35px,-25px)scale(1.12); }
        }
        @keyframes orbDrift2 {
          0%,100%{ transform:translate(0,0)   scale(1);   }
          50%    { transform:translate(-28px,18px)scale(0.94); }
        }
        @keyframes orbDrift3 {
          0%,100%{ transform:translate(0,0);   }
          50%    { transform:translate(18px,-32px); }
        }
        @keyframes logoSpin {
          from{ transform:rotate(0deg); }
          to  { transform:rotate(360deg); }
        }
        @keyframes logoPulse {
          0%,100%{ box-shadow:0 0 30px rgba(99,102,241,0.9),0 0 70px rgba(124,58,237,0.5),0 0 120px rgba(99,102,241,0.2); }
          50%    { box-shadow:0 0 50px rgba(99,102,241,1.0),0 0 100px rgba(124,58,237,0.7),0 0 180px rgba(99,102,241,0.35); }
        }
        @keyframes wordFlash {
          0%  { opacity:0; transform:translateY(18px) scale(0.8) rotateX(-35deg); filter:blur(4px); }
          22% { opacity:1; transform:translateY(0)    scale(1)   rotateX(0deg);   filter:blur(0);   }
          75% { opacity:1; transform:translateY(0)    scale(1)   rotateX(0deg);   filter:blur(0);   }
          100%{ opacity:0; transform:translateY(-14px) scale(0.92) rotateX(25deg); filter:blur(3px); }
        }
        @keyframes borderHue {
          from{ filter:hue-rotate(0deg); }
          to  { filter:hue-rotate(360deg); }
        }
        @keyframes scanSweep {
          from{ left:-60px; }
          to  { left:110%; }
        }
        @keyframes dotPulse {
          0%,100%{ opacity:1;   transform:translateY(-50%) scale(1);   }
          50%    { opacity:0.5; transform:translateY(-50%) scale(1.4); }
        }
        @keyframes btnRing {
          from{ opacity:1; transform:scale(1);    }
          to  { opacity:0; transform:scale(1.08); }
        }
        @keyframes shimmer {
          0%  { transform:translateX(-100%); }
          100%{ transform:translateX(220%); }
        }
        @keyframes fadeSlideUp {
          from{ opacity:0; transform:translateY(14px); }
          to  { opacity:1; transform:translateY(0);    }
        }
        @keyframes spin {
          to{ transform:rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ── Coins lumineux aux 4 angles de l'input ──────────────────────────────────
function CornerAccents({ color }) {
  const s = { position:'absolute', width:10, height:10, pointerEvents:'none' };
  const border = `2px solid ${color}`;
  return <>
    <div style={{ ...s, top:-1, left:-1,  borderTop:border, borderLeft:border,  borderRadius:'3px 0 0 0' }}/>
    <div style={{ ...s, top:-1, right:-1, borderTop:border, borderRight:border, borderRadius:'0 3px 0 0' }}/>
    <div style={{ ...s, bottom:-1, left:-1,  borderBottom:border, borderLeft:border,  borderRadius:'0 0 0 3px' }}/>
    <div style={{ ...s, bottom:-1, right:-1, borderBottom:border, borderRight:border, borderRadius:'0 0 3px 0' }}/>
  </>;
}
