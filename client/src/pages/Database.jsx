// ════════════════════════════════════════════════════════════════════════════
// client/src/pages/Database.jsx
// ════════════════════════════════════════════════════════════════════════════
// RESPONSIVE  : iPhone 12 Pro Max (430px) — breakpoint 768px
// DESIGN      : Header glassmorphism, tableau animé, storage card moderne
// ANIMATIONS  : fadeSlideUp, hover rows, AnimatedNumber, barre storage animée
// LOGIQUE     : Toutes les fonctionnalités originales intactes
// API         : GET /api/solution-express + GET /api/database/stats
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import {
  Trash2, Database as DbIcon, MapPin, HardDrive,
  Building2, Search, X, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

// ── Intercepteur JWT ──────────────────────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Hook responsive — breakpoint 768px ───────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT : AnimatedNumber
// Compte de 0 à la valeur avec easing cubique
// ════════════════════════════════════════════════════════════════════════════
function AnimatedNumber({ value, decimals = 0, color }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const end   = value || 0;
    prev.current = end;
    if (start === end) return;
    const duration  = 900;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * ease);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <span style={{ color }}>{display.toFixed(decimals)}</span>;
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════
const VILLES = [
  '','Montreal','Laval','Longueuil','Boucherville','Repentigny',
  'Vaudreuil-Dorion','Terrebonne','Saint-Jerome','Granby',
  'Trois-Rivieres','Drummondville','Victoriaville',
  'Ottawa','Gatineau','Ville de Quebec'
];

// Style de base pour les inputs filtres
const inputSt = {
  width:'100%', padding:'6px 10px', borderRadius:8,
  border:'1px solid var(--border)', background:'var(--bg-secondary)',
  color:'var(--text-primary)', fontSize:12,
  fontFamily:'var(--font-body)', outline:'none', transition:'border-color 0.2s'
};

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL : Database
// ════════════════════════════════════════════════════════════════════════════
export default function Database() {
  const isMobile = useIsMobile();

  // ── États ─────────────────────────────────────────────────────────────
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState(null);
  const [filters, setFilters] = useState({
    prenom:'', nom:'', email:'', telephone:'', entreprise:'', ville:''
  });
  const [showFilters, setShowFilters] = useState(true);

  // ── Fetch fiches Solution Express ─────────────────────────────────────
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const r = await api.get('/api/solution-express');
      setLeads(Array.isArray(r.data) ? r.data : []);
    } catch { setLeads([]); }
    finally { setLoading(false); }
  };

  // ── Fetch stats MongoDB ───────────────────────────────────────────────
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

  // ── Supprimer une fiche — logique originale intacte ───────────────────
  const handleDelete = async (item) => {
    if (!window.confirm("Supprimer ?")) return;
    try {
      await api.delete(`/api/solution-express/${item._id}`);
      setLeads(prev => prev.filter(l => l._id !== item._id));
      toast.success("Supprimé");
      fetchDbStats();
    } catch { toast.error("Erreur"); }
  };

  // ── Filtrage — logique originale intacte ──────────────────────────────
  const applyFilters = (list) => list.filter(item =>
    (item.prenom    ||'').toLowerCase().startsWith(filters.prenom.toLowerCase()) &&
    (item.nom       ||'').toLowerCase().startsWith(filters.nom.toLowerCase()) &&
    (item.email     ||'').toLowerCase().startsWith(filters.email.toLowerCase()) &&
    (item.telephone ||'').toLowerCase().startsWith(filters.telephone.toLowerCase()) &&
    (item.entreprise||'').toLowerCase().startsWith(filters.entreprise.toLowerCase()) &&
    (!filters.ville || item.ville === filters.ville)
  );

  const displayData = applyFilters(leads);
  const hasFilters  = Object.values(filters).some(v => v);

  // ── Couleur barre storage ─────────────────────────────────────────────
  const storageColor = !dbStats ? '#8b8b9e'
    : dbStats.storagePercent >= 80 ? '#f04438'
    : dbStats.storagePercent >= 50 ? '#f79009' : '#12b76a';

  // ── Style colonnes tableau ────────────────────────────────────────────
  const thStyle = { padding:'12px 16px', textAlign:'left', color:'var(--text-muted)', fontSize:11, fontWeight:600, background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)' };
  const tdStyle = { padding:'13px 16px', borderTop:'1px solid var(--border)', fontSize:13, color:'var(--text-primary)' };

  return (
    <div className="animate-fade">

      {/* ════════════════════════════════════════════════════════════════
          HEADER GLASSMORPHISM
          Gradient bleu + stats inline + date
          ════════════════════════════════════════════════════════════════ */}
      <div style={{
        background:'linear-gradient(135deg,rgba(59,108,248,0.1),rgba(18,183,106,0.06),rgba(59,108,248,0.04))',
        borderRadius:20, padding: isMobile?'18px 16px':'22px 28px',
        marginBottom:24, border:'1px solid rgba(59,108,248,0.18)',
        boxShadow:'0 8px 32px rgba(59,108,248,0.08)',
        backdropFilter:'blur(10px)',
        animation:'fadeSlideUp 0.4s ease both'
      }}>
        <div style={{ display:'flex', alignItems: isMobile?'flex-start':'center', justifyContent:'space-between', flexDirection: isMobile?'column':'row', gap: isMobile?12:0, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#3b6cf8,#12b76a)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 20px rgba(59,108,248,0.4)', flexShrink:0 }}>
              <DbIcon size={26} color="#fff"/>
            </div>
            <div>
              <h1 style={{ margin:0, fontSize: isMobile?20:24 }}>Base de Données</h1>
              <p style={{ color:'var(--text-muted)', fontSize:13, margin:0, marginTop:2 }}>
                Solution Express · <span style={{ color:'#12b76a', fontWeight:700 }}>{leads.length}</span> enregistrement{leads.length!==1?'s':''}
              </p>
            </div>
          </div>
          {!isMobile && (
            <div style={{ fontSize:12, color:'var(--text-muted)', background:'var(--bg-card)', padding:'6px 14px', borderRadius:8, border:'1px solid var(--border)' }}>
              {new Date().toLocaleDateString('fr-CA', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </div>
          )}
        </div>

        {/* Stats rapides */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(3,1fr)', gap:10 }}>
          {[
            { label:'Total fiches',   value:leads.length,                                                   color:'#3b6cf8' },
            { label:'Résultats',      value:displayData.length,                                             color:'#12b76a' },
            { label:'Filtrés',        value:leads.length - displayData.length,                              color:'#f79009' },
          ].map((s,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 14px', border:'1px solid rgba(255,255,255,0.08)', animation:`fadeSlideUp 0.4s ${i*0.05}s ease both` }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize: isMobile?18:22, fontWeight:800 }}>
                <AnimatedNumber value={s.value} decimals={0} color={s.color}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          STOCKAGE MONGODB — card moderne avec barre animée
          ════════════════════════════════════════════════════════════════ */}
      {dbStats && (
        <div style={{ background:'var(--bg-card)', borderRadius:16, padding: isMobile?'16px':'20px', marginBottom:24, border:'1px solid var(--border)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)', animation:'fadeSlideUp 0.4s 0.1s ease both' }}>

          {/* Header storage */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:`${storageColor}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <HardDrive size={18} color={storageColor}/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>Stockage MongoDB</div>
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>Free tier — 512 MB</div>
            </div>
            <div style={{ marginLeft:'auto', fontSize:20, fontWeight:800, color:storageColor }}>
              {dbStats.storagePercent}%
            </div>
          </div>

          {/* Barre de progression animée */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:12 }}>
              <span style={{ color:'var(--text-secondary)' }}>{dbStats.storageMB} MB utilisés</span>
              <span style={{ fontWeight:600, color:storageColor }}>{dbStats.storagePercent}% / 512 MB</span>
            </div>
            <div style={{ height:10, borderRadius:6, background:'var(--border)', overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:6,
                background:`linear-gradient(90deg,${storageColor},${storageColor}cc)`,
                width:`${dbStats.storagePercent}%`,
                transition:'width 1s ease',
                boxShadow:`0 0 8px ${storageColor}60`
              }}/>
            </div>
            {dbStats.storagePercent >= 80 && (
              <div style={{ fontSize:11, color:'#f04438', marginTop:8, background:'rgba(240,68,56,0.08)', padding:'6px 12px', borderRadius:8, border:'1px solid rgba(240,68,56,0.2)' }}>
                ⚠️ Stockage presque plein — supprime des données ou upgrade MongoDB
              </div>
            )}
          </div>

          {/* Compteur collection */}
          <div>
            <div style={{ background:'var(--bg-secondary)', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:12, transition:'transform 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
              <div style={{ width:38, height:38, borderRadius:10, background:'rgba(18,183,106,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Building2 size={18} color="#12b76a"/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.8 }}>Solution Express</div>
                <div style={{ fontSize:22, fontWeight:800, color:'#12b76a', lineHeight:1.2 }}>
                  <AnimatedNumber value={dbStats.collections?.solutionexpress || leads.length} decimals={0} color="#12b76a"/>
                </div>
              </div>
              <div style={{ fontSize:11, color:'var(--text-muted)', textAlign:'right' }}>
                <div style={{ fontWeight:600 }}>{dbStats.totalDocs} docs</div>
                <div>au total</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TABLEAU avec filtres inline
          Mobile : scroll horizontal / Desktop : tableau complet
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ background:'var(--bg-card)', borderRadius:16, overflow:'hidden', border:'1px solid var(--border)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)', animation:'fadeSlideUp 0.4s 0.15s ease both' }}>

        {/* Header tableau */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', background:'linear-gradient(135deg,rgba(59,108,248,0.06),transparent)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Filter size={13} color="var(--text-muted)"/>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>
              Tous les enregistrements
            </span>
            <span style={{ fontSize:11, background:'rgba(59,108,248,0.1)', color:'#3b6cf8', padding:'2px 10px', borderRadius:20, fontWeight:700 }}>
              {displayData.length} résultat{displayData.length!==1?'s':''}
            </span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {hasFilters && (
              <button
                onClick={() => setFilters({ prenom:'', nom:'', email:'', telephone:'', entreprise:'', ville:'' })}
                style={{ fontSize:11, color:'var(--danger)', background:'rgba(240,68,56,0.08)', border:'1px solid rgba(240,68,56,0.2)', borderRadius:20, padding:'4px 12px', cursor:'pointer', fontWeight:600, transition:'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(240,68,56,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(240,68,56,0.08)'}>
                ✕ Effacer filtres
              </button>
            )}
          </div>
        </div>

        {/* Tableau scrollable */}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth: isMobile?600:0 }}>
            <thead>
              <tr>
                {/* Filtre Prénom */}
                <th style={thStyle}>
                  <div style={{ fontSize:10, marginBottom:5, letterSpacing:0.8 }}>PRÉNOM</div>
                  <input style={inputSt} placeholder="Filtrer..." value={filters.prenom} onChange={e => setF('prenom', e.target.value)}
                    onFocus={e => e.target.style.borderColor='#3b6cf8'}
                    onBlur={e => e.target.style.borderColor='var(--border)'}/>
                </th>
                {/* Filtre Nom */}
                <th style={thStyle}>
                  <div style={{ fontSize:10, marginBottom:5, letterSpacing:0.8 }}>NOM</div>
                  <input style={inputSt} placeholder="Filtrer..." value={filters.nom} onChange={e => setF('nom', e.target.value)}
                    onFocus={e => e.target.style.borderColor='#3b6cf8'}
                    onBlur={e => e.target.style.borderColor='var(--border)'}/>
                </th>
                {/* Filtre Email */}
                <th style={thStyle}>
                  <div style={{ fontSize:10, marginBottom:5, letterSpacing:0.8 }}>EMAIL</div>
                  <input style={inputSt} placeholder="Filtrer..." value={filters.email} onChange={e => setF('email', e.target.value)}
                    onFocus={e => e.target.style.borderColor='#3b6cf8'}
                    onBlur={e => e.target.style.borderColor='var(--border)'}/>
                </th>
                {/* Filtre Téléphone */}
                <th style={thStyle}>
                  <div style={{ fontSize:10, marginBottom:5, letterSpacing:0.8 }}>TÉLÉPHONE</div>
                  <input style={inputSt} placeholder="Filtrer..." value={filters.telephone} onChange={e => setF('telephone', e.target.value)}
                    onFocus={e => e.target.style.borderColor='#3b6cf8'}
                    onBlur={e => e.target.style.borderColor='var(--border)'}/>
                </th>
                {/* Filtre Entreprise */}
                <th style={thStyle}>
                  <div style={{ fontSize:10, marginBottom:5, letterSpacing:0.8 }}>ENTREPRISE</div>
                  <input style={inputSt} placeholder="Filtrer..." value={filters.entreprise} onChange={e => setF('entreprise', e.target.value)}
                    onFocus={e => e.target.style.borderColor='#3b6cf8'}
                    onBlur={e => e.target.style.borderColor='var(--border)'}/>
                </th>
                {/* Filtre Ville */}
                <th style={thStyle}>
                  <div style={{ fontSize:10, marginBottom:5, letterSpacing:0.8 }}>VILLE</div>
                  <select style={inputSt} value={filters.ville} onChange={e => setF('ville', e.target.value)}>
                    {VILLES.map(v => <option key={v} value={v}>{v || 'Toutes'}</option>)}
                  </select>
                </th>
                {/* Actions */}
                <th style={{ ...thStyle, textAlign:'center' }}>
                  <div style={{ fontSize:10, marginBottom:5, letterSpacing:0.8 }}>ACTIONS</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                /* Loading state */
                <tr>
                  <td colSpan="7" style={{ padding:60, textAlign:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, color:'var(--text-muted)' }}>
                      <div style={{ width:24, height:24, border:'2px solid rgba(59,108,248,0.2)', borderTopColor:'#3b6cf8', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : displayData.length > 0 ? displayData.map((item, i) => (
                /* Rows avec animation fadeSlideUp décalée */
                <tr key={item._id}
                  style={{ transition:'background 0.15s', animation:`fadeSlideUp 0.3s ${Math.min(i*0.03,0.5)}s ease both` }}
                  onMouseEnter={e => { e.currentTarget.style.background='var(--bg-secondary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}>

                  {/* Prénom */}
                  <td style={tdStyle}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{item.prenom || '—'}</div>
                  </td>

                  {/* Nom */}
                  <td style={tdStyle}>
                    <div style={{ fontSize:13 }}>{item.nom || '—'}</div>
                  </td>

                  {/* Email */}
                  <td style={tdStyle}>
                    <div style={{ fontSize:12, color:'var(--text-secondary)', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {item.email || '—'}
                    </div>
                  </td>

                  {/* Téléphone */}
                  <td style={tdStyle}>
                    <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{item.telephone || '—'}</div>
                  </td>

                  {/* Entreprise */}
                  <td style={tdStyle}>
                    <div style={{ fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
                      {item.entreprise ? (
                        <>
                          <Building2 size={11} color="#12b76a"/>
                          <span style={{ color:'var(--text-primary)' }}>{item.entreprise}</span>
                        </>
                      ) : (
                        <span style={{ color:'var(--text-muted)' }}>Particulier</span>
                      )}
                    </div>
                  </td>

                  {/* Ville */}
                  <td style={tdStyle}>
                    <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--text-secondary)' }}>
                      <MapPin size={11} color="#3b6cf8"/>{item.ville || '—'}
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ ...tdStyle, textAlign:'center' }}>
                    <button
                      onClick={() => handleDelete(item)}
                      style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', margin:'0 auto' }}
                      onMouseEnter={e => { e.currentTarget.style.background='rgba(240,68,56,0.1)'; e.currentTarget.style.borderColor='rgba(240,68,56,0.4)'; e.currentTarget.style.color='#f04438'; e.currentTarget.style.transform='scale(1.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='var(--bg-secondary)'; e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.transform='scale(1)'; }}
                      title="Supprimer">
                      <Trash2 size={13} color="currentColor"/>
                    </button>
                  </td>
                </tr>
              )) : (
                /* État vide */
                <tr>
                  <td colSpan="7" style={{ padding:'48px 0', textAlign:'center', color:'var(--text-muted)' }}>
                    <div style={{ width:52, height:52, borderRadius:14, background:'rgba(59,108,248,0.06)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', border:'1px solid rgba(59,108,248,0.1)' }}>
                      <DbIcon size={24} color="#3b6cf8" style={{ opacity:0.4 }}/>
                    </div>
                    <div style={{ fontSize:14, fontWeight:600, color:'var(--text-secondary)', marginBottom:4 }}>
                      {hasFilters ? 'Aucun résultat' : 'Aucun enregistrement'}
                    </div>
                    <div style={{ fontSize:12 }}>
                      {hasFilters ? 'Modifie ou efface les filtres' : 'Ajoute des fiches dans Solution Express'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer tableau — compteur */}
        {displayData.length > 0 && (
          <div style={{ padding:'10px 20px', borderTop:'1px solid var(--border)', background:'var(--bg-secondary)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>
              <span style={{ fontWeight:700, color:'var(--text-primary)' }}>{displayData.length}</span> enregistrement{displayData.length!==1?'s':''} affichés sur <span style={{ fontWeight:700 }}>{leads.length}</span> au total
            </span>
            {hasFilters && (
              <span style={{ fontSize:11, background:'rgba(247,144,9,0.1)', color:'#f79009', padding:'2px 10px', borderRadius:20, fontWeight:600 }}>
                Filtres actifs
              </span>
            )}
          </div>
        )}
      </div>

      {/* Keyframes animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}
