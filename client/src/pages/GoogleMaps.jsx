import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Plus, MapPin, Phone, User, X, Edit2, Trash2, MessageSquare, Map, Sparkles, Mail, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const AV = ['av-blue','av-teal','av-amber','av-coral','av-purple'];
const VILLES = ['','Montreal','Laval','Longueuil','Boucherville','Repentigny','Vaudreuil-Dorion','Terrebonne','Saint-Jean-sur-Richelieu','Saint-Jerome','Saint-Sauveur','Salaberry-de-Valleyfield','Sorel-Tracy','Granby','Trois-Rivieres','Shawinigan','Louiseville','Drummondville','Victoriaville','Ottawa','Gatineau','Ville de Quebec'];

const CATEGORIES = ['','Restaurant','Pharmacie','Commerce','Bureau','Entrepôt','Clinique','Hôtel','Épicerie','Bar','Salon','Garage','Autre'];
const STATUS_LABELS = { new:'Nouveau', contacted:'Contacté', qualified:'Qualifié', saved:'Sauvegardé', ignored:'Ignoré' };
const STATUS_CLASS = { new:'badge-p0', contacted:'badge-p1', qualified:'badge-p2', saved:'badge-won', ignored:'badge-dead' };

const EMPTY = { nom:'', categorie:'', adresse:'', ville:'Montreal', codePostal:'', telephone:'', email:'', siteWeb:'', rating:0, totalReviews:0, lat:0, lng:0, keyword:'', status:'new', aiMessage:'' };
const inputSt = { width:'100%', padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:13, fontFamily:'var(--font-body)', outline:'none' };

export default function GoogleMaps() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ nom:'',telephone:'',email:'',ville:'',categorie:'',status:'' });
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [noteText, setNoteText] = useState('');
  const [selected, setSelected] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchPlaces = useCallback(async () => {
    try {
      const r = await axios.get('/api/google-maps');
      setPlaces(r.data);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPlaces(); }, [fetchPlaces]);

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = places.filter(p =>
    (p.nom||'').toLowerCase().startsWith(filters.nom.toLowerCase()) &&
    (p.telephone||'').toLowerCase().startsWith(filters.telephone.toLowerCase()) &&
    (p.email||'').toLowerCase().startsWith(filters.email.toLowerCase()) &&
    (!filters.ville || p.ville === filters.ville) &&
    (!filters.categorie || p.categorie === filters.categorie) &&
    (!filters.status || p.status === filters.status)
  );

  const hasFilters = Object.values(filters).some(v => v);
  const ini = p => (p.nom?.[0]||'G').toUpperCase();

  const openAdd = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (p, e) => { if(e) e.stopPropagation(); setForm({...p}); setSelected(p); setModal('edit'); };
  const openNotes = (p, e) => { if(e) e.stopPropagation(); setSelected(p); setNoteText(''); setModal('notes'); };
  const openDetail = (p) => { setSelected(p); setModal('detail'); };

  const handleSubmit = async () => {
    try {
      if (modal === 'add') { await axios.post('/api/google-maps', form); toast.success('Commerce ajouté !'); }
      else { await axios.put(`/api/google-maps/${selected._id}`, form); toast.success('Mis à jour !'); }
      setModal(null); fetchPlaces();
    } catch(err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async (p, e) => {
    if(e) e.stopPropagation();
    if (!confirm(`Supprimer ${p.nom} ?`)) return;
    await axios.delete(`/api/google-maps/${p._id}`);
    toast.success('Supprimé'); setModal(null); fetchPlaces();
  };

  const handleGenerateAI = async (p, e) => {
    if(e) e.stopPropagation();
    setAiLoading(true);
    try {
      const r = await axios.post(`/api/google-maps/${p._id}/generate-message`);
      toast.success('Message IA généré !');
      fetchPlaces();
      if (selected?._id === p._id) setSelected({...selected, aiMessage: r.data.message});
    } catch { toast.error('Erreur IA'); }
    finally { setAiLoading(false); }
  };

  const handleSendEmail = async (p, e) => {
    if(e) e.stopPropagation();
    if (!p.email) return toast.error('Pas d\'email');
    try {
      await axios.post(`/api/google-maps/${p._id}/send-email`);
      toast.success('Email envoyé !'); fetchPlaces();
    } catch { toast.error('Erreur envoi email'); }
  };

  const addNote = async (p) => {
    if (!noteText.trim()) return;
    try {
      await axios.put(`/api/google-maps/${p._id}`, { ...p, notes: [...(p.notes||[]), noteText] });
      setNoteText(''); setModal(null);
      toast.success('Note ajoutée'); fetchPlaces();
    } catch { toast.error('Erreur'); }
  };

  const StarRating = ({ rating }) => (
    <div style={{display:'flex',alignItems:'center',gap:3}}>
      <Star size={11} color="#f79009" fill="#f79009" />
      <span style={{fontSize:12,color:'var(--text-secondary)'}}>{rating || '—'}</span>
    </div>
  );

  return (
    <div className="animate-fade">
      <div className="page-header flex-between">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:40,height:40,borderRadius:10,background:'#4285f4',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Map size={22} color="#fff" />
          </div>
          <div><h1>Google Maps</h1><p style={{color:'var(--text-muted)',fontSize:13}}>Commerces détectés par zone</p></div>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
          <div style={{fontSize:12,color:'var(--text-muted)',background:'var(--bg-card)',padding:'6px 12px',borderRadius:8,border:'1px solid var(--border)'}}>
            {new Date().toLocaleDateString('fr-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Nouveau commerce</button>
        </div>
      </div>

      {/* FILTRES */}
      <div className="card" style={{ padding:16, marginBottom:20 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, minmax(0,1fr))', gap:10, marginBottom:10 }}>
          {[['nom','Nom commerce'],['telephone','Téléphone'],['email','Email']].map(([k,l])=>(
            <div key={k}>
              <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>{l}</div>
              <input style={inputSt} value={filters[k]} onChange={e=>setF(k,e.target.value)} />
            </div>
          ))}
          <div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>Ville</div>
            <select style={inputSt} value={filters.ville} onChange={e=>setF('ville',e.target.value)}>
              {VILLES.map(v=><option key={v} value={v}>{v||'Toutes'}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>Catégorie</div>
            <select style={inputSt} value={filters.categorie} onChange={e=>setF('categorie',e.target.value)}>
              {CATEGORIES.map(v=><option key={v} value={v}>{v||'Toutes'}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:10 }}>
          <div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>Statut</div>
            <select style={inputSt} value={filters.status} onChange={e=>setF('status',e.target.value)}>
              <option value="">Tous</option>
              {Object.entries(STATUS_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        {hasFilters && (
          <button onClick={()=>setFilters({ nom:'',telephone:'',email:'',ville:'',categorie:'',status:'' })}
            style={{ marginTop:10, fontSize:12, color:'var(--danger)', background:'none', border:'none', cursor:'pointer' }}>
            Effacer tous les filtres
          </button>
        )}
      </div>

      <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>
        {filtered.length} commerce{filtered.length!==1?'s':''} {hasFilters?'trouvé':'au total'}
      </div>

      {/* GRID CARDS */}
      {loading ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text-muted)'}}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Map size={40}/>
          <p>{hasFilters?'Aucun résultat':'Aucun commerce ajouté'}</p>
          <button className="btn btn-primary" onClick={openAdd} style={{marginTop:16}}><Plus size={14}/>Ajouter un commerce</button>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16}}>
          {filtered.map((p,i) => (
            <div key={p._id} className="card" onClick={()=>openDetail(p)}
              style={{padding:20,cursor:'pointer',transition:'transform 0.15s, box-shadow 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.15)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                <div className={`avatar ${AV[i%AV.length]}`} style={{width:44,height:44,fontSize:15,flexShrink:0}}>{ini(p)}</div>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:15,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.nom}</div>
                  {p.categorie && <div style={{fontSize:12,color:'var(--text-muted)'}}>{p.categorie}</div>}
                </div>
              </div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
                <span className={`badge ${STATUS_CLASS[p.status]||'badge-p2'}`}>{STATUS_LABELS[p.status]}</span>
                <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'#4285f415',color:'#4285f4'}}>Maps</span>
                {p.rating > 0 && <StarRating rating={p.rating} />}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:14}}>
                {p.ville && <span style={{fontSize:12,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:6}}><MapPin size={11}/>{p.adresse||p.ville}</span>}
                {p.telephone && <span style={{fontSize:12,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:6}}><Phone size={11}/>{p.telephone}</span>}
                {p.keyword && <span style={{fontSize:11,color:'var(--text-muted)'}}>Mot-clé: {p.keyword}</span>}
                {p.aiMessage && <span style={{fontSize:11,color:'var(--accent)',display:'flex',alignItems:'center',gap:4}}><Sparkles size={10}/>Message IA prêt</span>}
                {p.emailSent && <span style={{fontSize:11,color:'var(--success)'}}>✓ Email envoyé</span>}
              </div>
              <div style={{display:'flex',gap:6,borderTop:'1px solid var(--border)',paddingTop:12}} onClick={e=>e.stopPropagation()}>
                <button className="btn btn-sm" onClick={e=>handleGenerateAI(p,e)} title="Générer message IA" style={{flex:1,background:'rgba(59,108,248,0.1)',borderColor:'rgba(59,108,248,0.2)',color:'var(--accent)'}} disabled={aiLoading}><Sparkles size={12}/></button>
                <button className="btn btn-sm" onClick={e=>handleSendEmail(p,e)} title="Envoyer email" style={{flex:1,background:'rgba(18,183,106,0.1)',borderColor:'rgba(18,183,106,0.2)',color:'var(--success)'}}><Mail size={12}/></button>
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
                  <h2 style={{margin:0}}>{selected.nom}</h2>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>{selected.categorie||''} {selected.ville?`· ${selected.ville}`:''}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setModal(null)}><X size={16}/></button>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
              <span className={`badge ${STATUS_CLASS[selected.status]||'badge-p2'}`}>{STATUS_LABELS[selected.status]}</span>
              <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'#4285f415',color:'#4285f4'}}>Google Maps</span>
              {selected.rating > 0 && <span style={{fontSize:11,display:'flex',alignItems:'center',gap:3,padding:'2px 8px',borderRadius:20,background:'rgba(247,144,9,0.1)',color:'var(--warning)'}}><Star size={10} fill="currentColor"/>{selected.rating}/5</span>}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              {[['Téléphone',selected.telephone||'—'],['Email',selected.email||'—'],['Adresse',selected.adresse||'—'],['Ville',selected.ville||'—'],['Site web',selected.siteWeb||'—'],['Ajouté le',new Date(selected.createdAt).toLocaleDateString('fr-CA')]].map(([label,val])=>(
                <div key={label} style={{background:'var(--bg-secondary)',borderRadius:8,padding:'10px 12px'}}>
                  <div style={{fontSize:10,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',marginBottom:3}}>{label}</div>
                  <div style={{fontSize:13,color:'var(--text-primary)',wordBreak:'break-all'}}>{val}</div>
                </div>
              ))}
            </div>
            {selected.aiMessage && (
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',marginBottom:6,display:'flex',alignItems:'center',gap:6}}><Sparkles size={11} color="var(--accent)"/>Message IA</div>
                <div style={{background:'rgba(59,108,248,0.06)',border:'1px solid rgba(59,108,248,0.15)',borderRadius:8,padding:'10px 12px',fontSize:13,color:'var(--text-primary)',lineHeight:1.6}}>{selected.aiMessage}</div>
              </div>
            )}
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={e=>handleDelete(selected,e)}>Supprimer</button>
              <button className="btn" onClick={e=>openNotes(selected,e)}><MessageSquare size={13}/> Notes</button>
              <button className="btn" onClick={e=>handleGenerateAI(selected,e)} disabled={aiLoading}><Sparkles size={13}/> IA</button>
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
              <h2>{modal==='add'?'Nouveau commerce':'Modifier commerce'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={()=>setModal(null)}><X size={16}/></button>
            </div>
            <div className="form-grid">
              {[['nom','Nom du commerce','Restaurant Le Bouchon'],['telephone','Téléphone','514-555-0101'],['email','Email','contact@example.ca'],['adresse','Adresse','123 rue Saint-Denis'],['siteWeb','Site web','www.example.ca'],['keyword','Mot-clé recherche','restaurant Montréal']].map(([k,l,ph])=>(
                <div key={k} className="form-group"><label className="form-label">{l}</label><input className="input" placeholder={ph} value={form[k]||''} onChange={e=>set(k,e.target.value)} /></div>
              ))}
              <div className="form-group"><label className="form-label">Catégorie</label><select className="select" value={form.categorie} onChange={e=>set('categorie',e.target.value)}>{CATEGORIES.filter(v=>v).map(v=><option key={v}>{v}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Ville</label><select className="select" value={form.ville} onChange={e=>set('ville',e.target.value)}>{VILLES.filter(v=>v).map(v=><option key={v}>{v}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Statut</label><select className="select" value={form.status} onChange={e=>set('status',e.target.value)}>{Object.entries(STATUS_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Note Google (0-5)</label><input className="input" type="number" min="0" max="5" step="0.1" value={form.rating||0} onChange={e=>set('rating',parseFloat(e.target.value))} /></div>
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
              <h2>Notes — {selected.nom}</h2>
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
