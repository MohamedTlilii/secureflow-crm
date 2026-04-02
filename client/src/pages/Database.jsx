import { useState, useEffect } from 'react';
import { Trash2, Database as DbIcon, MapPin, HardDrive, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

api.interceptors.request.use(config => {
  const token = localStorage.getItem('sf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const VILLES = ['','Montreal','Laval','Longueuil','Boucherville','Repentigny','Vaudreuil-Dorion','Terrebonne','Saint-Jerome','Granby','Trois-Rivieres','Drummondville','Victoriaville','Ottawa','Gatineau','Ville de Quebec'];

export default function Database() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState(null);
  const [filters, setFilters] = useState({ prenom:'', nom:'', email:'', telephone:'', entreprise:'', ville:'' });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const r = await api.get('/api/solution-express');
      setLeads(Array.isArray(r.data) ? r.data : []);
    } catch { setLeads([]); }
    finally { setLoading(false); }
  };

  const fetchDbStats = async () => {
    try {
      const r = await api.get('/api/database/stats');
      setDbStats(r.data);
    } catch { setDbStats(null); }
  };

  useEffect(() => {
    fetchLeads();
    fetchDbStats();
  }, []);

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const handleDelete = async (item) => {
    if (!window.confirm("Supprimer ?")) return;
    try {
      await api.delete(`/api/solution-express/${item._id}`);
      setLeads(prev => prev.filter(l => l._id !== item._id));
      toast.success("Supprimé");
      fetchDbStats();
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

  const displayData = applyFilters(leads);

  const inputSt = { width:'100%', padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:13, fontFamily:'var(--font-body)', outline:'none' };
  const thStyle = { padding:'12px 16px', textAlign:'left', color:'var(--text-muted)', fontSize:11, fontWeight:600 };
  const tdStyle = { padding:'13px 16px', borderTop:'1px solid var(--border)' };

  const storageColor = !dbStats ? '#8b8b9e' :
    dbStats.storagePercent >= 80 ? '#f04438' :
    dbStats.storagePercent >= 50 ? '#f79009' : '#12b76a';

  return (
    <div className="animate-fade">
      <div className="page-header flex-between">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <DbIcon size={24} style={{ color:'var(--accent)' }} />
            <h1>Base de Données</h1>
          </div>
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)', background:'var(--bg-card)', padding:'6px 12px', borderRadius:8, border:'1px solid var(--border)' }}>
          {new Date().toLocaleDateString('fr-CA', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </div>
      </div>

      {/* ─── SECTION STOCKAGE MONGODB ─── */}
      {dbStats && (
        <div className="card" style={{ padding:20, marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <HardDrive size={18} color="var(--accent)" />
            <span style={{ fontSize:14, fontWeight:600 }}>Stockage MongoDB</span>
            <span style={{ fontSize:11, color:'var(--text-muted)', background:'var(--bg-hover)', padding:'2px 8px', borderRadius:20 }}>Free tier — 512 MB</span>
          </div>

          {/* Barre de progression */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:12, color:'var(--text-secondary)' }}>
                {dbStats.storageMB} MB utilisés
              </span>
              <span style={{ fontSize:12, fontWeight:600, color: storageColor }}>
                {dbStats.storagePercent}% / 512 MB
              </span>
            </div>
            <div style={{ height:10, borderRadius:6, background:'var(--border)', overflow:'hidden' }}>
              <div style={{
                height:'100%',
                borderRadius:6,
                background: storageColor,
                width: `${dbStats.storagePercent}%`,
                transition: 'width 0.5s ease'
              }} />
            </div>
            {dbStats.storagePercent >= 80 && (
              <div style={{ fontSize:11, color:'#f04438', marginTop:6 }}>
                ⚠️ Stockage presque plein — supprime des données ou upgrade MongoDB
              </div>
            )}
          </div>

          {/* Compteurs par collection */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(1, 1fr)', gap:12 }}>
            {[
              { label:'Solution Express', value: dbStats.collections?.solutionexpress || leads.length, icon: Building2, color:'#12b76a' },
            ].map((c, i) => (
              <div key={i} style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:8, background:`${c.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <c.icon size={16} color={c.color} />
                </div>
                <div>
                  <div style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', lineHeight:1 }}>{c.value}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:12, fontSize:11, color:'var(--text-muted)', textAlign:'right' }}>
            Total : {dbStats.totalDocs} documents
          </div>
        </div>
      )}

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
              <tr><td colSpan="7" style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>Chargement...</td></tr>
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
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => handleDelete(item)} className="btn btn-sm btn-danger" title="Supprimer">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="7" style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>
                {Object.values(filters).some(v=>v) ? 'Aucun résultat' : 'Aucun élément'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
