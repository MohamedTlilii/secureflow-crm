import { useState, useEffect } from 'react';
import { Search, Save, User, Building2, Phone, Mail, MapPin, Trash2, Database as DbIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios'; 
export default function Database() {
  const [tab, setTab] = useState('leads'); 
  const [leads, setLeads] = useState([]); 
  const [loading, setLoading] = useState(true);

  // État pour le formulaire de recherche et d'ajout
  const [clientForm, setClientForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    societe: '',
    ville: '',
    statut: 'prospect'
  });

 // 2. Modifie la fonction fetchLeads
const fetchLeads = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('sf_token'); 

    if (!token) {
      console.error("Aucun token trouvé");
      return;
    }

    const response = await fetch('http://localhost:5000/api/prospects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok && Array.isArray(data)) {
      setLeads(data);
    } else {
      setLeads([]);
    }
  } catch (error) {
    console.error("Erreur de connexion :", error);
    setLeads([]);
  } finally {
    setLoading(false);
  }
};

// 3. Modifie la fonction handleSave
const handleSave = async () => {
  if (!clientForm.nom) return toast.error("Le nom est obligatoire");
  try {
    // ✅ Utilise axios.post
    const response = await axios.post('/api/prospects', clientForm);
    if (response.status === 200 || response.status === 201) {
      toast.success("Enregistré !");
      setClientForm({ nom: '', email: '', telephone: '', societe: '', ville: '', statut: 'prospect' });
      fetchLeads();
    }
  } catch (error) {
    toast.error("Erreur de sauvegarde");
  }
};


  // 3. SUPPRESSION
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce lead ?")) return;
    try {
      const response = await fetch(`/api/prospects/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setLeads(prev => prev.filter(l => l._id !== id));
        toast.success("Supprimé");
      }
    } catch (error) {
      toast.error("Erreur suppression");
    }
  };

  // Filtrage pour le tableau
  const filteredData = leads.filter(item => {
    const matchesTab = tab === 'clients' ? item.statut === 'gagné' : true;
    const search = clientForm.nom.toLowerCase();
    return matchesTab && (
      (item.nom || "").toLowerCase().includes(search) || 
      (item.ville || "").toLowerCase().includes(search)
    );
  });

  
  useEffect(() => {
  fetchLeads();
}, []);



  return (
    <div className="animate-fade">
      {/* HEADER */}
      <div className="page-header flex-between">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <DbIcon size={24} style={{ color: 'var(--accent)' }} />
            <h1>Base de Données</h1>
          </div>
          <p>Gestion de vos leads et clients</p>
        </div>
        <div className="date-badge" style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
          {new Date().toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* RECHERCHE */}
      <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          <input type="text" placeholder="Nom" value={clientForm.nom} onChange={e => setClientForm({...clientForm, nom: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Tél" value={clientForm.telephone} onChange={e => setClientForm({...clientForm, telephone: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Société" value={clientForm.societe} onChange={e => setClientForm({...clientForm, societe: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Ville" value={clientForm.ville} onChange={e => setClientForm({...clientForm, ville: e.target.value})} style={inputStyle} />
          <button onClick={handleSave} className="btn btn-primary"><Save size={18} /> Sauver</button>
        </div>
      </div>

      {/* ONGLETS */}
      <div className="tabs" style={{ display: 'flex', gap: 20, marginBottom: '20px', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => setTab('leads')} style={{ ...tabStyle, color: tab === 'leads' ? 'var(--accent)' : 'var(--text-muted)', borderBottom: tab === 'leads' ? '2px solid var(--accent)' : '2px solid transparent' }}>Leads</button>
        <button onClick={() => setTab('clients')} style={{ ...tabStyle, color: tab === 'clients' ? 'var(--accent)' : 'var(--text-muted)', borderBottom: tab === 'clients' ? '2px solid var(--accent)' : '2px solid transparent' }}>Clients Gagnés</button>
      </div>

      {/* TABLEAU */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--bg-hover)', fontSize: '12px' }}>
            <tr>
              <th style={thStyle}>NOM</th>
              <th style={thStyle}>VILLE</th>
              <th style={thStyle}>CONTACT</th>
              <th style={thStyle}>STATUT</th>
              <th style={thStyle}>ACTION</th>
            </tr>
          </thead>
        <tbody>
  {loading ? (
    <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Connexion à MongoDB...</td></tr>
  ) : filteredData.length > 0 ? (
    filteredData.map(item => (
      <tr key={item._id} style={{ borderTop: '1px solid var(--border)' }}>
        {/* NOM & ENTREPRISE (Comme sur le Dashboard) */}
        <td style={tdStyle}>
          <div style={{ fontWeight: 600 }}>{item.prenom} {item.nom}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {item.entreprise || item.societe || 'Particulier'}
          </div>
        </td>

        {/* VILLE */}
        <td style={tdStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '13px' }}>
            <MapPin size={12} color="var(--text-muted)" />
            {item.ville || '---'}
          </div>
        </td>

        {/* CONTACT */}
        <td style={tdStyle}>
          <div style={{ fontSize: '12px' }}>{item.email || '---'}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.telephone || '---'}</div>
        </td>

        {/* STATUT (Badge dynamique) */}
        <td style={tdStyle}>
          <span className={`badge ${item.stage === '04_Closed' || item.statut === 'gagné' ? 'badge-success' : 'badge-info'}`}>
            {item.stage ? item.stage.split('_')[1] : (item.statut || 'LEAD')}
          </span>
        </td>

        {/* ACTIONS */}
        <td style={tdStyle}>
          <button 
            onClick={() => handleDelete(item._id)} 
            className="btn-ghost" 
            style={{ color: 'var(--danger)', cursor: 'pointer' }}
          >
            <Trash2 size={16}/>
          </button>
        </td>
      </tr>
    ))
  ) : (
    <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Aucun prospect trouvé dans la base</td></tr>
  )}
</tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'white' };
const tabStyle = { padding: '10px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 };
const thStyle = { padding: '15px', textAlign: 'left', color: 'var(--text-muted)' };
const tdStyle = { padding: '15px' };
