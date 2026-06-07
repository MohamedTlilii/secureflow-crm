// ════════════════════════════════════════════════════════════════════════════
// client/src/pages/Pipeline.jsx
// ════════════════════════════════════════════════════════════════════════════
// RESPONSIVE  : iPhone 12 Pro Max (430px) — breakpoint 768px
// DESIGN      : Header glassmorphism, colonnes Kanban animées, cards modernes
// ANIMATIONS  : fadeSlideUp colonnes, hover glow, drag & drop visuel
// LOGIQUE     : Toutes les fonctionnalités originales intactes
// SOURCES     : Solution Express uniquement
// ════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../api';
import AnimatedNumber from '../components/AnimatedNumber';
import { ArrowRight, MapPin, Target } from 'lucide-react';
import toast from 'react-hot-toast';


// ── ScoreRing — anneau SVG animé ─────────────────────────────────────────
function ScoreRing({ value, max, color, label, sublabel }) {
  const [animated, setAnimated] = useState(0);
  const pct  = max > 0 ? (value / max) : 0;
  const r    = 36;
  const circ = 2 * Math.PI * r;
  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);
  const dash = circ * animated;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <div style={{ position:'relative', width:90, height:90 }}>
        <svg width={90} height={90} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={7}/>
          <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={7}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition:'stroke-dasharray 1s ease' }}/>
        </svg>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
          <div style={{ fontSize:18, fontWeight:800, color, lineHeight:1 }}>{value}</div>
          <div style={{ fontSize:8, color:'#ffffff', fontWeight:600, textTransform:'uppercase', lineHeight:1.2 }}>{label}</div>
        </div>
      </div>
    </div>
  );
}

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
// CONSTANTES — colonnes pipeline
// ════════════════════════════════════════════════════════════════════════════
const STAGES = [
  { key:'new',                    label:'Nouveau',              color:'#3b6cf8', emoji:'🆕' },
  { key:'contacted',              label:'Contacté',             color:'#f79009', emoji:'📞' },
  { key:'proposal',               label:'Soumission',           color:'#a764f8', emoji:'📋' },
  { key:'installation_en_cours',  label:'Installation en cours',color:'#f97316', emoji:'🔧' },
  { key:'installe',               label:'Installé',             color:'#22c55e', emoji:'✅' },
  { key:'installation_annulee',   label:'Installation annulée', color:'#be123c', emoji:'🚫' },
];

const AV = ['av-blue','av-teal','av-amber','av-coral','av-purple'];

// ════════════════════════════════════════════════════════════════════════════
// MAPPING STATUTS — identiques à l'original
// ════════════════════════════════════════════════════════════════════════════
const normalizeStatus = (status) => status || 'new';



// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL : Pipeline
// ════════════════════════════════════════════════════════════════════════════
export default function Pipeline() {
  const isMobile = useIsMobile();

  // ── États ─────────────────────────────────────────────────────────────
  const [items, setItems]         = useState([]);
  const [anneeFiltre, setAnneeFiltre] = useState(String(new Date().getFullYear()));
  const [moisFiltre, setMoisFiltre]   = useState('tout');
  const [loading, setLoading]     = useState(true);
  const [dragOver, setDragOver]   = useState(null);
  const [dragging, setDragging]   = useState(null);
  const [settings, setSettings]   = useState({ services: [] });
  const [motifPending, setMotifPending] = useState(null);

  // ── Fetch Solution Express ────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const se = await api.get('/api/solution-express').catch(() => ({ data: [] }));
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

  useEffect(() => {
    fetchAll();
    const loadSettings = () => api.get('/api/settings').then(r => setSettings(r.data || { services: [] })).catch(() => {});
    loadSettings();
    const onVisible = () => { if (document.visibilityState === 'visible') { fetchAll(); loadSettings(); } };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchAll]);

  const svcMap = useMemo(() =>
    Object.fromEntries((settings.services||[]).map(s => [s.id, { label: s.label, color: s.color }])),
    [settings.services]
  );

  const leadTypeLbl = useMemo(() =>
    Object.fromEntries((settings.typeLead||[]).map(t => [t.key, t.label])),
    [settings.typeLead]
  );

  // ── Drag & Drop ───────────────────────────────────────────────────────
  const onDragStart = (e, id, source) => {
    e.dataTransfer.setData('itemId', id);
    e.dataTransfer.setData('itemSource', source);
    setDragging(id);
  };
  const onDragEnd = () => { setDragging(null); setDragOver(null); };
  const onDragOver = (e, stageKey) => { e.preventDefault(); setDragOver(stageKey); };
  const onDragLeave = () => setDragOver(null);

  // ── Mise à jour statut ────────────────────────────────────────────────
  const updateStatus = async (item, targetStage, motif) => {
    if (targetStage === 'installation_annulee' && !motif) {
      setMotifPending({ item, targetStage });
      return;
    }
    try {
      const payload = { status: targetStage };
      if (motif) payload.motifAnnulation = motif;
      await api.put(`/api/solution-express/${item._id}`, payload);
      toast.success(`→ ${STAGES.find(s => s.key === targetStage)?.label}`);
      fetchAll();
    } catch (err) {
      toast.error('Erreur mise à jour : ' + (err.response?.data?.message || err.message));
    }
  };

  const confirmAnnulation = (motif) => {
    if (!motifPending) return;
    const { item, targetStage } = motifPending;
    setMotifPending(null);
    updateStatus(item, targetStage, motif);
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

  // ── Années disponibles + filtrage ────────────────────────────────────
  const annees = useMemo(() =>
    [...new Set(items.map(f => new Date(f.dateVente || f.createdAt || Date.now()).getUTCFullYear()))].sort((a, b) => b - a),
    [items]
  );

  const filteredItems = useMemo(() => {
    let r = anneeFiltre === 'tout' ? items : items.filter(f => String(new Date(f.dateVente || f.createdAt || Date.now()).getUTCFullYear()) === anneeFiltre);
    if (anneeFiltre !== 'tout' && moisFiltre !== 'tout') r = r.filter(f => new Date(f.dateVente || f.createdAt || Date.now()).getUTCMonth() === Number(moisFiltre));
    return r;
  }, [items, anneeFiltre, moisFiltre]);

  // ── Stats pour le header ──────────────────────────────────────────────
  const totalItems   = filteredItems.length;
  const totalGagnes  = filteredItems.filter(i => i.stage === 'installe').length;
  const inCours      = filteredItems.filter(i => i.stage === 'installation_en_cours').length;
  const proposals    = filteredItems.filter(i => i.stage === 'proposal').length;
  const b2b          = filteredItems.filter(i => i.typeClient === 'b2b').length;
  const b2c          = filteredItems.filter(i => i.typeClient === 'b2c').length;
  const annulees     = filteredItems.filter(i => i.stage === 'installation_annulee').length;
  const nouveaux     = filteredItems.filter(i => i.stage === 'new').length;
  const contactes    = filteredItems.filter(i => i.stage === 'contacted').length;
  const convRate     = totalItems > 0 ? Math.round((totalGagnes / totalItems) * 100) : 0;
  const serviceCounts = useMemo(() => {
    const map = {};
    filteredItems.forEach(f => (f.produits||[]).forEach(p => { map[p] = (map[p]||0) + 1; }));
    return map;
  }, [filteredItems]);

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="animate-fade">

      {/* ════════════════════════════════════════════════════════════════
          HEADER GLASSMORPHISM
          Gradient bleu/vert + stats pipeline + barre conversion
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ padding:'1.5px', borderRadius:22, background:'linear-gradient(135deg,#a78bfa70,#3b6cf840,#12b76a25)', marginBottom:24, animation:'fadeSlideUp 0.4s ease both' }}>
      <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:'20.5px', padding: isMobile?'18px 16px':'28px 32px', backdropFilter:'blur(40px)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-80, left:-60, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(167,139,250,0.18) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-50, right:-30, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(59,108,248,0.12) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1 }}>
        {/* Ligne 1 : Titre + date */}
        <div style={{ display:'flex', alignItems: isMobile?'flex-start':'center', justifyContent:'space-between', flexDirection: isMobile?'column':'row', gap: isMobile?10:0, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#a78bfa,#3b6cf8)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 28px rgba(167,139,250,0.55)', flexShrink:0 }}>
              <Target size={26} color="#fff"/>
            </div>
            <div>
              <h1 style={{ margin:0, fontSize: isMobile?20:24 }}>Pipeline</h1>
              <p style={{ color:'#ffffff', fontSize:13, margin:0, marginTop:2 }}>
                <span style={{ color:'#3b6cf8', fontWeight:700 }}>{totalItems}</span> fiche{totalItems!==1?'s':''}
              </p>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            {!isMobile && (
              <div style={{ fontSize:12, color:'#efefef', background:'var(--bg-card)', padding:'6px 14px', borderRadius:8, border:'1px solid var(--border)', textTransform:'capitalize', whiteSpace:'nowrap' }}>
                {new Date().toLocaleDateString('fr-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
              </div>
            )}
            <select value={anneeFiltre} onChange={e => { setAnneeFiltre(e.target.value); setMoisFiltre('tout'); }}
              style={{ fontSize:12, padding:'7px 14px', borderRadius:9, border:'1px solid var(--bg-card)', background:'var(--bg-card)', color:'#ffffff', cursor:'pointer', outline:'none', fontWeight:700 }}>
              <option value="tout">Toutes les années</option>
              {annees.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
            {anneeFiltre !== 'tout' && (
              <select value={moisFiltre} onChange={e => setMoisFiltre(e.target.value)}
                style={{ fontSize:12, padding:'7px 14px', borderRadius:9, border:'1px solid var(--bg-card)', background:'var(--bg-card)', color:'#ffffff', cursor:'pointer', outline:'none', fontWeight:700 }}>
                <option value="tout">Tous les mois</option>
                {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m,i) => (
                  <option key={i} value={String(i)}>{m}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Total fiches — grand, pleine largeur */}
        <div style={{ padding:'1px', borderRadius:14, background:'linear-gradient(135deg,#3b6cf860,#3b6cf820)', marginBottom:10, animation:'fadeSlideUp 0.4s ease both' }}>
          <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:13, padding:'14px 18px', transition:'transform 0.2s,box-shadow 0.2s' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:46, height:46, borderRadius:13, background:'#3b6cf820', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 0 22px #3b6cf830' }}>
                  <span style={{ fontSize:20 }}>📁</span>
                </div>
                <div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:2 }}>Total fiches</div>
                  <div style={{ fontSize:32, fontWeight:900, color:'#3b6cf8', lineHeight:1 }}>{totalItems}</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ width:24, height:24, borderRadius:7, background:'rgba(59,108,248,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:12 }}>🏢</span>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color:'#3b6cf8' }}>{b2b}</span>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:600 }}>B2B</span>
                </div>
                <span style={{ color:'rgba(255,255,255,0.15)' }}>·</span>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ width:24, height:24, borderRadius:7, background:'rgba(18,183,106,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:12 }}>🏠</span>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color:'#12b76a' }}>{b2c}</span>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:600 }}>B2C</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6 cartes statuts — 2 rangées de 3 */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(3,1fr)', gap:10, marginBottom:16 }}>
          {[
            { label:'Nouveau',               value:nouveaux,    sub:'nouvelles clients',      color:'#3b6cf8' },
            { label:'Contacté',              value:contactes,   sub:'clients contactés',      color:'#f79009' },
            { label:'Soumissions',           value:proposals,   sub:'clients Soumissions',    color:'#a764f8' },
            { label:'Installation en cours', value:inCours,     sub:'installation en cours',  color:'#f97316' },
            { label:'Installés',             value:totalGagnes, sub:'client installé',        color:'#22c55e' },
            { label:'Annulées',              value:annulees,    sub:'installations annulées', color:'#be123c' },
          ].map((s,i) => (
            <div key={i} style={{ background:`${s.color}08`, borderRadius:10, padding:'10px 14px', border:`1px solid ${s.color}25`, animation:`fadeSlideUp 0.4s ${(i+1)*0.05}s ease both` }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize: isMobile?18:22, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:3 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Score conversion + Rings */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexDirection: isMobile?'column':'row', gap:20, marginTop:16 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize: isMobile?22:28, fontWeight:800, color:'var(--text-primary)', marginBottom:4 }}>
              Taux d'installation <AnimatedNumber value={convRate} decimals={0} suffix="%" color="var(--text-primary)"/>
            </div>
            <div style={{ fontSize:12, color:'white', marginBottom:12 }}>
              {totalGagnes} installé{totalGagnes!==1?'s':''} sur {totalItems} fiche{totalItems!==1?'s':''}
            </div>
            <div style={{ height:8, borderRadius:4, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:4, background:'linear-gradient(90deg,#3b6cf8,#12b76a)', width:`${convRate}%`, transition:'width 1.2s ease' }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:10, color:'white' }}>
              <span>0%</span><span>100%</span>
            </div>
          </div>
          {!isMobile && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:12, flexShrink:0 }}>
              <div style={{ display:'flex', gap:28 }}>
                <ScoreRing value={proposals}   max={totalItems||1} color="#a764f8" label="Soumission"  sublabel="Soumission"/>
                <ScoreRing value={inCours}     max={totalItems||1} color="#f97316" label="En cours"    sublabel="En cours"/>
                <ScoreRing value={totalGagnes} max={totalItems||1} color="#22c55e" label="Installé"    sublabel={`sur ${totalItems}`}/>
                <ScoreRing value={annulees}    max={totalItems||1} color="#be123c" label="Annulée"     sublabel="Annulée"/>
              </div>
              {(settings.services||[]).length > 0 && (
                <div style={{ display:'flex', gap:16 }}>
                  {(settings.services||[]).map(svc => (
                    <div key={svc.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <div style={{ width:44, height:44, borderRadius:'50%', border:`2.5px solid ${svc.color||'#8b8b9e'}`, background:`${svc.color||'#8b8b9e'}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ fontSize:15, fontWeight:800, color:svc.color||'#8b8b9e' }}>{serviceCounts[svc.id]||0}</span>
                      </div>
                      <span style={{ fontSize:9, color:'rgba(255,255,255,0.7)', fontWeight:600, textTransform:'uppercase', textAlign:'center', maxWidth:44, lineHeight:1.2 }}>{svc.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        </div>{/* /zIndex:1 */}
      </div>{/* /glassmorphism */}
      </div>{/* /gradient border */}

      {/* ════════════════════════════════════════════════════════════════
          KANBAN
          Mobile  : scroll horizontal 1 colonne à la fois
          Desktop : toutes les colonnes côte à côte
          ════════════════════════════════════════════════════════════════ */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'40vh', flexDirection:'column', gap:16 }}>
          <div style={{ position:'relative', width:44, height:44 }}>
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid rgba(59,130,246,0.12)' }}/>
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid transparent', borderTopColor:'#3b82f6', animation:'spin 0.9s linear infinite' }}/>
            <div style={{ position:'absolute', inset:4, borderRadius:'50%', border:'2px solid transparent', borderBottomColor:'rgba(192,132,252,0.5)', animation:'spin 1.5s linear infinite reverse' }}/>
          </div>
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
            const stageItems = filteredItems.filter(p => p.stage === stage.key).sort((a,b) => new Date(b.dateVente||b.createdAt) - new Date(a.dateVente||a.createdAt));
            const isDropTarget = dragOver === stage.key;

            return (
              <div key={stage.key}
                onDragOver={e => onDragOver(e, stage.key)}
                onDragLeave={onDragLeave}
                onDrop={e => onDrop(e, stage.key)}
                style={{
                  scrollSnapAlign: isMobile?'start':'none',
                  background: isDropTarget ? `${stage.color}10` : 'rgba(3,8,26,0.97)',
                  borderRadius:16, padding:12,
                  border: isDropTarget ? `2px dashed ${stage.color}` : `1px solid ${stage.color}30`,
                  display:'flex', flexDirection:'column',
                  minWidth: isMobile?'85vw':240,
                  maxWidth: isMobile?'85vw':280,
                  transition:'all 0.2s',
                  animation:`fadeSlideUp 0.4s ${stageIdx * 0.06}s ease both`,
                  flexShrink:0,
                  backdropFilter:'blur(20px)',
                  boxShadow:`0 4px 20px ${stage.color}15`
                }}>

                {/* ── En-tête colonne ── */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, padding:'4px 0' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    {/* Indicateur couleur */}
                    <div style={{ width:10, height:10, borderRadius:'50%', background:stage.color, boxShadow:`0 0 6px ${stage.color}60` }}/>
                    <span style={{ fontSize:12, fontWeight:700, color:'#ffffff', textTransform:'uppercase', letterSpacing:'0.06em' }}>{stage.label}</span>
                  </div>
                  {/* Badge compteur */}
                  <span style={{ fontSize:12, fontWeight:800, background:stageItems.length > 0 ? `${stage.color}18` : 'var(--bg-card)', color:stageItems.length > 0 ? stage.color : '#ffffff', borderRadius:20, padding:'2px 10px', border:`1px solid ${stageItems.length > 0 ? stage.color+'30' : 'var(--border)'}`, transition:'all 0.3s' }}>
                    {stageItems.length}
                  </span>
                </div>

                {/* ── Mini barre de remplissage colonne ── */}
                <div style={{ height:3, borderRadius:2, background:'var(--border)', overflow:'hidden', marginBottom:12 }}>
                  <div style={{ height:'100%', borderRadius:2, background:stage.color, width:`${totalItems > 0 ? Math.round((stageItems.length/totalItems)*100) : 0}%`, transition:'width 1s ease' }}/>
                </div>

                {/* ── Cards de la colonne ── */}
                <div style={{ display:'flex', flexDirection:'column', gap:8, flex:1, maxHeight:600, overflowY:'auto' }}>
                  {stageItems.map((p, i) => {
                    const isDragging = dragging === p._id;
                    const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
                    const dCurr  = new Date(p.dateVente||p.createdAt);
                    const dPrev  = i > 0 ? new Date(stageItems[i-1].dateVente||stageItems[i-1].createdAt) : null;
                    const showSep = !dPrev || dCurr.getUTCMonth() !== dPrev.getUTCMonth() || dCurr.getUTCFullYear() !== dPrev.getUTCFullYear();
                    const sepLabel = `${MOIS[dCurr.getUTCMonth()]} ${dCurr.getUTCFullYear()}`;

                    return (
                      <React.Fragment key={p._id}>
                      {showSep && (
                        <div style={{ display:'flex', alignItems:'center', gap:6, margin:'4px 0 2px' }}>
                          <div style={{ flex:1, height:1, background:`${stage.color}25` }}/>
                          <span style={{ fontSize:10, fontWeight:700, color:stage.color, letterSpacing:0.8, textTransform:'uppercase' }}>{sepLabel}</span>
                          <div style={{ flex:1, height:1, background:`${stage.color}25` }}/>
                        </div>
                      )}
                      <div
                        draggable
                        onDragStart={e => onDragStart(e, p._id, p.source)}
                        onDragEnd={onDragEnd}
                        style={{
                          background:'rgba(4,10,24,0.97)',
                          border:`1px solid ${stage.color}25`,
                          borderRadius:12, padding:'12px 12px 10px',
                          cursor:'pointer', transition:'all 0.2s',
                          borderLeft:`3px solid ${stage.color}`,
                          boxShadow:`0 2px 12px rgba(0,0,0,0.15), 0 0 0 0 ${stage.color}`,
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
                            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                              <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'var(--text-primary)', flex:1, minWidth:0 }}>{p.displayName}</div>
                              {p.typeClient && (
                                <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:20, flexShrink:0,
                                  background: p.typeClient==='b2b' ? 'rgba(59,108,248,0.15)' : 'rgba(18,183,106,0.15)',
                                  color: p.typeClient==='b2b' ? '#3b6cf8' : '#12b76a',
                                  border:`1px solid ${p.typeClient==='b2b' ? 'rgba(59,108,248,0.3)' : 'rgba(18,183,106,0.3)'}` }}>
                                  {p.typeClient==='b2b' ? '🏢 B2B' : '🏠 B2C'}
                                </span>
                              )}
                            </div>
                            {(p.prenom||p.nom) && <div style={{ fontSize:11, color:'#ffffff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginTop:1 }}>{`${p.prenom||''} ${p.nom||''}`.trim()}</div>}
                          </div>
                        </div>

                        {/* Ville */}
                        {p.ville && (
                          <div style={{ fontSize:11, color:'#ffffff', marginBottom:7, display:'flex', alignItems:'center', gap:4 }}>
                            <MapPin size={9}/> {p.ville}
                          </div>
                        )}

                        {/* Type de lead */}
                        {p.leadType && (
                          <div style={{ marginBottom:7 }}>
                            <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:20, background:'rgba(167,100,248,0.12)', color:'#a764f8', border:'1px solid rgba(167,100,248,0.25)' }}>
                              🎯 {leadTypeLbl[p.leadType] || p.leadType}
                            </span>
                          </div>
                        )}

                        {/* Produits Solution Express */}
                        {(p.produits||[]).length > 0 && (
                          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:7 }}>
                            {p.produits.slice(0,3).map(code => {
                              const svc = svcMap[code];
                              const clr = svc?.color || stage.color;
                              return (
                                <span key={code} style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:20, background:`${clr}15`, color:clr, border:`1px solid ${clr}30` }}>
                                  {svc?.label || code}
                                </span>
                              );
                            })}
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

                        {/* Commission */}
                        {(p.commissionTotale||0) > 0 && (
                          <div style={{ marginBottom: stage.key!=='installe'&&stage.key!=='installation_annulee' ? 8 : 0 }}>
                            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'rgba(18,183,106,0.12)', color:'#12b76a', border:'1px solid rgba(18,183,106,0.25)' }}>
                              💰 {p.commissionTotale} TND
                            </span>
                          </div>
                        )}

                        {/* Motif annulation */}
                        {stage.key === 'installation_annulee' && p.motifAnnulation && (
                          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 9px', borderRadius:8, background:'rgba(190,18,60,0.08)', border:'1px solid rgba(190,18,60,0.2)' }}>
                            <span style={{ fontSize:11, color:'#be123c' }}>✕</span>
                            <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:500 }}>Motif :</span>
                            <span style={{ fontSize:11, color:'#be123c', fontWeight:600 }}>{p.motifAnnulation}</span>
                          </div>
                        )}

                        {/* Bouton Avancer */}
                        {stage.key !== 'installe' && stage.key !== 'installation_annulee' && (
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
                      </React.Fragment>
                    );
                  })}

                  {/* État vide */}
                  {stageItems.length === 0 && (
                    <div style={{ textAlign:'center', padding:'24px 0', color:'#ffffff', fontSize:12, borderRadius:10, border:`2px dashed ${isDropTarget ? stage.color : 'var(--border)'}`, transition:'border-color 0.2s', background: isDropTarget ? `${stage.color}04` : 'transparent' }}>
                      {isDropTarget ? `Déposer ici` : 'Vide'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* ── Modal motif d'annulation ── */}
      {motifPending && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'rgba(3,8,26,0.98)', borderRadius:18, padding:'28px 24px', width:'100%', maxWidth:420, border:'1px solid rgba(190,18,60,0.3)', boxShadow:'0 25px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize:20, marginBottom:6 }}>⚠️</div>
            <div style={{ fontSize:16, fontWeight:700, color:'#be123c', marginBottom:6 }}>Motif d'annulation</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginBottom:20 }}>Pourquoi cette installation a-t-elle été annulée ?</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
              {(settings.motifsAnnulation||['Prix trop élevé','Délai trop long','Concurrent','Client non disponible','Autre']).map(m => (
                <button key={m} onClick={() => confirmAnnulation(m)}
                  style={{ padding:'11px 16px', borderRadius:10, border:'1px solid rgba(190,18,60,0.25)', background:'rgba(190,18,60,0.06)', color:'#ffffff', fontSize:13, fontWeight:500, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(190,18,60,0.15)'; e.currentTarget.style.borderColor='rgba(190,18,60,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(190,18,60,0.06)'; e.currentTarget.style.borderColor='rgba(190,18,60,0.25)'; }}>
                  {m}
                </button>
              ))}
            </div>
            <button onClick={() => setMotifPending(null)}
              style={{ width:'100%', padding:'10px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(255,255,255,0.5)', fontSize:12, cursor:'pointer' }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Keyframes animations */}
      <style>{`
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}
