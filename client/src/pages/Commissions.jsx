// ════════════════════════════════════════════════════════════════════════════
// client/src/pages/Commissions.jsx
// ════════════════════════════════════════════════════════════════════════════
// RESPONSIVE : iPhone 12 Pro Max (430px) et tous les mobiles (breakpoint 768px)
// DESIGN     : Header glassmorphism, chiffres animés, graphique par mois
// LOGIQUE    : Filtre statut + année dynamique selon données réelles
// API        : GET /api/solution-express — filtre commissionTotale > 0
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useMemo } from 'react';
import AnimatedNumber from '../components/AnimatedNumber';
import api from '../api';
import {
  CheckCircle, XCircle, ChevronLeft, ChevronRight,
  TrendingUp, MapPin, Calendar, Wallet
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';


// ── Helpers format ────────────────────────────────────────────────────────
const fmtDate  = d => d ? new Date(d).toLocaleDateString('fr-CA', { year:'numeric', month:'short', day:'numeric', timeZone:'UTC' }) : '—';
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
// COMPOSANT : CalendrierModerne
// Calendrier interactif — points verts/orange par jour avec commission
// ════════════════════════════════════════════════════════════════════════════
function CalendrierModerne({ commissions, onSelectDate, selectedDate, onMonthChange }) {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });
  useEffect(() => { onMonthChange?.(current); }, [current]);

  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const firstDay    = new Date(current.year, current.month, 1).getDay();
  const offset      = firstDay === 0 ? 6 : firstDay - 1;
  const monthName   = new Date(current.year, current.month).toLocaleDateString('fr-CA', { month:'long', year:'numeric' });
  const days        = ['L','M','M','J','V','S','D'];

  const prevMonth = () => setCurrent(c => ({ year: c.month===0?c.year-1:c.year, month: c.month===0?11:c.month-1 }));
  const nextMonth = () => setCurrent(c => ({ year: c.month===11?c.year+1:c.year, month: c.month===11?0:c.month+1 }));

  // Index YYYY-MM-DD → {total, payee, attente, items}
  const byDate = {};
  commissions.forEach(c => {
    const d   = new Date(c.dateVente || c.createdAt);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
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
        <button onClick={prevMonth} style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-card)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#ffffff', transition:'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--bg-secondary)'; e.currentTarget.style.color='#12b76a'; }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--bg-card)'; e.currentTarget.style.color='#ffffff'; }}>
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
        <button onClick={nextMonth} style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-card)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#ffffff', transition:'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--bg-secondary)'; e.currentTarget.style.color='#12b76a'; }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--bg-card)'; e.currentTarget.style.color='#ffffff'; }}>
          <ChevronRight size={16}/>
        </button>
      </div>

      {/* Corps calendrier */}
      <div style={{ padding:'16px' }}>
        {/* Jours semaine */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:8 }}>
          {days.map((d,i) => (
            <div key={i} style={{ textAlign:'center', fontSize:10, color:'#ffffff', fontWeight:700, padding:'4px 0' }}>{d}</div>
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
        <div style={{ display:'flex', gap:12, marginTop:14, paddingTop:12, borderTop:'1px solid var(--border)', fontSize:10, color:'#ffffff', flexWrap:'wrap' }}>
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
  const [annee, setAnnee]                   = useState(String(new Date().getFullYear()));
  const [selectedDate, setSelectedDate]     = useState(null);
  const [selectedVentes, setSelectedVentes] = useState([]);
  const [resumeFiche, setResumeFiche]       = useState(null);
  const [calMois, setCalMois]               = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });
  const [settings, setSettings]             = useState({});

  // Fetch commissions
  const fetchFiches = useCallback(async () => {
    try {
      const r = await api.get('/api/solution-express');
      const fresh = (r.data||[]).filter(x => (x.commissionTotale||0) > 0 || (x.commissionFixe||0) > 0);
      setFiches(fresh);
      return fresh;
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  }, []);

  const fetchSettings = useCallback(() => {
    api.get('/api/settings').then(r => setSettings(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchFiches();
    fetchSettings();
    const onVisible = () => { if (!document.hidden) { fetchFiches(); fetchSettings(); } };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchFiches, fetchSettings]);

  const commerceLbl = useMemo(() =>
    Object.fromEntries((settings.typeCommerce||[]).map(t => [t.key, t.label])),
    [settings.typeCommerce]
  );

  const qualifLbl = useMemo(() =>
    Object.fromEntries((settings.qualificationSysteme||[]).map(q => [q.key, q.label])),
    [settings.qualificationSysteme]
  );

  // Toggle payée / non payée
  const togglePaiement = async (fiche) => {
    try {
      await api.put(`/api/solution-express/${fiche._id}`, {
        commissionPayee: !fiche.commissionPayee,
        datePaiementCommission: !fiche.commissionPayee ? new Date().toISOString() : null,
      });
      toast.success(!fiche.commissionPayee ? '✓ Commission payée !' : 'Marquée non payée');
      const fresh = await fetchFiches();
      if (fresh) {
        const ids = new Set(selectedVentes.map(v => v._id));
        setSelectedVentes(fresh.filter(f => ids.has(f._id)));
      }
    } catch { toast.error('Erreur'); }
  };

  // Années dynamiques — seulement celles qui ont des données
  const annees = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [...new Set([currentYear, ...fiches.map(c => new Date(c.dateVente || c.createdAt || Date.now()).getUTCFullYear())])].sort((a,b) => b-a);
  }, [fiches]);

  // Filtrage
  const filtered = fiches.filter(c => {
    const yr      = new Date(c.dateVente || c.createdAt).getUTCFullYear();
    const anneeOk = annee === 'tout' || String(yr) === String(annee);
    const statOk  = filtre === 'tout' ? true : filtre === 'payee' ? c.commissionPayee : !c.commissionPayee;
    return anneeOk && statOk;
  });

  // Stats — annulées exclues (cohérent avec la barre objectif)
  const filteredActives = filtered.filter(c => c.status !== 'installation_annulee');
  const totalGagne = filteredActives.reduce((s,c) => s + (c.commissionTotale||0), 0);
  const totalPaye  = filteredActives.filter(c => c.commissionPayee).reduce((s,c) => s + (c.commissionTotale||0), 0);
  const enAttente  = Math.max(0, totalGagne - totalPaye);
  const vals       = filteredActives.map(c => c.commissionTotale||0).filter(v => v > 0);
  const maximum    = vals.length > 0 ? Math.max(...vals) : 0;
  const minimum    = vals.length > 0 ? Math.min(...vals) : 0;

  const filteredHistorique = filtered.filter(c => {
    const d = new Date(c.dateVente || c.createdAt);
    return d.getUTCFullYear() === calMois.year && d.getUTCMonth() === calMois.month;
  });

  // % payé pour la barre de progression dans le header
  const pctPaye = totalGagne > 0 ? Math.round((totalPaye / totalGagne) * 100) : 0;

  // Graphique : par année si "tout", une barre par fiche si année précise
  const MOIS_COURT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const YEAR_COLORS = ['#12b76a','#3b6cf8','#f79009','#a764f8','#f04438','#61DAFB','#f97316'];
  const chartData = annee === 'tout'
    ? annees.map((yr, i) => {
        const yrFiches = filtered.filter(c => new Date(c.dateVente || c.createdAt).getUTCFullYear() === yr);
        return { name: String(yr), total: yrFiches.reduce((s,c) => s + (c.commissionTotale||0), 0), count: yrFiches.length, color: YEAR_COLORS[i % YEAR_COLORS.length] };
      })
    : [...filteredHistorique]
        .sort((a,b) => new Date(a.dateVente||a.createdAt) - new Date(b.dateVente||b.createdAt))
        .map(c => {
          const d       = new Date(c.dateVente || c.createdAt);
          const label   = `${d.getUTCDate()} ${MOIS_COURT[d.getUTCMonth()]}`;
          const annulee = c.status === 'installation_annulee';
          return {
            name:    label,
            total:   c.commissionTotale || 0,
            color:   annulee ? '#be123c' : '#12b76a',
            annulee,
            fullNom: c.entreprise || `${c.prenom||''} ${c.nom||''}`.trim() || '?',
            motif:   c.motifAnnulation || '',
            payee:   c.commissionPayee,
          };
        });

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ position:'relative', width:44, height:44 }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid rgba(16,185,129,0.12)' }}/>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid transparent', borderTopColor:'#10b981', animation:'spin 0.9s linear infinite' }}/>
        <div style={{ position:'absolute', inset:4, borderRadius:'50%', border:'2px solid transparent', borderBottomColor:'rgba(59,130,246,0.5)', animation:'spin 1.5s linear infinite reverse' }}/>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="animate-fade">

      {/* ════════════════════════════════════════════════════════════════
          HEADER ULTRA-MODERN — gradient border + aurora
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ padding:'1.5px', borderRadius:22, background:'linear-gradient(135deg,#12b76a70,#61DAFB35,#a78bfa25)', marginBottom:24, animation:'fadeSlideUp 0.4s ease both' }}>
      <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:'20.5px', padding: isMobile ? '20px 16px' : '28px 32px', backdropFilter:'blur(40px)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-80, left:-60, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(18,183,106,0.20) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-50, right:-30, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(97,218,251,0.12) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1 }}>

        {/* Ligne 1 : Icône + Titre + Filtres */}
        <div style={{ display:'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent:'space-between', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 14 : 0 }}>

          {/* Icône + Titre */}
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#12b76a,#61DAFB)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 28px rgba(18,183,106,0.55)', flexShrink:0 }}>
              <Wallet size={26} color="#030a16"/>
            </div>
            <div>
              <h1 style={{ margin:0, fontSize: isMobile ? 20 : 24 }}>Commissions</h1>
              <p style={{ color:'#ffffff', fontSize:13, margin:0, marginTop:2 }}>
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
                    color: filtre===k ? '#fff' : '#ffffff',
                    boxShadow: filtre===k ? '0 2px 8px rgba(0,0,0,0.2)' : 'none' }}>
                  {l}
                </button>
              ))}
            </div>
            {/* Date courante — desktop seulement */}
            {!isMobile && (
              <div style={{ fontSize:12, color:'#efefef', background:'var(--bg-card)', padding:'6px 14px', borderRadius:8, border:'1px solid var(--border)', textTransform:'capitalize' }}>
                {new Date().toLocaleDateString('fr-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
              </div>
            )}
            {/* Année */}
            <select value={annee} onChange={e => { setAnnee(e.target.value); setFiltre('tout'); }}
              style={{ fontSize:12, padding:'7px 12px', borderRadius:9, border:'1px solid rgba(18,183,106,0.25)', background:'var(--bg-card)', color:'var(--text-primary)', cursor:'pointer', outline:'none', fontWeight:700 }}>
              <option value="tout">Toutes les années</option>
              {annees.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Barre de progression payé seulement */}
        <div style={{ marginTop:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:12, color:'#ffffff', fontWeight:600 }}>
              {filteredActives.filter(c=>c.commissionPayee).length} / {filteredActives.length} ventes payées
            </span>
            <span style={{ fontSize:14, fontWeight:800, color: pctPaye >= 70 ? '#12b76a' : pctPaye >= 40 ? '#f79009' : '#f04438' }}>
              {pctPaye}% payé
            </span>
          </div>
          <div style={{ height:8, borderRadius:4, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:4, background:`linear-gradient(90deg,#12b76a,${pctPaye >= 70 ? '#61DAFB' : '#f79009'})`, width:`${pctPaye}%`, transition:'width 1s ease', boxShadow:'0 0 12px rgba(18,183,106,0.6)' }}/>
          </div>
        </div>
        </div>{/* /zIndex:1 */}
      </div>{/* /glassmorphism */}
      </div>{/* /gradient border */}

      {/* ════════════════════════════════════════════════════════════════
          STATS CARDS DÉTAILLÉES
          Mobile : 2 colonnes / Desktop : 5 colonnes
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr 1fr', gap: isMobile ? 10 : 14, marginBottom:24 }}>

        {/* Total — pleine largeur sur mobile */}
        <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto', padding:'1.5px', borderRadius:18, background:'linear-gradient(135deg,#12b76a70,#61DAFB35)', animation:'fadeSlideUp 0.4s 0.05s ease both' }}>
        <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:'16.5px', padding: isMobile ? '16px 18px' : '22px 26px', backdropFilter:'blur(20px)', display:'flex', alignItems:'center', gap:14, height:'100%' }}>
          <div style={{ width: isMobile?44:56, height: isMobile?44:56, borderRadius:14, background:'linear-gradient(135deg,#12b76a,#61DAFB)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 20px rgba(18,183,106,0.5)' }}>
            <TrendingUp size={isMobile?20:26} color="#030a16"/>
          </div>
          <div>
            <div style={{ fontSize:10, color:'#12b76a', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Total gagné</div>
            <div style={{ fontSize: isMobile?22:28, fontWeight:800, color:'#12b76a', lineHeight:1 }}><AnimatedNumber value={totalGagne} color="#12b76a"/></div>
            <div style={{ fontSize:11, color:'#ffffff', marginTop:6 }}>{filtered.length} vente{filtered.length!==1?'s':''} · moy. {fmtMoney(totalGagne/Math.max(filtered.length,1))}</div>
          </div>
        </div>
        </div>{/* /gradient total */}

        {/* Payé */}
        <div style={{ padding:'1px', borderRadius:16, background:'linear-gradient(135deg,#3b6cf860,#61DAFB20)', animation:'fadeSlideUp 0.4s 0.1s ease both' }}>
        <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:15, padding: isMobile?'14px 12px':'20px 18px', backdropFilter:'blur(20px)', textAlign:'center', height:'100%' }}>
          <div style={{ fontSize:10, color:'#61DAFB', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>✓ Payé</div>
          <div style={{ fontSize: isMobile?16:20, fontWeight:800, lineHeight:1 }}><AnimatedNumber value={totalPaye} color="#61DAFB"/></div>
          <div style={{ fontSize:10, color:'#ffffff', marginTop:6 }}>{filtered.filter(c=>c.commissionPayee).length} vente{filtered.filter(c=>c.commissionPayee).length!==1?'s':''}</div>
        </div>
        </div>

        {/* Attente */}
        <div style={{ padding:'1px', borderRadius:16, background:'linear-gradient(135deg,#f7900960,#f0443820)', animation:'fadeSlideUp 0.4s 0.15s ease both' }}>
        <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:15, padding: isMobile?'14px 12px':'20px 18px', backdropFilter:'blur(20px)', textAlign:'center', height:'100%' }}>
          <div style={{ fontSize:10, color:'#f79009', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>⏳ Attente</div>
          <div style={{ fontSize: isMobile?16:20, fontWeight:800, lineHeight:1 }}><AnimatedNumber value={enAttente} color="#f79009"/></div>
          <div style={{ fontSize:10, color:'#ffffff', marginTop:6 }}>{filtered.filter(c=>!c.commissionPayee).length} vente{filtered.filter(c=>!c.commissionPayee).length!==1?'s':''}</div>
        </div>
        </div>

        {/* Maximum */}
        <div style={{ padding:'1px', borderRadius:16, background:'linear-gradient(135deg,#a78bfa60,#61DAFB20)', animation:'fadeSlideUp 0.4s 0.2s ease both' }}>
        <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:15, padding: isMobile?'14px 12px':'20px 18px', backdropFilter:'blur(20px)', textAlign:'center', height:'100%' }}>
          <div style={{ fontSize:10, color:'#a78bfa', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>↑ Max</div>
          <div style={{ fontSize: isMobile?16:20, fontWeight:800, lineHeight:1 }}><AnimatedNumber value={maximum} color="#a78bfa"/></div>
          <div style={{ fontSize:10, color:'#ffffff', marginTop:6 }}>meilleure</div>
        </div>
        </div>

        {/* Minimum */}
        <div style={{ padding:'1px', borderRadius:16, background:'linear-gradient(135deg,#8b8b9e40,#61DAFB15)', animation:'fadeSlideUp 0.4s 0.25s ease both' }}>
        <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:15, padding: isMobile?'14px 12px':'20px 18px', backdropFilter:'blur(20px)', textAlign:'center', height:'100%' }}>
          <div style={{ fontSize:10, color:'#8b8b9e', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>↓ Min</div>
          <div style={{ fontSize: isMobile?16:20, fontWeight:800, lineHeight:1 }}><AnimatedNumber value={minimum} color="#8b8b9e"/></div>
          <div style={{ fontSize:10, color:'#ffffff', marginTop:6 }}>plus petite</div>
        </div>
        </div>
      </div>

      {/* Barre objectif annuel */}
      {annee !== 'tout' && ((settings.objectifAnnuel||{})[annee] > 0) && (() => {
        const obj = (settings.objectifAnnuel||{})[annee];
        const actives = filtered.filter(c => c.status !== 'installation_annulee');
        const gagneActif = actives.reduce((s,c) => s+(c.commissionTotale||0), 0);
        const pct = Math.min(100, Math.round((gagneActif / obj) * 100));
        return (
          <div style={{ marginBottom:20, background:'rgba(18,183,106,0.05)', borderRadius:12, padding:'12px 16px', border:'1px solid rgba(18,183,106,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#ffffff', marginBottom:6 }}>
              <span style={{ fontWeight:700 }}>Objectif {annee}</span>
              <span style={{ fontWeight:700, color: pct >= 100 ? '#12b76a' : '#f79009' }}>
                {gagneActif.toFixed(0)} / {obj} TND — {pct}%
              </span>
            </div>
            <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:3, background: pct >= 100 ? 'linear-gradient(90deg,#12b76a,#61DAFB)' : 'linear-gradient(90deg,#3b6cf8,#12b76a)', width:`${pct}%`, transition:'width 1.2s ease' }}/>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════
          GRAPHIQUE PAR MOIS
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ padding:'1.5px', borderRadius:18, background:'linear-gradient(135deg,#12b76a50,#61DAFB25,#a78bfa15)', marginBottom:24 }}>
      <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:'16.5px', padding: isMobile?'16px':'20px 24px', backdropFilter:'blur(20px)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>Commissions par mois</div>
            <div style={{ fontSize:11, color:'#ffffff', marginTop:2 }}>{annee === 'tout' ? 'Toutes les années' : annee}</div>
          </div>
          <div style={{ fontSize:12, fontWeight:700, color:'#12b76a', background:'rgba(18,183,106,0.08)', padding:'4px 12px', borderRadius:20, border:'1px solid rgba(18,183,106,0.2)' }}>
            {fmtMoney(totalGagne)} total
          </div>
        </div>
        <ResponsiveContainer width="100%" height={isMobile ? 120 : 160}>
          <BarChart data={chartData} barSize={isMobile ? 14 : 22} margin={{ top:0, right:0, bottom:0, left:0 }}>
            <XAxis dataKey="name" tick={{ fill:'#ffffff', fontSize: isMobile?8:10 }} axisLine={false} tickLine={false}/>
            <YAxis hide/>
            <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, fontSize:12, boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                if (!d.total) return null;
                return (
                  <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:12, maxWidth:200 }}>
                    {annee !== 'tout' && <div style={{ color:'var(--text-primary)', fontWeight:700, marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{d.fullNom}</div>}
                    <div style={{ color: d.color || '#12b76a', fontWeight:700, marginBottom:4 }}>{fmtMoney(d.total)}</div>
                    {annee !== 'tout' ? (
                      <>
                        <div style={{ color: d.annulee ? '#be123c' : '#12b76a' }}>{d.annulee ? '❌ Annulée' : '✅ Installé'}</div>
                        {d.annulee && d.motif && <div style={{ color:'#be123c', fontSize:11, marginTop:2 }}>✕ {d.motif}</div>}
                        <div style={{ color: d.payee ? '#12b76a' : '#f79009', fontSize:11, marginTop:2 }}>{d.payee ? '✓ Payée' : '⏳ Non payée'}</div>
                      </>
                    ) : (
                      <div style={{ color:'#ffffff' }}>{d.count} installation{d.count > 1 ? 's' : ''}</div>
                    )}
                  </div>
                );
              }}
              cursor={{ fill:'rgba(255,255,255,0.04)' }}/>
            <Bar dataKey="total" radius={[6,6,0,0]}>
              {chartData.map((e,i) => <Cell key={i} fill={e.total > 0 ? (e.color || '#12b76a') : 'rgba(255,255,255,0.06)'}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      </div>{/* /gradient border chart */}

      {/* ════════════════════════════════════════════════════════════════
          CALENDRIER + LISTE
          Mobile  : empilés
          Desktop : 2 colonnes (320px + 1fr)
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '320px 1fr', gap:20, alignItems:'flex-start' }}>

        {/* Colonne gauche : Calendrier + détail jour */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <CalendrierModerne commissions={filtered} selectedDate={selectedDate} onSelectDate={(date, ventes) => { setSelectedDate(date); setSelectedVentes(ventes); }} onMonthChange={setCalMois}/>

          {/* Détail du jour sélectionné */}
          {selectedDate && selectedVentes.length > 0 && (
            <div style={{ background:'var(--bg-card)', borderRadius:16, overflow:'hidden', border:'1px solid rgba(18,183,106,0.2)', boxShadow:'0 4px 20px rgba(18,183,106,0.1)', animation:'fadeSlideUp 0.3s ease both' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'linear-gradient(135deg,rgba(18,183,106,0.08),transparent)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:6 }}>
                  <Calendar size={13} color="#12b76a"/>
                  {selectedDate.toLocaleDateString('fr-CA', { weekday:'long', day:'numeric', month:'long' })}
                </div>
                <button onClick={() => { setSelectedDate(null); setSelectedVentes([]); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#ffffff', fontSize:18, lineHeight:1, transition:'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color='var(--danger)'}
                  onMouseLeave={e => e.currentTarget.style.color='#ffffff'}>×</button>
              </div>
              <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:8 }}>
                {selectedVentes.map((c, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg-secondary)', borderRadius:10, padding:'10px 12px', gap:8, border:`1px solid ${c.commissionPayee?'rgba(18,183,106,0.15)':'rgba(247,144,9,0.15)'}` }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {c.entreprise || `${c.prenom||''} ${c.nom||''}`.trim() || 'Sans nom'}
                      </div>
                      {c.ville && <div style={{ fontSize:10, color:'#ffffff', marginTop:2 }}>{c.ville}</div>}
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color: c.commissionPayee?'#12b76a':'#f79009' }}>{fmtMoney(c.commissionTotale)}</div>
                      <div style={{ fontSize:9, color: c.commissionPayee?'#12b76a':'#f79009', fontWeight:600 }}>{c.commissionPayee?'✓ Payée':'⏳ Attente'}</div>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop:'1px solid var(--border)', paddingTop:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:11, color:'#ffffff' }}>Total du jour</span>
                  <span style={{ fontSize:16, fontWeight:800, color:'#12b76a' }}>{fmtMoney(selectedVentes.reduce((s,c) => s+(c.commissionTotale||0), 0))}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite : Liste historique */}
        <div style={{ padding:'1.5px', borderRadius:18, background:'linear-gradient(135deg,#12b76a40,#a78bfa20)' }}>
        <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:'16.5px', overflow:'hidden', backdropFilter:'blur(20px)' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg,rgba(18,183,106,0.08),transparent)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>Historique des commissions</div>
            {filteredHistorique.length > 0 && (
              <div style={{ fontSize:11, color:'#ffffff', background:'var(--bg-secondary)', padding:'3px 12px', borderRadius:20, border:'1px solid var(--border)', fontWeight:600 }}>
                <span style={{ color:'var(--text-primary)', fontWeight:800 }}>{filteredHistorique.length}</span> vente{filteredHistorique.length!==1?'s':''}
              </div>
            )}
          </div>

          {filteredHistorique.length > 0 ? (
            <div>
              {[...filteredHistorique]
                .sort((a,b) => new Date(b.dateVente||b.createdAt) - new Date(a.dateVente||a.createdAt))
                .map((c, i, arr) => {
                  const annulee = c.status === 'installation_annulee';
                  const color   = annulee ? '#be123c' : c.commissionPayee ? '#12b76a' : '#f79009';
                  return (
                <div key={c._id}
                  style={{ display:'flex', alignItems:'center', gap: isMobile?10:14, padding: isMobile?'12px 14px':'14px 20px', borderBottom: i<arr.length-1?'1px solid var(--border)':'none', transition:'all 0.15s', background: annulee?'rgba(190,18,60,0.03)':undefined }}
                  onMouseEnter={e => { e.currentTarget.style.background= annulee?'rgba(190,18,60,0.07)':'var(--bg-secondary)'; if(!isMobile) e.currentTarget.style.transform='translateX(3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background= annulee?'rgba(190,18,60,0.03)':'transparent'; e.currentTarget.style.transform='translateX(0)'; }}>

                  {/* Icône */}
                  <div style={{ width: isMobile?36:44, height: isMobile?36:44, borderRadius:12, background:`linear-gradient(135deg,${color}22,${color}08)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${color}33` }}>
                    <Wallet size={isMobile?14:18} color={color}/>
                  </div>

                  {/* Nom + infos */}
                  <div style={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={() => setResumeFiche(c)}>
                    <div style={{ fontSize: isMobile?13:14, fontWeight:600, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {c.entreprise || `${c.prenom||''} ${c.nom||''}`.trim() || 'Sans nom'}
                    </div>
                    {c.typeClient === 'b2b' && c.entreprise && (`${c.prenom||''} ${c.nom||''}`.trim()) && (
                      <div style={{ fontSize:11, color:'#ffffff', fontWeight:500, marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {`${c.prenom||''} ${c.nom||''}`.trim()}
                      </div>
                    )}
                    <div style={{ fontSize:11, color:'#ffffff', marginTop:3, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      {c.ville && <span style={{ display:'flex', alignItems:'center', gap:3 }}><MapPin size={9}/>{c.ville}</span>}
                      <span style={{ display:'flex', alignItems:'center', gap:3 }}><Calendar size={9}/>{fmtDate(c.dateVente || c.createdAt)}</span>
                      {c.commissionPayee && c.datePaiementCommission && !isMobile && (
                        <span style={{ color:'#12b76a', fontWeight:600 }}>· Payée le {fmtDate(c.datePaiementCommission)}</span>
                      )}
                    </div>
                    {annulee && c.motifAnnulation && (
                      <div style={{ fontSize:10, color:'#be123c', marginTop:3, fontWeight:600 }}>✕ {c.motifAnnulation}</div>
                    )}
                  </div>

                  {/* Détail fixe + extra — caché sur mobile */}
                  {!isMobile && !annulee && (c.commissionFixe > 0 || c.commissionExtra > 0) && (
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      {c.commissionFixe  > 0 && <div style={{ fontSize:11, color:'#ffffff' }}>Fixe : <strong style={{color:'#ffffff'}}>{fmtMoney(c.commissionFixe)}</strong></div>}
                      {c.commissionExtra > 0 && <div style={{ fontSize:11, color:'#ffffff' }}>Extra : <strong style={{color:'#ffffff'}}>{fmtMoney(c.commissionExtra)}</strong></div>}
                    </div>
                  )}

                  {/* Montant total */}
                  <div style={{ textAlign:'right', flexShrink:0, minWidth: isMobile?70:90 }}>
                    <div style={{ fontSize: isMobile?15:19, fontWeight:800, color, lineHeight:1 }}>
                      {fmtMoney(c.commissionTotale)}
                    </div>
                    {annulee && <div style={{ fontSize:9, color:'#be123c', fontWeight:700, marginTop:2 }}>ANNULÉE</div>}
                  </div>

                  {/* Bouton toggle ou badge annulée */}
                  {annulee ? (
                    <div style={{ display:'flex', alignItems:'center', gap:4, padding: isMobile?'6px 10px':'8px 14px', borderRadius:20, fontSize:11, fontWeight:700, flexShrink:0, border:'1px solid rgba(190,18,60,0.3)', background:'rgba(190,18,60,0.08)', color:'#be123c' }}>
                      ❌{!isMobile && ' Annulée'}
                    </div>
                  ) : (
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
                  )}
                </div>
                  );
                })}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'#ffffff' }}>
              <div style={{ width:64, height:64, borderRadius:18, background:'linear-gradient(135deg,rgba(18,183,106,0.08),rgba(18,183,106,0.02))', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', border:'1px solid rgba(18,183,106,0.15)' }}>
                <Wallet size={30} color="#12b76a" style={{ opacity:0.4 }}/>
              </div>
              <div style={{ fontSize:14, fontWeight:600, color:'#ffffff', marginBottom:6 }}>Aucune commission</div>
              <div style={{ fontSize:12 }}>Ajoute une commission dans Solution Express</div>
            </div>
          )}
        </div>
        </div>{/* /glassmorphism historique */}
        </div>{/* /gradient border historique */}

      {/* ════ MODAL RÉSUMÉ ════ */}
      {resumeFiche && (
        <div onClick={() => setResumeFiche(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(8px)', animation:'fadeIn 0.15s ease' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:'var(--bg-card)', borderRadius:20, width:'100%', maxWidth:620, maxHeight:'85vh', display:'flex', flexDirection:'column', border:'1px solid rgba(18,183,106,0.2)', boxShadow:'0 24px 80px rgba(0,0,0,0.6)', animation:'slideUp 0.2s ease' }}>

            {/* Header */}
            {(() => {
              const STATUS_LBL = { new:'Nouveau', contacted:'Contacté', proposal:'Soumission', installation_en_cours:'Installation en cours', installe:'Installé', installation_annulee:'Installation annulée' };
              const STATUS_CLR = { new:'#3b6cf8', contacted:'#f79009', proposal:'#a764f8', installation_en_cours:'#f97316', installe:'#22c55e', installation_annulee:'#be123c' };
              const f = resumeFiche;
              const nomContact = `${f.prenom||''} ${f.nom||''}`.trim();
              return (
                <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexShrink:0 }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {/* Nom */}
                    <div style={{ fontSize:15, fontWeight:800, color:'var(--text-primary)' }}>
                      {f.entreprise || nomContact || 'Sans nom'}
                    </div>
                    {/* B2B/B2C + commerce + ville */}
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background: f.typeClient==='b2b'?'rgba(59,108,248,0.15)':'rgba(167,139,250,0.15)', color: f.typeClient==='b2b'?'#3b6cf8':'#a78bfa', border:`1px solid ${f.typeClient==='b2b'?'rgba(59,108,248,0.3)':'rgba(167,139,250,0.3)'}` }}>
                        {f.typeClient==='b2b'?'🏢 B2B':'👤 B2C'}
                      </span>
                      {f.typeCommerce && f.typeCommerce !== 'autre' && (
                        <span style={{ fontSize:11, color:'#ffffff', fontWeight:600 }}>{commerceLbl[f.typeCommerce]||f.typeCommerce}</span>
                      )}
                      {f.ville && <span style={{ fontSize:11, color:'#ffffff' }}>· {f.ville}</span>}
                    </div>
                    {/* Pipeline */}
                    {f.status && (
                      <div style={{ display:'inline-flex', alignItems:'center' }}>
                        <span style={{ fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20, background:`${STATUS_CLR[f.status]}20`, color:STATUS_CLR[f.status]||'#ffffff', border:`1px solid ${STATUS_CLR[f.status]}40` }}>
                          {STATUS_LBL[f.status]||f.status}
                        </span>
                      </div>
                    )}
                    {/* Contact */}
                    {nomContact && (
                      <div style={{ fontSize:12, color:'#ffffff' }}>
                        <span style={{ color:'#ffffff' }}>Contact : </span>{nomContact}
                      </div>
                    )}
                    {/* Qualification système */}
                    {f.qualificationSysteme && (
                      <div style={{ fontSize:11, color:'#ffffff' }}>
                        <span style={{ fontWeight:600 }}>Système : </span>{qualifLbl[f.qualificationSysteme]||f.qualificationSysteme}
                      </div>
                    )}
                    {/* Date de vente */}
                    {f.dateVente && (
                      <div style={{ fontSize:11, color:'#ffffff' }}>
                        <span style={{ fontWeight:600 }}>Date de vente : </span>{fmtDate(f.dateVente)}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setResumeFiche(null)}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#ffffff', fontSize:22, lineHeight:1, transition:'color 0.15s', flexShrink:0 }}
                    onMouseEnter={e => e.currentTarget.style.color='#f04438'}
                    onMouseLeave={e => e.currentTarget.style.color='#ffffff'}>×</button>
                </div>
              );
            })()}

            {/* Résumé */}
            <div style={{ overflowY:'auto', flex:1, padding:'20px' }}>
              {resumeFiche.summary
                ? <pre style={{ fontFamily:'inherit', fontSize:13, color:'#ffffff', lineHeight:1.75, whiteSpace:'pre-wrap', wordBreak:'break-word', margin:0 }}>{resumeFiche.summary}</pre>
                : <div style={{ textAlign:'center', color:'#ffffff', fontSize:13, padding:'40px 0' }}>Aucun résumé</div>
              }
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}
