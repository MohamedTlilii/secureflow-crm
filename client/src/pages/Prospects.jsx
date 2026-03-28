import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Plus, MapPin, Phone, User, X, Edit2, Trash2, MessageSquare, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('sf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const STAGES = { '01_Inbox':'Inbox','02_Qualifying':'Qualification','03_Proposal':'Proposition','04_Closed':'Gagné','99_Dead':'Perdu' };
const SIGNALS = { ouverture:'Nouveau local',recrutement:'Recrutement','nouveau-poste':'Nouveau poste',expansion:'Expansion',commentaire:'Commentaire post',incident:'Incident',manuel:'Manuel' };
const AV = ['av-blue','av-teal','av-amber','av-coral','av-purple'];
const PRIO_CLASS = { P0:'badge-p0', P1:'badge-p1', P2:'badge-p2', P3:'badge-dead' };
const STAGE_CLASS = { '04_Closed':'badge-won','99_Dead':'badge-dead' };
const VILLES = ['','Montreal','Laval','Longueuil','Boucherville','Repentigny','Vaudreuil-Dorion','Terrebonne','Saint-Jean-sur-Richelieu','Saint-Jerome','Saint-Sauveur','Salaberry-de-Valleyfield','Sorel-Tracy','Granby','Trois-Rivieres','Shawinigan','Louiseville','Drummondville','Victoriaville','Ottawa','Gatineau','Ville de Quebec'];
const EMPTY = { prenom:'',nom:'',entreprise:'',type:'B2B',ville:'Montreal',telephone:'',email:'',linkedin:'',priorite:'P1',stage:'01_Inbox',signal:'manuel',valeurEstimee:0,source:'manuel' };

const inputSt = { width:'100%', padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:13, fontFamily:'var(--font-body)', outline:'none' };

function SourceBadge({ source }) {
  if (source === 'linkedin') return <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'#0077b515',color:'#0077b5'}}>LinkedIn</span>;
  if (source === 'google_alert') return <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'#ea433515',color:'#ea4335'}}>Google Alert</span>;
  return null;
}

export default function Prospects() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ prenom:'',nom:'',entreprise:'',type:'',ville:'',priorite:'',stage:'',signal:'',telephone:'',email:'',source:'' });
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [noteText, setNoteText] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchProspects = useCallback(async () => {
    try {
      const r = await axios.get('/api/prospects');
      setProspects(r.data);
    } catch {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filteredProspects = prospects.filter(p =>
    (p.prenom||'').toLowerCase().startsWith(filters.prenom.toLowerCase()) &&
    (p.nom||'').toLowerCase().startsWith(filters.nom.toLowerCase()) &&
    (p.entreprise||'').toLowerCase().startsWith(filters.entreprise.toLowerCase()) &&
    (p.telephone||'').toLowerCase().startsWith(filters.telephone.toLowerCase()) &&
    (p.email||'').toLowerCase().startsWith(filters.email.toLowerCase()) &&
    (!filters.type || p.type === filters.type) &&
    (!filters.ville || p.ville === filters.ville) &&
    (!filters.priorite || p.priorite === filters.priorite) &&
    (!filters.stage || p.stage === filters.stage) &&
    (!filters.signal || p.signal === filters.signal) &&
    (!filters.source || p.source === filters.source)
  );

  const hasFilters = Object.values(filters).some(v => v);

  const openAdd = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (p, e) => {
    if (e) e.stopPropagation();
    setForm({ prenom:p.prenom,nom:p.nom,entreprise:p.entreprise||'',type:p.type,ville:p.ville,telephone:p.telephone||'',email:p.email||'',linkedin:p.linkedin||'',priorite:p.priorite,stage:p.stage,signal:p.signal,valeurEstimee:p.valeurEstimee||0,source:p.source||'manuel' });
    setSelected(p);
    setModal('edit');
  };
  const openNotes = (p, e) => {
    if (e) e.stopPropagation();
    setSelected(p);
    setNoteText('');
    setModal('notes');
  };
  const openDetail = (p) => { setSelected(p); setModal('detail'); };

  const handleSubmit = async () => {
    console.log('FORM ENVOYE:', JSON.stringify(form));
    try {
      if (modal === 'add') {
        await axios.post('/api/prospects', form);
        toast.success('Prospect ajouté !');
      } else {
        await axios.put(`/api/prospects/${selected._id}`, form);
        toast.success('Mis à jour !');
      }
      setModal(null);
      fetchProspects();
    } catch(err) {
      console.log('ERREUR BACKEND:', JSON.stringify(err.response?.data));
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (p, e) => {
    if (e) e.stopPropagation();
    if (!confirm(`Supprimer ${p.prenom} ${p.nom} ?`)) return;
    await axios.delete(`/api/prospects/${p._id}`);
    toast.success('Supprimé');
    setModal(null);
    fetchProspects();
  };

  const handleAdvance = async (p, e) => {
    if (e) e.stopPropagation();
    const order = ['01_Inbox','02_Qualifying','03_Proposal','04_Closed'];
    const idx = order.indexOf(p.stage);
    if (idx < order.length-1) {
      await axios.put(`/api/prospects/${p._id}`, { stage: order[idx+1] });
      toast.success(`→ ${STAGES[order[idx+1]]}`);
      fetchProspects();
    }
  };

  const addNote = async (p) => {
    if (!noteText.trim()) return;
    try {
      await axios.post(`/api/prospects/${p._id}/notes`, { text: noteText });
      setNoteText('');
      setModal(null);
      toast.success('Note ajoutée');
      await fetchProspects();
    } catch {
      toast.error('Erreur');
    }
  };

  const ini = p => ((p.prenom?.[0]||'')+(p.nom?.[0]||'')).toUpperCase();

  return (
    <div className="animate-fade">
      <div className="page-header flex-between">
        <div><h1>Prospects</h1></div>
        <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8}}>
          <div style={{fontSize:12,color:'var(--text-muted)',background:'var(--bg-card)',padding:'6px 12px',borderRadius:8,border:'1px solid var(--border)'}}>
            {new Date().toLocaleDateString('fr-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Nouveau prospect</button>
        </div>
      </div>

      {/* FILTRES */}
      <div className="card" style={{ padding:16, marginBottom:20 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, minmax(0,1fr))', gap:10, marginBottom:10 }}>
          {[['prenom','Prénom'],['nom','Nom'],['entreprise','Entreprise'],['telephone','Téléphone'],['email','Email']].map(([k,l])=>(
            <div key={k}>
              <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>{l}</div>
              <input style={inputSt} value={filters[k]} onChange={e=>setF(k,e.target.value)} />
            </div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(0,1fr))', gap:10 }}>
          <div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>Type</div>
            <select style={inputSt} value={filters.type} onChange={e=>setF('type',e.target.value)}>
              <option value="">Tous</option><option>B2B</option><option>B2C</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>Ville</div>
            <select style={inputSt} value={filters.ville} onChange={e=>setF('ville',e.target.value)}>
              {VILLES.map(v=><option key={v} value={v}>{v||'Toutes'}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>Priorité</div>
            <select style={inputSt} value={filters.priorite} onChange={e=>setF('priorite',e.target.value)}>
              <option value="">Toutes</option><option value="P0">P0</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>Étape</div>
            <select style={inputSt} value={filters.stage} onChange={e=>setF('stage',e.target.value)}>
              <option value="">Toutes</option>
              {Object.entries(STAGES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>Signal</div>
            <select style={inputSt} value={filters.signal} onChange={e=>setF('signal',e.target.value)}>
              <option value="">Tous</option>
              {Object.entries(SIGNALS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>Source</div>
            <select style={inputSt} value={filters.source} onChange={e=>setF('source',e.target.value)}>
              <option value="">Toutes</option>
              <option value="manuel">Manuel</option>
              <option value="linkedin">LinkedIn</option>
              <option value="google_alert">Google Alert</option>
            </select>
          </div>
        </div>
        {hasFilters && (
          <button onClick={()=>setFilters({ prenom:'',nom:'',entreprise:'',type:'',ville:'',priorite:'',stage:'',signal:'',telephone:'',email:'',source:'' })}
            style={{ marginTop:10, fontSize:12, color:'var(--danger)', background:'none', border:'none', cursor:'pointer' }}>
            Effacer tous les filtres
          </button>
        )}
      </div>

      <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>
        {filteredProspects.length} prospect{filteredProspects.length!==1?'s':''} {hasFilters?'trouvé':'au total'}
      </div>

      {/* GRID CARDS */}
      {loading ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text-muted)'}}>Chargement...</div>
      ) : filteredProspects.length === 0 ? (
        <div className="empty-state">
          <User size={40}/>
          <p>{hasFilters?'Aucun résultat pour ces filtres':'Aucun prospect trouvé'}</p>
          <button className="btn btn-primary" onClick={openAdd} style={{marginTop:16}}><Plus size={14}/>Ajouter un prospect</button>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16}}>
          {filteredProspects.map((p,i) => (
            <div key={p._id} className="card" onClick={()=>openDetail(p)}
              style={{padding:20, cursor:'pointer', transition:'transform 0.15s, box-shadow 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.15)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}>
              <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:12}}>
                <div className={`avatar ${AV[i%AV.length]}`} style={{width:44,height:44,fontSize:15,flexShrink:0}}>{ini(p)}</div>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:600, fontSize:15, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.prenom} {p.nom}</div>
                  {p.entreprise && <div style={{fontSize:12,color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.entreprise}</div>}
                </div>
              </div>
              <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:12}}>
                <span className={`badge ${STAGE_CLASS[p.stage]||PRIO_CLASS[p.priorite]}`}>{p.priorite}</span>
                <span className={`badge ${p.type==='B2B'?'badge-b2b':'badge-b2c'}`}>{p.type}</span>
                <span style={{fontSize:11,color:'var(--text-muted)',background:'var(--bg-hover)',padding:'2px 8px',borderRadius:20}}>{STAGES[p.stage]}</span>
                <SourceBadge source={p.source} />
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:5, marginBottom:14}}>
                <span style={{fontSize:12,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:6}}><MapPin size={11}/>{p.ville}</span>
                {p.telephone && <span style={{fontSize:12,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:6}}><Phone size={11}/>{p.telephone}</span>}
                <span style={{fontSize:11,color:'var(--text-muted)'}}>Signal: {SIGNALS[p.signal]}</span>
              </div>
              <div style={{display:'flex', gap:6, borderTop:'1px solid var(--border)', paddingTop:12}} onClick={e=>e.stopPropagation()}>
                {p.stage!=='04_Closed'&&p.stage!=='99_Dead'&&(
                  <button className="btn btn-sm" onClick={e=>handleAdvance(p,e)} title="Avancer" style={{flex:1}}><ArrowRight size={12}/></button>
                )}
                <button className="btn btn-sm" onClick={e=>openNotes(p,e)} title="Notes" style={{flex:1}}><MessageSquare size={12}/></button>
                <button className="btn btn-sm" onClick={e=>openEdit(p,e)} title="Modifier" style={{flex:1}}><Edit2 size={12}/></button>
                <button className="btn btn-sm btn-danger" onClick={e=>handleDelete(p,e)} title="Supprimer" style={{flex:1}}><Trash2 size={12}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DETAIL */}
      {modal==='detail' && selected && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}>
          <div className="modal">
            <div className="modal-header">
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div className={`avatar ${AV[0]}`} style={{width:48,height:48,fontSize:16}}>{ini(selected)}</div>
                <div>
                  <h2 style={{margin:0}}>{selected.prenom} {selected.nom}</h2>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>{selected.entreprise||'Particulier'} · {selected.ville}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setModal(null)}><X size={16}/></button>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
              <span className={`badge ${STAGE_CLASS[selected.stage]||PRIO_CLASS[selected.priorite]}`}>{selected.priorite}</span>
              <span className={`badge ${selected.type==='B2B'?'badge-b2b':'badge-b2c'}`}>{selected.type}</span>
              <span style={{fontSize:11,color:'var(--text-muted)',background:'var(--bg-hover)',padding:'2px 8px',borderRadius:20}}>{STAGES[selected.stage]}</span>
              <span style={{fontSize:11,color:'var(--text-muted)',background:'var(--bg-hover)',padding:'2px 8px',borderRadius:20}}>Signal: {SIGNALS[selected.signal]}</span>
              <SourceBadge source={selected.source} />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              {[['Téléphone',selected.telephone||'—'],['Email',selected.email||'—'],['Ville',selected.ville],['Ajouté le',new Date(selected.createdAt).toLocaleDateString('fr-CA')]].map(([label,val])=>(
                <div key={label} style={{background:'var(--bg-secondary)',borderRadius:8,padding:'10px 12px'}}>
                  <div style={{fontSize:10,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',marginBottom:3}}>{label}</div>
                  <div style={{fontSize:13,color:'var(--text-primary)'}}>{val}</div>
                </div>
              ))}
            </div>
            {selected.notes?.length > 0 && (
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',marginBottom:6}}>Dernière note</div>
                <div style={{background:'var(--bg-secondary)',borderRadius:8,padding:'10px 12px',fontSize:13,color:'var(--text-primary)'}}>
                  {selected.notes[selected.notes.length-1].text || selected.notes[selected.notes.length-1]}
                </div>
              </div>
            )}
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={e=>handleDelete(selected,e)}>Supprimer</button>
              <button className="btn" onClick={e=>openNotes(selected,e)}><MessageSquare size={13}/> Notes</button>
              <button className="btn btn-primary" onClick={e=>openEdit(selected,e)}><Edit2 size={13}/> Modifier</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD/EDIT */}
      {(modal==='add'||modal==='edit') && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}>
          <div className="modal">
            <div className="modal-header">
              <h2>{modal==='add'?'Nouveau prospect':'Modifier prospect'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={()=>setModal(null)}><X size={16}/></button>
            </div>
            <div className="form-grid">
              {[['prenom','Prénom','Marc'],['nom','Nom','Tremblay'],['entreprise','Entreprise','Restaurant...'],['telephone','Téléphone','514-555-0101'],['email','Email','marc@example.ca']].map(([k,l,ph])=>(
                <div key={k} className="form-group"><label className="form-label">{l}</label><input className="input" placeholder={ph} value={form[k]} onChange={e=>set(k,e.target.value)} /></div>
              ))}
              <div className="form-group"><label className="form-label">Type</label><select className="select" value={form.type} onChange={e=>set('type',e.target.value)}><option>B2B</option><option>B2C</option></select></div>
              <div className="form-group"><label className="form-label">Ville</label><select className="select" value={form.ville} onChange={e=>set('ville',e.target.value)}>{VILLES.filter(v=>v).map(v=><option key={v}>{v}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Priorité</label><select className="select" value={form.priorite} onChange={e=>set('priorite',e.target.value)}><option value="P0">P0 — Urgent</option><option value="P1">P1 — Intéressé</option><option value="P2">P2 — Tiède</option><option value="P3">P3 — Froid</option></select></div>
              <div className="form-group"><label className="form-label">Étape</label><select className="select" value={form.stage} onChange={e=>set('stage',e.target.value)}>{Object.entries(STAGES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Signal</label><select className="select" value={form.signal} onChange={e=>set('signal',e.target.value)}>{Object.entries(SIGNALS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Source</label>
                <select className="select" value={form.source} onChange={e=>set('source',e.target.value)}>
                  <option value="manuel">Manuel</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="google_alert">Google Alert</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={()=>setModal(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{modal==='add'?'Ajouter':'Sauvegarder'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOTES */}
      {modal==='notes' && selected && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}>
          <div className="modal">
            <div className="modal-header">
              <h2>Notes — {selected.prenom} {selected.nom}</h2>
              <button className="btn btn-ghost btn-sm" onClick={()=>setModal(null)}><X size={16}/></button>
            </div>
            <div style={{maxHeight:220,overflowY:'auto',display:'flex',flexDirection:'column',gap:6,marginBottom:12}}>
              {selected.notes?.length ? (
                selected.notes.map((n,i)=>(
                  <div key={i} style={{background:'var(--bg-secondary)',borderRadius:8,padding:'8px 12px'}}>
                    <div style={{fontSize:13,color:'var(--text-primary)'}}>{n.text||n}</div>
                    {n.author&&<div style={{fontSize:11,color:'var(--text-muted)',marginTop:3}}>{n.author} · {new Date(n.date).toLocaleDateString('fr-CA')}</div>}
                  </div>
                ))
              ) : <div style={{color:'var(--text-muted)',fontSize:13,textAlign:'center',padding:'20px 0'}}>Aucune note</div>}
            </div>
            <textarea className="input" style={{resize:'vertical',minHeight:80}} placeholder="Ajouter une note..." value={noteText} onChange={e=>setNoteText(e.target.value)} />
            <div className="modal-footer">
              <button className="btn" onClick={()=>setModal(null)}>Fermer</button>
              <button className="btn btn-primary" onClick={()=>addNote(selected)}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
