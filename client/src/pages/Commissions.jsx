// ════════════════════════════════════════════════════════════════════════════
// client/src/pages/Commissions.jsx
// ════════════════════════════════════════════════════════════════════════════
// RESPONSIVE : iPhone 12 Pro Max (430px) et tous les mobiles (breakpoint 768px)
// DESIGN     : Header glassmorphism, chiffres animés, graphique par mois
// LOGIQUE    : Filtre statut + année dynamique selon données réelles
// API        : GET /api/solution-express — filtre commissionTotale > 0
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api';
import {
  DollarSign, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  TrendingUp, MapPin, Calendar, Wallet
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';

// ── Intercepteur JWT ──────────────────────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Helpers format ────────────────────────────────────────────────────────
const fmtDate  = d => d ? new Date(d).toLocaleDateString('fr-CA', { year:'numeric', month:'short', day:'numeric' }) : '—';
const fmtMoney = v => `${(v||0).toFixed(2)} TND`;

// ── Hook responsive ───────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT : AnimatedNumber
// Chiffre qui compte de 0 à la valeur cible avec easing cubique
// ════════════════════════════════════════════════════════════════════════════
function AnimatedNumber({ value, decimals = 2, suffix = ' TND', color }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const end   = value || 0;
    prev.current = end;
    if (start === end) return;
    const duration  = 900;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * ease);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <span style={{ color }}>{display.toFixed(decimals)}{suffix}</span>;
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT : CalendrierModerne
// Calendrier interactif — points verts/orange par jour avec commission
// ════════════════════════════════════════════════════════════════════════════
function CalendrierModerne({ commissions, onSelectDate, selectedDate }) {
  const today = new Date();
  const [current, setCurrent]   = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [animDir, setAnimDir]   = useState(null);

  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const firstDay    = new Date(current.year, current.month, 1).getDay();
  const offset      = firstDay === 0 ? 6 : firstDay - 1;
  const monthName   = new Date(current.year, current.month).toLocaleDateString('fr-CA', { month:'long', year:'numeric' });
  const days        = ['L','M','M','J','V','S','D'];

  const prevMonth = () => {
    setAnimDir('left');
    setTimeout(() => setAnimDir(null), 300);
    setCurrent(c => ({ year: c.month===0?c.year-1:c.year, month: c.month===0?11:c.month-1 }));
  };
  const nextMonth = () => {
    setAnimDir('right');
    setTimeout(() => setAnimDir(null), 300);
    setCurrent(c => ({ year: c.month===11?c.year+1:c.year, month: c.month===11?0:c.month+1 }));
  };

  // Index YYYY-MM-DD → {total, payee, attente, items}
  const byDate = {};
  commissions.forEach(c => {
    const d   = new Date(c.dateVente || c.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (!byDate[key]) byDate[key] = { total:0, payee:0, attente:0, items:[] };
    byDate[key].total += c.commissionTotale||0;
    if (c.commissionPayee) byDate[key].payee  += c.commissionTotale||0;
    else                   byDate[key].attente += c.commissionTotale||0;
    byDate[key].items.push(c);
  });

  // Total du mois affiché
  const totalMois = Object.entries(byDate)
    .filter(([k]) => k.startsWith(`${current.year}-${String(current.month+1).padStart(2,'0')}`))
    .reduce((s,[,v]) => s + v.total, 0);

  return (
    <div style={{ background:'var(--bg-card)', borderRadius:16, overflow:'hidden', border:'1px solid var(--border)', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>

      {/* Header gradient vert */}
      <div style={{ padding:'16px 20px', background:'linear-gradient(135deg,rgba(18,183,106,0.12),rgba(18,183,106,0.04))', borderBottom:'1px solid rgba(18,183,106,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={prevMonth} style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-card)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', transition:'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--bg-secondary)'; e.currentTarget.style.color='#12b76a'; }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--bg-card)'; e.currentTarget.style.color='var(--text-muted)'; }}>
          <ChevronLeft size={16}/>
        </button>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', textTransform:'capitalize' }}>{monthName}</div>
          {totalMois > 0 && (
            <div style={{ fontSize:11, color:'#12b76a', fontWeight:700, marginTop:2, background:'rgba(18,183,106,0.1)', padding:'1px 10px', borderRadius:20, display:'inline-block' }}>
              {fmtMoney(totalMois)} ce mois
            </div>
          )}
        </div>
        <button onClick={nextMonth} style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-card)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', transition:'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--bg-secondary)'; e.currentTarget.style.color='#12b76a'; }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--bg-card)'; e.currentTarget.style.color='var(--text-muted)'; }}>
          <ChevronRight size={16}/>
        </button>
      </div>

      {/* Corps calendrier */}
      <div style={{ padding:'16px', transition:'opacity 0.25s', opacity: animDir ? 0.5 : 1 }}>
        {/* Jours semaine */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:8 }}>
          {days.map((d,i) => (
            <div key={i} style={{ textAlign:'center', fontSize:10, color:'var(--text-muted)', fontWeight:700, padding:'4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Grille jours */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
          {Array(offset).fill(null).map((_,i) => <div key={`e${i}`}/>)}
          {Array(daysInMonth).fill(null).map((_,i) => {
            const day     = i + 1;
            const date    = new Date(current.year, current.month, day);
            const key     = `${current.year}-${String(current.month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const data    = byDate[key];
            const isToday = date.toDateString() === today.toDateString();
            const isSel   = selectedDate && date.toDateString() === selectedDate.toDateString();
            const hasData = !!data;
            return (
              <div key={day}
                onClick={() => hasData ? onSelectDate(date, data.items) : onSelectDate(null, [])}
                style={{
                  borderRadius:8, padding:'5px 3px', textAlign:'center',
                  cursor: hasData ? 'pointer' : 'default', transition:'all 0.15s',
                  background: isSel ? 'linear-gradient(135deg,#12b76a,#0e9558)' : isToday ? 'rgba(59,108,248,0.12)' : hasData ? 'rgba(18,183,106,0.07)' : 'transparent',
                  border: isSel ? '2px solid #12b76a' : isToday ? '1px solid #3b6cf8' : hasData ? '1px solid rgba(18,183,106,0.25)' : '1px solid transparent',
                  boxShadow: isSel ? '0 2px 8px rgba(18,183,106,0.3)' : 'none',
                  minHeight:46, transform: isSel ? 'scale(1.05)' : 'scale(1)'
                }}
                onMouseEnter={e => { if(hasData && !isSel) { e.currentTarget.style.background='rgba(18,183,106,0.14)'; e.currentTarget.style.transform='scale(1.03)'; }}}
                onMouseLeave={e => { if(hasData && !isSel) { e.currentTarget.style.background='rgba(18,183,106,0.07)'; e.currentTarget.style.transform='scale(1)'; }}}>
                <div style={{ fontSize:12, fontWeight: isToday||isSel||hasData?700:400, color: isSel?'#fff':isToday?'#3b6cf8':'var(--text-primary)' }}>{day}</div>
                {hasData && (
                  <>
                    <div style={{ fontSize:8, fontWeight:700, color: isSel?'rgba(255,255,255,0.9)':'#12b76a', marginTop:1, lineHeight:1 }}>
                      {data.total >= 1000 ? `${(data.total/1000).toFixed(1)}k` : data.total.toFixed(0)}
                    </div>
                    <div style={{ display:'flex', justifyContent:'center', gap:2, marginTop:2 }}>
                      {data.payee   > 0 && <div style={{ width:3, height:3, borderRadius:'50%', background: isSel?'rgba(255,255,255,0.8)':'#12b76a' }}/>}
                      {data.attente > 0 && <div style={{ width:3, height:3, borderRadius:'50%', background: isSel?'rgba(255,255,255,0.6)':'#f79009' }}/>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div style={{ display:'flex', gap:12, marginTop:14, paddingTop:12, borderTop:'1px solid var(--border)', fontSize:10, color:'var(--text-muted)', flexWrap:'wrap' }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:7, height:7, borderRadius:'50%', background:'#12b76a', display:'inline-block' }}/> Payée</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:7, height:7, borderRadius:'50%', background:'#f79009', display:'inline-block' }}/> En attente</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:7, height:7, borderRadius:'50%', background:'#3b6cf8', display:'inline-block' }}/> Aujourd'hui</span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL : Commissions
// ════════════════════════════════════════════════════════════════════════════
export default function Commissions() {
  const isMobile = useIsMobile();

  const [fiches, setFiches]                 = useState([]);
  const [loading, setLoading]               = useState(true);
  const [filtre, setFiltre]                 = useState('tout');
  const [annee, setAnnee]                   = useState('tout');
  const [selectedDate, setSelectedDate]     = useState(null);
  const [selectedVentes, setSelectedVentes] = useState([]);

  // Fetch commissions
  const fetchFiches = useCallback(async () => {
    try {
      const r = await api.get('/api/solution-express');
      setFiches((r.data||[]).filter(x => (x.commissionTotale||0) > 0 || (x.commissionFixe||0) > 0));
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFiches(); }, [fetchFiches]);

  // Toggle payée / non payée
  const togglePaiement = async (fiche) => {
    try {
      await api.put(`/api/solution-express/${fiche._id}`, {
        ...fiche,
        commissionPayee: !fiche.commissionPayee,
        datePaiementCommission: !fiche.commissionPayee ? new Date().toISOString() : null,
      });
      toast.success(!fiche.commissionPayee ? '✓ Commission payée !' : 'Marquée non payée');
      setSelectedVentes(prev => prev.map(v => v._id === fiche._id ? {...v, commissionPayee: !fiche.commissionPayee} : v));
      fetchFiches();
    } catch { toast.error('Erreur'); }
  };

  // Années dynamiques — seulement celles qui ont des données
  const annees = [...new Set(fiches.map(c => new Date(c.dateVente || c.createdAt).getFullYear()))].sort((a,b) => b-a);

  // Filtrage
  const filtered = fiches.filter(c => {
    const yr      = new Date(c.dateVente || c.createdAt).getFullYear();
    const anneeOk = annee === 'tout' || String(yr) === annee;
    const statOk  = filtre === 'tout' ? true : filtre === 'payee' ? c.commissionPayee : !c.commissionPayee;
    return anneeOk && statOk;
  });

  // Stats
  const totalGagne = filtered.reduce((s,c) => s + (c.commissionTotale||0), 0);
  const totalPaye  = filtered.filter(c => c.commissionPayee).reduce((s,c) => s + (c.commissionTotale||0), 0);
  const enAttente  = totalGagne - totalPaye;
  const vals       = filtered.map(c => c.commissionTotale||0).filter(v => v > 0);
  const maximum    = vals.length > 0 ? Math.max(...vals) : 0;
  const minimum    = vals.length > 0 ? Math.min(...vals) : 0;

  // % payé pour la barre de progression dans le header
  const pctPaye = totalGagne > 0 ? Math.round((totalPaye / totalGagne) * 100) : 0;

  // Graphique par mois
  const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const chartData = MOIS.map((name, idx) => {
    const total = filtered.filter(c => new Date(c.dateVente || c.createdAt).getMonth() === idx)
      .reduce((s,c) => s + (c.commissionTotale||0), 0);
    return { name, total };
  });

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div style={{ width:36, height:36, border:'3px solid rgba(18,183,106,0.2)', borderTopColor:'#12b76a', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
    </div>
  );

  return (
    <div className="animate-fade">

      {/* ════════════════════════════════════════════════════════════════
          HEADER GLASSMORPHISM
          Fond gradient vert subtil + stats rapides inline
          ════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(18,183,106,0.1),rgba(59,108,248,0.06),rgba(18,183,106,0.04))',
        borderRadius:20, padding: isMobile ? '20px 16px' : '24px 28px',
        marginBottom:24, border:'1px solid rgba(18,183,106,0.18)',
        boxShadow:'0 8px 32px rgba(18,183,106,0.1)',
        backdropFilter:'blur(10px)',
        animation:'fadeSlideUp 0.4s ease both'
      }}>

        {/* Ligne 1 : Icône + Titre + Filtres */}
        <div style={{ display:'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent:'space-between', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 14 : 0 }}>

          {/* Icône + Titre */}
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#12b76a,#0e9558)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 20px rgba(18,183,106,0.4)', flexShrink:0 }}>
              <Wallet size={26} color="#191818"/>
            </div>
            <div>
              <h1 style={{ margin:0, fontSize: isMobile ? 20 : 24 }}>Commissions</h1>
              <p style={{ color:'var(--text-muted)', fontSize:13, margin:0, marginTop:2 }}>
                Solution Express · <span style={{ color:'#12b76a', fontWeight:700 }}>{fiches.length}</span> vente{fiches.length!==1?'s':''}
              </p>
            </div>
          </div>

          {/* Filtres */}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            {/* Statut */}
            <div style={{ display:'flex', gap:3, background:'rgba(0,0,0,0.1)', borderRadius:10, padding:3 }}>
              {[['tout','Tout'],['payee','✓ Payée'],['non_payee','⏳']].map(([k,l]) => (
                <button key={k} onClick={() => setFiltre(k)}
                  style={{ padding: isMobile ? '5px 10px' : '5px 14px', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', border:'none', transition:'all 0.2s',
                    background: filtre===k ? (k==='payee'?'#12b76a':k==='non_payee'?'#f79009':'var(--accent)') : 'transparent',
                    color: filtre===k ? '#fff' : 'var(--text-muted)',
                    boxShadow: filtre===k ? '0 2px 8px rgba(0,0,0,0.2)' : 'none' }}>
                  {l}
                </button>
              ))}
            </div>
            {/* Année */}
            <select value={annee} onChange={e => setAnnee(e.target.value)}
              style={{ fontSize:12, padding:'7px 12px', borderRadius:9, border:'1px solid rgba(18,183,106,0.25)', background:'var(--bg-card)', color:'var(--text-primary)', cursor:'pointer', outline:'none', fontWeight:700 }}>
              <option value="tout">Toutes</option>
              {annees.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Barre de progression payé seulement */}
        <div style={{ marginTop:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600 }}>
              {filtered.filter(c=>c.commissionPayee).length} / {filtered.length} ventes payées
            </span>
            <span style={{ fontSize:14, fontWeight:800, color: pctPaye >= 70 ? '#12b76a' : pctPaye >= 40 ? '#f79009' : '#f04438' }}>
              {pctPaye}% payé
            </span>
          </div>
          <div style={{ height:8, borderRadius:4, background:'rgba(255,255,255,0.1)', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:4, background:`linear-gradient(90deg,#12b76a,${pctPaye >= 70 ? '#0e9558' : '#f79009'})`, width:`${pctPaye}%`, transition:'width 1s ease' }}/>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          STATS CARDS DÉTAILLÉES
          Mobile : 2 colonnes / Desktop : 5 colonnes
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr 1fr', gap: isMobile ? 10 : 14, marginBottom:24 }}>

        {/* Total — pleine largeur sur mobile */}
        <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto', background:'linear-gradient(135deg,rgba(18,183,106,0.12),rgba(18,183,106,0.04))', borderRadius:16, padding: isMobile ? '16px 18px' : '22px 26px', border:'1px solid rgba(18,183,106,0.2)', display:'flex', alignItems:'center', gap:14, boxShadow:'0 4px 20px rgba(18,183,106,0.08)', animation:'fadeSlideUp 0.4s 0.05s ease both' }}>
          <div style={{ width: isMobile?44:56, height: isMobile?44:56, borderRadius:14, background:'linear-gradient(135deg,#12b76a,#0e9558)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 14px rgba(18,183,106,0.4)' }}>
            <TrendingUp size={isMobile?20:26} color="#fff"/>
          </div>
          <div>
            <div style={{ fontSize:10, color:'#12b76a', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Total gagné</div>
            <div style={{ fontSize: isMobile?22:28, fontWeight:800, color:'#12b76a', lineHeight:1 }}><AnimatedNumber value={totalGagne} color="#12b76a"/></div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>{filtered.length} vente{filtered.length!==1?'s':''} · moy. {fmtMoney(totalGagne/Math.max(filtered.length,1))}</div>
          </div>
        </div>

        {/* Payé */}
        <div style={{ background:'linear-gradient(135deg,rgba(59,108,248,0.08),rgba(59,108,248,0.02))', borderRadius:16, padding: isMobile?'14px 12px':'20px 18px', border:'1px solid rgba(59,108,248,0.18)', textAlign:'center', boxShadow:'0 4px 20px rgba(59,108,248,0.06)', animation:'fadeSlideUp 0.4s 0.1s ease both' }}>
          <div style={{ fontSize:10, color:'#3b6cf8', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>✓ Payé</div>
          <div style={{ fontSize: isMobile?16:20, fontWeight:800, lineHeight:1 }}><AnimatedNumber value={totalPaye} color="#3b6cf8"/></div>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:6 }}>{filtered.filter(c=>c.commissionPayee).length} vente{filtered.filter(c=>c.commissionPayee).length!==1?'s':''}</div>
        </div>

        {/* Attente */}
        <div style={{ background:'linear-gradient(135deg,rgba(247,144,9,0.08),rgba(247,144,9,0.02))', borderRadius:16, padding: isMobile?'14px 12px':'20px 18px', border:'1px solid rgba(247,144,9,0.18)', textAlign:'center', boxShadow:'0 4px 20px rgba(247,144,9,0.06)', animation:'fadeSlideUp 0.4s 0.15s ease both' }}>
          <div style={{ fontSize:10, color:'#f79009', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>⏳ Attente</div>
          <div style={{ fontSize: isMobile?16:20, fontWeight:800, lineHeight:1 }}><AnimatedNumber value={enAttente} color="#f79009"/></div>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:6 }}>{filtered.filter(c=>!c.commissionPayee).length} vente{filtered.filter(c=>!c.commissionPayee).length!==1?'s':''}</div>
        </div>

        {/* Maximum */}
        <div style={{ background:'linear-gradient(135deg,rgba(167,100,248,0.08),rgba(167,100,248,0.02))', borderRadius:16, padding: isMobile?'14px 12px':'20px 18px', border:'1px solid rgba(167,100,248,0.18)', textAlign:'center', boxShadow:'0 4px 20px rgba(167,100,248,0.06)', animation:'fadeSlideUp 0.4s 0.2s ease both' }}>
          <div style={{ fontSize:10, color:'#a764f8', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>↑ Max</div>
          <div style={{ fontSize: isMobile?16:20, fontWeight:800, lineHeight:1 }}><AnimatedNumber value={maximum} color="#a764f8"/></div>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:6 }}>meilleure</div>
        </div>

        {/* Minimum */}
        <div style={{ background:'linear-gradient(135deg,rgba(139,139,158,0.08),rgba(139,139,158,0.02))', borderRadius:16, padding: isMobile?'14px 12px':'20px 18px', border:'1px solid rgba(139,139,158,0.18)', textAlign:'center', animation:'fadeSlideUp 0.4s 0.25s ease both' }}>
          <div style={{ fontSize:10, color:'#8b8b9e', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>↓ Min</div>
          <div style={{ fontSize: isMobile?16:20, fontWeight:800, lineHeight:1 }}><AnimatedNumber value={minimum} color="#8b8b9e"/></div>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:6 }}>plus petite</div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          GRAPHIQUE PAR MOIS
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ background:'var(--bg-card)', borderRadius:16, padding: isMobile?'16px':'20px 24px', marginBottom:24, border:'1px solid var(--border)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>Commissions par mois</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{annee === 'tout' ? 'Toutes les années' : annee}</div>
          </div>
          <div style={{ fontSize:12, fontWeight:700, color:'#12b76a', background:'rgba(18,183,106,0.08)', padding:'4px 12px', borderRadius:20, border:'1px solid rgba(18,183,106,0.2)' }}>
            {fmtMoney(totalGagne)} total
          </div>
        </div>
        <ResponsiveContainer width="100%" height={isMobile ? 120 : 160}>
          <BarChart data={chartData} barSize={isMobile ? 14 : 22} margin={{ top:0, right:0, bottom:0, left:0 }}>
            <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize: isMobile?8:10 }} axisLine={false} tickLine={false}/>
            <YAxis hide/>
            <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, fontSize:12, boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }} formatter={v => [fmtMoney(v), 'Commission']} cursor={{ fill:'rgba(255,255,255,0.04)' }}/>
            <Bar dataKey="total" radius={[6,6,0,0]}>
              {chartData.map((e,i) => <Cell key={i} fill={e.total > 0 ? '#12b76a' : 'var(--bg-secondary)'}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          CALENDRIER + LISTE
          Mobile  : empilés
          Desktop : 2 colonnes (320px + 1fr)
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '320px 1fr', gap:20, alignItems:'flex-start' }}>

        {/* Colonne gauche : Calendrier + détail jour */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <CalendrierModerne commissions={filtered} selectedDate={selectedDate} onSelectDate={(date, ventes) => { setSelectedDate(date); setSelectedVentes(ventes); }}/>

          {/* Détail du jour sélectionné */}
          {selectedDate && selectedVentes.length > 0 && (
            <div style={{ background:'var(--bg-card)', borderRadius:16, overflow:'hidden', border:'1px solid rgba(18,183,106,0.2)', boxShadow:'0 4px 20px rgba(18,183,106,0.1)', animation:'fadeSlideUp 0.3s ease both' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'linear-gradient(135deg,rgba(18,183,106,0.08),transparent)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:6 }}>
                  <Calendar size={13} color="#12b76a"/>
                  {selectedDate.toLocaleDateString('fr-CA', { weekday:'long', day:'numeric', month:'long' })}
                </div>
                <button onClick={() => { setSelectedDate(null); setSelectedVentes([]); }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:18, lineHeight:1, transition:'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color='var(--danger)'}
                  onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>×</button>
              </div>
              <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:8 }}>
                {selectedVentes.map((c, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg-secondary)', borderRadius:10, padding:'10px 12px', gap:8, border:`1px solid ${c.commissionPayee?'rgba(18,183,106,0.15)':'rgba(247,144,9,0.15)'}` }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {c.entreprise || `${c.prenom||''} ${c.nom||''}`.trim() || 'Sans nom'}
                      </div>
                      {c.ville && <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{c.ville}</div>}
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color: c.commissionPayee?'#12b76a':'#f79009' }}>{fmtMoney(c.commissionTotale)}</div>
                      <div style={{ fontSize:9, color: c.commissionPayee?'#12b76a':'#f79009', fontWeight:600 }}>{c.commissionPayee?'✓ Payée':'⏳ Attente'}</div>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop:'1px solid var(--border)', paddingTop:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:11, color:'var(--text-muted)' }}>Total du jour</span>
                  <span style={{ fontSize:16, fontWeight:800, color:'#12b76a' }}>{fmtMoney(selectedVentes.reduce((s,c) => s+(c.commissionTotale||0), 0))}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite : Liste historique */}
        <div style={{ background:'var(--bg-card)', borderRadius:16, overflow:'hidden', border:'1px solid var(--border)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', background:'linear-gradient(135deg,rgba(18,183,106,0.06),transparent)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>Historique des ventes</div>
            {filtered.length > 0 && (
              <div style={{ fontSize:11, color:'var(--text-muted)', background:'var(--bg-secondary)', padding:'3px 12px', borderRadius:20, border:'1px solid var(--border)', fontWeight:600 }}>
                <span style={{ color:'var(--text-primary)', fontWeight:800 }}>{filtered.length}</span> vente{filtered.length!==1?'s':''}
              </div>
            )}
          </div>

          {filtered.length > 0 ? (
            <div>
              {[...filtered]
                .sort((a,b) => new Date(b.dateVente||b.createdAt) - new Date(a.dateVente||a.createdAt))
                .map((c, i, arr) => (
                <div key={c._id}
                  style={{ display:'flex', alignItems:'center', gap: isMobile?10:14, padding: isMobile?'12px 14px':'14px 20px', borderBottom: i<arr.length-1?'1px solid var(--border)':'none', transition:'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='var(--bg-secondary)'; if(!isMobile) e.currentTarget.style.transform='translateX(3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.transform='translateX(0)'; }}>

                  {/* Icône */}
                  <div style={{ width: isMobile?36:44, height: isMobile?36:44, borderRadius:12, background: c.commissionPayee?'linear-gradient(135deg,rgba(18,183,106,0.15),rgba(18,183,106,0.05))':'linear-gradient(135deg,rgba(247,144,9,0.15),rgba(247,144,9,0.05))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${c.commissionPayee?'rgba(18,183,106,0.2)':'rgba(247,144,9,0.2)'}` }}>
                    <Wallet size={isMobile?14:18} color={c.commissionPayee?'#12b76a':'#f79009'}/>
                  </div>

                  {/* Nom + infos */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize: isMobile?13:14, fontWeight:600, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {c.entreprise || `${c.prenom||''} ${c.nom||''}`.trim() || 'Sans nom'}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      {c.ville && <span style={{ display:'flex', alignItems:'center', gap:3 }}><MapPin size={9}/>{c.ville}</span>}
                      <span style={{ display:'flex', alignItems:'center', gap:3 }}><Calendar size={9}/>{fmtDate(c.dateVente || c.createdAt)}</span>
                      {c.commissionPayee && c.datePaiementCommission && !isMobile && (
                        <span style={{ color:'#12b76a', fontWeight:600 }}>· Payée le {fmtDate(c.datePaiementCommission)}</span>
                      )}
                    </div>
                  </div>

                  {/* Détail fixe + extra — caché sur mobile */}
                  {!isMobile && (c.commissionFixe > 0 || c.commissionExtra > 0) && (
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      {c.commissionFixe  > 0 && <div style={{ fontSize:11, color:'var(--text-muted)' }}>Fixe : <strong style={{color:'var(--text-secondary)'}}>{fmtMoney(c.commissionFixe)}</strong></div>}
                      {c.commissionExtra > 0 && <div style={{ fontSize:11, color:'var(--text-muted)' }}>Extra : <strong style={{color:'var(--text-secondary)'}}>{fmtMoney(c.commissionExtra)}</strong></div>}
                    </div>
                  )}

                  {/* Montant total */}
                  <div style={{ textAlign:'right', flexShrink:0, minWidth: isMobile?70:90 }}>
                    <div style={{ fontSize: isMobile?15:19, fontWeight:800, color: c.commissionPayee?'#12b76a':'#f79009', lineHeight:1 }}>
                      {fmtMoney(c.commissionTotale)}
                    </div>
                  </div>

                  {/* Bouton toggle */}
                  <button onClick={() => togglePaiement(c)}
                    style={{ display:'flex', alignItems:'center', gap: isMobile?4:6, padding: isMobile?'6px 10px':'8px 16px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0, transition:'all 0.2s',
                      border:`1px solid ${c.commissionPayee?'rgba(18,183,106,0.3)':'rgba(247,144,9,0.3)'}`,
                      background: c.commissionPayee?'rgba(18,183,106,0.08)':'rgba(247,144,9,0.08)',
                      color: c.commissionPayee?'#12b76a':'#f79009' }}
                    onMouseEnter={e => e.currentTarget.style.transform='scale(1.04)'}
                    onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                    {c.commissionPayee
                      ? <><CheckCircle size={13}/>{!isMobile && ' Payée'}</>
                      : <><XCircle size={13}/>{!isMobile && ' En attente'}</>}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
              <div style={{ width:64, height:64, borderRadius:18, background:'linear-gradient(135deg,rgba(18,183,106,0.08),rgba(18,183,106,0.02))', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', border:'1px solid rgba(18,183,106,0.15)' }}>
                <Wallet size={30} color="#12b76a" style={{ opacity:0.4 }}/>
              </div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text-secondary)', marginBottom:6 }}>Aucune commission</div>
              <div style={{ fontSize:12 }}>Ajoute une commission dans Solution Express</div>
            </div>
          )}
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}
