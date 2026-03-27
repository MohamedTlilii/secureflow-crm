import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Plus, Search, Filter, ChevronRight, Phone, Mail, MapPin, Building2, User, X, Edit2, Trash2, MessageSquare, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('sf_token')}` }
});

const STAGES = { '01_Inbox':'Inbox','02_Qualifying':'Qualification','03_Proposal':'Proposition','04_Closed':'Gagné','99_Dead':'Perdu' };
const SIGNALS = { ouverture:'Nouveau local',recrutement:'Recrutement','nouveau-poste':'Nouveau poste',expansion:'Expansion',commentaire:'Commentaire post',incident:'Incident',manuel:'Manuel' };
const AV = ['av-blue','av-teal','av-amber','av-coral','av-purple'];

const PRIO_CLASS = { P0:'badge-p0', P1:'badge-p1', P2:'badge-p2', P3:'badge-dead' };
const STAGE_CLASS = { '04_Closed':'badge-won','99_Dead':'badge-dead' };

const VILLES = ['Montreal','Laval','Longueuil','Boucherville','Repentigny','Vaudreuil-Dorion','Terrebonne','Saint-Jean-sur-Richelieu','Saint-Jerome','Saint-Sauveur','Salaberry-de-Valleyfield','Sorel-Tracy','Granby','Trois-Rivieres','Shawinigan','Louiseville','Drummondville','Victoriaville','Ottawa','Gatineau','Ville de Quebec'];

const EMPTY = { prenom:'',nom:'',entreprise:'',type:'B2B',ville:'Montreal',telephone:'',email:'',linkedin:'',priorite:'P1',stage:'01_Inbox',signal:'manuel',notes:'',valeurEstimee:0 };

export default function Prospects() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ stage:'', type:'', priorite:'' });
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [noteText, setNoteText] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchProspects = useCallback(async () => {
    const params = { ...filters };
    if (search) params.search = search;
    // ✅ FIX: axios.get avec authHeader() et params séparés
    const r = await axios.get('/api/prospects', { ...authHeader(), params });
    setProspects(r.data);
    setLoading(false);
  }, [search, filters]);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const openAdd = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (p) => {
    setForm({ prenom:p.prenom,nom:p.nom,entreprise:p.entreprise||'',type:p.type,ville:p.ville,telephone:p.telephone||'',email:p.email||'',linkedin:p.linkedin||'',priorite:p.priorite,stage:p.stage,signal:p.signal,notes:'',valeurEstimee:p.valeurEstimee||0 });
    setSelected(p);
    setModal('edit');
  };

  const handleSubmit = async () => {
    console.log('TOKEN:', localStorage.getItem('sf_token'));
    console.log('FORM DATA:', form);
    try {
      if (modal === 'add') {
        // ✅ FIX: axios.post avec authHeader() en 3e argument
        await axios.post('/api/prospects', form, authHeader());
        toast.success('Prospect ajouté !');
      } else {
        // ✅ FIX: axios.put avec authHeader() en 3e argument
        await axios.put(`/api/prospects/${selected._id}`, form, authHeader());
        toast.success('Mis à jour !');
      }
      setModal(null);
      fetchProspects();
    } catch(err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Supprimer ${p.prenom} ${p.nom} ?`)) return;
    // ✅ FIX: axios.delete avec authHeader() en 2e argument
    await axios.delete(`/api/prospects/${p._id}`, authHeader());
    toast.success('Supprimé');
    fetchProspects();
  };

  const handleAdvance = async (p) => {
    const order = ['01_Inbox','02_Qualifying','03_Proposal','04_Closed'];
    const idx = order.indexOf(p.stage);
    if (idx < order.length-1) {
      // ✅ FIX: axios.put avec authHeader() en 3e argument
      await axios.put(`/api/prospects/${p._id}`, { stage: order[idx+1] }, authHeader());
      toast.success(`Déplacé → ${STAGES[order[idx+1]]}`);
      fetchProspects();
    }
  };

   const addNote = async (p) => {
    if (!noteText.trim()) return;
    try {
      // On envoie la note au serveur
      await axios.post(`/api/prospects/${p._id}/notes`, { text: noteText }, authHeader());
      
      setNoteText(''); // On vide le champ texte
      setModal(null);  // ✅ CETTE LIGNE FERME LE MODAL AUTOMATIQUEMENT
      
      toast.success('Note ajoutée');
      fetchProspects(); // On rafraîchit la liste pour voir la nouvelle note
    } catch (err) {
      toast.error('Erreur lors de l\'ajout');
    }
  };


  const ini = p => ((p.prenom[0]||'')+(p.nom[0]||'')).toUpperCase();

  return (
    <div className="animate-fade">
      <div className="page-header flex-between">
        <div><h1>Prospects</h1><p>Gérez tous vos contacts de prospection</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} />Nouveau prospect</button>
      </div>

      {/* Filtres */}
      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:200,position:'relative'}}>
          <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}} />
          <input className="input" style={{paddingLeft:36}} placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        {['stage','type','priorite'].map(f => (
          <select key={f} className="select" style={{width:150}} value={filters[f]} onChange={e=>setFilters(x=>({...x,[f]:e.target.value}))}>
            <option value="">{f==='stage'?'Toutes étapes':f==='type'?'B2B + B2C':'Toutes priorités'}</option>
            {f==='stage' && Object.entries(STAGES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            {f==='type' && ['B2B','B2C'].map(v=><option key={v} value={v}>{v}</option>)}
            {f==='priorite' && ['P0','P1','P2','P3'].map(v=><option key={v} value={v}>{v}</option>)}
          </select>
        ))}
      </div>

      {/* Liste */}
      {/* {loading ? <div style={{textAlign:'center',padding:60,color:'var(--text-muted)'}}>Chargement...</div> :
       prospects.length === 0 ? (
        <div className="empty-state">
          <User size={40} />
          <p>Aucun prospect trouvé</p>
          <button className="btn btn-primary" onClick={openAdd} style={{marginTop:16}}><Plus size={14}/>Ajouter un prospect</button>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {prospects.map((p,i) => (
            <div key={p._id} className="card animate-fade" style={{animationDelay:`${i*0.03}s`,padding:'16px 20px'}}>
              <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
                <div className={`avatar ${AV[i%AV.length]}`} style={{width:42,height:42,fontSize:14}}>{ini(p)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:15,fontWeight:600}}>{p.prenom} {p.nom}</span>
                    <span className={`badge ${STAGE_CLASS[p.stage] || PRIO_CLASS[p.priorite]}`}>{p.priorite}</span>
                    <span className={`badge ${p.type==='B2B'?'badge-b2b':'badge-b2c'}`}>{p.type}</span>
                    <span style={{fontSize:11,color:'var(--text-muted)',background:'var(--bg-hover)',padding:'2px 8px',borderRadius:20}}>{STAGES[p.stage]}</span>
                  </div>
                  <div style={{display:'flex',gap:14,marginTop:4,flexWrap:'wrap'}}>
                    {p.entreprise && <span style={{fontSize:12,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:4}}><Building2 size={11}/>{p.entreprise}</span>}
                    <span style={{fontSize:12,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:4}}><MapPin size={11}/>{p.ville}</span>
                    {p.telephone && <span style={{fontSize:12,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:4}}><Phone size={11}/>{p.telephone}</span>}
                    <span style={{fontSize:12,color:'var(--text-muted)'}}>Signal: {SIGNALS[p.signal]}</span>
                  </div>
                </div>
                <div style={{display:'flex',gap:6,flexShrink:0}}>
                  {p.stage !== '04_Closed' && p.stage !== '99_Dead' && (
                    <button className="btn btn-sm" onClick={()=>handleAdvance(p)} title="Avancer dans le pipeline"><ArrowRight size={13}/></button>
                  )}
                  <button className="btn btn-sm" onClick={()=>{setSelected(p);setModal('notes')}} title="Notes"><MessageSquare size={13}/></button>
                  <button className="btn btn-sm" onClick={()=>openEdit(p)} title="Modifier"><Edit2 size={13}/></button>
                  <button className="btn btn-sm btn-danger" onClick={()=>handleDelete(p)} title="Supprimer"><Trash2 size={13}/></button>
                </div>
              </div>
              {p.notes?.length > 0 && (
                <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)'}}>
                  <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>Dernière note:</div>
                  <div style={{fontSize:13,color:'var(--text-secondary)'}}>{p.notes[p.notes.length-1].text}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )} */}
    {/* Liste CORRIGÉE */}
      {loading ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text-muted)'}}>Chargement...</div>
      ) : prospects.length === 0 ? (
        <div className="empty-state">
          <User size={40} />
          <p>Aucun prospect trouvé</p>
          <button className="btn btn-primary" onClick={openAdd} style={{marginTop:16}}><Plus size={14}/>Ajouter un prospect</button>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {prospects.map((p, i) => (
            <div key={p._id} className="card animate-fade" style={{animationDelay:`${i*0.03}s`,padding:'16px 20px'}}>
              <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
                <div className={`avatar ${AV[i%AV.length]}`} style={{width:42,height:42,fontSize:14}}>{ini(p)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:15,fontWeight:600}}>{p.prenom} {p.nom}</span>
                    <span className={`badge ${STAGE_CLASS[p.stage] || PRIO_CLASS[p.priorite]}`}>{p.priorite}</span>
                    <span className={`badge ${p.type==='B2B'?'badge-b2b':'badge-b2c'}`}>{p.type}</span>
                    <span style={{fontSize:11,color:'var(--text-muted)',background:'var(--bg-hover)',padding:'2px 8px',borderRadius:20}}>{STAGES[p.stage]}</span>
                  </div>
                  <div style={{display:'flex',gap:14,marginTop:4,flexWrap:'wrap'}}>
                    {p.entreprise && <span style={{fontSize:12,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:4}}><Building2 size={11}/>{p.entreprise}</span>}
                    <span style={{fontSize:12,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:4}}><MapPin size={11}/>{p.ville}</span>
                    {p.telephone && <span style={{fontSize:12,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:4}}><Phone size={11}/>{p.telephone}</span>}
                    <span style={{fontSize:12,color:'var(--text-muted)'}}>Signal: {SIGNALS[p.signal]}</span>
                  </div>
                </div>
                <div style={{display:'flex',gap:6,flexShrink:0}}>
                  {p.stage !== '04_Closed' && p.stage !== '99_Dead' && (
                    <button className="btn btn-sm" onClick={()=>handleAdvance(p)} title="Avancer"><ArrowRight size={13}/></button>
                  )}
                  <button className="btn btn-sm" onClick={()=>{setSelected(p);setModal('notes')}} title="Notes"><MessageSquare size={13}/></button>
                  <button className="btn btn-sm" onClick={()=>openEdit(p)} title="Modifier"><Edit2 size={13}/></button>
                  <button className="btn btn-sm btn-danger" onClick={()=>handleDelete(p)} title="Supprimer"><Trash2 size={13}/></button>
                </div>
              </div>
              {p.notes && (
                <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)'}}>
                  <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Historique des notes :</div>
                  <div style={{fontSize:13,color:'var(--text-secondary)', whiteSpace: 'pre-wrap'}}>{p.notes}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Modal add/edit */}
      {(modal==='add'||modal==='edit') && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}>
          <div className="modal">
            <div className="modal-header">
              <h2>{modal==='add'?'Nouveau prospect':'Modifier prospect'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={()=>setModal(null)}><X size={16}/></button>
            </div>
            <div className="form-grid">
              {[['prenom','Prénom','text','Marc'],['nom','Nom','text','Tremblay']].map(([k,l,t,ph])=>(
                <div key={k} className="form-group"><label className="form-label">{l}</label><input className="input" type={t} placeholder={ph} value={form[k]} onChange={e=>set(k,e.target.value)} /></div>
              ))}
              <div className="form-group"><label className="form-label">Entreprise</label><input className="input" placeholder="Restaurant Le Bouchon" value={form.entreprise} onChange={e=>set('entreprise',e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Type</label><select className="select" value={form.type} onChange={e=>set('type',e.target.value)}><option>B2B</option><option>B2C</option></select></div>
              <div className="form-group"><label className="form-label">Ville</label><select className="select" value={form.ville} onChange={e=>set('ville',e.target.value)}>{VILLES.map(v=><option key={v}>{v}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Priorité</label><select className="select" value={form.priorite} onChange={e=>set('priorite',e.target.value)}><option value="P0">P0 — Urgent</option><option value="P1">P1 — Intéressé</option><option value="P2">P2 — Tiède</option><option value="P3">P3 — Froid</option></select></div>
              <div className="form-group"><label className="form-label">Étape</label><select className="select" value={form.stage} onChange={e=>set('stage',e.target.value)}>{Object.entries(STAGES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Signal</label><select className="select" value={form.signal} onChange={e=>set('signal',e.target.value)}>{Object.entries(SIGNALS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Téléphone</label><input className="input" placeholder="514-555-0101" value={form.telephone} onChange={e=>set('telephone',e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="input" type="email" placeholder="marc@example.ca" value={form.email} onChange={e=>set('email',e.target.value)} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={()=>setModal(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{modal==='add'?'Ajouter':'Sauvegarder'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal notes */}
           {/* Modal notes — VERSION FIXE */}
      {modal === 'notes' && selected && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal">
            <div className="modal-header">
              <h2>Notes — {selected.prenom} {selected.nom}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}><X size={16} /></button>
            </div>
            
            {/* Zone d'affichage du texte (On a enlevé le .map qui faisait crasher) */}
            <div style={{
              maxHeight: 250, overflowY: 'auto', background: 'var(--bg-secondary)',
              borderRadius: 8, padding: '12px', marginBottom: 16,
              whiteSpace: 'pre-wrap', fontSize: 13, color: 'var(--text-primary)',
              border: '1px solid var(--border)'
            }}>
              {selected.notes || "Aucune note pour le moment."}
            </div>

            {/* Zone pour écrire */}
            <textarea
              className="input"
              style={{ resize: 'vertical', minHeight: 80 }}
              placeholder="Ajouter une note..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
            />
            
            <div className="modal-footer">
              <button className="btn" onClick={() => setModal(null)}>Fermer</button>
              <button className="btn btn-primary" onClick={() => addNote(selected)}>Ajouter</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
