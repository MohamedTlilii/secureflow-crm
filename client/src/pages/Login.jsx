// ════════════════════════════════════════════════════════════════════════════
// client/src/pages/Login.jsx
// ════════════════════════════════════════════════════════════════════════════
// RESPONSIVE  : iPhone 12 Pro Max (430px) et tous les mobiles
// DESIGN      : Glassmorphism card, glows animés, grille décorative
// ANIMATIONS  : slideUp entrée, shimmer bouton, glow inputs focus, iconFloat
// LOGIQUE     : Login uniquement — identique à l'original
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(''); // champ actif pour glow
  const [mounted, setMounted] = useState(false); // animation d'entrée

  const { login }  = useAuth();
  const navigate   = useNavigate();

  // ── Animation d'entrée au montage ────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Logique originale intacte ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <div style={{
      minHeight:'100vh', background:'var(--bg-primary)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:20, position:'relative', overflow:'hidden'
    }}>

      {/* ── Glows de fond animés ── */}
      <div style={{ position:'absolute', top:'15%', left:'50%', transform:'translateX(-50%)', width:700, height:500, background:'radial-gradient(ellipse, rgba(59,108,248,0.14) 0%, transparent 70%)', pointerEvents:'none', animation:'glowPulse 4s ease-in-out infinite' }}/>
      <div style={{ position:'absolute', bottom:'5%', right:'5%', width:400, height:400, background:'radial-gradient(ellipse, rgba(18,183,106,0.1) 0%, transparent 70%)', pointerEvents:'none', animation:'glowPulse 5s 1s ease-in-out infinite' }}/>
      <div style={{ position:'absolute', bottom:'20%', left:'5%', width:300, height:300, background:'radial-gradient(ellipse, rgba(167,100,248,0.08) 0%, transparent 70%)', pointerEvents:'none', animation:'glowPulse 6s 2s ease-in-out infinite' }}/>

      {/* ── Grille de points décoratifs ── */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'radial-gradient(rgba(59,108,248,0.07) 1px, transparent 1px)', backgroundSize:'32px 32px' }}/>

      {/* ── Contenu — slide up au montage ── */}
      <div style={{
        width:'100%', maxWidth:420, position:'relative', zIndex:1,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(24px)',
        transition:'opacity 0.6s ease, transform 0.6s ease'
      }}>

        {/* ── Logo + Titre ── */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{
            width:64, height:64, borderRadius:18,
            background:'linear-gradient(135deg,var(--accent),#6b46fa)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px',
            boxShadow:'0 0 40px var(--accent-glow), 0 8px 32px rgba(59,108,248,0.3)',
            animation:'iconFloat 3s ease-in-out infinite'
          }}>
            <Shield size={30} color="#fff"/>
          </div>
          <h1 style={{
            fontFamily:'var(--font-display)', fontSize:28, fontWeight:800,
            letterSpacing:'-0.5px', marginBottom:6,
            background:'linear-gradient(135deg,var(--text-primary) 0%,#3b6cf8 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'
          }}>
            SecureFlow CRM
          </h1>
          <p style={{ color:'var(--text-secondary)', fontSize:14 }}>Gestion de prospection</p>
        </div>

        {/* ── Card glassmorphism ── */}
        <div style={{
          background:'var(--bg-card)', border:'1px solid var(--border)',
          borderRadius:24, padding:32,
          boxShadow:'0 20px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.04)',
          backdropFilter:'blur(20px)',
          borderTop:'1px solid rgba(255,255,255,0.08)'
        }}>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* ── Email ── */}
            <div style={{ animation:'fadeSlideUp 0.4s 0.1s ease both' }}>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.8, display:'block', marginBottom:6 }}>
                Email
              </label>
              <div style={{ position:'relative' }}>
                <Mail size={15} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color: focused==='email'?'#3b6cf8':'var(--text-muted)', transition:'color 0.2s' }}/>
                <input
                  style={{
                    width:'100%', padding:'11px 13px 11px 38px',
                    borderRadius:10, fontSize:14, outline:'none',
                    fontFamily:'var(--font-body)', boxSizing:'border-box',
                    background:'var(--bg-secondary)', color:'var(--text-primary)',
                    border: focused==='email' ? '1px solid #3b6cf8' : '1px solid var(--border)',
                    boxShadow: focused==='email' ? '0 0 0 3px rgba(59,108,248,0.12)' : 'none',
                    transition:'all 0.2s'
                  }}
                  type="email" placeholder="contact@exemple.ca"
                  value={form.email} onChange={e => set('email', e.target.value)}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                  required
                />
              </div>
            </div>

            {/* ── Mot de passe ── */}
            <div style={{ animation:'fadeSlideUp 0.4s 0.15s ease both' }}>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.8, display:'block', marginBottom:6 }}>
                Mot de passe
              </label>
              <div style={{ position:'relative' }}>
                <Lock size={15} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color: focused==='password'?'#3b6cf8':'var(--text-muted)', transition:'color 0.2s' }}/>
                <input
                  style={{
                    width:'100%', padding:'11px 44px 11px 38px',
                    borderRadius:10, fontSize:14, outline:'none',
                    fontFamily:'var(--font-body)', boxSizing:'border-box',
                    background:'var(--bg-secondary)', color:'var(--text-primary)',
                    border: focused==='password' ? '1px solid #3b6cf8' : '1px solid var(--border)',
                    boxShadow: focused==='password' ? '0 0 0 3px rgba(59,108,248,0.12)' : 'none',
                    transition:'all 0.2s'
                  }}
                  type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                  required minLength={6}
                />
                {/* Toggle visibilité */}
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:4, borderRadius:6, transition:'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color='#3b6cf8'}
                  onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            {/* ── Bouton Submit avec shimmer ── */}
            <button type="submit" disabled={loading}
              style={{
                width:'100%', padding:'13px', borderRadius:12, fontSize:14,
                fontWeight:700, cursor: loading?'not-allowed':'pointer',
                border:'none', marginTop:6,
                background: loading ? 'var(--bg-secondary)' : 'linear-gradient(135deg,#3b6cf8,#6b46fa)',
                color: loading ? 'var(--text-muted)' : '#fff',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(59,108,248,0.4)',
                transition:'all 0.2s',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                position:'relative', overflow:'hidden',
                animation:'fadeSlideUp 0.4s 0.2s ease both'
              }}
              onMouseEnter={e => { if(!loading) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(59,108,248,0.5)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=loading?'none':'0 4px 20px rgba(59,108,248,0.4)'; }}>

              {/* Shimmer animé sur le bouton */}
              {!loading && (
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.12) 50%,transparent 100%)', animation:'shimmer 2.5s ease-in-out infinite' }}/>
              )}

              {loading ? (
                <>
                  <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                  Chargement...
                </>
              ) : (
                <>Se connecter <ArrowRight size={16}/></>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes glowPulse {
          0%,100% { opacity:0.6; }
          50%      { opacity:1; }
        }
        @keyframes iconFloat {
          0%,100% { transform:translateY(0); }
          50%      { transform:translateY(-6px); }
        }
        @keyframes shimmer {
          0%   { transform:translateX(-100%); }
          100% { transform:translateX(200%); }
        }
      `}</style>
    </div>
  );
}
