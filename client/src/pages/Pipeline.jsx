// ════════════════════════════════════════════════════════════════════════════
// client/src/pages/Pipeline.jsx
// ════════════════════════════════════════════════════════════════════════════
// RESPONSIVE  : iPhone 12 Pro Max (430px) — breakpoint 768px
// DESIGN      : Header glassmorphism, colonnes Kanban animées, cards modernes
// ANIMATIONS  : fadeSlideUp colonnes, hover glow, drag & drop visuel
// LOGIQUE     : Toutes les fonctionnalités originales intactes
// SOURCES     : Solution Express uniquement
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api';
import {
  ArrowRight, X, MapPin, Phone, Mail, Building2, Calendar,
  Shield, TrendingUp, Target, Zap, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Intercepteur JWT ──────────────────────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Hook responsive — breakpoint 768px ───────────────────────────────────
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
// Compte de 0 à la valeur avec easing cubique
// ════════════════════════════════════════════════════════════════════════════
function AnimatedNumber({ value, decimals = 0, color }) {
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
  return <span style={{ color }}>{display.toFixed(decimals)}</span>;
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES — colonnes pipeline
// ════════════════════════════════════════════════════════════════════════════
const STAGES = [
  { key:'new',        label:'Nouveau',    color:'#3b6cf8', emoji:'🆕' },
  { key:'contacted',  label:'Contacté',   color:'#f79009', emoji:'📞' },
  { key:'interested', label:'Intéressé',  color:'#12b76a', emoji:'✨' },
  { key:'proposal',   label:'Soumission', color:'#a764f8', emoji:'📋' },
  { key:'won',        label:'Gagné',      color:'#12b76a', emoji:'🏆' },
  { key:'lost',       label:'Perdu',      color:'#f04438', emoji:'❌' },
  { key:'ignored',    label:'Ignoré',     color:'#8b8b9e', emoji:'🚫' },
];

const AV = ['av-blue','av-teal','av-amber','av-coral','av-purple'];

// ════════════════════════════════════════════════════════════════════════════
// MAPPING STATUTS — identiques à l'original
// ════════════════════════════════════════════════════════════════════════════
const normalizeStatus = (status) => status || 'new';

const denormalizeStatus = (unifiedStatus, source) => {
  if (source === 'google_alert') {
    switch(unifiedStatus) {
      case 'new':        return 'new';
      case 'contacted':  return 'contacted';
      case 'interested': return 'contacted';
      case 'proposal':   return 'contacted';
      case 'won':        return 'saved';
      case 'lost':       return 'ignored';
      case 'ignored':    return 'ignored';
      default:           return 'new';
    }
  }
  if (source === 'linkedin') {
    switch(unifiedStatus) {
      case 'new':        return 'new';
      case 'contacted':  return 'contacted';
      case 'interested': return 'qualified';
      case 'proposal':   return 'proposal';
      case 'won':        return 'won';
      case 'lost':       return 'lost';
      case 'ignored':    return 'ignored';
      default:           return 'new';
    }
  }
  if (source === 'google_map') {
    switch(unifiedStatus) {
      case 'new':        return 'new';
      case 'contacted':  return 'contacted';
      case 'won':        return 'saved';
      case 'ignored':    return 'ignored';
      default:           return 'new';
    }
  }
  return unifiedStatus;
};


const SOURCE_BADGE = {
  solution_express: { label:'🏢 Solution Express', color:'#12b76a' },
};

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT : MiniCalendar — identique à l'original avec design amélioré
// ════════════════════════════════════════════════════════════════════════════
function MiniCalendar({ items }) {
  const today   = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const firstDay    = new Date(current.year, current.month, 1).getDay();
  const offset      = firstDay === 0 ? 6 : firstDay - 1;
  const rdvDates    = items.filter(p => p.rdvDate).map(p => new Date(p.rdvDate).toDateString());

  const prevMonth = () => setCurrent(c => ({ year: c.month===0?c.year-1:c.year, month: c.month===0?11:c.month-1 }));
  const nextMonth = () => setCurrent(c => ({ year: c.month===11?c.year+1:c.year, month: c.month===11?0:c.month+1 }));
  const monthName = new Date(current.year, current.month).toLocaleDateString('fr-CA', { month:'long', year:'numeric' });
  const days = ['L','M','M','J','V','S','D'];

  return (
    <div style={{ background:'var(--bg-card)', borderRadius:16, padding:16, marginBottom:20, border:'1px solid var(--border)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
      {/* Header calendrier */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <button onClick={prevMonth} style={{ width:28, height:28, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', transition:'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--bg-hover)'; e.currentTarget.style.color='#3b6cf8'; }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--bg-secondary)'; e.currentTarget.style.color='var(--text-muted)'; }}>
          <ChevronLeft size={14}/>
        </button>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', textTransform:'capitalize' }}>{monthName}</span>
        <button onClick={nextMonth} style={{ width:28, height:28, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', transition:'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--bg-hover)'; e.currentTarget.style.color='#3b6cf8'; }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--bg-secondary)'; e.currentTarget.style.color='var(--text-muted)'; }}>
          <ChevronRight size={14}/>
        </button>
      </div>
      {/* Jours semaine */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:6 }}>
        {days.map((d,i) => <div key={i} style={{ textAlign:'center', fontSize:9, color:'var(--text-muted)', fontWeight:700, padding:'2px 0' }}>{d}</div>)}
      </div>
      {/* Grille jours */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
        {Array(offset).fill(null).map((_,i) => <div key={`e${i}`}/>)}
        {Array(daysInMonth).fill(null).map((_,i) => {
          const day     = i + 1;
          const date    = new Date(current.year, current.month, day);
          const isToday = date.toDateString() === today.toDateString();
          const hasRdv  = rdvDates.includes(date.toDateString());
          return (
            <div key={day} style={{ textAlign:'center', fontSize:11, padding:'5px 2px', borderRadius:7, transition:'all 0.1s',
              background: isToday ? 'linear-gradient(135deg,#3b6cf8,#12b76a)' : hasRdv ? 'rgba(59,108,248,0.12)' : 'transparent',
              color: isToday ? 'white' : hasRdv ? '#3b6cf8' : 'var(--text-primary)',
              fontWeight: isToday||hasRdv ? 700 : 400 }}>
              {day}
              {hasRdv && !isToday && <div style={{ width:4, height:4, borderRadius:'50%', background:'#3b6cf8', margin:'1px auto 0' }}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL : Pipeline
// ════════════════════════════════════════════════════════════════════════════
export default function Pipeline() {
  const isMobile = useIsMobile();

  // ── États ─────────────────────────────────────────────────────────────
  const [items, setItems]         = useState([]);
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [dragOver, setDragOver]   = useState(null); // colonne survolée pendant drag
  const [dragging, setDragging]   = useState(null); // item en cours de drag

  // ── Fetch Solution Express ────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [se] = await Promise.all([
        api.get('/api/solution-express').catch(() => ({ data: [] })),
      ]);
      const all = [
        ...se.data.map(x => ({
          ...x,
          source:      'solution_express',
          stage:       normalizeStatus(x.status),
          displayName: x.entreprise || `${x.prenom||''} ${x.nom||''}`.trim() || 'Solution Express',
        })),
      ];
      setItems(all);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Drag & Drop ───────────────────────────────────────────────────────
  const onDragStart = (e, id, source, item) => {
    e.dataTransfer.setData('itemId', id);
    e.dataTransfer.setData('itemSource', source);
    setDragging(id);
  };
  const onDragEnd = () => { setDragging(null); setDragOver(null); };
  const onDragOver = (e, stageKey) => { e.preventDefault(); setDragOver(stageKey); };
  const onDragLeave = () => setDragOver(null);

  // ── Mise à jour statut — logique originale intacte ─────────────────────
const updateStatus = async (item, targetStage) => {
    const newStatus = denormalizeStatus(targetStage);
    try {
      const { stage, source, displayName, ...cleanItem } = item;
      await api.put(`/api/solution-express/${item._id}`, { ...cleanItem, status: newStatus });
      toast.success(`→ ${STAGES.find(s => s.key === targetStage)?.label}`);
      fetchAll();
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expirée — reconnecte-toi');
        localStorage.removeItem('sf_token');
        window.location.href = '/login';
      } else {
        toast.error('Erreur mise à jour : ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const onDrop = async (e, targetStage) => {
    setDragOver(null);
    const id     = e.dataTransfer.getData('itemId');
    const source = e.dataTransfer.getData('itemSource');
    const item   = items.find(x => x._id === id && x.source === source);
    if (item) await updateStatus(item, targetStage);
  };

  // ── Avancer d'une étape ───────────────────────────────────────────────
  const advance = async (item, e) => {
    e.stopPropagation();
    const order = STAGES.map(s => s.key);
    const idx   = order.indexOf(item.stage);
    if (idx < order.length - 1) await updateStatus(item, order[idx + 1]);
  };

  const ini = (item) => {
    const name  = item.displayName || '';
    const parts = name.split(' ');
    return ((parts[0]?.[0]||'')+(parts[1]?.[0]||'')).toUpperCase() || '?';
  };

  const stageInfo = (key) => STAGES.find(s => s.key === key);

  // ── Stats pour le header ──────────────────────────────────────────────
  const totalItems  = items.length;
  const totalGagnes = items.filter(i => i.stage === 'won').length;
  const totalPipeline = items.filter(i => ['contacted','interested','proposal'].includes(i.stage)).length;
  const convRate    = totalItems > 0 ? Math.round((totalGagnes / totalItems) * 100) : 0;

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="animate-fade">

      {/* ════════════════════════════════════════════════════════════════
          HEADER GLASSMORPHISM
          Gradient bleu/vert + stats pipeline + barre conversion
          ════════════════════════════════════════════════════════════════ */}
      <div style={{
        background:'linear-gradient(135deg,rgba(59,108,248,0.1),rgba(167,100,248,0.06),rgba(18,183,106,0.04))',
        borderRadius:20, padding: isMobile?'18px 16px':'22px 28px',
        marginBottom:24, border:'1px solid rgba(59,108,248,0.18)',
        boxShadow:'0 8px 32px rgba(59,108,248,0.08)',
        backdropFilter:'blur(10px)',
        animation:'fadeSlideUp 0.4s ease both'
      }}>
        {/* Ligne 1 : Titre + date */}
        <div style={{ display:'flex', alignItems: isMobile?'flex-start':'center', justifyContent:'space-between', flexDirection: isMobile?'column':'row', gap: isMobile?10:0, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#3b6cf8,#a764f8)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 20px rgba(59,108,248,0.4)', flexShrink:0 }}>
              <Target size={26} color="#fff"/>
            </div>
            <div>
              <h1 style={{ margin:0, fontSize: isMobile?20:24 }}>Pipeline</h1>
              <p style={{ color:'var(--text-muted)', fontSize:13, margin:0, marginTop:2 }}>
                Kanban · <span style={{ color:'#3b6cf8', fontWeight:700 }}>{totalItems}</span> fiche{totalItems!==1?'s':''}
              </p>
            </div>
          </div>
          {!isMobile && (
            <div style={{ fontSize:12, color:'var(--text-muted)', background:'var(--bg-card)', padding:'6px 14px', borderRadius:8, border:'1px solid var(--border)' }}>
              {new Date().toLocaleDateString('fr-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
            </div>
          )}
        </div>

        {/* Ligne 2 : Stats rapides */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(4,1fr)', gap:10, marginBottom:16 }}>
          {[
            { label:'Total',     value:totalItems,    color:'#3b6cf8' },
            { label:'Gagnés',    value:totalGagnes,   color:'#12b76a' },
            { label:'Pipeline',  value:totalPipeline, color:'#f79009' },
            { label:'Taux conv', value:convRate,      color:'#a764f8', suffix:'%' },
          ].map((s,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 14px', border:'1px solid rgba(255,255,255,0.08)', animation:`fadeSlideUp 0.4s ${i*0.05}s ease both` }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize: isMobile?18:22, fontWeight:800 }}>
                <AnimatedNumber value={s.value} decimals={0} color={s.color}/>
                {s.suffix && <span style={{ color:s.color }}>{s.suffix}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Barre conversion */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:11, color:'var(--text-muted)' }}>
            <span>Taux de conversion</span>
            <span style={{ fontWeight:700, color:'#12b76a' }}>{convRate}%</span>
          </div>
          <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:3, background:'linear-gradient(90deg,#3b6cf8,#12b76a)', width:`${convRate}%`, transition:'width 1.2s ease' }}/>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          KANBAN
          Mobile  : scroll horizontal 1 colonne à la fois
          Desktop : toutes les colonnes côte à côte
          ════════════════════════════════════════════════════════════════ */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'40vh' }}>
          <div style={{ width:36, height:36, border:'3px solid rgba(59,108,248,0.2)', borderTopColor:'#3b6cf8', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
        </div>
      ) : (
        <div style={{
          display:'flex', gap:12, alignItems:'flex-start',
          paddingBottom:20, overflowX:'auto',
          // Snap scroll sur mobile
          scrollSnapType: isMobile?'x mandatory':'none',
          WebkitOverflowScrolling:'touch'
        }}>
          {STAGES.map((stage, stageIdx) => {
            const stageItems = items.filter(p => p.stage === stage.key);
            const isDropTarget = dragOver === stage.key;

            return (
              <div key={stage.key}
                onDragOver={e => onDragOver(e, stage.key)}
                onDragLeave={onDragLeave}
                onDrop={e => onDrop(e, stage.key)}
                style={{
                  // Snap scroll sur mobile
                  scrollSnapAlign: isMobile?'start':'none',
                  background: isDropTarget ? `${stage.color}08` : 'var(--bg-secondary)',
                  borderRadius:16, padding:12,
                  border: isDropTarget ? `2px dashed ${stage.color}` : '1px solid var(--border)',
                  display:'flex', flexDirection:'column',
                  minWidth: isMobile?'85vw':240,
                  maxWidth: isMobile?'85vw':280,
                  transition:'all 0.2s',
                  // Slide-in animation par colonne avec délai progressif
                  animation:`fadeSlideUp 0.4s ${stageIdx * 0.06}s ease both`,
                  flexShrink:0
                }}>

                {/* ── En-tête colonne ── */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, padding:'4px 0' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    {/* Indicateur couleur */}
                    <div style={{ width:10, height:10, borderRadius:'50%', background:stage.color, boxShadow:`0 0 6px ${stage.color}60` }}/>
                    <span style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{stage.label}</span>
                  </div>
                  {/* Badge compteur */}
                  <span style={{ fontSize:12, fontWeight:800, background:stageItems.length > 0 ? `${stage.color}18` : 'var(--bg-card)', color:stageItems.length > 0 ? stage.color : 'var(--text-muted)', borderRadius:20, padding:'2px 10px', border:`1px solid ${stageItems.length > 0 ? stage.color+'30' : 'var(--border)'}`, transition:'all 0.3s' }}>
                    {stageItems.length}
                  </span>
                </div>

                {/* ── Mini barre de remplissage colonne ── */}
                <div style={{ height:3, borderRadius:2, background:'var(--border)', overflow:'hidden', marginBottom:12 }}>
                  <div style={{ height:'100%', borderRadius:2, background:stage.color, width:`${totalItems > 0 ? Math.round((stageItems.length/totalItems)*100) : 0}%`, transition:'width 1s ease' }}/>
                </div>

                {/* ── Cards de la colonne ── */}
                <div style={{ display:'flex', flexDirection:'column', gap:8, flex:1 }}>
                  {stageItems.map((p, i) => {
                    const srcBadge  = SOURCE_BADGE[p.source];
                    const isSE      = p.source === 'solution_express';
                    const isDragging = dragging === p._id;

                    return (
                      <div key={p._id}
                        draggable
                        onDragStart={e => onDragStart(e, p._id, p.source, p)}
                        onDragEnd={onDragEnd}
                        onClick={() => setSelected(p)}
                        style={{
                          background:'var(--bg-card)',
                          border:'1px solid var(--border)',
                          borderRadius:12, padding:'12px 12px 10px',
                          cursor:'pointer', transition:'all 0.2s',
                          borderLeft:`3px solid ${stage.color}`,
                          boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                          // Effet visuel pendant le drag
                          opacity: isDragging ? 0.4 : 1,
                          transform: isDragging ? 'scale(0.96)' : 'scale(1)',
                          // Animation décalée par card
                          animation:`fadeSlideUp 0.3s ${Math.min(i*0.05,0.4)}s ease both`
                        }}
                        onMouseEnter={e => {
                          if (!isDragging) {
                            e.currentTarget.style.transform='translateY(-2px)';
                            e.currentTarget.style.boxShadow=`0 8px 20px rgba(0,0,0,0.1), 0 0 0 1px ${stage.color}40`;
                            e.currentTarget.style.borderLeftColor=stage.color;
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isDragging) {
                            e.currentTarget.style.transform='scale(1)';
                            e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)';
                            e.currentTarget.style.borderLeftColor=stage.color;
                          }
                        }}>

                        {/* Avatar + Nom */}
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                          <div className={`avatar ${AV[i%AV.length]}`} style={{ width:32, height:32, fontSize:11, flexShrink:0 }}>{ini(p)}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'var(--text-primary)' }}>{p.displayName}</div>
                            {p.entreprise && <div style={{ fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginTop:1 }}>{p.entreprise}</div>}
                          </div>
                        </div>

                        {/* Ville */}
                        {p.ville && (
                          <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:7, display:'flex', alignItems:'center', gap:4 }}>
                            <MapPin size={9}/> {p.ville}
                          </div>
                        )}

                        {/* Produits Solution Express */}
                        {isSE && (p.produits||[]).length > 0 && (
                          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:7 }}>
                            {p.produits.slice(0,3).map(code => (
                              <span key={code} style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:20, background:`${stage.color}15`, color:stage.color, border:`1px solid ${stage.color}30` }}>
                                {code === 'alarme' ? '🔒' : code === 'internet' ? '🌐' : code === 'mobile' ? '📱' : code === 'cameras' ? '📷' : '•'} {code}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Urgence si > 0 */}
                        {(p.urgencyScore||0) > 0 && (
                          <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:7 }}>
                            <div style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:20,
                              background: p.urgencyScore >= 7 ? 'rgba(240,68,56,0.1)' : 'rgba(247,144,9,0.1)',
                              color: p.urgencyScore >= 7 ? '#f04438' : '#f79009',
                              border: `1px solid ${p.urgencyScore >= 7 ? 'rgba(240,68,56,0.2)' : 'rgba(247,144,9,0.2)'}` }}>
                              ⚡ {p.urgencyScore}/10
                            </div>
                          </div>
                        )}

                        {/* Badge source */}
                        <div style={{ marginBottom: stage.key!=='won'&&stage.key!=='lost'&&stage.key!=='ignored' ? 8 : 0 }}>
                          <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:`${srcBadge?.color}15`, color:srcBadge?.color, border:`1px solid ${srcBadge?.color}30` }}>
                            {srcBadge?.label}
                          </span>
                        </div>

                        {/* Bouton Avancer */}
                        {stage.key !== 'won' && stage.key !== 'lost' && stage.key !== 'ignored' && (
                          <button
                            onClick={e => advance(p, e)}
                            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'6px', borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                              border:`1px solid ${stage.color}40`,
                              background:`${stage.color}08`,
                              color:stage.color }}
                            onMouseEnter={e => { e.currentTarget.style.background=`${stage.color}18`; e.currentTarget.style.transform='scale(1.02)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background=`${stage.color}08`; e.currentTarget.style.transform='scale(1)'; }}>
                            Avancer <ArrowRight size={11}/>
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* État vide */}
                  {stageItems.length === 0 && (
                    <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-muted)', fontSize:12, borderRadius:10, border:`2px dashed ${isDropTarget ? stage.color : 'var(--border)'}`, transition:'border-color 0.2s', background: isDropTarget ? `${stage.color}04` : 'transparent' }}>
                      {isDropTarget ? `Déposer ici` : 'Vide'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODAL DÉTAIL — glassmorphism + toutes les infos
          ════════════════════════════════════════════════════════════════ */}
      {selected && (
        <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) setSelected(null); }}>
          <div style={{ background:'var(--bg-card)', borderRadius: isMobile?0:16, width:'100%', maxWidth:560, margin:'auto', overflow:'hidden', boxShadow:'0 25px 60px rgba(0,0,0,0.3)' }}>

            {/* Header modal avec gradient selon statut */}
            <div style={{ background:`linear-gradient(135deg,${stageInfo(selected.stage)?.color||'#3b6cf8'}18,transparent)`, borderBottom:`3px solid ${stageInfo(selected.stage)?.color||'#3b6cf8'}`, padding: isMobile?'18px 16px':'22px 24px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div className="avatar av-blue" style={{ width:48, height:48, fontSize:16 }}>{ini(selected)}</div>
                  <div>
                    <h2 style={{ margin:'0 0 4px', fontSize: isMobile?17:20 }}>{selected.displayName}</h2>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{selected.entreprise||'—'}</div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}><X size={16}/></button>
              </div>

              {/* Badges statut + source */}
              <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:`${stageInfo(selected.stage)?.color}20`, color:stageInfo(selected.stage)?.color, border:`1px solid ${stageInfo(selected.stage)?.color}40` }}>
                  {stageInfo(selected.stage)?.emoji} {stageInfo(selected.stage)?.label}
                </span>
                <span style={{ fontSize:10, fontWeight:600, padding:'3px 10px', borderRadius:20, background:`${SOURCE_BADGE[selected.source]?.color}15`, color:SOURCE_BADGE[selected.source]?.color, border:`1px solid ${SOURCE_BADGE[selected.source]?.color}30` }}>
                  {SOURCE_BADGE[selected.source]?.label}
                </span>
              </div>
            </div>

            <div style={{ padding: isMobile?'16px':'22px 24px' }}>

              {/* Infos en grille */}
              <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:10, marginBottom:16 }}>
                {[
                  ['Ville',      selected.ville      ||'—', MapPin],
                  ['Téléphone',  selected.telephone  ||'—', Phone],
                  ['Email',      selected.email      ||'—', Mail],
                  ['Entreprise', selected.entreprise ||'—', Building2],
                  ['Ajouté le',  new Date(selected.createdAt).toLocaleDateString('fr-CA'), Calendar],
                  ['Statut',     stageInfo(selected.stage)?.label || '—', Target],
                ].map(([label, val, Icon]) => (
                  <div key={label} style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'10px 12px', transition:'transform 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.transform='translateX(3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform='translateX(0)'}>
                    <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginBottom:3, display:'flex', alignItems:'center', gap:4 }}>
                      <Icon size={9}/>{label}
                    </div>
                    <div style={{ fontSize:13, color:'var(--text-primary)', wordBreak:'break-word' }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Infos Solution Express */}
              {selected.source === 'solution_express' && (
                <>
                  {(selected.produits||[]).length > 0 && (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>Produits</div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {selected.produits.map(code => (
                          <span key={code} style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background:'rgba(18,183,106,0.1)', color:'#12b76a', border:'1px solid rgba(18,183,106,0.2)' }}>
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selected.qualificationSysteme && selected.qualificationSysteme !== 'inconnu' && (
                    <div style={{ marginBottom:14, background:'var(--bg-secondary)', borderRadius:10, padding:'10px 12px' }}>
                      <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>Qualification système</div>
                      <div style={{ fontSize:13, color:'var(--text-primary)' }}>🔒 {selected.qualificationSysteme?.replace(/_/g,' ')}</div>
                    </div>
                  )}
                  {selected.summary && (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>Résumé</div>
                      <div style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'12px 14px', fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, borderLeft:'3px solid #12b76a' }}>
                        {selected.summary}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Message IA */}
              {selected.aiMessage && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>Message IA</div>
                  <div style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'12px 14px', fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>
                    {selected.aiMessage}
                  </div>
                </div>
              )}

              {/* Changer le statut */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>Changer le statut</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {STAGES.map(s => (
                    <button key={s.key}
                      onClick={async () => { await updateStatus(selected, s.key); setSelected(null); }}
                      style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                        border:`2px solid ${selected.stage===s.key?s.color:'var(--border)'}`,
                        background:selected.stage===s.key?s.color:'var(--bg-secondary)',
                        color:selected.stage===s.key?'#fff':'var(--text-secondary)',
                        transform: selected.stage===s.key ? 'scale(1.05)' : 'scale(1)' }}
                      onMouseEnter={e => { if(selected.stage!==s.key) { e.currentTarget.style.borderColor=s.color; e.currentTarget.style.color=s.color; }}}
                      onMouseLeave={e => { if(selected.stage!==s.key) { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-secondary)'; }}}>
                      {s.emoji} {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer modal */}
            <div style={{ padding: isMobile?'12px 16px':'14px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', background:'var(--bg-card)' }}>
              <button className="btn" onClick={() => setSelected(null)}>Fermer</button>
              {selected.stage !== 'won' && selected.stage !== 'lost' && selected.stage !== 'ignored' && (
                <button className="btn btn-primary" onClick={async e => { await advance(selected, e); setSelected(null); }}
                  style={{ display:'flex', alignItems:'center', gap:6 }}>
                  Avancer <ArrowRight size={13}/>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keyframes animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}
