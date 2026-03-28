
import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowRight, X, MapPin, Phone, Mail, Calendar, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STAGES = [
  { key:'01_Inbox', label:'Inbox', color:'#8b8b9e' },
  { key:'02_Qualifying', label:'Qualification', color:'#f79009' },
  { key:'03_Proposal', label:'Proposition', color:'#3b6cf8' },
  { key:'04_Closed', label:'Gagné', color:'#12b76a' },
  { key:'99_Dead', label:'Perdu', color:'#4a4a5e' },
];

const SIGNALS = { ouverture:'Nouveau local',recrutement:'Recrutement','nouveau-poste':'Nouveau poste',expansion:'Expansion',commentaire:'Commentaire post',incident:'Incident',manuel:'Manuel' };
const AV = ['av-blue','av-teal','av-amber','av-coral','av-purple'];
const PRIO_CLASS = { P0:'badge-p0', P1:'badge-p1', P2:'badge-p2', P3:'badge-dead' };

// Mini calendrier
function MiniCalendar({ prospects }) {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const firstDay = new Date(current.year, current.month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const rdvDates = prospects
    .filter(p => p.rdvDate)
    .map(p => new Date(p.rdvDate).toDateString());

  const prevMonth = () => setCurrent(c => {
    const m = c.month === 0 ? 11 : c.month - 1;
    const y = c.month === 0 ? c.year - 1 : c.year;
    return { year: y, month: m };
  });
  const nextMonth = () => setCurrent(c => {
    const m = c.month === 11 ? 0 : c.month + 1;
    const y = c.month === 11 ? c.year + 1 : c.year;
    return { year: y, month: m };
  });

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
        {days.map((d,i) => (
          <div key={i} style={{ textAlign:'center', fontSize:10, color:'var(--text-muted)', fontWeight:600, padding:'2px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
        {Array(offset).fill(null).map((_,i) => <div key={`e${i}`} />)}
        {Array(daysInMonth).fill(null).map((_,i) => {
          const day = i + 1;
          const date = new Date(current.year, current.month, day);
          const isToday = date.toDateString() === today.toDateString();
          const hasRdv = rdvDates.includes(date.toDateString());
          return (
            <div key={day} style={{
              textAlign:'center', fontSize:11, padding:'4px 0', borderRadius:6,
              background: isToday ? 'var(--accent)' : hasRdv ? 'rgba(59,108,248,0.15)' : 'transparent',
              color: isToday ? 'white' : hasRdv ? 'var(--accent)' : 'var(--text-primary)',
              fontWeight: isToday || hasRdv ? 700 : 400,
              position:'relative'
            }}>
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
  const [prospects, setProspects] = useState([]);
  const [selected, setSelected] = useState(null);

  const fetchProspects = () => {
    axios.get('/api/prospects').then(r => setProspects(r.data));
  };

  useEffect(() => { fetchProspects(); }, []);

  const onDragStart = (e, id) => { e.dataTransfer.setData("prospectId", id); };
  const onDragOver = (e) => { e.preventDefault(); };
  const onDrop = async (e, targetStage) => {
    const id = e.dataTransfer.getData("prospectId");
    await axios.put(`/api/prospects/${id}`, { stage: targetStage });
    fetchProspects();
    toast.success("Étape mise à jour");
  };

  const advance = async (p, e) => {
    e.stopPropagation();
    const order = STAGES.map(s => s.key);
    const idx = order.indexOf(p.stage);
    if (idx < order.length - 1) {
      await axios.put(`/api/prospects/${p._id}`, { stage: order[idx + 1] });
      fetchProspects();
      toast.success(`Déplacé → ${STAGES[idx + 1].label}`);
    }
  };

  const ini = p => ((p.prenom?.[0] || '') + (p.nom?.[0] || '')).toUpperCase();
  const stageInfo = (key) => STAGES.find(s => s.key === key);

  return (
   
 <div className="animate-fade">
      <div className="page-header flex-between">
        <div>
        <h1>Pipeline</h1>
        </div>
        <div style={{fontSize:12,color:'var(--text-muted)',background:'var(--bg-card)',padding:'6px 12px',borderRadius:8,border:'1px solid var(--border)'}}>
          {new Date().toLocaleDateString('fr-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </div>
      </div>
      

      {/* KANBAN */}
      <div style={{ display:'flex', gap:12, alignItems:'flex-start', paddingBottom:20, overflowX:'auto' }}>
        {STAGES.map(stage => {
          const items = prospects.filter(p => p.stage === stage.key);
          return (
            <div key={stage.key} onDragOver={onDragOver} onDrop={(e) => onDrop(e, stage.key)}
              style={{ background:'var(--bg-secondary)', borderRadius:16, padding:12, border:'1px solid var(--border)', display:'flex', flexDirection:'column', minWidth:260 }}>
              
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:stage.color }} />
                  <span style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{stage.label}</span>
                </div>
                <span style={{ fontSize:11, fontWeight:700, background:'var(--bg-card)', color:'var(--text-muted)', borderRadius:20, padding:'2px 8px', border:'1px solid var(--border)' }}>{items.length}</span>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:8, flex:1 }}>
                {items.map((p, i) => (
                  <div key={p._id} draggable onDragStart={(e) => onDragStart(e, p._id)}
                    onClick={() => setSelected(p)}
                    style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:12, cursor:'pointer', transition:'border-color 0.15s, transform 0.15s', width:240, minWidth:240, boxSizing:'border-box', overflow:'hidden' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; }}>

                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <div className={`avatar ${AV[i % AV.length]}`} style={{ width:28, height:28, fontSize:11 }}>{ini(p)}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.prenom} {p.nom}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.entreprise || 'Particulier'}</div>
                      </div>
                      <span className={`badge ${PRIO_CLASS[p.priorite]}`} style={{ fontSize:9 }}>{p.priorite}</span>
                    </div>

                    <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8 }}>{p.ville} · {p.type}</div>

                    {stage.key !== '04_Closed' && stage.key !== '99_Dead' && (
                      <button className="btn btn-sm" style={{ width:'100%', justifyContent:'center', fontSize:11 }} onClick={(e) => advance(p, e)}>
                        Avancer <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text-muted)', fontSize:12, flex:1 }}>Vide</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DETAIL */}
      {selected && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="modal">
            <div className="modal-header">
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div className={`avatar ${AV[0]}`} style={{ width:48, height:48, fontSize:16 }}>{ini(selected)}</div>
                <div>
                  <h2 style={{ margin:0 }}>{selected.prenom} {selected.nom}</h2>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{selected.entreprise || 'Particulier'}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>

            {/* Badges */}
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              <span className={`badge ${PRIO_CLASS[selected.priorite]}`}>{selected.priorite}</span>
              <span className={`badge ${selected.type === 'B2B' ? 'badge-b2b' : 'badge-b2c'}`}>{selected.type}</span>
              <span style={{ fontSize:11, color: stageInfo(selected.stage)?.color, background:'var(--bg-hover)', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>
                ● {stageInfo(selected.stage)?.label}
              </span>
            </div>

            {/* Infos */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              {[
                ['Ville', selected.ville, MapPin],
                ['Téléphone', selected.telephone || '—', Phone],
                ['Email', selected.email || '—', Mail],
                ['Signal', SIGNALS[selected.signal] || selected.signal, Calendar],
                ['Entreprise', selected.entreprise || 'Particulier', Building2],
                ['Ajouté le', new Date(selected.createdAt).toLocaleDateString('fr-CA'), Calendar],
              ].map(([label, val, Icon]) => (
                <div key={label} style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginBottom:3, display:'flex', alignItems:'center', gap:4 }}>
                    <Icon size={9} />{label}
                  </div>
                  <div style={{ fontSize:13, color:'var(--text-primary)' }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Notes */}
            {selected.notes?.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginBottom:6 }}>Dernière note</div>
                <div style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'var(--text-primary)' }}>
                  {typeof selected.notes[selected.notes.length - 1] === 'object'
                    ? selected.notes[selected.notes.length - 1].text
                    : selected.notes[selected.notes.length - 1]}
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
