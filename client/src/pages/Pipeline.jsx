import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowRight, X, MapPin, Phone, Mail, Building2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const STAGES = [
  { key:'01_Inbox',      label:'Inbox',         color:'#8b8b9e' },
  { key:'02_Qualifying', label:'Qualification',  color:'#f79009' },
  { key:'03_Proposal',   label:'Proposition',    color:'#3b6cf8' },
  { key:'04_Closed',     label:'Gagné',          color:'#12b76a' },
  { key:'99_Dead',       label:'Perdu',          color:'#4a4a5e' },
];

const AV = ['av-blue','av-teal','av-amber','av-coral','av-purple'];

const statusToStage = (status) => {
  switch(status) {
    case 'new':       return '01_Inbox';
    case 'analyzed':  return '01_Inbox';
    case 'contacted': return '02_Qualifying';
    case 'qualified': return '03_Proposal';
    case 'saved':     return '04_Closed';
    case 'ignored':   return '99_Dead';
    default:          return '01_Inbox';
  }
};

const stageToStatus = (stage) => {
  switch(stage) {
    case '01_Inbox':      return 'new';
    case '02_Qualifying': return 'contacted';
    case '03_Proposal':   return 'qualified';
    case '04_Closed':     return 'saved';
    case '99_Dead':       return 'ignored';
    default:              return 'new';
  }
};

const getRoute = (source) => {
  switch(source) {
    case 'linkedin':     return '/api/linkedin';
    case 'google_alert': return '/api/google-alerts';
    case 'google_map':   return '/api/google-maps';
    default:             return '/api/linkedin';
  }
};

const SOURCE_BADGE = {
  linkedin:     { label:'💼 LinkedIn',     color:'#0077b5' },
  google_alert: { label:'🔔 Google Alert', color:'#ea4335' },
  google_map:   { label:'🗺️ Google Maps',  color:'#34a853' },
};

// Mini Calendrier
function MiniCalendar({ items }) {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const firstDay = new Date(current.year, current.month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const rdvDates = items.filter(p => p.rdvDate).map(p => new Date(p.rdvDate).toDateString());

  const prevMonth = () => setCurrent(c => ({ year: c.month === 0 ? c.year - 1 : c.year, month: c.month === 0 ? 11 : c.month - 1 }));
  const nextMonth = () => setCurrent(c => ({ year: c.month === 11 ? c.year + 1 : c.year, month: c.month === 11 ? 0 : c.month + 1 }));

  const monthName = new Date(current.year, current.month).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });
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
        {Array(offset).fill(null).map((_,i) => <div key={`e${i}`} />)}
        {Array(daysInMonth).fill(null).map((_,i) => {
          const day = i + 1;
          const date = new Date(current.year, current.month, day);
          const isToday = date.toDateString() === today.toDateString();
          const hasRdv = rdvDates.includes(date.toDateString());
          return (
            <div key={day} style={{ textAlign:'center', fontSize:11, padding:'4px 0', borderRadius:6, background: isToday ? 'var(--accent)' : hasRdv ? 'rgba(59,108,248,0.15)' : 'transparent', color: isToday ? 'white' : hasRdv ? 'var(--accent)' : 'var(--text-primary)', fontWeight: isToday || hasRdv ? 700 : 400 }}>
              {day}
              {hasRdv && !isToday && <div style={{ width:4, height:4, borderRadius:'50%', background:'var(--accent)', margin:'1px auto 0' }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Pipeline() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [li, ga, gm] = await Promise.all([
        axios.get('/api/linkedin'),
        axios.get('/api/google-alerts'),
        axios.get('/api/google-maps'),
      ]);
      const all = [
        ...li.data.map(x => ({ ...x, source:'linkedin', stage:statusToStage(x.status), displayName:`${x.prenom||''} ${x.nom||''}`.trim()||x.entreprise||'Sans nom' })),
        ...ga.data.map(x => ({ ...x, source:'google_alert', stage:statusToStage(x.status), displayName:x.entreprise||`${x.prenom||''} ${x.nom||''}`.trim()||'Google Alert' })),
        ...gm.data.map(x => ({ ...x, source:'google_map', stage:statusToStage(x.status), displayName:x.nom||'Google Maps Lead', entreprise:x.nom||'' })),
      ];
      setItems(all);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const onDragStart = (e, id, source) => { e.dataTransfer.setData('itemId', id); e.dataTransfer.setData('itemSource', source); };
  const onDragOver = (e) => { e.preventDefault(); };
  const onDrop = async (e, targetStage) => {
    const id = e.dataTransfer.getData('itemId');
    const source = e.dataTransfer.getData('itemSource');
    await axios.put(`${getRoute(source)}/${id}`, { status: stageToStatus(targetStage) });
    toast.success('Étape mise à jour');
    fetchAll();
  };

  const advance = async (item, e) => {
    e.stopPropagation();
    const order = STAGES.map(s => s.key);
    const idx = order.indexOf(item.stage);
    if (idx < order.length - 1) {
      const nextStage = order[idx + 1];
      await axios.put(`${getRoute(item.source)}/${item._id}`, { status: stageToStatus(nextStage) });
      toast.success(`→ ${STAGES[idx + 1].label}`);
      fetchAll();
    }
  };

  const ini = (item) => {
    const name = item.displayName || '';
    const parts = name.split(' ');
    return ((parts[0]?.[0]||'')+(parts[1]?.[0]||'')).toUpperCase() || '?';
  };

  const stageInfo = (key) => STAGES.find(s => s.key === key);

  return (
    <div className="animate-fade">
      <div className="page-header flex-between">
        <div><h1>Pipeline</h1></div>
        <div style={{fontSize:12,color:'var(--text-muted)',background:'var(--bg-card)',padding:'6px 12px',borderRadius:8,border:'1px solid var(--border)'}}>
          {new Date().toLocaleDateString('fr-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </div>
      </div>


      {/* KANBAN */}
      {loading ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text-muted)'}}>Chargement...</div>
      ) : (
        <div style={{ display:'flex', gap:12, alignItems:'flex-start', paddingBottom:20, overflowX:'auto' }}>
          {STAGES.map(stage => {
            const stageItems = items.filter(p => p.stage === stage.key);
            return (
              <div key={stage.key} onDragOver={onDragOver} onDrop={(e) => onDrop(e, stage.key)}
                style={{ background:'var(--bg-secondary)', borderRadius:16, padding:12, border:'1px solid var(--border)', display:'flex', flexDirection:'column', minWidth:260 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:stage.color }} />
                    <span style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{stage.label}</span>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, background:'var(--bg-card)', color:'var(--text-muted)', borderRadius:20, padding:'2px 8px', border:'1px solid var(--border)' }}>{stageItems.length}</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, flex:1 }}>
                  {stageItems.map((p, i) => (
                    <div key={p._id} draggable
                      onDragStart={(e) => onDragStart(e, p._id, p.source)}
                      onClick={() => setSelected(p)}
                      style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:12, cursor:'pointer', transition:'border-color 0.15s, transform 0.15s', width:240, minWidth:240, boxSizing:'border-box', overflow:'hidden' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform=''; }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        <div className={`avatar ${AV[i%AV.length]}`} style={{ width:28, height:28, fontSize:11 }}>{ini(p)}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.displayName}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.entreprise||'—'}</div>
                        </div>
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>{p.ville||'—'}</div>
                      <div style={{ marginBottom:8 }}>
                        <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:`${SOURCE_BADGE[p.source]?.color}15`, color:SOURCE_BADGE[p.source]?.color }}>
                          {SOURCE_BADGE[p.source]?.label}
                        </span>
                      </div>
                      {stage.key !== '04_Closed' && stage.key !== '99_Dead' && (
                        <button className="btn btn-sm" style={{ width:'100%', justifyContent:'center', fontSize:11 }} onClick={(e) => advance(p, e)}>
                          Avancer <ArrowRight size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                  {stageItems.length === 0 && <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text-muted)', fontSize:12 }}>Vide</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DETAIL */}
      {selected && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="modal">
            <div className="modal-header">
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div className="avatar av-blue" style={{ width:48, height:48, fontSize:16 }}>{ini(selected)}</div>
                <div>
                  <h2 style={{ margin:0 }}>{selected.displayName}</h2>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{selected.entreprise||'—'}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, color:stageInfo(selected.stage)?.color, background:'var(--bg-hover)', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>
                ● {stageInfo(selected.stage)?.label}
              </span>
              <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:`${SOURCE_BADGE[selected.source]?.color}15`, color:SOURCE_BADGE[selected.source]?.color }}>
                {SOURCE_BADGE[selected.source]?.label}
              </span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              {[
                ['Ville', selected.ville||'—', MapPin],
                ['Téléphone', selected.telephone||'—', Phone],
                ['Email', selected.email||'—', Mail],
                ['Entreprise', selected.entreprise||'—', Building2],
                ['Ajouté le', new Date(selected.createdAt).toLocaleDateString('fr-CA'), Calendar],
                ['Status', selected.status||'—', Calendar],
              ].map(([label, val, Icon]) => (
                <div key={label} style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginBottom:3, display:'flex', alignItems:'center', gap:4 }}>
                    <Icon size={9} />{label}
                  </div>
                  <div style={{ fontSize:13, color:'var(--text-primary)' }}>{val}</div>
                </div>
              ))}
            </div>
            {selected.aiMessage && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginBottom:6 }}>Message IA</div>
                <div style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'var(--text-primary)', lineHeight:1.5 }}>
                  {selected.aiMessage}
                </div>
              </div>
            )}
            <div className="modal-footer">
              <button className="btn" onClick={() => setSelected(null)}>Fermer</button>
              {selected.stage !== '04_Closed' && selected.stage !== '99_Dead' && (
                <button className="btn btn-primary" onClick={async (e) => { await advance(selected, e); setSelected(null); }}>
                  Avancer <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
