import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Plus, MapPin, Phone, User, X, Edit2, Trash2, MessageSquare, Bell, Sparkles, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('sf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AV = ['av-blue','av-teal','av-amber','av-coral','av-purple'];
const VILLES = ['','Montreal','Laval','Longueuil','Boucherville','Repentigny','Vaudreuil-Dorion','Terrebonne','Saint-Jean-sur-Richelieu','Saint-Jerome','Saint-Sauveur','Salaberry-de-Valleyfield','Sorel-Tracy','Granby','Trois-Rivieres','Shawinigan','Louiseville','Drummondville','Victoriaville','Ottawa','Gatineau','Ville de Quebec'];

const ALERT_TYPES = { incendie:'Incendie', vol:'Vol', nouvelle_entreprise:'Nouvelle entreprise', ouverture:'Ouverture', incident:'Incident', autre:'Autre' };
const STATUS_LABELS = { new:'Nouveau', analyzed:'Analysé', contacted:'Contacté', saved:'Sauvegardé', ignored:'Ignoré' };
const STATUS_CLASS = { new:'badge-p0', analyzed:'badge-p1', contacted:'badge-p2', saved:'badge-won', ignored:'badge-dead' };
const ALERT_COLORS = { incendie:'#f04438', vol:'#f79009', nouvelle_entreprise:'#12b76a', ouverture:'#3b6cf8', incident:'#a764f8', autre:'#8b8b9e' };

const EMPTY = { alertText:'', keyword:'', sourceUrl:'', entreprise:'', prenom:'', nom:'', email:'', telephone:'', adresse:'', ville:'Montreal', alertType:'autre', aiSummary:'', urgencyScore:0, status:'new' };
const inputSt = { width:'100%', padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:13, fontFamily:'var(--font-body)', outline:'none' };

export default function GoogleAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ prenom:'',nom:'',entreprise:'',telephone:'',email:'',ville:'',alertType:'',status:'' });
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [alertInput, setAlertInput] = useState('');
  const [noteText, setNoteText] = useState('');
  const [selected, setSelected] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const r = await axios.get('/api/google-alerts');
      setAlerts(r.data);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = alerts.filter(p =>
    (p.prenom||'').toLowerCase().startsWith(filters.prenom.toLowerCase()) &&
    (p.nom||'').toLowerCase().startsWith(filters.nom.toLowerCase()) &&
    (p.entreprise||'').toLowerCase().startsWith(filters.entreprise.toLowerCase()) &&
    (p.telephone||'').toLowerCase().startsWith(filters.telephone.toLowerCase()) &&
    (p.email||'').toLowerCase().startsWith(filters.email.toLowerCase()) &&
    (!filters.ville || p.ville === filters.ville) &&
    (!filters.alertType || p.alertType === filters.alertType) &&
    (!filters.status || p.status === filters.status)
  );

  const hasFilters = Object.values(filters).some(v => v);
  const ini = p => ((p.prenom?.[0]||p.entreprise?.[0]||'G')).toUpperCase();

  const openAdd = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (p, e) => { if(e) e.stopPropagation(); setForm({...p}); setSelected(p); setModal('edit'); };
  const openNotes = (p, e) => { if(e) e.stopPropagation(); setSelected(p); setNoteText(''); setModal('notes'); };
  const openDetail = (p) => { setSelected(p); setModal('detail'); };
  const openAnalyze = () => { setAlertInput(''); setModal('analyze'); };

  // Analyse avec Gemini (gratuit) puis sauvegarde dans MongoDB
  const handleAnalyze = async () => {
  if (!alertInput.trim()) return toast.error("Colle le texte de l'alerte Google");
  setAiLoading(true);
  try {
    await axios.post('/api/google-alerts/analyze-gemini', { alertText: alertInput });
    toast.success('Alerte analysée et sauvegardée !');
    setModal(null);
    fetchAlerts();
  } catch (err) {
    if (err.response?.status === 429) {
      toast.error('Limite Gemini — réessaie dans 1 minute', { duration: 5000 });
    } else {
      toast.error('Erreur — ' + (err.response?.data?.message || 'vérfie le backend'));
    }
  } finally {
    setAiLoading(false);
  }
};

  const handleSubmit = async () => {
    try {
      if (modal === 'add') { await axios.post('/api/google-alerts', form); toast.success('Alerte ajoutée !'); }
      else { await axios.put(`/api/google-alerts/${selected._id}`, form); toast.success('Mis à jour !'); }
      setModal(null); fetchAlerts();
    } catch(err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async (p, e) => {
    if(e) e.stopPropagation();
    if (!confirm('Supprimer cette alerte ?')) return;
    await axios.delete(`/api/google-alerts/${p._id}`);
    toast.success('Supprimé'); setModal(null); fetchAlerts();
  };

  const addNote = async (p) => {
    if (!noteText.trim()) return;
    try {
      await axios.put(`/api/google-alerts/${p._id}`, { ...p, notes: [...(p.notes||[]), noteText] });
      setNoteText(''); setModal(null);
      toast.success('Note ajoutée'); fetchAlerts();
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="animate-fade">
      <div className="page-header flex-between">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:40,height:40,borderRadius:10,background:'#ea4335',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Bell size={22} color="#fff" />
          </div>
          <div>
            <h1>Google Alerts</h1>
            <p style={{color:'var(--text-muted)',fontSize:13}}>Alertes analysées par Gemini AI — gratuit</p>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
          <div style={{fontSize:12,color:'var(--text-muted)',background:'var(--bg-card)',padding:'6px 12px',borderRadius:8,border:'1px solid var(--border)'}}>
            {new Date().toLocaleDateString('fr-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn" onClick={openAnalyze} style={{background:'rgba(234,67,53,0.1)',borderColor:'rgba(234,67,53,0.2)',color:'#ea4335'}}>
              <Sparkles size={15}/> Analyser avec Gemini
            </button>
            <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Manuel</button>
          </div>
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
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:10 }}>
          <div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>Ville</div>
            <select style={inputSt} value={filters.ville} onChange={e=>setF('ville',e.target.value)}>
              {VILLES.map(v=><option key={v} value={v}>{v||'Toutes'}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>Type</div>
            <select style={inputSt} value={filters.alertType} onChange={e=>setF('alertType',e.target.value)}>
              <option value="">Tous</option>
              {Object.entries(ALERT_TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>Statut</div>
            <select style={inputSt} value={filters.status} onChange={e=>setF('status',e.target.value)}>
              <option value="">Tous</option>
              {Object.entries(STATUS_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        {hasFilters && (
          <button onClick={()=>setFilters({ prenom:'',nom:'',entreprise:'',telephone:'',email:'',ville:'',alertType:'',status:'' })}
            style={{ marginTop:10, fontSize:12, color:'var(--danger)', background:'none', border:'none', cursor:'pointer' }}>
            Effacer tous les filtres
          </button>
        )}
      </div>

      <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>
        {filtered.length} alerte{filtered.length!==1?'s':''} {hasFilters?'trouvée':'au total'}
      </div>

      {/* GRID CARDS */}
      {loading ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text-muted)'}}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Bell size={40}/>
          <p>{hasFilters?'Aucun résultat':'Aucune alerte Google'}</p>
          <button className="btn" onClick={openAnalyze} style={{marginTop:16,background:'rgba(234,67,53,0.1)',borderColor:'rgba(234,67,53,0.2)',color:'#ea4335'}}>
            <Sparkles size={14}/> Analyser une alerte avec Gemini
          </button>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16}}>
          {filtered.map((p,i) => {
            const alertColor = ALERT_COLORS[p.alertType] || '#8b8b9e';
            return (
              <div key={p._id} className="card" onClick={()=>openDetail(p)}
                style={{padding:20,cursor:'pointer',transition:'transform 0.15s, box-shadow 0.15s',borderTop:`3px solid ${alertColor}`}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.15)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                  <div className={`avatar ${AV[i%AV.length]}`} style={{width:44,height:44,fontSize:15,flexShrink:0}}>{ini(p)}</div>
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:15,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.entreprise || `${p.prenom} ${p.nom}` || 'Alerte Google'}</div>
                    {p.keyword && <div style={{fontSize:12,color:'var(--text-muted)'}}>Mot-clé: {p.keyword}</div>}
                  </div>
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
                  <span className={`badge ${STATUS_CLASS[p.status]||'badge-p2'}`}>{STATUS_LABELS[p.status]}</span>
                  <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:`${alertColor}18`,color:alertColor}}>{ALERT_TYPES[p.alertType]||p.alertType}</span>
                  {p.urgencyScore > 0 && (
                    <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:p.urgencyScore>=7?'rgba(240,68,56,0.1)':'rgba(247,144,9,0.1)',color:p.urgencyScore>=7?'var(--danger)':'var(--warning)',display:'flex',alignItems:'center',gap:3}}>
                      <AlertTriangle size={9}/>{p.urgencyScore}/10
                    </span>
                  )}
                </div>
                {p.aiSummary && (
                  <div style={{fontSize:12,color:'var(--text-secondary)',marginBottom:12,lineHeight:1.5,background:'var(--bg-secondary)',padding:'8px 10px',borderRadius:8,borderLeft:'3px solid var(--accent)',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                    {p.aiSummary}
                  </div>
                )}
                <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:14}}>
                  {p.ville && <span style={{fontSize:12,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:6}}><MapPin size={11}/>{p.ville}</span>}
                  {p.telephone && <span style={{fontSize:12,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:6}}><Phone size={11}/>{p.telephone}</span>}
                </div>
                <div style={{display:'flex',gap:6,borderTop:'1px solid var(--border)',paddingTop:12}} onClick={e=>e.stopPropagation()}>
                  <button className="btn btn-sm" onClick={e=>openNotes(p,e)} title="Notes" style={{flex:1}}><MessageSquare size={12}/></button>
                  <button className="btn btn-sm" onClick={e=>openEdit(p,e)} title="Modifier" style={{flex:1}}><Edit2 size={12}/></button>
                  <button className="btn btn-sm btn-danger" onClick={e=>handleDelete(p,e)} title="Supprimer" style={{flex:1}}><Trash2 size={12}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL ANALYSER */}
      {modal==='analyze' && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}>
          <div className="modal">
            <div className="modal-header">
              <h2 style={{display:'flex',alignItems:'center',gap:8}}><Sparkles size={18} color="#ea4335"/>Analyser avec Gemini AI</h2>
              <button className="btn btn-ghost btn-sm" onClick={()=>setModal(null)}><X size={16}/></button>
            </div>
            <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:16}}>
              Colle le texte de ton email Google Alert — Gemini extrait les infos et crée la fiche automatiquement.
            </p>
            <textarea
              className="input"
              style={{resize:'vertical',minHeight:180}}
              placeholder="Colle ici le texte de ton alerte Google..."
              value={alertInput}
              onChange={e=>setAlertInput(e.target.value)}
            />
            <div className="modal-footer">
              <button className="btn" onClick={()=>setModal(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleAnalyze} disabled={aiLoading} style={{gap:8}}>
                {aiLoading ? (
                  <><div style={{width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/> Analyse...</>
                ) : (
                  <><Sparkles size={14}/> Analyser</>
                )}
              </button>
            </div>
          </div>
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
                  <h2 style={{margin:0}}>{selected.entreprise||`${selected.prenom} ${selected.nom}`||'Alerte Google'}</h2>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>{ALERT_TYPES[selected.alertType]} {selected.ville?`· ${selected.ville}`:''}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setModal(null)}><X size={16}/></button>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
              <span className={`badge ${STATUS_CLASS[selected.status]||'badge-p2'}`}>{STATUS_LABELS[selected.status]}</span>
              <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:`${ALERT_COLORS[selected.alertType]||'#8b8b9e'}18`,color:ALERT_COLORS[selected.alertType]||'#8b8b9e'}}>{ALERT_TYPES[selected.alertType]}</span>
              {selected.urgencyScore > 0 && <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'rgba(240,68,56,0.1)',color:'var(--danger)'}}>Urgence {selected.urgencyScore}/10</span>}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              {[['Téléphone',selected.telephone||'—'],['Email',selected.email||'—'],['Ville',selected.ville||'—'],['Mot-clé',selected.keyword||'—'],['Adresse',selected.adresse||'—'],['Ajouté le',new Date(selected.createdAt).toLocaleDateString('fr-CA')]].map(([label,val])=>(
                <div key={label} style={{background:'var(--bg-secondary)',borderRadius:8,padding:'10px 12px'}}>
                  <div style={{fontSize:10,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',marginBottom:3}}>{label}</div>
                  <div style={{fontSize:13,color:'var(--text-primary)'}}>{val}</div>
                </div>
              ))}
            </div>
            {selected.aiSummary && (
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',marginBottom:6,display:'flex',alignItems:'center',gap:6}}><Sparkles size={11} color="#ea4335"/>Résumé Gemini</div>
                <div style={{background:'rgba(234,67,53,0.06)',border:'1px solid rgba(234,67,53,0.15)',borderRadius:8,padding:'10px 12px',fontSize:13,color:'var(--text-primary)',lineHeight:1.6}}>{selected.aiSummary}</div>
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
              <h2>{modal==='add'?'Nouvelle alerte':'Modifier alerte'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={()=>setModal(null)}><X size={16}/></button>
            </div>
            <div className="form-grid">
              {[['prenom','Prénom','Marc'],['nom','Nom','Tremblay'],['entreprise','Entreprise','Restaurant...'],['telephone','Téléphone','514-555-0101'],['adresse','Adresse','123 rue...'],['keyword','Mot-clé','incendie Montréal']].map(([k,l,ph])=>(
                <div key={k} className="form-group"><label className="form-label">{l}</label><input className="input" placeholder={ph} value={form[k]||''} onChange={e=>set(k,e.target.value)} /></div>
              ))}
              <div className="form-group"><label className="form-label">Ville</label><select className="select" value={form.ville} onChange={e=>set('ville',e.target.value)}>{VILLES.filter(v=>v).map(v=><option key={v}>{v}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Type</label><select className="select" value={form.alertType} onChange={e=>set('alertType',e.target.value)}>{Object.entries(ALERT_TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Statut</label><select className="select" value={form.status} onChange={e=>set('status',e.target.value)}>{Object.entries(STATUS_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
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
              <h2>Notes — {selected.entreprise||`${selected.prenom} ${selected.nom}`}</h2>
              <button className="btn btn-ghost btn-sm" onClick={()=>setModal(null)}><X size={16}/></button>
            </div>
            <div style={{maxHeight:220,overflowY:'auto',display:'flex',flexDirection:'column',gap:6,marginBottom:12}}>
              {selected.notes?.length ? selected.notes.map((n,i)=>(
                <div key={i} style={{background:'var(--bg-secondary)',borderRadius:8,padding:'8px 12px'}}>
                  <div style={{fontSize:13,color:'var(--text-primary)'}}>{n.text||n}</div>
                </div>
              )) : <div style={{color:'var(--text-muted)',fontSize:13,textAlign:'center',padding:'20px 0'}}>Aucune note</div>}
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
