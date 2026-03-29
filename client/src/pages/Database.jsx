import { useState, useEffect } from 'react';
import { BookmarkCheck, Trash2, Database as DbIcon, MapPin, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const VILLES = ['','Montreal','Laval','Longueuil','Boucherville','Repentigny','Vaudreuil-Dorion','Terrebonne','Saint-Jerome','Granby','Trois-Rivieres','Drummondville','Victoriaville','Ottawa','Gatineau','Ville de Quebec'];

export default function Database() {
  const [tab, setTab] = useState('leads');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ prenom:'', nom:'', email:'', telephone:'', entreprise:'', ville:'' });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const [linkedin, alerts, maps] = await Promise.all([
        axios.get('/api/linkedin'),
        axios.get('/api/google-alerts'),
        axios.get('/api/google-maps')
      ]);
      const all = [
        ...(Array.isArray(linkedin.data) ? linkedin.data.map(l => ({...l, _source:'linkedin'})) : []),
        ...(Array.isArray(alerts.data) ? alerts.data.map(l => ({...l, _source:'google-alerts'})) : []),
        ...(Array.isArray(maps.data) ? maps.data.map(l => ({...l, _source:'google-maps'})) : []),
      ];
      setLeads(all);
    } catch { setLeads([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeads(); }, []);

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const handleSauvegarder = async (item) => {
    try {
      await axios.put(`/api/linkedin/${item._id}`, { status: 'saved' });
      toast.success(`${item.prenom} ${item.nom} → Sauvegardé !`);
      fetchLeads();
    } catch { toast.error("Erreur"); }
  };

  const handleBackToLead = async (item) => {
    try {
      await axios.put(`/api/linkedin/${item._id}`, { status: 'new' });
      toast.success(`Remis en Lead`);
      fetchLeads();
    } catch { toast.error("Erreur"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ?")) return;
    try {
      await axios.delete(`/api/linkedin/${id}`);
      setLeads(prev => prev.filter(l => l._id !== id));
      toast.success("Supprimé");
    } catch { toast.error("Erreur"); }
  };

  const applyFilters = (list) => list.filter(item =>
    (item.prenom||'').toLowerCase().startsWith(filters.prenom.toLowerCase()) &&
    (item.nom||'').toLowerCase().startsWith(filters.nom.toLowerCase()) &&
    (item.email||'').toLowerCase().startsWith(filters.email.toLowerCase()) &&
    (item.telephone||'').toLowerCase().startsWith(filters.telephone.toLowerCase()) &&
    (item.entreprise||'').toLowerCase().startsWith(filters.entreprise.toLowerCase()) &&
    (!filters.ville || item.ville === filters.ville)
  );

  const allLeads = leads.filter(l => l.status !== 'saved' && l.status !== 'ignored');
  const savedList = leads.filter(l => l.status === 'saved');
  const displayData = applyFilters(tab === 'leads' ? allLeads : savedList);

  const inputSt = { width:'100%', padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:13, fontFamily:'var(--font-body)', outline:'none' };
  const thStyle = { padding:'12px 16px', textAlign:'left', color:'var(--text-muted)', fontSize:11, fontWeight:600 };
  const tdStyle = { padding:'13px 16px', borderTop:'1px solid var(--border)' };

  return (
    <div className="animate-fade">
      <div className="page-header flex-between">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <DbIcon size={24} style={{ color:'var(--accent)' }} />
            <h1>Base de Données</h1>
          </div>
          <p>Leads LinkedIn actifs et sauvegardés</p>
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)', background:'var(--bg-card)', padding:'6px 12px', borderRadius:8, border:'1px solid var(--border)' }}>
          {new Date().toLocaleDateString('fr-CA', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </div>
      </div>

      {/* ONGLETS */}
      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        <button onClick={() => setTab('leads')} style={{
          padding:'9px 18px', cursor:'pointer', borderRadius:8, fontSize:13, fontWeight:500,
          fontFamily:'var(--font-body)', border: tab==='leads' ? 'none' : '1px solid var(--border)',
          background: tab==='leads' ? 'var(--accent)' : 'var(--bg-card)',
          color: tab==='leads' ? '#fff' : 'var(--text-secondary)'
        }}>
          Leads ({allLeads.length})
        </button>
        <button onClick={() => setTab('saved')} style={{
          padding:'9px 18px', cursor:'pointer', borderRadius:8, fontSize:13, fontWeight:500,
          fontFamily:'var(--font-body)', border: tab==='saved' ? 'none' : '1px solid var(--border)',
          background: tab==='saved' ? '#12b76a' : 'var(--bg-card)',
          color: tab==='saved' ? '#fff' : 'var(--text-secondary)',
          display:'flex', alignItems:'center', gap:6
        }}>
          <BookmarkCheck size={13} /> Sauvegardés ({savedList.length})
        </button>
      </div>

      {/* TABLEAU */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead style={{ background:'var(--bg-hover)' }}>
  <tr>
    <th style={thStyle}>
      <div style={{ fontSize:10, marginBottom:4 }}>PRÉNOM</div>
      <input style={inputSt} placeholder="a, b..." value={filters.prenom} onChange={e => setF('prenom', e.target.value)} />
    </th>
    <th style={thStyle}>
      <div style={{ fontSize:10, marginBottom:4 }}>NOM</div>
      <input style={inputSt} placeholder="a, b..." value={filters.nom} onChange={e => setF('nom', e.target.value)} />
    </th>
    <th style={thStyle}>
      <div style={{ fontSize:10, marginBottom:4 }}>EMAIL</div>
      <input style={inputSt} placeholder="a, b..." value={filters.email} onChange={e => setF('email', e.target.value)} />
    </th>
    <th style={thStyle}>
      <div style={{ fontSize:10, marginBottom:4 }}>TÉLÉPHONE</div>
      <input style={inputSt} placeholder="5, 4..." value={filters.telephone} onChange={e => setF('telephone', e.target.value)} />
    </th>
    <th style={thStyle}>
      <div style={{ fontSize:10, marginBottom:4 }}>ENTREPRISE</div>
      <input style={inputSt} placeholder="a, b..." value={filters.entreprise} onChange={e => setF('entreprise', e.target.value)} />
    </th>
    <th style={thStyle}>
      <div style={{ fontSize:10, marginBottom:4 }}>VILLE</div>
      <select style={inputSt} value={filters.ville} onChange={e => setF('ville', e.target.value)}>
        {VILLES.map(v => <option key={v} value={v}>{v || 'Toutes'}</option>)}
      </select>
    </th>
    <th style={thStyle}>
      <div style={{ fontSize:10, marginBottom:4 }}>SOURCE</div>
    </th>
    <th style={thStyle}>
      <div style={{ fontSize:10, marginBottom:4 }}>ACTIONS</div>
      {Object.values(filters).some(v => v) && (
        <button onClick={() => setFilters({ prenom:'', nom:'', email:'', telephone:'', entreprise:'', ville:'' })}
          style={{ fontSize:11, color:'var(--danger)', background:'none', border:'none', cursor:'pointer' }}>
          Effacer
        </button>
      )}
    </th>
  </tr>
</thead>
          <tbody>
  {loading ? (
    <tr><td colSpan="8" style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>Chargement...</td></tr>
  ) : displayData.length > 0 ? displayData.map(item => (
    <tr key={item._id}
      onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
      <td style={tdStyle}><div style={{ fontWeight:600, fontSize:13 }}>{item.prenom || '---'}</div></td>
      <td style={tdStyle}><div style={{ fontSize:13 }}>{item.nom || '---'}</div></td>
      <td style={tdStyle}><div style={{ fontSize:12, color:'var(--text-secondary)' }}>{item.email || '---'}</div></td>
      <td style={tdStyle}><div style={{ fontSize:12, color:'var(--text-secondary)' }}>{item.telephone || '---'}</div></td>
      <td style={tdStyle}><div style={{ fontSize:12 }}>{item.entreprise || 'Particulier'}</div></td>
      <td style={tdStyle}>
        <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--text-secondary)' }}>
          <MapPin size={11} />{item.ville || '---'}
        </div>
      </td>
      <td style={tdStyle}>
        {item._source === 'linkedin' && <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'#0077b515',color:'#0077b5'}}>LinkedIn</span>}
        {item._source === 'google-alerts' && <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'#ea433515',color:'#ea4335'}}>G. Alert</span>}
        {item._source === 'google-maps' && <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'#850e5a15',color:'#42f466'}}>G. Maps</span>}
      </td>
      <td style={tdStyle}>
        <div style={{ display:'flex', gap:6 }}>
          {tab === 'leads' && (
            <button onClick={() => handleSauvegarder(item)} className="btn btn-sm" title="Sauvegarder"
              style={{ background:'rgba(18,183,106,0.1)', borderColor:'rgba(18,183,106,0.2)', color:'#12b76a' }}>
              <BookmarkCheck size={13} />
            </button>
          )}
          {tab === 'saved' && (
            <button onClick={() => handleBackToLead(item)} className="btn btn-sm" title="Remettre en Lead"
              style={{ background:'rgba(59,108,248,0.1)', borderColor:'rgba(59,108,248,0.2)', color:'var(--accent)' }}>
              <ArrowLeft size={13} />
            </button>
          )}
          <button onClick={() => handleDelete(item)} className="btn btn-sm btn-danger" title="Supprimer">
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  )) : (
    <tr><td colSpan="8" style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>
      {Object.values(filters).some(v=>v) ? 'Aucun résultat' : 'Aucun élément'}
    </td></tr>
  )}
</tbody>
        </table>
      </div>
    </div>
  );
}