// import { useState } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import { Shield, Eye, EyeOff, Lock, Mail } from 'lucide-react';
// import toast from 'react-hot-toast';

// export default function Login() {
//   const [mode, setMode] = useState('login');
//   const [form, setForm] = useState({ name: '', email: '', password: '' });
//   const [showPw, setShowPw] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const { login, register } = useAuth();
//   const navigate = useNavigate();

//   const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       if (mode === 'login') {
//         await login(form.email, form.password);
//         toast.success('Bienvenue !');
//       } else {
//         await register(form.name, form.email, form.password);
//         toast.success('Compte créé !');
//       }
//       navigate('/');
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Une erreur est survenue');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{
//       minHeight: '100vh', background: 'var(--bg-primary)',
//       display: 'flex', alignItems: 'center', justifyContent: 'center',
//       padding: 20, position: 'relative', overflow: 'hidden'
//     }}>
//       {/* Background glow */}
//       <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(59,108,248,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
//       <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(0,212,170,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

//       <div style={{ width: '100%', maxWidth: 420, animation: 'fadeIn 0.4s ease' }}>
//         {/* Logo */}
//         <div style={{ textAlign: 'center', marginBottom: 40 }}>
//           <div style={{
//             width: 60, height: 60, borderRadius: 16,
//             background: 'linear-gradient(135deg, var(--accent), #6b46fa)',
//             display: 'flex', alignItems: 'center', justifyContent: 'center',
//             margin: '0 auto 16px',
//             boxShadow: '0 0 40px var(--accent-glow)'
//           }}>
//             <Shield size={28} color="#fff" />
//           </div>
//           <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>SecureFlow CRM</h1>
//           <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Gestion de prospection — Sécurité</p>
//         </div>

//         {/* Card */}
//         <div style={{
//           background: 'var(--bg-card)', border: '1px solid var(--border)',
//           borderRadius: 20, padding: 32
//         }}>
//           {/* Tabs */}
//           <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 10, padding: 4, marginBottom: 28, gap: 4 }}>
//             {['login','register'].map(m => (
//               <button key={m} onClick={() => setMode(m)} style={{
//                 flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
//                 borderRadius: 8, fontSize: 13, fontWeight: 500,
//                 background: mode === m ? 'var(--bg-card)' : 'transparent',
//                 color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
//                 boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
//                 transition: 'all 0.2s', fontFamily: 'var(--font-body)'
//               }}>
//                 {m === 'login' ? 'Connexion' : 'Créer un compte'}
//               </button>
//             ))}
//           </div>

//           <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
//             {mode === 'register' && (
//               <div className="form-group" style={{ marginBottom: 0 }}>
//                 <label className="form-label">Nom complet</label>
//                 <input className="input" placeholder="Alexx Sadd" value={form.name} onChange={e => set('name', e.target.value)} required />
//               </div>
//             )}
//             <div className="form-group" style={{ marginBottom: 0 }}>
//               <label className="form-label">Email</label>
//               <div style={{ position: 'relative' }}>
//                 <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
//                 <input className="input" style={{ paddingLeft: 36 }} type="email" placeholder="alexx@exemple.ca" value={form.email} onChange={e => set('email', e.target.value)} required />
//               </div>
//             </div>
//             <div className="form-group" style={{ marginBottom: 0 }}>
//               <label className="form-label">Mot de passe</label>
//               <div style={{ position: 'relative' }}>
//                 <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
//                 <input className="input" style={{ paddingLeft: 36, paddingRight: 40 }} type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
//                 <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
//                   {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
//                 </button>
//               </div>
//             </div>
//             <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14, marginTop: 4 }}>
//               {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
//             </button>
//           </form>
//         </div>

//         <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>
//           SecureFlow CRM © 2024 — Alexx Sadd Sécurité
//         </p>
//       </div>
//     </div>
//   );
// }
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(59,108,248,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(0,212,170,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeIn 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--accent), #6b46fa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 40px var(--accent-glow)'
          }}>
            <Shield size={28} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>SecureFlow CRM</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Gestion de prospection </p>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input" style={{ paddingLeft: 36 }} type="email" placeholder="alexx@exemple.ca" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input" style={{ paddingLeft: 36, paddingRight: 40 }} type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14, marginTop: 4 }}>
              {loading ? 'Chargement...' : 'Se connecter'}
            </button>
          </form>
        </div>

        {/* <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>
          SecureFlow CRM © 2024 — Alexx Sadd Sécurité
        </p> */}
      </div>
    </div>
  );
}