// ════════════════════════════════════════════════════════════════════════════
// client/src/pages/Pipeline.jsx
// ════════════════════════════════════════════════════════════════════════════
// RESPONSIVE  : iPhone 12 Pro Max (430px) — breakpoint 768px
// DESIGN      : Header glassmorphism, colonnes Kanban animées, cards modernes
// ANIMATIONS  : fadeSlideUp colonnes, hover glow, drag & drop visuel
// LOGIQUE     : Toutes les fonctionnalités originales intactes
// SOURCES     : Solution Express uniquement
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../api';
import AnimatedNumber from '../components/AnimatedNumber';
import { ArrowRight, MapPin, Target } from 'lucide-react';
import toast from 'react-hot-toast';


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

  const filteredItems = useMemo(() =>
    anneeFiltre === 'tout'
      ? items
      : items.filter(f => String(new Date(f.dateVente || f.createdAt || Date.now()).getUTCFullYear()) === anneeFiltre),
    [items, anneeFiltre]
  );

  // ── Stats pour le header ──────────────────────────────────────────────
  const totalItems   = filteredItems.length;
  const totalGagnes  = filteredItems.filter(i => i.stage === 'installe').length;
  const inCours      = filteredItems.filter(i => i.stage === 'installation_en_cours').length;
  const proposals    = filteredItems.filter(i => i.stage === 'proposal').length;
  const b2b          = filteredItems.filter(i => i.typeClient === 'b2b').length;
  const b2c          = filteredItems.filter(i => i.typeClient === 'b2c').length;
  const annulees     = filteredItems.filter(i => i.stage === 'installation_annulee').length;
  const convRate     = totalItems > 0 ? Math.round((totalGagnes / totalItems) * 100) : 0;

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
            <select value={anneeFiltre} onChange={e => setAnneeFiltre(e.target.value)}
              style={{ fontSize:12, padding:'7px 14px', borderRadius:9, border:'1px solid var(--bg-card)', background:'var(--bg-card)', color:'#ffffff', cursor:'pointer', outline:'none', fontWeight:700 }}>
              <option value="tout">Toutes les années</option>
              {annees.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Ligne 2 : Stats rapides */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(5,1fr)', gap:10, marginBottom:16 }}>
          {[
            { label:'Total fiches',          value:totalItems,   sub:`${b2b} B2B · ${b2c} B2C`,                    color:'#3b6cf8' },
            { label:'Installés',             value:totalGagnes,  sub:`Taux d'installation ${convRate}%`,            color:'#22c55e' },
            { label:'Installation en cours', value:inCours,      sub:`${inCours} en cours`,                         color:'#f97316' },
            { label:'Soumissions',           value:proposals,    sub:`${proposals} fiche${proposals!==1?'s':''}`,   color:'#a764f8' },
            { label:'Annulées',              value:annulees,     sub:`${annulees} fiche${annulees!==1?'s':''}`,     color:'#be123c' },
          ].map((s,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 14px', border:'1px solid rgba(255,255,255,0.08)', animation:`fadeSlideUp 0.4s ${i*0.05}s ease both` }}>
              <div style={{ fontSize:10, color:'#ffffff', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize: isMobile?18:22, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:11, color:'#ffffff', marginTop:3 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Barre conversion */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:11, color:'#ffffff' }}>
            <span>Taux de conversion</span>
            <span style={{ fontWeight:700, color:'#12b76a' }}>{convRate}%</span>
          </div>
          <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:3, background:'linear-gradient(90deg,#a78bfa,#12b76a)', width:`${convRate}%`, transition:'width 1.2s ease', boxShadow:'0 0 12px rgba(167,139,250,0.6)' }}/>
          </div>
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
                <div style={{ display:'flex', flexDirection:'column', gap:8, flex:1 }}>
                  {stageItems.map((p, i) => {
                    const isDragging = dragging === p._id;

                    return (
                      <div key={p._id}
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
                            <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'var(--text-primary)' }}>{p.displayName}</div>
                            {(p.prenom||p.nom) && <div style={{ fontSize:11, color:'#ffffff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginTop:1 }}>{`${p.prenom||''} ${p.nom||''}`.trim()}</div>}
                          </div>
                        </div>

                        {/* Ville */}
                        {p.ville && (
                          <div style={{ fontSize:11, color:'#ffffff', marginBottom:7, display:'flex', alignItems:'center', gap:4 }}>
                            <MapPin size={9}/> {p.ville}
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
