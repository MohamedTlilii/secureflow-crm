// ════════════════════════════════════════════════════════════════════════════
// client/src/pages/Pipeline.jsx
//
// Pipeline Kanban — toutes les sources unifiées
// Sources : LinkedIn · Google Alerts · Google Maps · Solution Express
//
// STATUTS UNIFIÉS (identiques à SolutionExpress.jsx) :
//   new | contacted | interested | proposal | won | lost | ignored
//
// SYNC BIDIRECTIONNEL :
//   Changer le statut ici → mis à jour dans la source d'origine (PUT /api/...)
//   Changer dans SolutionExpress → reflété ici au prochain fetch
//
// ROUTES BACKEND :
//   GET /api/linkedin          PUT /api/linkedin/:id
//   GET /api/google-alerts     PUT /api/google-alerts/:id
//   GET /api/google-maps       PUT /api/google-maps/:id
//   GET /api/solution-express  PUT /api/solution-express/:id
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { ArrowRight, X, MapPin, Phone, Mail, Building2, Calendar, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('sf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ════════════════════════════════════════════════════════════════════════════
// COLONNES PIPELINE — identiques aux statuts Solution Express
// ════════════════════════════════════════════════════════════════════════════
const STAGES = [
  { key:'new',       label:'Nouveau',    color:'#3b6cf8' },
  { key:'contacted', label:'Contacté',   color:'#f79009' },
  { key:'interested',label:'Intéressé',  color:'#12b76a' },
  { key:'proposal',  label:'Soumission', color:'#a764f8' },
  { key:'won',       label:'Gagné',      color:'#12b76a' },
  { key:'lost',      label:'Perdu',      color:'#f04438' },
  { key:'ignored',   label:'Ignoré',     color:'#8b8b9e' },
];

const AV = ['av-blue','av-teal','av-amber','av-coral','av-purple'];

// ════════════════════════════════════════════════════════════════════════════
// MAPPING STATUTS — convertit les anciens statuts vers les nouveaux
// ════════════════════════════════════════════════════════════════════════════

// Google Alerts (anciens statuts) → statuts unifiés
const normalizeStatus = (status, source) => {
  if (source === 'google_alert') {
    switch(status) {
      case 'new':       return 'new';
      case 'analyzed':  return 'new';
      case 'contacted': return 'contacted';
      case 'saved':     return 'won';
      case 'ignored':   return 'ignored';
      default:          return 'new';
    }
  }
  if (source === 'linkedin') {
    switch(status) {
      case 'new':       return 'new';
      case 'contacted': return 'contacted';
      case 'qualified': return 'interested';
      case 'proposal':  return 'proposal';
      case 'won':       return 'won';
      case 'lost':      return 'lost';
      case 'ignored':   return 'ignored';
      default:          return 'new';
    }
  }
  if (source === 'google_map') {
    switch(status) {
      case 'new':       return 'new';
      case 'contacted': return 'contacted';
      case 'saved':     return 'won';
      case 'ignored':   return 'ignored';
      default:          return 'new';
    }
  }
  // solution_express — statuts déjà unifiés
  return status || 'new';
};

// Statut unifié → statut de la source d'origine (pour le PUT)
const denormalizeStatus = (unifiedStatus, source) => {
  if (source === 'google_alert') {
    switch(unifiedStatus) {
      case 'new':       return 'new';
      case 'contacted': return 'contacted';
      case 'interested':return 'contacted';
      case 'proposal':  return 'contacted';
      case 'won':       return 'saved';
      case 'lost':      return 'ignored';
      case 'ignored':   return 'ignored';
      default:          return 'new';
    }
  }
  if (source === 'linkedin') {
    switch(unifiedStatus) {
      case 'new':       return 'new';
      case 'contacted': return 'contacted';
      case 'interested':return 'qualified';
      case 'proposal':  return 'proposal';
      case 'won':       return 'won';
      case 'lost':      return 'lost';
      case 'ignored':   return 'ignored';
      default:          return 'new';
    }
  }
  if (source === 'google_map') {
    switch(unifiedStatus) {
      case 'new':       return 'new';
      case 'contacted': return 'contacted';
      case 'won':       return 'saved';
      case 'ignored':   return 'ignored';
      default:          return 'new';
    }
  }
  // solution_express — direct
  return unifiedStatus;
};

// Route API selon la source
const getRoute = (source) => {
  switch(source) {
    case 'linkedin':          return '/api/linkedin';
    case 'google_alert':      return '/api/google-alerts';
    case 'google_map':        return '/api/google-maps';
    case 'solution_express':  return '/api/solution-express';
    default:                  return '/api/linkedin';
  }
};

// Badge source avec couleur et icône
const SOURCE_BADGE = {
  linkedin:         { label:'💼 LinkedIn',         color:'#0077b5' },
  google_alert:     { label:'🔔 Google Alert',     color:'#ea4335' },
  google_map:       { label:'🗺️ Google Maps',      color:'#34a853' },
  solution_express: { label:'🏢 Solution Express', color:'#12b76a' },
};

// ════════════════════════════════════════════════════════════════════════════
// MINI CALENDRIER — identique à ton code original
// ════════════════════════════════════════════════════════════════════════════
function MiniCalendar({ items }) {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const firstDay    = new Date(current.year, current.month, 1).getDay();
  const offset      = firstDay === 0 ? 6 : firstDay - 1;
  const rdvDates    = items.filter(p => p.rdvDate).map(p => new Date(p.rdvDate).toDateString());

  const prevMonth = () => setCurrent(c => ({ year: c.month === 0 ? c.year-1 : c.year, month: c.month === 0 ? 11 : c.month-1 }));
  const nextMonth = () => setCurrent(c => ({ year: c.month === 11 ? c.year+1 : c.year, month: c.month === 11 ? 0 : c.month+1 }));
  const monthName = new Date(current.year, current.month).toLocaleDateString('fr-CA', { month:'long', year:'numeric' });
  const days = ['L','M','M','J','V','S','D'];

  return (
    <div className="card" style={{ padding:16, marginBottom:20, maxWidth:320 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <button onClick={prevMonth} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:16 }}>‹</button>
        <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', textTransform:'capitalize' }}>{monthName}</span>
        <button onClick={nextMonth} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:16 }}>›</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
        {days.map((d,i) => <div key={i} style={{ textAlign:'center', fontSize:10, color:'var(--text-muted)', fontWeight:600, padding:'2px 0' }}>{d}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
        {Array(offset).fill(null).map((_,i) => <div key={`e${i}`}/>)}
        {Array(daysInMonth).fill(null).map((_,i) => {
          const day  = i + 1;
          const date = new Date(current.year, current.month, day);
          const isToday = date.toDateString() === today.toDateString();
          const hasRdv  = rdvDates.includes(date.toDateString());
          return (
            <div key={day} style={{ textAlign:'center', fontSize:11, padding:'4px 0', borderRadius:6, background: isToday?'var(--accent)':hasRdv?'rgba(59,108,248,0.15)':'transparent', color: isToday?'white':hasRdv?'var(--accent)':'var(--text-primary)', fontWeight: isToday||hasRdv?700:400 }}>
              {day}
              {hasRdv && !isToday && <div style={{ width:4, height:4, borderRadius:'50%', background:'var(--accent)', margin:'1px auto 0' }}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function Pipeline() {
  const [items, setItems]     = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── FETCH — Google Alerts + Solution Express uniquement ─────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [ga, se] = await Promise.all([
        axios.get('/api/google-alerts').catch(() => ({ data: [] })),
        axios.get('/api/solution-express').catch(() => ({ data: [] })),
      ]);

      const all = [
        // Google Alerts
        ...ga.data.map(x => ({
          ...x,
          source:      'google_alert',
          stage:       normalizeStatus(x.status, 'google_alert'),
          displayName: x.entreprise || `${x.prenom||''} ${x.nom||''}`.trim() || 'Google Alert',
        })),
        // Solution Express
        ...se.data.map(x => ({
          ...x,
          source:      'solution_express',
          stage:       normalizeStatus(x.status, 'solution_express'),
          displayName: x.entreprise || `${x.prenom||''} ${x.nom||''}`.trim() || 'Solution Express',
        })),
      ];

      setItems(all);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── DRAG & DROP ───────────────────────────────────────────────────────────
  const onDragStart = (e, id, source) => {
    e.dataTransfer.setData('itemId', id);
    e.dataTransfer.setData('itemSource', source);
  };
  const onDragOver = (e) => { e.preventDefault(); };

  // ── Fonction centrale de mise à jour du statut ────────────────────────────
  // Pour Solution Express : envoie le document COMPLET (évite de perdre les champs)
  // Pour les autres sources : envoie juste { status }
  const updateStatus = async (item, targetStage) => {
    const newStatus = denormalizeStatus(targetStage, item.source);
    try {
      if (item.source === 'solution_express') {
        // Nettoie les champs frontend avant d'envoyer au backend
        const { stage, source, displayName, ...cleanItem } = item;
        await axios.put(`/api/solution-express/${item._id}`, {
          ...cleanItem,
          status: newStatus
        });
      } else {
        await axios.put(`${getRoute(item.source)}/${item._id}`, { status: newStatus });
      }
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

  // Drag & drop → déposer dans une colonne
  const onDrop = async (e, targetStage) => {
    const id     = e.dataTransfer.getData('itemId');
    const source = e.dataTransfer.getData('itemSource');
    // Trouve le doc complet dans items pour Solution Express
    const item = items.find(x => x._id === id && x.source === source);
    if (item) await updateStatus(item, targetStage);
  };

  // Bouton Avancer d'une étape
  const advance = async (item, e) => {
    e.stopPropagation();
    const order = STAGES.map(s => s.key);
    const idx   = order.indexOf(item.stage);
    if (idx < order.length - 1) {
      await updateStatus(item, order[idx + 1]);
    }
  };

  const ini = (item) => {
    const name  = item.displayName || '';
    const parts = name.split(' ');
    return ((parts[0]?.[0]||'')+(parts[1]?.[0]||'')).toUpperCase() || '?';
  };

  const stageInfo = (key) => STAGES.find(s => s.key === key);

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="animate-fade">

      {/* HEADER */}
      <div className="page-header flex-between">
        <div><h1>Pipeline</h1></div>
        <div style={{ fontSize:12, color:'var(--text-muted)', background:'var(--bg-card)', padding:'6px 12px', borderRadius:8, border:'1px solid var(--border)' }}>
          {new Date().toLocaleDateString('fr-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </div>
      </div>

      {/* KANBAN */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}>Chargement...</div>
      ) : (
        <div style={{ display:'flex', gap:12, alignItems:'flex-start', paddingBottom:20, overflowX:'auto' }}>
          {STAGES.map(stage => {
            const stageItems = items.filter(p => p.stage === stage.key);
            return (
              <div key={stage.key}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, stage.key)}
                style={{ background:'var(--bg-secondary)', borderRadius:16, padding:12, border:'1px solid var(--border)', display:'flex', flexDirection:'column', minWidth:240 }}
              >
                {/* En-tête colonne */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:stage.color }}/>
                    <span style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{stage.label}</span>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, background:'var(--bg-card)', color:'var(--text-muted)', borderRadius:20, padding:'2px 8px', border:'1px solid var(--border)' }}>
                    {stageItems.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ display:'flex', flexDirection:'column', gap:8, flex:1 }}>
                  {stageItems.map((p, i) => {
                    const srcBadge  = SOURCE_BADGE[p.source];
                    const isSE      = p.source === 'solution_express';
                    return (
                      <div key={p._id}
                        draggable
                        onDragStart={(e) => onDragStart(e, p._id, p.source)}
                        onClick={() => setSelected(p)}
                        style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:12, cursor:'pointer', transition:'border-color 0.15s,transform 0.15s', borderLeft:`3px solid ${srcBadge?.color||'var(--border)'}`, boxSizing:'border-box', overflow:'hidden' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor=stage.color; e.currentTarget.style.transform='translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform=''; }}
                      >
                        {/* Avatar + Nom */}
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                          <div className={`avatar ${AV[i%AV.length]}`} style={{ width:28, height:28, fontSize:11 }}>{ini(p)}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.displayName}</div>
                            <div style={{ fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.entreprise||'—'}</div>
                          </div>
                        </div>

                        {/* Ville */}
                        {p.ville && (
                          <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6, display:'flex', alignItems:'center', gap:4 }}>
                            <MapPin size={9}/> {p.ville}
                          </div>
                        )}

                        {/* Produits Solution Express */}
                        {isSE && (p.produits||[]).length > 0 && (
                          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:6 }}>
                            {p.produits.slice(0,2).map(code => (
                              <span key={code} style={{ fontSize:9, fontWeight:600, padding:'1px 6px', borderRadius:20, background:`${srcBadge?.color}15`, color:srcBadge?.color }}>
                                {code === 'alarme' ? '🔒' : code === 'internet' ? '🌐' : code === 'mobile' ? '📱' : code === 'cameras' ? '📷' : '•'} {code}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Badge source */}
                        <div style={{ marginBottom: stage.key !== 'won' && stage.key !== 'lost' && stage.key !== 'ignored' ? 8 : 0 }}>
                          <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:`${srcBadge?.color}15`, color:srcBadge?.color }}>
                            {srcBadge?.label}
                          </span>
                        </div>

                        {/* Bouton Avancer */}
                        {stage.key !== 'won' && stage.key !== 'lost' && stage.key !== 'ignored' && (
                          <button className="btn btn-sm" style={{ width:'100%', justifyContent:'center', fontSize:11 }} onClick={(e) => advance(p, e)}>
                            Avancer <ArrowRight size={11}/>
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {stageItems.length === 0 && (
                    <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text-muted)', fontSize:12 }}>Vide</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL DÉTAIL                                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {selected && (
        <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) setSelected(null); }}>
          <div className="modal">
            <div className="modal-header">
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div className="avatar av-blue" style={{ width:48, height:48, fontSize:16 }}>{ini(selected)}</div>
                <div>
                  <h2 style={{ margin:0 }}>{selected.displayName}</h2>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{selected.entreprise||'—'}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}><X size={16}/></button>
            </div>

            {/* Badges */}
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, color:stageInfo(selected.stage)?.color, background:'var(--bg-hover)', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>
                ● {stageInfo(selected.stage)?.label}
              </span>
              <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:`${SOURCE_BADGE[selected.source]?.color}15`, color:SOURCE_BADGE[selected.source]?.color }}>
                {SOURCE_BADGE[selected.source]?.label}
              </span>
            </div>

            {/* Infos */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              {[
                ['Ville',       selected.ville      ||'—', MapPin],
                ['Téléphone',   selected.telephone  ||'—', Phone],
                ['Email',       selected.email      ||'—', Mail],
                ['Entreprise',  selected.entreprise ||'—', Building2],
                ['Ajouté le',   new Date(selected.createdAt).toLocaleDateString('fr-CA'), Calendar],
                ['Statut',      stageInfo(selected.stage)?.label || '—', Calendar],
              ].map(([label, val, Icon]) => (
                <div key={label} style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginBottom:3, display:'flex', alignItems:'center', gap:4 }}>
                    <Icon size={9}/>{label}
                  </div>
                  <div style={{ fontSize:13, color:'var(--text-primary)' }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Infos spécifiques Solution Express */}
            {selected.source === 'solution_express' && (
              <>
                {(selected.produits||[]).length > 0 && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginBottom:6 }}>Produits</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {selected.produits.map(code => (
                        <span key={code} style={{ fontSize:11, fontWeight:600, padding:'2px 10px', borderRadius:20, background:'rgba(18,183,106,0.1)', color:'#12b76a' }}>
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selected.qualificationSysteme && selected.qualificationSysteme !== 'inconnu' && (
                  <div style={{ marginBottom:12, background:'var(--bg-secondary)', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginBottom:3 }}>Qualification système</div>
                    <div style={{ fontSize:13, color:'var(--text-primary)' }}>🔒 {selected.qualificationSysteme?.replace(/_/g,' ')}</div>
                  </div>
                )}
                {selected.summary && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginBottom:6 }}>Résumé</div>
                    <div style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'var(--text-primary)', lineHeight:1.5 }}>
                      {selected.summary}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Message IA (LinkedIn/Google Alerts) */}
            {selected.aiMessage && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginBottom:6 }}>Message IA</div>
                <div style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'var(--text-primary)', lineHeight:1.5 }}>
                  {selected.aiMessage}
                </div>
              </div>
            )}

            {/* Changer le statut directement depuis le modal */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginBottom:8 }}>Changer le statut</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {STAGES.map(s => (
                  <button key={s.key}
                    onClick={async () => {
                      await updateStatus(selected, s.key);
                      setSelected(null);
                    }}
                    style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:`2px solid ${selected.stage===s.key?s.color:'var(--border)'}`, background:selected.stage===s.key?s.color:'var(--bg-secondary)', color:selected.stage===s.key?'#fff':'var(--text-secondary)', transition:'all 0.15s' }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setSelected(null)}>Fermer</button>
              {selected.stage !== 'won' && selected.stage !== 'lost' && selected.stage !== 'ignored' && (
                <button className="btn btn-primary" onClick={async (e) => { await advance(selected, e); setSelected(null); }}>
                  Avancer <ArrowRight size={13}/>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
