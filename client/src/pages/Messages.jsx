import { useState } from 'react';
import { Copy, Check, MessageSquare, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const VILLES = ['Montreal','Laval','Longueuil','Boucherville','Repentigny','Terrebonne','Saint-Jerome','Granby','Trois-Rivieres','Drummondville','Victoriaville','Ottawa','Gatineau','Ville de Quebec'];

const TYPES_BUSINESS = [
  { value:'restaurant', label:'Restaurant / Café' },
  { value:'commerce', label:'Commerce / Boutique' },
  { value:'bureau', label:'Bureau / Entreprise' },
  { value:'entrepot', label:'Entrepôt / Industrie' },
  { value:'pharmacie', label:'Pharmacie / Clinique' },
  { value:'residence', label:'Résidence / Condo' },
  { value:'maison', label:'Maison individuelle' },
];

const SIGNAUX = [
  { value:'ouverture', label:'Nouveau local ouvert' },
  { value:'recrutement', label:'Recrutement de staff' },
  { value:'nouveau-poste', label:'Nouveau poste / Direction' },
  { value:'expansion', label:'Expansion d\'entreprise' },
  { value:'commentaire', label:'Commenté post sécurité' },
  { value:'incident', label:'Mentionné un incident' },
];

const TEMPLATES = [
  { key:'intro', label:'Premier contact' },
  { key:'followup', label:'Relance (pas de réponse)' },
  { key:'rdv', label:'Prise de rendez-vous' },
  { key:'b2c', label:'B2C — Particulier' },
];

const QUICK = [
  { label:'Après un incident dans le quartier', msg:'Salut [Prénom], j\'ai vu qu\'il y a eu quelques incidents dans votre secteur ces derniers temps. Vous êtes bien protégés ? Notre système relié à la centrale ULC, les forces de l\'ordre arrivent en 10-15 min max. Ça vaut 5 min pour en parler ?' },
  { label:'Email relance #2', msg:'Bonjour [Prénom], suite à mon message de lundi — je voulais partager qu\'un client similaire dans votre secteur vient de nous confier sa sécurité. Résultat : 0 incident en 6 mois, tranquillité totale. Disponible cette semaine pour une démo rapide ?' },
  { label:'Après la démo — Closing', msg:'Bonjour [Prénom], merci pour notre appel. Comme convenu : protection complète incendie/vol/urgence médicale, centrale ULC certifiée, gestion depuis votre cell. On peut planifier l\'installation dès cette semaine si vous confirmez. Quelle date vous convient ?' },
  { label:'Réactivation — Client inactif', msg:'Salut [Prénom], ça fait un moment ! J\'ai vu que vous avez ouvert un nouveau local. Votre système actuel couvre bien les deux sites ? On a de nouvelles options depuis l\'app — ça vaut un petit appel de 10 min.' },
  { label:'Séquence B2C — Bracelet panique', msg:'Bonjour [Prénom], saviez-vous qu\'avec notre bracelet panique, en cas d\'urgence médicale ou d\'intrusion, la centrale appelle police/ambulance en quelques minutes ? Tout se gère depuis votre téléphone. Je peux vous montrer comment ça fonctionne ?' },
];

function generateMessage(form) {
  const { prenom, typeB, ville, signal, template } = form;
  const p = prenom || '[Prénom]';
  const v = ville || '[Ville]';
  const tl = { restaurant:'votre restaurant', commerce:'votre commerce', bureau:'votre bureau', entrepot:'votre entrepôt', pharmacie:'votre pharmacie', residence:'votre résidence', maison:'votre maison' }[typeB] || 'votre établissement';
  const sl = {
    ouverture:`j'ai vu que vous venez d'ouvrir ${tl} à ${v}`,
    recrutement:`j'ai remarqué que vous recrutez du staff pour ${tl}`,
    'nouveau-poste':`félicitations pour votre nouveau rôle`,
    expansion:`j'ai vu que vous êtes en pleine expansion à ${v}`,
    commentaire:`j'ai vu votre commentaire sur la sécurité`,
    incident:`j'ai appris qu'il y a eu un incident récent`
  }[signal] || `je voulais vous contacter au sujet de ${tl} à ${v}`;

  if (template === 'intro') {
    if (typeB === 'maison' || typeB === 'residence')
      return `Salut ${p}, ${sl} — vous avez déjà une protection reliée à une centrale ULC certifiée Canada ? On a des solutions smart home avec bracelet panique, serrure intelligente et alertes directes. C'est quoi votre plus grande préoccupation en ce moment ?`;
    return `Salut ${p}, ${sl} — vous avez déjà un système de protection incendie/vol connecté à une centrale certifiée ULC ? Avec gestion du staff et alertes sur votre cell en temps réel. 5 minutes cette semaine pour qu'on en parle ?`;
  }
  if (template === 'followup')
    return `Salut ${p}, tu as eu le temps de voir mon message ? J'ai justement aidé un ${tl.replace('votre ','')} similaire à ${v} à sécuriser son local avec notre système central ULC — on devrait en parler.`;
  if (template === 'rdv')
    return `${p}, on vient justement de résoudre ça pour un client similaire à ${v}. Je peux t'envoyer une vidéo de 3 minutes qui montre comment ? Si tu veux qu'on discute de ta situation, je suis libre mardi ou jeudi.`;
  if (template === 'b2c')
    return `Salut ${p}, ${sl} — vous saviez qu'avec notre système, en cas d'urgence médicale ou de vol, la centrale appelle police/ambulance en moins de 10-15 min ? Avec bracelet panique et tout depuis votre cell. Ça vous intéresse qu'on en parle ?`;
  return '';
}

export default function Messages() {
  const [form, setForm] = useState({ prenom:'', typeB:'commerce', ville:'Montreal', signal:'ouverture', template:'intro' });
  const [copied, setCopied] = useState(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const msg = generateMessage(form);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      toast.success('Copié !');
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    
  <div className="animate-fade">
      <div className="page-header flex-between">
        <div>
        <h1>Générateur de messages</h1>
        <p>Créez des messages LinkedIn personnalisés pour votre prospection</p>
        </div>
        <div style={{fontSize:12,color:'var(--text-muted)',background:'var(--bg-card)',padding:'6px 12px',borderRadius:8,border:'1px solid var(--border)'}}>
          {new Date().toLocaleDateString('fr-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </div>
      </div>
      <div className="grid-2">
        {/* Générateur */}
        <div>
          <div className="card mb-4">
            <h3 style={{fontSize:15,marginBottom:16}}>Personnalisation</h3>
            <div className="form-group">
              <label className="form-label">Prénom du prospect</label>
              <input className="input" placeholder="Marc" value={form.prenom} onChange={e=>set('prenom',e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Type de business</label>
              <select className="select" value={form.typeB} onChange={e=>set('typeB',e.target.value)}>
                {TYPES_BUSINESS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Ville</label>
              <select className="select" value={form.ville} onChange={e=>set('ville',e.target.value)}>
                {VILLES.map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Signal détecté</label>
              <select className="select" value={form.signal} onChange={e=>set('signal',e.target.value)}>
                {SIGNAUX.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Type de message</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {TEMPLATES.map(t=>(
                  <button key={t.key} onClick={()=>set('template',t.key)} style={{
                    padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:500,border:'1px solid',cursor:'pointer',
                    background: form.template===t.key ? 'var(--accent)' : 'var(--bg-secondary)',
                    borderColor: form.template===t.key ? 'var(--accent)' : 'var(--border)',
                    color: form.template===t.key ? '#fff' : 'var(--text-secondary)',
                    fontFamily:'var(--font-body)'
                  }}>{t.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Message généré */}
          <div className="card">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <h3 style={{fontSize:14,display:'flex',alignItems:'center',gap:6}}><MessageSquare size={14} color="var(--accent)"/>Message généré</h3>
              <button className="btn btn-sm" onClick={()=>copy(msg,'main')} style={{gap:5}}>
                {copied==='main' ? <><Check size={12}/>Copié</> : <><Copy size={12}/>Copier</>}
              </button>
            </div>
            <div style={{background:'var(--bg-secondary)',borderRadius:8,padding:14,fontSize:13,lineHeight:1.7,color:'var(--text-primary)',minHeight:80,border:'1px solid var(--border)'}}>
              {msg || <span style={{color:'var(--text-muted)'}}>Remplissez les champs pour générer...</span>}
            </div>
            <div style={{fontSize:11,color:'var(--text-muted)',marginTop:8}}>{msg.length} caractères · {msg.split(' ').filter(Boolean).length} mots</div>
          </div>
        </div>

        {/* Templates rapides */}
        <div>
          <div className="card">
            <h3 style={{fontSize:15,marginBottom:16}}>Templates rapides</h3>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {QUICK.map((t,i) => (
                <div key={i} style={{background:'var(--bg-secondary)',borderRadius:10,padding:14,border:'1px solid var(--border)'}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,marginBottom:8}}>
                    <span style={{fontSize:12,fontWeight:600,color:'var(--text-primary)'}}>{t.label}</span>
                    <button className="btn btn-sm" onClick={()=>copy(t.msg,`q${i}`)} style={{flexShrink:0,gap:4}}>
                      {copied===`q${i}` ? <><Check size={11}/>Copié</> : <><Copy size={11}/>Copier</>}
                    </button>
                  </div>
                  <p style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.6}}>{t.msg}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
