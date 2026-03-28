import { useState } from 'react';
import { Plus, X, Newspaper, AlertCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const EMPTY_PROSPECT = {
  prenom:'', nom:'', entreprise:'', type:'B2B', ville:'Montreal',
  telephone:'', email:'', linkedin:'', priorite:'P1',
  stage:'01_Inbox', signal:'ouverture', valeurEstimee:0, source:'google_alert'
};

const VILLES = ['Montreal','Laval','Longueuil','Boucherville','Repentigny','Vaudreuil-Dorion','Terrebonne','Saint-Jean-sur-Richelieu','Saint-Jerome','Granby','Trois-Rivieres','Drummondville','Victoriaville','Ottawa','Gatineau','Ville de Quebec'];
const SIGNALS = { ouverture:'Nouveau local',recrutement:'Recrutement','nouveau-poste':'Nouveau poste',expansion:'Expansion',commentaire:'Commentaire post',incident:'Incident',manuel:'Manuel' };
const SIGNAL_COLORS = { ouverture:'#12b76a', recrutement:'#3b6cf8', expansion:'#f79009', manuel:'#8b8b9e', incident:'#f04438', 'nouveau-poste':'#9b59b6', commentaire:'#1abc9c' };

export default function GoogleAlerts() {
  const [raw, setRaw] = useState('');
  const [cards, setCards] = useState([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addModal, setAddModal] = useState(null);
  const [form, setForm] = useState(EMPTY_PROSPECT);

  const analyzeWithGemini = async () => {
    if (!raw.trim()) { toast.error("Colle ton email Google Alert d'abord"); return; }
    setLoading(true);
    setCards([]);
    setAnalyzed(false);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_KEY;
      const prompt = `Tu es un assistant CRM pour une entreprise de securite (alarmes incendie, systemes de securite) qui prospecte des commerces au Quebec.

Analyse ce texte d'alerte Google et extrait UNIQUEMENT les resultats qui representent une vraie opportunite de vente (nouveau commerce, ouverture, demenagement, nouveau directeur, expansion, nouveau restaurant, nouveau garage, etc.).

Ignore les articles non pertinents (politique, sports, meteo, salons, evenements culturels, etc.).

Pour chaque opportunite trouvee, retourne un JSON array:
[
  {
    "titre": "Nom du commerce ou titre de l'article",
    "entreprise": "Nom de l'entreprise si detectable, sinon vide",
    "source": "Nom du media/site",
    "ville": "Ville detectee (Montreal par defaut)",
    "signal": "ouverture|recrutement|expansion|nouveau-poste|commentaire|incident|manuel",
    "resume": "1-2 phrases expliquant pourquoi c'est une opportunite de vendre un systeme de securite"
  }
]

Si aucune opportunite, retourne [].
Retourne UNIQUEMENT le JSON, rien d'autre, pas de markdown.

Texte a analyser:
${raw}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
          })
        }
      );

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

      let parsed = [];
      try {
        const clean = text.replace(/```json|```/g, '').trim();
        parsed = JSON.parse(clean);
      } catch {
        toast.error('Erreur parsing — reessaie');
        setLoading(false);
        return;
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        toast('Aucune opportunite detectee dans ce texte', { icon: '🔍' });
        setCards([]);
        setAnalyzed(true);
        setLoading(false);
        return;
      }

      setCards(parsed.map((c, i) => ({ ...c, id: i })));
      setAnalyzed(true);
      toast.success(`${parsed.length} opportunite${parsed.length > 1 ? 's' : ''} detectee${parsed.length > 1 ? 's' : ''} !`);
    } catch (err) {
      console.error(err);
      toast.error('Erreur API Gemini — verifie ta cle');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = (card) => {
    setForm({
      ...EMPTY_PROSPECT,
      entreprise: card.entreprise || card.titre || '',
      ville: card.ville || 'Montreal',
      signal: card.signal || 'ouverture',
      source: 'google_alert'
    });
    setAddModal(card);
  };

  const handleSubmit = async () => {
    try {
      await axios.post('/api/prospects', form);
      toast.success('Prospect ajoute !');
      setAddModal(null);
    } catch(err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="animate-fade">

      {/* HEADER */}
      <div className="page-header flex-between">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'white', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
            <svg width="22" height="22" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.96 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          </div>
          <div>
            <h1 style={{ margin:0 }}>Google Alerts</h1>
            <p style={{ margin:0, fontSize:12, color:'var(--text-muted)' }}>Analyse par Gemini AI — 1500 requetes/jour gratuites</p>
          </div>
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)', background:'var(--bg-card)', padding:'6px 12px', borderRadius:8, border:'1px solid var(--border)' }}>
          {new Date().toLocaleDateString('fr-CA', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </div>
      </div>

      {/* ZONE COLLER */}
      <div className="card" style={{ padding:20, marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>📋 Colle ton email Google Alert ici</div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>
          Gmail → copie le contenu de l'alerte → colle ici → Gemini detecte les vraies opportunites automatiquement
        </div>
        <textarea
          value={raw}
          onChange={e => { setRaw(e.target.value); setAnalyzed(false); setCards([]); }}
          placeholder="Colle ici le texte de ton alerte Google..."
          style={{ width:'100%', minHeight:160, padding:'12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:13, fontFamily:'var(--font-body)', outline:'none', resize:'vertical', boxSizing:'border-box' }}
        />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
          {raw && (
            <button onClick={() => { setRaw(''); setCards([]); setAnalyzed(false); }}
              style={{ fontSize:12, color:'var(--danger)', background:'none', border:'none', cursor:'pointer' }}>
              Effacer
            </button>
          )}
          <div style={{ flex:1 }} />
          <button className="btn btn-primary" onClick={analyzeWithGemini} disabled={loading} style={{ gap:8 }}>
            {loading ? (
              <>
                <div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                Gemini analyse...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Analyser avec Gemini AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* RÉSULTATS */}
      {analyzed && (
        <>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>
            {cards.length} opportunite{cards.length !== 1 ? 's' : ''} detectee{cards.length !== 1 ? 's' : ''} par Gemini
          </div>
          {cards.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={40} />
              <p>Aucune opportunite detectee dans ce texte</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
              {cards.map((card) => (
                <div key={card.id} className="card"
                  style={{ padding:20, transition:'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <Newspaper size={12} color="var(--text-muted)" />
                      <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>{card.source}</span>
                    </div>
                    <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:`${SIGNAL_COLORS[card.signal]||'#8b8b9e'}20`, color:SIGNAL_COLORS[card.signal]||'#8b8b9e' }}>
                      {SIGNALS[card.signal]||card.signal}
                    </span>
                  </div>

                  <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', marginBottom:8, lineHeight:1.4 }}>
                    {card.titre}
                  </div>

                  {card.entreprise && (
                    <div style={{ fontSize:12, color:'var(--accent)', fontWeight:500, marginBottom:6 }}>
                      🏢 {card.entreprise}
                    </div>
                  )}

                  {card.resume && (
                    <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:12, lineHeight:1.5, background:'var(--bg-secondary)', padding:'8px 10px', borderRadius:8, borderLeft:'3px solid var(--accent)' }}>
                      {card.resume}
                    </div>
                  )}

                  <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:14 }}>📍 {card.ville}</div>

                  <div style={{ borderTop:'1px solid var(--border)', paddingTop:12 }}>
                    <button className="btn btn-primary btn-sm" style={{ width:'100%', justifyContent:'center' }} onClick={() => openAdd(card)}>
                      <Plus size={12} /> Ajouter comme prospect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* MODAL */}
      {addModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setAddModal(null); }}>
          <div className="modal">
            <div className="modal-header">
              <h2>Nouveau prospect</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setAddModal(null)}><X size={16} /></button>
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16, background:'var(--bg-secondary)', padding:'8px 12px', borderRadius:8 }}>
              📰 {addModal.titre?.substring(0, 80)}
            </div>
            <div className="form-grid">
              {[['prenom','Prénom','Marc'],['nom','Nom','Tremblay'],['entreprise','Entreprise','Garage...'],['telephone','Téléphone','514-555-0101'],['email','Email','marc@example.ca']].map(([k,l,ph]) => (
                <div key={k} className="form-group">
                  <label className="form-label">{l}</label>
                  <input className="input" placeholder={ph} value={form[k]} onChange={e => set(k, e.target.value)} />
                </div>
              ))}
              <div className="form-group"><label className="form-label">Type</label>
                <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
                  <option>B2B</option><option>B2C</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Ville</label>
                <select className="select" value={form.ville} onChange={e => set('ville', e.target.value)}>
                  {VILLES.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Priorité</label>
                <select className="select" value={form.priorite} onChange={e => set('priorite', e.target.value)}>
                  <option value="P0">P0 — Urgent</option>
                  <option value="P1">P1 — Intéressé</option>
                  <option value="P2">P2 — Tiède</option>
                  <option value="P3">P3 — Froid</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Signal</label>
                <select className="select" value={form.signal} onChange={e => set('signal', e.target.value)}>
                  {Object.entries(SIGNALS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setAddModal(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
