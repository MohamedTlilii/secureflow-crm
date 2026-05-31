// ════════════════════════════════════════════════════════════════════════════
// client/src/pages/Comparaison.jsx
// Comparaison annuelle des commissions — année N-1 vs année N
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../api';
import AnimatedNumber from '../components/AnimatedNumber';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, BarChart2, Calendar, Wallet, CheckCircle, Target, ChevronLeft, ChevronRight } from 'lucide-react';

// ── Hook responsive ────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

function pct(curr, prev) {
  if (prev === 0 && curr === 0) return null;
  if (prev === 0) return 100;
  return Math.round(((curr - prev) / Math.abs(prev)) * 100);
}

function calcMetrics(arr) {
  const actives  = arr.filter(f => f.status !== 'installation_annulee');
  const withComm = actives.filter(f => (f.commissionTotale || 0) > 0 || (f.commissionFixe || 0) > 0);
  const gained   = actives.reduce((s, f) => s + (f.commissionTotale || 0), 0);
  const paid     = actives.filter(f => f.commissionPayee).reduce((s, f) => s + (f.commissionTotale || 0), 0);
  const pending  = gained - paid;
  const installe = actives.filter(f => f.status === 'installe').length;
  const commVals = withComm.map(f => f.commissionTotale || 0).filter(v => v > 0);
  const commMax  = commVals.length > 0 ? Math.max(...commVals) : 0;
  const commMin  = commVals.length > 0 ? Math.min(...commVals) : 0;
  const payRate  = gained > 0 ? Math.round((paid / gained) * 100) : 0;
  return { gained, paid, pending, installe, commMax, commMin, payRate, total: arr.length };
}

function DeltaBadge({ curr, prev }) {
  const delta = pct(curr, prev);
  if (delta === null) return <span style={{ fontSize:11, color:'#8b8b9e' }}>—</span>;
  const up    = delta > 0;
  const eq    = delta === 0;
  const color = eq ? '#8b8b9e' : up ? '#12b76a' : '#ef4444';
  const bg    = eq ? 'rgba(139,139,158,0.1)' : up ? 'rgba(18,183,106,0.12)' : 'rgba(239,68,68,0.12)';
  const bord  = eq ? 'rgba(139,139,158,0.2)' : up ? 'rgba(18,183,106,0.3)'  : 'rgba(239,68,68,0.3)';
  const Icon  = eq ? Minus : up ? TrendingUp : TrendingDown;
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:20, background:bg, border:`1px solid ${bord}` }}>
      <Icon size={11} color={color}/>
      <span style={{ fontSize:12, fontWeight:700, color }}>{up ? '+' : ''}{delta}%</span>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(3,8,26,0.97)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px', backdropFilter:'blur(20px)' }}>
      <div style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize:12, color:p.color, fontWeight:600 }}>{p.name} : {p.value.toFixed(0)} TND</div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function Comparaison() {
  const isMobile              = useIsMobile();
  const [fiches, setFiches]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchAll = useCallback(() => {
    api.get('/api/solution-express')
      .then(r => setFiches(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAll();
    const onVisible = () => { if (!document.hidden) fetchAll(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchAll]);

  const realYear = new Date().getFullYear();
  const currYear = selectedYear;
  const prevYear = selectedYear - 1;
  const minYear  = fiches.length > 0
    ? Math.min(...fiches.map(f => new Date(f.dateVente || f.createdAt).getUTCFullYear()))
    : realYear;

  const fichesCurr = useMemo(() =>
    fiches.filter(f => new Date(f.dateVente || f.createdAt).getUTCFullYear() === currYear),
    [fiches, currYear]
  );
  const fichesPrev = useMemo(() =>
    fiches.filter(f => new Date(f.dateVente || f.createdAt).getUTCFullYear() === prevYear),
    [fiches, prevYear]
  );

  const mCurr = useMemo(() => calcMetrics(fichesCurr), [fichesCurr]);
  const mPrev = useMemo(() => calcMetrics(fichesPrev), [fichesPrev]);

  const monthlyData = useMemo(() =>
    MONTHS_FR.map((name, idx) => {
      const sum = (arr) =>
        arr.filter(f => f.status !== 'installation_annulee')
           .filter(f => new Date(f.dateVente || f.createdAt).getUTCMonth() === idx)
           .reduce((s, f) => s + (f.commissionTotale || 0), 0);
      return { name, [prevYear]: Math.round(sum(fichesPrev)), [currYear]: Math.round(sum(fichesCurr)) };
    }),
    [fichesCurr, fichesPrev, currYear, prevYear]
  );

  const bestMonth = (year) => {
    let best = { idx: -1, val: 0 };
    monthlyData.forEach((m, i) => { if ((m[year] || 0) > best.val) best = { idx: i, val: m[year] }; });
    return best.idx >= 0 ? `${MONTHS_FR[best.idx]} · ${best.val.toFixed(0)} TND` : '—';
  };

  const hasPrevData = mPrev.total > 0;
  const hasCurrData = mCurr.total > 0;

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

  const kpis = [
    { label:'Commissions gagnées',    icon:Wallet,      color:'#12b76a', curr:mCurr.gained,   prev:mPrev.gained,   decimals:0, suffix:' TND' },
    { label:'Commissions payées',     icon:CheckCircle, color:'#3b6cf8', curr:mCurr.paid,     prev:mPrev.paid,     decimals:0, suffix:' TND' },
    { label:'En attente',             icon:Target,      color:'#f79009', curr:mCurr.pending,  prev:mPrev.pending,  decimals:0, suffix:' TND' },
    { label:'Installations réalisées',icon:BarChart2,   color:'#a764f8', curr:mCurr.installe, prev:mPrev.installe, decimals:0, suffix:''     },
  ];

  const globalScore   = pct(mCurr.gained, mPrev.gained);
  const scoreColor    = globalScore === null ? '#8b8b9e' : globalScore > 0 ? '#12b76a' : globalScore < 0 ? '#ef4444' : '#8b8b9e';
  const scoreEmoji    = globalScore === null ? '📊' : globalScore > 20 ? '🚀' : globalScore > 0 ? '📈' : globalScore === 0 ? '➡️' : '📉';

  return (
    <div className="animate-fade">
      <style>{`
        @keyframes spin         { to { transform:rotate(360deg); } }
        @keyframes fadeSlideUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse    { 0%,100%{opacity:0.5} 50%{opacity:1} }
      `}</style>

      {/* ══════════ HEADER ══════════════════════════════════════════════════ */}
      <div style={{ padding:'1.5px', borderRadius:22, background:'linear-gradient(135deg,#12b76a60,#3b6cf830,#a78bfa25)', marginBottom:24, animation:'fadeSlideUp 0.4s ease both' }}>
      <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:'20.5px', padding: isMobile?'20px 16px':'28px 32px', position:'relative', overflow:'hidden' }}>
        {/* Orbs */}
        <div style={{ position:'absolute', top:-60, right:-40, width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle,rgba(59,108,248,0.13) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-40, left:-20, width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle,rgba(18,183,106,0.1) 0%,transparent 70%)', pointerEvents:'none' }}/>

        <div style={{ position:'relative', display:'flex', flexDirection:isMobile?'column':'row', alignItems:isMobile?'flex-start':'center', justifyContent:'space-between', gap:16 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <div style={{ width:38, height:38, borderRadius:11, background:'linear-gradient(135deg,rgba(59,108,248,0.2),rgba(18,183,106,0.2))', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(59,108,248,0.3)', boxShadow:'0 0 20px rgba(59,108,248,0.2)' }}>
                <BarChart2 size={19} color="#3b6cf8"/>
              </div>
              <h1 style={{ margin:0, fontSize:isMobile?19:23, fontWeight:800, background:'linear-gradient(135deg,#e8fff5,#12b76a,#3b6cf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                Comparaison annuelle
              </h1>
            </div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', display:'flex', alignItems:'center', gap:8 }}>
              Évolution de vos commissions · {prevYear} → {currYear}
              {selectedYear === realYear && <span style={{ fontSize:11, color:'#12b76a', fontWeight:700, padding:'2px 8px', borderRadius:6, background:'rgba(18,183,106,0.12)', border:'1px solid rgba(18,183,106,0.25)' }}>Année en cours</span>}
            </div>
          </div>

          {/* ── Navigateur d'années ── */}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>

            {/* Flèche gauche */}
            <button onClick={() => setSelectedYear(y => y - 1)} disabled={selectedYear <= minYear}
              style={{ width:36, height:36, borderRadius:10, border:`1px solid ${selectedYear <= minYear ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.14)'}`, background:'transparent', color:selectedYear <= minYear ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.55)', cursor:selectedYear <= minYear ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.18s' }}
              onMouseEnter={e => { if (selectedYear > minYear) { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='rgba(255,255,255,0.25)'; } }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=selectedYear<=minYear?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor=selectedYear<=minYear?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.14)'; }}>
              <ChevronLeft size={16}/>
            </button>

            {/* Badges années */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ padding:'7px 15px', borderRadius:12, background:'rgba(59,108,248,0.12)', border:'1px solid rgba(59,108,248,0.3)', textAlign:'center', minWidth:72 }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:2 }}>Précédent</div>
                <div style={{ fontSize:20, fontWeight:900, color:'#3b6cf8', lineHeight:1 }}>{prevYear}</div>
              </div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.2)', fontWeight:300 }}>vs</div>
              <div style={{ padding:'7px 15px', borderRadius:12, background:'rgba(18,183,106,0.12)', border:'1px solid rgba(18,183,106,0.3)', textAlign:'center', minWidth:72 }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:2 }}>Actuel</div>
                <div style={{ fontSize:20, fontWeight:900, color:'#12b76a', lineHeight:1 }}>{currYear}</div>
              </div>
            </div>

            {/* Flèche droite */}
            <button onClick={() => setSelectedYear(y => y + 1)} disabled={selectedYear >= realYear}
              style={{ width:36, height:36, borderRadius:10, border:`1px solid ${selectedYear >= realYear ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.14)'}`, background:'transparent', color:selectedYear >= realYear ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.55)', cursor:selectedYear >= realYear ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.18s' }}
              onMouseEnter={e => { if (selectedYear < realYear) { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='rgba(255,255,255,0.25)'; } }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=selectedYear>=realYear?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor=selectedYear>=realYear?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.14)'; }}>
              <ChevronRight size={16}/>
            </button>

            {/* Bouton reset si pas sur l'année courante */}
            {selectedYear !== realYear && (
              <button onClick={() => setSelectedYear(realYear)}
                style={{ padding:'5px 11px', borderRadius:8, border:'1px solid rgba(247,144,9,0.35)', background:'rgba(247,144,9,0.1)', color:'#f79009', cursor:'pointer', fontSize:11, fontWeight:700, transition:'all 0.18s', whiteSpace:'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(247,144,9,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(247,144,9,0.1)'; }}>
                Aujourd'hui
              </button>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* ══════════ BANDEAU PREMIÈRE ANNÉE ══════════════════════════════════ */}
      {!hasPrevData && (
        <div style={{ padding:'1px', borderRadius:14, background:'linear-gradient(135deg,#f7900940,#f7900908)', marginBottom:24 }}>
        <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:13, padding:'14px 18px', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'rgba(247,144,9,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Calendar size={15} color="#f79009"/>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#f79009' }}>Première année de référence</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>
              Aucune donnée pour {prevYear}. La comparaison complète sera disponible en {currYear + 1}.
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ══════════ KPI CARDS ════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} style={{ padding:'1px', borderRadius:16, background:`linear-gradient(135deg,${kpi.color}35,${kpi.color}10)` }}>
            <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:15, padding:isMobile?'14px 12px':'18px', height:'100%', display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ width:32, height:32, borderRadius:9, background:`${kpi.color}1a`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon size={15} color={kpi.color}/>
                </div>
                <DeltaBadge curr={kpi.curr} prev={kpi.prev}/>
              </div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{kpi.label}</div>
              <div style={{ fontSize:isMobile?17:21, fontWeight:900, color:kpi.color, lineHeight:1 }}>
                <AnimatedNumber value={kpi.curr} decimals={kpi.decimals} suffix={kpi.suffix} color={kpi.color}/>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:600 }}>{prevYear} :</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)', fontWeight:600 }}>{kpi.prev.toFixed(kpi.decimals)}{kpi.suffix}</span>
              </div>
            </div>
            </div>
          );
        })}
      </div>

      {/* ══════════ GRAPHIQUE MENSUEL ════════════════════════════════════════ */}
      <div style={{ padding:'1px', borderRadius:18, background:'linear-gradient(135deg,#3b6cf840,#12b76a20)', marginBottom:24 }}>
      <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:17, padding:isMobile?'16px':'24px', backdropFilter:'blur(20px)' }}>
        <div style={{ display:'flex', alignItems:isMobile?'flex-start':'center', justifyContent:'space-between', flexDirection:isMobile?'column':'row', gap:12, marginBottom:20 }}>
          <div>
            <h3 style={{ margin:0, fontSize:15, fontWeight:700 }}>Commissions par mois</h3>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:3 }}>Comparaison mensuelle {prevYear} vs {currYear}</div>
          </div>
          <div style={{ display:'flex', gap:16, alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:10, height:10, borderRadius:3, background:'#3b6cf8' }}/>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)', fontWeight:600 }}>{prevYear}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:10, height:10, borderRadius:3, background:'#12b76a' }}/>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)', fontWeight:600 }}>{currYear}</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={isMobile ? 190 : 250}>
          <BarChart data={monthlyData} barGap={3} barCategoryGap="28%">
            <XAxis dataKey="name" tick={{ fill:'rgba(255,255,255,0.35)', fontSize:10 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill:'rgba(255,255,255,0.25)', fontSize:10 }} axisLine={false} tickLine={false} width={42}/>
            <Tooltip content={<ChartTooltip/>} cursor={{ fill:'rgba(255,255,255,0.03)' }}/>
            <Bar dataKey={prevYear} name={String(prevYear)} fill="#3b6cf8" radius={[4,4,0,0]} maxBarSize={22}/>
            <Bar dataKey={currYear} name={String(currYear)} fill="#12b76a" radius={[4,4,0,0]} maxBarSize={22}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      </div>

      {/* ══════════ INSIGHTS CÔTE À CÔTE ════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:14, marginBottom:24 }}>
        {[
          { year: prevYear, m: mPrev, color:'#3b6cf8', hasData: hasPrevData },
          { year: currYear, m: mCurr, color:'#12b76a', hasData: hasCurrData },
        ].map(({ year, m, color, hasData }) => (
          <div key={year} style={{ padding:'1px', borderRadius:18, background:`linear-gradient(135deg,${color}40,${color}10)` }}>
          <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:17, padding:isMobile?'16px':'20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <div style={{ width:9, height:9, borderRadius:'50%', background:color, boxShadow:`0 0 10px ${color}99`, animation:'glowPulse 2s ease infinite' }}/>
              <h3 style={{ margin:0, fontSize:15, fontWeight:800, color }}>{year}</h3>
            </div>
            {hasData ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { label:'Total fiches',           value: m.total },
                  { label:'Installations',           value: m.installe },
                  { label:'Commission ↑ Max',       value: m.commMax > 0 ? `${m.commMax.toFixed(0)} TND` : '—' },
                  { label:'Commission ↓ Min',       value: m.commMin > 0 ? `${m.commMin.toFixed(0)} TND` : '—' },
                  { label:'Taux de paiement',       value: `${m.payRate}%` },
                  { label:'Meilleur mois',          value: bestMonth(year) },
                  { label:'Total de commission',    value: m.gained > 0 ? `${m.gained.toFixed(0)} TND` : '—' },
                ].map((row, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:9, background:`${color}08`, border:`1px solid ${color}18` }}>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)', fontWeight:500 }}>{row.label}</span>
                    <span style={{ fontSize:13, fontWeight:700, color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'28px 0', color:'rgba(255,255,255,0.2)', fontSize:13 }}>
                Aucune donnée pour {year}
              </div>
            )}
          </div>
          </div>
        ))}
      </div>

      {/* ══════════ SCORE GLOBAL ════════════════════════════════════════════ */}
      {hasPrevData && hasCurrData && (
        <div style={{ padding:'1.5px', borderRadius:18, background:`linear-gradient(135deg,${scoreColor}55,${scoreColor}15)`, marginBottom:24 }}>
        <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:17, padding:isMobile?'24px 16px':'32px', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:300, height:300, borderRadius:'50%', background:`radial-gradient(circle,${scoreColor}10 0%,transparent 70%)`, pointerEvents:'none' }}/>
          <div style={{ position:'relative' }}>
            <div style={{ fontSize:44, marginBottom:10 }}>{scoreEmoji}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:700, textTransform:'uppercase', letterSpacing:2, marginBottom:10 }}>Performance globale</div>
            <div style={{ fontSize:isMobile?42:56, fontWeight:900, color:scoreColor, lineHeight:1, marginBottom:10, textShadow:`0 0 40px ${scoreColor}60` }}>
              {globalScore !== null && globalScore > 0 ? '+' : ''}{globalScore ?? '—'}%
            </div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', fontWeight:500 }}>
              de croissance en commissions entre {prevYear} et {currYear}
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
