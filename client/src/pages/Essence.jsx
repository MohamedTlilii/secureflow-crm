// client/src/pages/Essence.jsx
// ════════════════════════════════════════════════════════════════════════════
// PAGE INDEMNITÉ CARBURANT — 5 DT/jour · Lun→Ven · À partir de 2026
// FEATURES  : Années dynamiques · Alerte mois non reçu · Note par mois
//             Simulateur · Objectif annuel · Tendance cumulative · Export
// RESPONSIVE: iPhone 12 Pro Max + tous mobiles (breakpoint 768px)
// DESIGN    : Glassmorphism orange · AnimatedNumber · fadeSlideUp
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api';
import {
  Fuel, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  TrendingUp, Calendar, AlertTriangle, Download,
  BarChart2, Target, FileText, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, Area, AreaChart, CartesianGrid
} from 'recharts';
import toast from 'react-hot-toast';

// ── JWT intercepteur ──────────────────────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Helpers ───────────────────────────────────────────────────────────────
const MOIS_FR    = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MOIS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

const fmtDate  = d => d ? new Date(d).toLocaleDateString('fr-CA', { day:'numeric', month:'short', year:'numeric' }) : '—';
const fmtMoney = v => `${(v||0).toFixed(3)} TND`;

// ── Hook responsive ───────────────────────────────────────────────────────
function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return m;
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT : AnimatedNumber
// ════════════════════════════════════════════════════════════════════════════
function AnimatedNumber({ value, decimals = 3, suffix = ' TND', color }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current, end = value || 0;
    prev.current = end;
    if (start === end) return;
    const dur = 900, t0 = performance.now();
    const step = now => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(start + (end - start) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <span style={{ color }}>{display.toFixed(decimals)}{suffix}</span>;
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT : NoteModal
// ════════════════════════════════════════════════════════════════════════════
function NoteModal({ mois, onSave, onClose }) {
  const [txt, setTxt] = useState(mois?.note || '');
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'var(--bg-card)', borderRadius:20, padding:24, width:'100%', maxWidth:400, border:'1px solid rgba(245,158,11,0.3)', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', animation:'fadeSlideUp 0.25s ease both' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>
            📝 Note — {MOIS_FR[mois?.mois]} {mois?.annee}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:20 }}><X size={18}/></button>
        </div>
        <textarea value={txt} onChange={e => setTxt(e.target.value)} rows={4}
          placeholder="Ex: Reçu en retard, paiement partiel..."
          style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid rgba(245,158,11,0.3)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:13, resize:'vertical', outline:'none' }}/>
        <div style={{ display:'flex', gap:10, marginTop:14, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', cursor:'pointer', fontWeight:600, fontSize:13 }}>Annuler</button>
          <button onClick={() => onSave(txt)} style={{ padding:'8px 20px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#f59e0b,#ea580c)', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:13 }}>Sauvegarder</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL : Essence
// ════════════════════════════════════════════════════════════════════════════
export default function Essence() {
  const isMobile = useIsMobile();

  const [data,       setData]       = useState([]);
  const [stats,      setStats]      = useState(null);
  const [annees,     setAnnees]     = useState([]);
  const [annee,      setAnnee]      = useState(new Date().getFullYear());
  const [loading,    setLoading]    = useState(true);
  const [noteModal,  setNoteModal]  = useState(null);   // doc en édition
  const [vueMode,    setVueMode]    = useState('annee'); // 'annee' | 'cumul'
  const [simJours,   setSimJours]   = useState(22);

  // ── Fetch années ──────────────────────────────────────────────────────────
  const fetchAnnees = useCallback(async () => {
    try {
      const r = await api.get('/api/essence/annees');
      setAnnees(r.data);
      if (r.data.length > 0 && !r.data.includes(annee)) setAnnee(r.data[r.data.length - 1]);
    } catch { toast.error('Erreur années'); }
  }, []);

  // ── Fetch data + stats ────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rData, rStats] = await Promise.all([
        api.get(`/api/essence?annee=${annee}`),
        api.get(`/api/essence/stats?annee=${annee}`),
      ]);
      setData(rData.data);
      setStats(rStats.data);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  }, [annee]);

  useEffect(() => { fetchAnnees(); }, [fetchAnnees]);
  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Toggle reçu ───────────────────────────────────────────────────────────
  const toggleRecu = async (doc) => {
    try {
      await api.put(`/api/essence/${doc._id}`, { recu: !doc.recu });
      toast.success(!doc.recu ? '✅ Marqué reçu !' : 'Marqué en attente');
      fetchData();
    } catch { toast.error('Erreur'); }
  };

  // ── Sauvegarder note ──────────────────────────────────────────────────────
  const saveNote = async (note) => {
    try {
      await api.put(`/api/essence/${noteModal._id}`, { note });
      toast.success('Note sauvegardée');
      setNoteModal(null);
      fetchData();
    } catch { toast.error('Erreur'); }
  };

  // ── Alerte : dernier mois non reçu ───────────────────────────────────────
  const now         = new Date();
  const prevMoisIdx = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevMoisDoc = data.find(d => d.mois === prevMoisIdx);
  const showAlerte  = prevMoisDoc && !prevMoisDoc.recu;

  // ── Données graphique barres ──────────────────────────────────────────────
  const chartBar = data.map(d => ({
    name:    MOIS_SHORT[d.mois],
    total:   d.montantAttendu,
    recu:    d.recu ? d.montantAttendu : 0,
    attente: d.recu ? 0 : d.montantAttendu,
  }));

  // ── Données graphique cumulatif ───────────────────────────────────────────
  let cumAttendu = 0, cumRecu = 0;
  const chartCumul = data.map(d => {
    cumAttendu += d.montantAttendu;
    cumRecu    += d.recu ? d.montantAttendu : 0;
    return { name: MOIS_SHORT[d.mois], attendu: +cumAttendu.toFixed(3), recu: +cumRecu.toFixed(3) };
  });

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const rows = [['Mois','Année','Jours ouvrés','Taux/j (TND)','Attendu (TND)','Reçu','Date réception','Note']];
    data.forEach(d => rows.push([
      MOIS_FR[d.mois], d.annee, d.joursOuvres, d.montantParJour,
      d.montantAttendu, d.recu ? 'Oui' : 'Non',
      d.dateReception ? fmtDate(d.dateReception) : '', d.note || ''
    ]));
    const csv  = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `essence_${annee}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV téléchargé');
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div style={{ width:38, height:38, border:'3px solid rgba(245,158,11,0.2)', borderTopColor:'#f59e0b', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
    </div>
  );

  const pctColor = (stats?.pctRecu || 0) >= 70 ? '#12b76a' : (stats?.pctRecu || 0) >= 40 ? '#f59e0b' : '#f04438';

  return (
    <div className="animate-fade">

      {/* ══════════════════════════════════════════════════════════════
          ALERTE MOIS NON REÇU
          ══════════════════════════════════════════════════════════════ */}
      {showAlerte && (
        <div style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.35)', borderRadius:14, padding:'12px 18px', marginBottom:16, animation:'fadeSlideUp 0.3s ease both' }}>
          <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink:0 }}/>
          <div style={{ flex:1, fontSize:13, color:'var(--text-primary)' }}>
            <strong style={{ color:'#f59e0b' }}>{MOIS_FR[prevMoisIdx]}</strong> n'est pas encore marqué comme reçu — pense à le mettre à jour !
          </div>
          <button onClick={() => toggleRecu(prevMoisDoc)} style={{ padding:'6px 14px', borderRadius:10, border:'1px solid rgba(245,158,11,0.4)', background:'rgba(245,158,11,0.15)', color:'#f59e0b', cursor:'pointer', fontWeight:700, fontSize:12, flexShrink:0 }}>
            Marquer reçu
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          HEADER GLASSMORPHISM ORANGE
          ══════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(234,88,12,0.07),rgba(245,158,11,0.04))',
        borderRadius:20, padding: isMobile ? '20px 16px' : '24px 28px',
        marginBottom:22, border:'1px solid rgba(245,158,11,0.22)',
        boxShadow:'0 8px 32px rgba(245,158,11,0.12)', backdropFilter:'blur(10px)',
        animation:'fadeSlideUp 0.4s ease both'
      }}>

        {/* Ligne 1 : icône + titre + contrôles */}
        <div style={{ display:'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent:'space-between', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 14 : 0 }}>

          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#f59e0b,#ea580c)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 20px rgba(245,158,11,0.45)', flexShrink:0 }}>
              <Fuel size={26} color="#fff"/>
            </div>
            <div>
              <h1 style={{ margin:0, fontSize: isMobile ? 20 : 24 }}>Indemnité Carburant</h1>
              <p style={{ color:'var(--text-muted)', fontSize:13, margin:'2px 0 0' }}>
                5 DT/jour · Lun → Ven ·{' '}
                <span style={{ color:'#f59e0b', fontWeight:700 }}>{stats?.totalJours || 0}</span> jours ouvrés
              </p>
            </div>
          </div>

          {/* Contrôles droite */}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            {/* Sélecteur année dynamique */}
            <select value={annee} onChange={e => setAnnee(parseInt(e.target.value))}
              style={{ fontSize:12, padding:'7px 12px', borderRadius:9, border:'1px solid rgba(245,158,11,0.3)', background:'var(--bg-card)', color:'var(--text-primary)', cursor:'pointer', outline:'none', fontWeight:700 }}>
              {annees.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {/* Bouton export */}
            <button onClick={exportCSV}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, border:'1px solid rgba(245,158,11,0.3)', background:'rgba(245,158,11,0.1)', color:'#f59e0b', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(245,158,11,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(245,158,11,0.1)'}>
              <Download size={13}/>{!isMobile && ' Export CSV'}
            </button>
          </div>
        </div>

        {/* Barre de progression */}
        <div style={{ marginTop:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600 }}>
              {stats?.moisRecus || 0} / {stats?.moisTotal || 0} mois reçus
            </span>
            <span style={{ fontSize:14, fontWeight:800, color: pctColor }}>
              {stats?.pctRecu || 0}% reçu
            </span>
          </div>
          <div style={{ height:8, borderRadius:4, background:'rgba(255,255,255,0.1)', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:4, background:`linear-gradient(90deg,#f59e0b,${pctColor})`, width:`${stats?.pctRecu || 0}%`, transition:'width 1.2s ease' }}/>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          STATS CARDS
          Mobile : 2 col / Desktop : 2fr 1fr 1fr 1fr 1fr
          ══════════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr 1fr', gap: isMobile ? 10 : 14, marginBottom:22 }}>

        {/* Total attendu — pleine largeur mobile */}
        <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto', background:'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.04))', borderRadius:16, padding: isMobile ? '16px 18px' : '22px 26px', border:'1px solid rgba(245,158,11,0.22)', display:'flex', alignItems:'center', gap:14, boxShadow:'0 4px 20px rgba(245,158,11,0.1)', animation:'fadeSlideUp 0.4s 0.05s ease both' }}>
          <div style={{ width: isMobile?44:56, height: isMobile?44:56, borderRadius:14, background:'linear-gradient(135deg,#f59e0b,#ea580c)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 14px rgba(245,158,11,0.4)' }}>
            <Target size={isMobile?20:26} color="#fff"/>
          </div>
          <div>
            <div style={{ fontSize:10, color:'#f59e0b', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Objectif annuel</div>
            <div style={{ fontSize: isMobile?22:28, fontWeight:800, color:'#f59e0b', lineHeight:1 }}>
              <AnimatedNumber value={stats?.totalAttendu || 0} color="#f59e0b"/>
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>
              {stats?.moisTotal || 0} mois · {fmtMoney((stats?.totalAttendu || 0) / Math.max(stats?.moisTotal || 1, 1))}/mois moy.
            </div>
          </div>
        </div>

        {/* Reçu */}
        <div style={{ background:'linear-gradient(135deg,rgba(18,183,106,0.1),rgba(18,183,106,0.03))', borderRadius:16, padding: isMobile?'14px 12px':'20px 18px', border:'1px solid rgba(18,183,106,0.2)', textAlign:'center', animation:'fadeSlideUp 0.4s 0.1s ease both' }}>
          <div style={{ fontSize:10, color:'#12b76a', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>✓ Reçu</div>
          <div style={{ fontSize: isMobile?16:20, fontWeight:800, lineHeight:1 }}><AnimatedNumber value={stats?.totalRecu || 0} color="#12b76a"/></div>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:6 }}>{stats?.moisRecus || 0} mois payés</div>
        </div>

        {/* Manquant */}
        <div style={{ background:'linear-gradient(135deg,rgba(240,68,56,0.08),rgba(240,68,56,0.02))', borderRadius:16, padding: isMobile?'14px 12px':'20px 18px', border:'1px solid rgba(240,68,56,0.15)', textAlign:'center', animation:'fadeSlideUp 0.4s 0.15s ease both' }}>
          <div style={{ fontSize:10, color:'#f04438', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>⏳ Manquant</div>
          <div style={{ fontSize: isMobile?16:20, fontWeight:800, lineHeight:1 }}><AnimatedNumber value={stats?.totalManquant || 0} color="#f04438"/></div>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:6 }}>{(stats?.moisTotal||0) - (stats?.moisRecus||0)} mois</div>
        </div>

        {/* Jours ouvrés */}
        <div style={{ background:'linear-gradient(135deg,rgba(59,108,248,0.08),rgba(59,108,248,0.02))', borderRadius:16, padding: isMobile?'14px 12px':'20px 18px', border:'1px solid rgba(59,108,248,0.18)', textAlign:'center', animation:'fadeSlideUp 0.4s 0.2s ease both' }}>
          <div style={{ fontSize:10, color:'#3b6cf8', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>📅 Jours</div>
          <div style={{ fontSize: isMobile?16:20, fontWeight:800, lineHeight:1 }}><AnimatedNumber value={stats?.totalJours || 0} decimals={0} suffix="" color="#3b6cf8"/></div>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:6 }}>jours ouvrés</div>
        </div>

        {/* Simulateur */}
        <div style={{ background:'linear-gradient(135deg,rgba(167,100,248,0.08),rgba(167,100,248,0.02))', borderRadius:16, padding: isMobile?'14px 12px':'20px 18px', border:'1px solid rgba(167,100,248,0.18)', textAlign:'center', animation:'fadeSlideUp 0.4s 0.25s ease both' }}>
          <div style={{ fontSize:10, color:'#a764f8', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:6 }}>⚡ Sim.</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, marginBottom:4 }}>
            <input type="number" value={simJours} min={1} max={31} onChange={e => setSimJours(parseInt(e.target.value)||0)}
              style={{ width:44, padding:'3px 6px', borderRadius:6, border:'1px solid rgba(167,100,248,0.3)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:13, fontWeight:700, textAlign:'center', outline:'none' }}/>
            <span style={{ fontSize:10, color:'var(--text-muted)' }}>j</span>
          </div>
          <div style={{ fontSize: isMobile?14:17, fontWeight:800, color:'#a764f8', lineHeight:1 }}>{(simJours * 5).toFixed(3)} TND</div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          GRAPHIQUE — Toggle Barres / Cumulatif
          ══════════════════════════════════════════════════════════════ */}
      <div style={{ background:'var(--bg-card)', borderRadius:16, padding: isMobile ? '16px' : '20px 24px', marginBottom:22, border:'1px solid var(--border)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)', animation:'fadeSlideUp 0.4s 0.15s ease both' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>
              {vueMode === 'annee' ? 'Carburant par mois' : 'Tendance cumulative'}
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{annee}</div>
          </div>
          <div style={{ display:'flex', gap:3, background:'rgba(0,0,0,0.08)', borderRadius:10, padding:3 }}>
            {[['annee','Barres',BarChart2],['cumul','Cumul',TrendingUp]].map(([k,l,Icon]) => (
              <button key={k} onClick={() => setVueMode(k)}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', border:'none', transition:'all 0.2s',
                  background: vueMode===k ? '#f59e0b' : 'transparent',
                  color: vueMode===k ? '#fff' : 'var(--text-muted)',
                  boxShadow: vueMode===k ? '0 2px 8px rgba(245,158,11,0.4)' : 'none' }}>
                <Icon size={12}/> {!isMobile && l}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={isMobile ? 130 : 170}>
          {vueMode === 'annee' ? (
            <BarChart data={chartBar} barSize={isMobile ? 14 : 22} margin={{ top:0, right:0, bottom:0, left:0 }}>
              <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize: isMobile?8:10 }} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, fontSize:12 }}
                formatter={v => [fmtMoney(v), '']} cursor={{ fill:'rgba(255,255,255,0.04)' }}/>
              <Bar dataKey="recu" name="Reçu" radius={[6,6,0,0]} fill="#12b76a"/>
              <Bar dataKey="attente" name="Attente" radius={[6,6,0,0]} fill="#f59e0b" opacity={0.5}/>
            </BarChart>
          ) : (
            <AreaChart data={chartCumul} margin={{ top:4, right:4, bottom:0, left:0 }}>
              <defs>
                <linearGradient id="gAttendu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gRecu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#12b76a" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#12b76a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize: isMobile?8:10 }} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, fontSize:12 }}
                formatter={v => [fmtMoney(v), '']}/>
              <Area type="monotone" dataKey="attendu" name="Attendu" stroke="#f59e0b" fill="url(#gAttendu)" strokeWidth={2}/>
              <Area type="monotone" dataKey="recu" name="Reçu" stroke="#12b76a" fill="url(#gRecu)" strokeWidth={2}/>
            </AreaChart>
          )}
        </ResponsiveContainer>

        {/* Légende */}
        <div style={{ display:'flex', gap:16, marginTop:10, flexWrap:'wrap' }}>
          <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text-muted)' }}>
            <span style={{ width:10, height:10, borderRadius:2, background:'#12b76a', display:'inline-block' }}/> Reçu
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text-muted)' }}>
            <span style={{ width:10, height:10, borderRadius:2, background:'#f59e0b', opacity:0.7, display:'inline-block' }}/> En attente
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          LISTE MENSUELLE
          ══════════════════════════════════════════════════════════════ */}
      <div style={{ background:'var(--bg-card)', borderRadius:16, overflow:'hidden', border:'1px solid var(--border)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)', animation:'fadeSlideUp 0.4s 0.2s ease both' }}>

        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', background:'linear-gradient(135deg,rgba(245,158,11,0.06),transparent)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>Historique mensuel {annee}</div>
          <div style={{ fontSize:11, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', color:'#f59e0b', padding:'3px 12px', borderRadius:20, fontWeight:700 }}>
            {data.length} mois
          </div>
        </div>

        {data.length > 0 ? (
          <div>
            {[...data].reverse().map((doc, i, arr) => {
              const hasNote = doc.note && doc.note.trim();
              return (
                <div key={doc._id}
                  style={{ display:'flex', alignItems:'center', gap: isMobile?10:14, padding: isMobile?'12px 14px':'14px 20px', borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none', transition:'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='var(--bg-secondary)'; if(!isMobile) e.currentTarget.style.transform='translateX(3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.transform='translateX(0)'; }}>

                  {/* Icône */}
                  <div style={{ width: isMobile?36:44, height: isMobile?36:44, borderRadius:12, background: doc.recu ? 'linear-gradient(135deg,rgba(18,183,106,0.15),rgba(18,183,106,0.05))' : 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${doc.recu ? 'rgba(18,183,106,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                    <Fuel size={isMobile?14:18} color={doc.recu ? '#12b76a' : '#f59e0b'}/>
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize: isMobile?13:14, fontWeight:700, color:'var(--text-primary)' }}>
                      {MOIS_FR[doc.mois]} {doc.annee}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:3 }}><Calendar size={9}/>{doc.joursOuvres} jours ouvrés</span>
                      {doc.recu && doc.dateReception && !isMobile && (
                        <span style={{ color:'#12b76a', fontWeight:600 }}>· Reçu le {fmtDate(doc.dateReception)}</span>
                      )}
                      {hasNote && <span style={{ color:'var(--text-muted)', fontStyle:'italic', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120 }}>📝 {doc.note}</span>}
                    </div>
                  </div>

                  {/* Taux — masqué mobile */}
                  {!isMobile && (
                    <div style={{ textAlign:'right', flexShrink:0, fontSize:11, color:'var(--text-muted)' }}>
                      {doc.joursOuvres} × {doc.montantParJour} TND
                    </div>
                  )}

                  {/* Montant */}
                  <div style={{ textAlign:'right', flexShrink:0, minWidth: isMobile?70:90 }}>
                    <div style={{ fontSize: isMobile?15:19, fontWeight:800, color: doc.recu ? '#12b76a' : '#f59e0b', lineHeight:1 }}>
                      {fmtMoney(doc.montantAttendu)}
                    </div>
                  </div>

                  {/* Bouton note */}
                  {!isMobile && (
                    <button onClick={() => setNoteModal(doc)}
                      style={{ padding:'6px 10px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', cursor:'pointer', transition:'all 0.2s', flexShrink:0 }}
                      onMouseEnter={e => { e.currentTarget.style.color='#f59e0b'; e.currentTarget.style.borderColor='rgba(245,158,11,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.borderColor='var(--border)'; }}>
                      <FileText size={13}/>
                    </button>
                  )}

                  {/* Toggle reçu */}
                  <button onClick={() => toggleRecu(doc)}
                    style={{ display:'flex', alignItems:'center', gap: isMobile?4:6, padding: isMobile?'6px 10px':'8px 16px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0, transition:'all 0.2s',
                      border:`1px solid ${doc.recu ? 'rgba(18,183,106,0.3)' : 'rgba(245,158,11,0.3)'}`,
                      background: doc.recu ? 'rgba(18,183,106,0.08)' : 'rgba(245,158,11,0.08)',
                      color: doc.recu ? '#12b76a' : '#f59e0b' }}
                    onMouseEnter={e => e.currentTarget.style.transform='scale(1.04)'}
                    onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                    {doc.recu
                      ? <><CheckCircle size={13}/>{!isMobile && ' Reçu'}</>
                      : <><XCircle size={13}/>{!isMobile && ' Attente'}</>}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
            <div style={{ width:64, height:64, borderRadius:18, background:'rgba(245,158,11,0.08)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', border:'1px solid rgba(245,158,11,0.15)' }}>
              <Fuel size={30} color="#f59e0b" style={{ opacity:0.4 }}/>
            </div>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text-secondary)', marginBottom:6 }}>Aucune donnée pour {annee}</div>
            <div style={{ fontSize:12 }}>Les mois apparaîtront automatiquement</div>
          </div>
        )}
      </div>

      {/* Modal note */}
      {noteModal && <NoteModal mois={noteModal} onSave={saveNote} onClose={() => setNoteModal(null)}/>}

      {/* Keyframes */}
      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
