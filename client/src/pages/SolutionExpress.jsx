// ════════════════════════════════════════════════════════════════════════════
// client/src/pages/SolutionExpress.jsx
// ════════════════════════════════════════════════════════════════════════════
// RESPONSIVE  : iPhone 12 Pro Max (430px) — breakpoint 768px
// DESIGN      : Header glassmorphism, cards animées, filtres modernes
// ANIMATIONS  : fadeSlideUp cards, hover glow, AnimatedNumber, ScoreRing mini
// LOGIQUE     : Toutes les fonctionnalités originales intactes
// API         : GET/POST/PUT/DELETE /api/solution-express
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api';
import {
  Plus, MapPin, Phone, X, Edit2, Trash2,
  AlertTriangle, Mail, Calendar, Clock, Tag, Search,
  User, Building2, Shield, Wifi, Video, Smartphone,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, FileText, Lock,
  DollarSign, CheckCircle, XCircle, TrendingUp, Filter, Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Intercepteur JWT ──────────────────────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ════════════════════════════════════════════════════════════════════════════
// HOOK : useIsMobile — breakpoint 768px pour responsive iPhone
// ════════════════════════════════════════════════════════════════════════════
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
// Compte de 0 à la valeur avec easing cubique (900ms)
// ════════════════════════════════════════════════════════════════════════════
function AnimatedNumber({ value, decimals = 0, suffix = '', color }) {
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
  return <span style={{ color }}>{display.toFixed(decimals)}{suffix}</span>;
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT : MiniScoreRing
// Petit anneau SVG pour afficher le score d'urgence sur les cards
// ════════════════════════════════════════════════════════════════════════════
function MiniScoreRing({ score, size = 32 }) {
  const [animated, setAnimated] = useState(0);
  const r    = (size / 2) - 3;
  const circ = 2 * Math.PI * r;
  const pct  = score / 10;
  const color = score >= 7 ? '#f04438' : score >= 4 ? '#f79009' : '#12b76a';

  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 100);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={3}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${circ * animated} ${circ}`} strokeLinecap="round"
          style={{ transition:'stroke-dasharray 0.8s ease' }}/>
      </svg>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:10, fontWeight:800, color }}>{score}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT : DatePicker moderne avec calendrier
// ════════════════════════════════════════════════════════════════════════════
function DatePicker({ value, onChange, placeholder = 'Sélectionner une date' }) {
  const [open, setOpen] = useState(false);
  const today    = new Date();
  const initDate = value ? new Date(value + 'T12:00:00') : today;
  const [current, setCurrent] = useState({ year: initDate.getFullYear(), month: initDate.getMonth() });

  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const firstDay    = new Date(current.year, current.month, 1).getDay();
  const offset      = firstDay === 0 ? 6 : firstDay - 1;
  const monthName   = new Date(current.year, current.month).toLocaleDateString('fr-CA', { month:'long', year:'numeric' });
  const days        = ['L','M','M','J','V','S','D'];

  const prevM = () => setCurrent(c => ({ year: c.month===0?c.year-1:c.year, month: c.month===0?11:c.month-1 }));
  const nextM = () => setCurrent(c => ({ year: c.month===11?c.year+1:c.year, month: c.month===11?0:c.month+1 }));

  const selectDay = (day) => {
    const y = current.year, m = String(current.month+1).padStart(2,'0'), d = String(day).padStart(2,'0');
    onChange(`${y}-${m}-${d}`);
    setOpen(false);
  };

  const displayValue = value ? new Date(value + 'T12:00:00').toLocaleDateString('fr-CA', { day:'numeric', month:'long', year:'numeric' }) : '';

  return (
    <div style={{ position:'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', color: value ? 'var(--text-primary)' : 'var(--text-muted)', fontSize:13, textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:8, transition:'border-color 0.15s' }}
        onFocus={e => e.currentTarget.style.borderColor='#12b76a'}
        onBlur={e => e.currentTarget.style.borderColor='var(--border)'}>
        <Calendar size={14} color={value ? '#12b76a' : 'var(--text-muted)'}/>
        {displayValue || placeholder}
        {value && <button type="button" onClick={e => { e.stopPropagation(); onChange(''); }} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:0, fontSize:14, lineHeight:1 }}>×</button>}
      </button>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:1000, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.2)', padding:14, minWidth:260 }}>
          {/* Navigation mois */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <button type="button" onClick={prevM} style={{ width:28, height:28, borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-secondary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>
              <ChevronLeft size={14}/>
            </button>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', textTransform:'capitalize' }}>{monthName}</span>
            <button type="button" onClick={nextM} style={{ width:28, height:28, borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-secondary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>
              <ChevronRight size={14}/>
            </button>
          </div>
          {/* Jours semaine */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
            {days.map((d,i) => <div key={i} style={{ textAlign:'center', fontSize:9, color:'var(--text-muted)', fontWeight:700, padding:'3px 0' }}>{d}</div>)}
          </div>
          {/* Grille jours */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
            {Array(offset).fill(null).map((_,i) => <div key={`e${i}`}/>)}
            {Array(daysInMonth).fill(null).map((_,i) => {
              const day     = i + 1;
              const y       = current.year, m = String(current.month+1).padStart(2,'0'), d = String(day).padStart(2,'0');
              const dateStr = `${y}-${m}-${d}`;
              const isSel   = value === dateStr;
              const isToday = new Date(current.year, current.month, day).toDateString() === today.toDateString();
              return (
                <button key={day} type="button" onClick={() => selectDay(day)}
                  style={{ padding:'5px 2px', borderRadius:6, border:'none', cursor:'pointer', textAlign:'center', fontSize:12, fontWeight: isSel||isToday?700:400, transition:'all 0.1s',
                    background: isSel ? '#12b76a' : isToday ? 'rgba(59,108,248,0.1)' : 'transparent',
                    color: isSel ? '#fff' : isToday ? '#3b6cf8' : 'var(--text-primary)' }}
                  onMouseEnter={e => { if(!isSel) e.currentTarget.style.background='var(--bg-secondary)'; }}
                  onMouseLeave={e => { if(!isSel) e.currentTarget.style.background=isToday?'rgba(59,108,248,0.1)':'transparent'; }}>
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES — labels, couleurs, options
// ════════════════════════════════════════════════════════════════════════════
const AV_COLORS = ['av-blue','av-teal','av-amber','av-coral','av-purple'];

const VILLES = [
  '','Montreal','Laval','Longueuil','Boucherville','Repentigny',
  'Vaudreuil-Dorion','Terrebonne','Saint-Jean-sur-Richelieu',
  'Saint-Jerome','Saint-Sauveur','Salaberry-de-Valleyfield',
  'Sorel-Tracy','Granby','Trois-Rivieres','Shawinigan',
  'Louiseville','Drummondville','Victoriaville',
  'Ottawa','Gatineau','Ville de Quebec'
];

const TYPE_COMMERCE_LABELS = {
  restaurant:'Restaurant', pizzeria:'Pizzeria', boulangerie:'Boulangerie',
  traiteur:'Traiteur', cafe:'Café', bar_resto:'Bar / Resto',
  salon_coiffure:'Salon coiffure', esthetique:'Esthétique', spa:'Spa',
  massotherapie:'Massothérapie', barbier:'Barbier',
  garage_auto:'Garage auto', carrosserie:'Carrosserie', esthetique_auto:'Esthétique auto',
  lave_auto:'Lave-auto', pneus:'Pneus', concessionnaire:'Concessionnaire',
  clinique_dentaire:'Clinique dentaire', clinique_privee:'Clinique privée',
  pharmacie:'Pharmacie', optometrie:'Optométrie', cabinet_infirmier:'Cabinet infirmier',
  boutique:'Boutique', epicerie:'Épicerie', boucherie:'Boucherie',
  librairie:'Librairie', quincaillerie:'Quincaillerie',
  bureau:'Bureau', cabinet_comptable:'Cabinet comptable', agence:'Agence',
  assurance:'Assurance', immobilier:'Immobilier',
  garderie:'Garderie', ecole_privee:'École privée', centre_formation:'Centre formation',
  gym:'Gym', centre_sportif:'Centre sportif', studio_yoga:'Studio yoga',
  entrepot:'Entrepôt', transport:'Transport', manufacture:'Manufacture', construction:'Construction',
  veterinaire:'Vétérinaire', animalerie:'Animalerie', autre:'Autre'
};

const STATUS_LABELS = {
  new:'Nouveau', contacted:'Contacté', interested:'Intéressé',
  proposal:'Soumission', won:'Gagné', lost:'Perdu', ignored:'Ignoré'
};
const STATUS_CLASS = {
  new:'badge-p0', contacted:'badge-p1', interested:'badge-p2',
  proposal:'badge-p3', won:'badge-won', lost:'badge-dead', ignored:'badge-dead'
};
const STATUS_COLORS = {
  new:'#3b6cf8', contacted:'#f79009', interested:'#12b76a',
  proposal:'#a764f8', won:'#12b76a', lost:'#f04438', ignored:'#8b8b9e'
};

const LEAD_TYPES = {
  nouvelle_entreprise:'Nouvelle entreprise', demenagement:'Déménagement',
  reouverture:'Réouverture', commerce_existant:'Commerce existant', autre:'Autre'
};
const LEAD_COLORS = {
  nouvelle_entreprise:'#12b76a', demenagement:'#0077b5',
  reouverture:'#f79009', commerce_existant:'#a764f8', autre:'#8b8b9e'
};

const QUALIF_LABELS = {
  pas_de_systeme:'Pas de système', systeme_plus_10_ans:'Système +10 ans',
  systeme_non_connecte_nouveau_proprio:'Non connecté (nouveau proprio)',
  systeme_non_connecte_insatisfait:'Non connecté (insatisfait)',
  systeme_non_connecte_diy:'Non connecté (DIY)',
  systeme_moins_5_ans_avec_contrat:'-5 ans avec contrat',
  systeme_moins_5_ans_sans_contrat:'-5 ans sans contrat',
  systeme_5_10_ans_panneau_tactile:'5-10 ans panneau tactile',
  systeme_5_10_ans_panneau_boutons:'5-10 ans panneau boutons',
  inconnu:'Inconnu'
};

const PRODUIT_LABELS = { alarme:'Alarme', cameras:'Caméras', internet:'Internet', mobile:'Mobile', controle_acces:'Contrôle accès', autre:'Autre' };
const PRODUIT_COLORS = { alarme:'#f04438', cameras:'#a764f8', internet:'#3b6cf8', mobile:'#12b76a', controle_acces:'#f79009', autre:'#8b8b9e' };
const PRODUIT_ICONS  = { alarme:Shield, cameras:Video, internet:Wifi, mobile:Smartphone, controle_acces:Shield, autre:Tag };

const FOURN_ALARME = {
  adt:'ADT', bell_alarme:'Bell Alarme', telus_alarme:'Telus Alarme',
  gardaworld:'GardaWorld', api_alarm:'API Alarm', securitas:'Securitas',
  alarme_mirabel:'Alarme Mirabel', alarme_signal_teck:'Signal Teck', allo_alarme:'AlloAlarme',
  protection_incendie_laval:'Protection Incendie Laval', multialarme:'MultiAlarme', alarme_expert:'Alarme Expert',
  autre:'Autre', inconnu:'Inconnu', aucun:'Aucun'
};
const FOURN_INTERNET = {
  videotron:'Vidéotron', bell_internet:'Bell Internet', cogeco:'Cogeco',
  distributel:'Distributel', teksavvy:'TekSavvy', ebox:'EBox',
  autre:'Autre', inconnu:'Inconnu', aucun:'Aucun'
};
const FOURN_MOBILE = {
  bell_mobile:'Bell Mobile', telus_mobile:'Telus Mobile', rogers:'Rogers',
  fizz:'Fizz', koodo:'Koodo', public_mobile:'Public Mobile',
  fido:'Fido', chatr:'Chatr', virgin_plus:'Virgin Plus',
  autre:'Autre', inconnu:'Inconnu', aucun:'Aucun'
};

const EMPTY_FORM = {
  sourceText:'', sourceUrl:'',
  entreprise:'', typeCommerce:'autre', typeClient:'b2b',
  ancienneAdresse:'',
  prenom:'', nom:'', sexe:'inconnu', telephone:'', email:'',
  adresse:'', ville:'Montreal', region:'',
  leadType:'nouvelle_entreprise',
  qualificationSysteme:'inconnu',
  produits:[],
  fournisseurAlarme:'inconnu', fournisseurInternet:'inconnu', fournisseurMobile:'inconnu',
  fournisseurProposeAlarme:'aucun', fournisseurProposeInternet:'aucun', fournisseurProposeMobile:'aucun',
  status:'new', urgencyScore:0, summary:'',
  commissionFixe:0, commissionExtra:0,
  commissionTotale:0, commissionPayee:false,
  dateVente:'', datePaiementCommission:'',
};

const EMPTY_FILTERS = {
  status:'', typeClient:'', typeCommerce:'', ville:'',
  produit:'', qualificationSysteme:'', leadType:'',
  fournisseurAlarme:'', fournisseurInternet:'', fournisseurMobile:'',
  commissionPayee:''
};

// Style de base pour les inputs
const iSt = {
  width:'100%', padding:'7px 10px', borderRadius:8,
  border:'1px solid var(--border)', background:'var(--bg-secondary)',
  color:'var(--text-primary)', fontSize:13,
  fontFamily:'var(--font-body)', outline:'none', boxSizing:'border-box'
};

// ════════════════════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS UI
// ════════════════════════════════════════════════════════════════════════════

// Section dans l'ultra-fiche avec titre uppercase
function FicheSection({ title, children }) {
  return (
    <div style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'14px 16px' }}>
      <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>{title}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>{children}</div>
    </div>
  );
}

// Ligne d'info avec icône dans l'ultra-fiche
function InfoRow({ icon, label, val }) {
  if (!val || val === 'inconnu' || val === 'aucun') return null;
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
      <span style={{ color:'var(--text-muted)', marginTop:2, flexShrink:0 }}>{icon}</span>
      <div>
        <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase' }}>{label}</div>
        <div style={{ fontSize:13, color:'var(--text-primary)', wordBreak:'break-word' }}>{val}</div>
      </div>
    </div>
  );
}

// Badge produit coloré avec icône
function ProduitBadge({ code }) {
  const Icon  = PRODUIT_ICONS[code]  || Tag;
  const color = PRODUIT_COLORS[code] || '#8b8b9e';
  return (
    <span style={{ fontSize:10, fontWeight:600, padding:'3px 9px', borderRadius:20, background:`${color}18`, color, display:'inline-flex', alignItems:'center', gap:4, border:`1px solid ${color}30` }}>
      <Icon size={9}/> {PRODUIT_LABELS[code]}
    </span>
  );
}

function getFournLabel(field, val) {
  if (!val || val === 'inconnu' || val === 'aucun') return null;
  if (field === 'alarme')   return FOURN_ALARME[val]   || val;
  if (field === 'internet') return FOURN_INTERNET[val] || val;
  if (field === 'mobile')   return FOURN_MOBILE[val]   || val;
  return val;
}

// Ligne fournisseur actuel → proposé
function FournisseurRow({ icon, color, label, actuel, propose }) {
  if (!actuel && !propose) return null;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, transition:'transform 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.transform='translateX(3px)'}
      onMouseLeave={e => e.currentTarget.style.transform='translateX(0)'}>
      <span style={{ flexShrink:0 }}>{icon}</span>
      <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', minWidth:52 }}>{label}</span>
      {actuel  && <span style={{ fontSize:12, color:'var(--text-primary)', background:'var(--bg-secondary)', padding:'2px 8px', borderRadius:6 }}>{actuel}</span>}
      {actuel && propose && <span style={{ fontSize:12, color:'var(--text-muted)' }}>→</span>}
      {propose && <span style={{ fontSize:12, color, background:`${color}15`, padding:'2px 8px', borderRadius:6, fontWeight:600 }}>{propose}</span>}
    </div>
  );
}

// ── Badge commission sur la card — pulse si en attente ────────────────────
function CommissionBadge({ fiche, onToggle }) {
  if (!fiche.commissionTotale && !fiche.commissionFixe && !fiche.commissionExtra) return null;
  const montant = fiche.commissionTotale || 0;
  const payee   = fiche.commissionPayee;
  return (
    <div
      onClick={e => { e.stopPropagation(); onToggle(fiche); }}
      style={{
        display:'flex', alignItems:'center', gap:6,
        background: payee ? 'rgba(18,183,106,0.1)' : 'rgba(247,144,9,0.08)',
        border: `1px solid ${payee ? '#12b76a' : '#f79009'}40`,
        borderRadius:10, padding:'7px 12px', cursor:'pointer',
        transition:'all 0.2s', marginTop:8,
        // Pulse animation si non payée
        animation: !payee ? 'commPulse 2.5s ease-in-out infinite' : 'none'
      }}
      onMouseEnter={e => { e.currentTarget.style.transform='scale(1.02)'; e.currentTarget.style.boxShadow=`0 3px 12px ${payee?'rgba(18,183,106,0.2)':'rgba(247,144,9,0.2)'}`; }}
      onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none'; }}
      title={payee ? 'Cliquer pour marquer Non payée' : 'Cliquer pour marquer Payée'}
    >
      <Wallet size={13} color={payee ? '#12b76a' : '#f79009'}/>
      <span style={{ fontSize:12, fontWeight:700, color: payee ? '#12b76a' : '#f79009' }}>
        {montant.toFixed(2)} TND
      </span>
      <span style={{ fontSize:10, fontWeight:600, color: payee ? '#12b76a' : '#f79009', marginLeft:2 }}>
        {payee ? '✓ Payée' : '⏳'}
      </span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL : SolutionExpress
// ════════════════════════════════════════════════════════════════════════════
export default function SolutionExpress() {
  const isMobile = useIsMobile();

  // ── États ─────────────────────────────────────────────────────────────
  const [fiches, setFiches]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filters, setFilters]         = useState(EMPTY_FILTERS);
  const [sortBy, setSortBy]           = useState('date_desc');
  const [showFilters, setShowFilters] = useState(!false); // ouvert par défaut desktop
  const [modal, setModal]             = useState(null);
  const [selected, setSelected]       = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [noteText, setNoteText]       = useState('');
  const [activeTab, setActiveTab]     = useState(0);
  const [searchFocused, setSearchFocused] = useState(false); // pour glow focus

  // ── Fetch toutes les fiches ───────────────────────────────────────────
  const fetchFiches = useCallback(async () => {
    try {
      const r = await api.get('/api/solution-express');
      setFiches(r.data);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFiches(); }, [fetchFiches]);

  // ── Helpers ───────────────────────────────────────────────────────────
  const setF    = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const setFld  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const ini     = p => ((p.prenom?.[0] || p.entreprise?.[0] || 'S')).toUpperCase();
  const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-CA', { year:'numeric', month:'short', day:'numeric' }) : '—';
  const hasFilters = Object.values(filters).some(v => v !== '');
  const dernNote   = p => p.notes?.length > 0 ? p.notes[p.notes.length - 1] : null;

  // ── Toggle produit dans le formulaire ────────────────────────────────
  const toggleProduit = (code) => {
    const list = form.produits || [];
    setFld('produits', list.includes(code) ? list.filter(x => x !== code) : [...list, code]);
  };

  // ── Toggle payé/non payé depuis la card ──────────────────────────────
  const togglePaiement = async (p) => {
    try {
      const updated = {
        ...p,
        commissionPayee: !p.commissionPayee,
        datePaiementCommission: !p.commissionPayee ? new Date().toISOString() : null,
        stage: undefined, source: undefined, displayName: undefined
      };
      await api.put(`/api/solution-express/${p._id}`, updated);
      toast.success(!p.commissionPayee ? '✓ Commission marquée payée !' : 'Commission marquée non payée');
      fetchFiches();
      if (selected?._id === p._id) {
        setSelected(prev => ({ ...prev, commissionPayee: !p.commissionPayee, datePaiementCommission: updated.datePaiementCommission }));
      }
    } catch { toast.error('Erreur mise à jour commission'); }
  };

  // ── Filtrage + recherche ──────────────────────────────────────────────
  const afterSearch = fiches.filter(p => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (p.entreprise||'').toLowerCase().includes(s) ||
      (p.prenom    ||'').toLowerCase().includes(s) ||
      (p.nom       ||'').toLowerCase().includes(s) ||
      (p.telephone ||'').toLowerCase().includes(s) ||
      (p.email     ||'').toLowerCase().includes(s) ||
      (p.ville     ||'').toLowerCase().includes(s)
    );
  });

  const filtered = afterSearch.filter(p => {
    if (filters.status               && p.status               !== filters.status)               return false;
    if (filters.typeClient           && p.typeClient            !== filters.typeClient)           return false;
    if (filters.typeCommerce         && p.typeCommerce          !== filters.typeCommerce)         return false;
    if (filters.ville                && p.ville                 !== filters.ville)               return false;
    if (filters.leadType             && p.leadType              !== filters.leadType)             return false;
    if (filters.qualificationSysteme && p.qualificationSysteme !== filters.qualificationSysteme) return false;
    if (filters.produit              && !(p.produits||[]).includes(filters.produit))              return false;
    if (filters.fournisseurAlarme    && p.fournisseurAlarme    !== filters.fournisseurAlarme)    return false;
    if (filters.fournisseurInternet  && p.fournisseurInternet  !== filters.fournisseurInternet)  return false;
    if (filters.fournisseurMobile    && p.fournisseurMobile    !== filters.fournisseurMobile)    return false;
    if (filters.commissionPayee === 'payee'     && !p.commissionPayee)  return false;
    if (filters.commissionPayee === 'non_payee' && p.commissionPayee)   return false;
    if (filters.commissionPayee === 'avec'      && !p.commissionTotale) return false;
    return true;
  });

  // ── Tri ───────────────────────────────────────────────────────────────
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'date_desc':       return new Date(b.createdAt) - new Date(a.createdAt);
      case 'date_asc':        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'urgency_desc':    return b.urgencyScore - a.urgencyScore;
      case 'commission_desc': return (b.commissionTotale||0) - (a.commissionTotale||0);
      case 'entreprise':      return (a.entreprise||'').localeCompare(b.entreprise||'');
      case 'status':          return (a.status||'').localeCompare(b.status||'');
      default:                return 0;
    }
  });

  // ── Stats pour le header glassmorphism ────────────────────────────────
  const totalFiches  = fiches.length;
  const totalGagnes  = fiches.filter(f => f.status === 'won').length;
  const totalPipeline = fiches.filter(f => ['contacted','interested','proposal'].includes(f.status)).length;
  const convRate     = totalFiches > 0 ? Math.round((totalGagnes / totalFiches) * 100) : 0;

  // ── Ouvrir modals ─────────────────────────────────────────────────────
  const openAdd   = ()     => { setForm(EMPTY_FORM); setActiveTab(0); setModal('add'); };
  const openEdit  = (p, e) => { if(e) e.stopPropagation(); setForm({...p}); setSelected(p); setActiveTab(0); setModal('edit'); };
  const openFiche = (p, e) => { if(e) e.stopPropagation(); setSelected(p); setModal('fiche'); };

  // ── Soumettre formulaire add/edit ─────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        commissionTotale: (parseFloat(form.commissionFixe)||0) + (parseFloat(form.commissionExtra)||0)
      };
      if (modal === 'add') { await api.post('/api/solution-express', payload); toast.success('Fiche ajoutée !'); }
      else { await api.put(`/api/solution-express/${selected._id}`, payload); toast.success('Mis à jour !'); }
      setModal(null); fetchFiches();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  // ── Supprimer fiche ───────────────────────────────────────────────────
  const handleDelete = async (p, e) => {
    if(e) e.stopPropagation();
    if (!confirm('Supprimer cette fiche ?')) return;
    try { await api.delete(`/api/solution-express/${p._id}`); toast.success('Supprimé'); setModal(null); fetchFiches(); }
    catch { toast.error('Erreur suppression'); }
  };

  // ── Ajouter note ──────────────────────────────────────────────────────
  const addNote = async (p) => {
    if (!noteText.trim()) return;
    try {
      const updatedNotes = [...(p.notes||[]), noteText.trim()];
      await api.put(`/api/solution-express/${p._id}`, { ...p, notes: updatedNotes });
      toast.success('Note ajoutée ✓');
      setNoteText('');
      setSelected(prev => ({ ...prev, notes: updatedNotes }));
      fetchFiches();
    } catch { toast.error('Erreur note'); }
  };

  // ── Supprimer note ────────────────────────────────────────────────────
  const deleteNote = async (p, idx) => {
    if (!confirm('Supprimer cette note ?')) return;
    try {
      const updatedNotes = (p.notes||[]).filter((_,i) => i !== idx);
      await api.put(`/api/solution-express/${p._id}`, { ...p, notes: updatedNotes });
      toast.success('Note supprimée');
      setSelected(prev => ({ ...prev, notes: updatedNotes }));
      fetchFiches();
    } catch { toast.error('Erreur suppression note'); }
  };

  // ── Changer statut depuis l'ultra-fiche ───────────────────────────────
  const changeStatus = async (p, newStatus) => {
    try {
      await api.put(`/api/solution-express/${p._id}`, { ...p, status: newStatus });
      setSelected(prev => ({ ...prev, status: newStatus }));
      fetchFiches(); toast.success('Statut mis à jour');
    } catch { toast.error('Erreur statut'); }
  };

  // ── Onglets du formulaire ─────────────────────────────────────────────
  const TABS = [
    { label:'👤 Contact',    icon: User      },
    { label:'🏢 Entreprise', icon: Building2 },
    { label:'🔒 Système',   icon: Lock       },
    { label:'💰 Commission', icon: DollarSign },
    { label:'📝 Résumé',    icon: FileText   },
  ];

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="animate-fade">

      {/* ════════════════════════════════════════════════════════════════
          HEADER GLASSMORPHISM
          Gradient vert + stats inline + barre conversion
          ════════════════════════════════════════════════════════════════ */}
      <div style={{
        background:'linear-gradient(135deg,rgba(18,183,106,0.1),rgba(59,108,248,0.06),rgba(18,183,106,0.04))',
        borderRadius:20, padding: isMobile ? '18px 16px' : '22px 28px',
        marginBottom:24, border:'1px solid rgba(18,183,106,0.18)',
        boxShadow:'0 8px 32px rgba(18,183,106,0.1)',
        backdropFilter:'blur(10px)',
        animation:'fadeSlideUp 0.4s ease both'
      }}>
        {/* Ligne 1 : Icône + Titre + Bouton nouveau */}
        <div style={{ display:'flex', alignItems: isMobile?'flex-start':'center', justifyContent:'space-between', flexDirection: isMobile?'column':'row', gap: isMobile?12:0, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#12b76a,#0e9558)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 20px rgba(18,183,106,0.4)', flexShrink:0 }}>
              <Building2 size={26} color="#fff"/>
            </div>
            <div>
              <h1 style={{ margin:0, fontSize: isMobile?20:24 }}>Solution Express</h1>
              <p style={{ color:'var(--text-muted)', fontSize:13, margin:0, marginTop:2 }}>
                CRM personnel · <span style={{ color:'#12b76a', fontWeight:700 }}>{totalFiches}</span> fiche{totalFiches!==1?'s':''}
              </p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={openAdd}
            style={{ display:'flex', alignItems:'center', gap:8, padding: isMobile?'9px 16px':'10px 20px', fontSize:13, fontWeight:700, borderRadius:12, boxShadow:'0 4px 14px rgba(18,183,106,0.35)', transition:'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
            <Plus size={16}/> Nouvelle fiche
          </button>
        </div>

        {/* Ligne 2 : Stats rapides + barre conversion */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(4,1fr)', gap:10, marginBottom:16 }}>
          {[
            { label:'Total',    value:totalFiches,   color:'#12b76a', suffix:' fiches' },
            { label:'Gagnés',   value:totalGagnes,   color:'#12b76a', suffix:'' },
            { label:'Pipeline', value:totalPipeline, color:'#f79009', suffix:'' },
            { label:'Conversion',value:convRate,     color:'#3b6cf8', suffix:'%' },
          ].map((s,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 14px', border:'1px solid rgba(255,255,255,0.08)', animation:`fadeSlideUp 0.4s ${i*0.05}s ease both` }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize: isMobile?18:22, fontWeight:800 }}>
                <AnimatedNumber value={s.value} decimals={0} suffix={s.suffix} color={s.color}/>
              </div>
            </div>
          ))}
        </div>

        {/* Barre de conversion animée */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:11, color:'var(--text-muted)' }}>
            <span>Taux de conversion</span>
            <span style={{ fontWeight:700, color:'#12b76a' }}>{convRate}%</span>
          </div>
          <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:3, background:'linear-gradient(90deg,#12b76a,#3b6cf8)', width:`${convRate}%`, transition:'width 1.2s ease' }}/>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          FILTRES — glassmorphism subtil
          Mobile : caché par défaut / Desktop : visible par défaut
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ background:'var(--bg-card)', borderRadius:16, padding:14, marginBottom:20, border:'1px solid var(--border)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: showFilters ? 14 : 0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Filter size={13} color="var(--text-muted)"/>
            <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8 }}>Filtres</span>
            {hasFilters && (
              <span style={{ fontSize:10, background:'rgba(18,183,106,0.1)', color:'#12b76a', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>
                Actifs
              </span>
            )}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {hasFilters && (
              <button onClick={() => setFilters(EMPTY_FILTERS)}
                style={{ fontSize:11, color:'var(--danger)', background:'rgba(240,68,56,0.08)', border:'1px solid rgba(240,68,56,0.2)', borderRadius:20, padding:'3px 10px', cursor:'pointer', fontWeight:600 }}>
                ✕ Effacer
              </button>
            )}
            <button onClick={() => setShowFilters(s => !s)}
              style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer', color:'var(--text-muted)', padding:'5px 8px', display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600 }}>
              {showFilters ? <><ChevronUp size={14}/> Cacher</> : <><ChevronDown size={14}/> Afficher</>}
            </button>
          </div>
        </div>

        {/* Contenu filtres — animé à l'ouverture */}
        {showFilters && (
          <div style={{ animation:'fadeSlideUp 0.2s ease both' }}>
            {/* Ligne 1 — 5 filtres principaux */}
            <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(5,minmax(0,1fr))', gap:10, marginBottom:10 }}>
              {[
                ['status',    'Statut',      STATUS_LABELS],
                ['typeClient','Type client', {'b2b':'🏢 B2B','b2c':'🏠 B2C'}],
                ['leadType',  'Type lead',   LEAD_TYPES],
                ['ville',     'Ville',       Object.fromEntries(VILLES.filter(v=>v).map(v=>[v,v]))],
              ].map(([k, l, opts]) => (
                <div key={k}>
                  <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>{l}</div>
                  <select style={iSt} value={filters[k]} onChange={e => setF(k, e.target.value)}>
                    <option value="">Tous</option>
                    {Object.entries(opts).map(([ov,ol]) => <option key={ov} value={ov}>{ol}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>Trier par</div>
                <select style={iSt} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="date_desc">Date ↓ récent</option>
                  <option value="date_asc">Date ↑ ancien</option>
                  <option value="urgency_desc">Urgence ↓</option>
                  <option value="commission_desc">Commission ↓</option>
                  <option value="entreprise">Entreprise A-Z</option>
                  <option value="status">Statut</option>
                </select>
              </div>
            </div>

            {/* Ligne 2 — 4 filtres secondaires */}
            <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(4,minmax(0,1fr))', gap:10, marginBottom:10 }}>
              <div>
                <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>Type commerce</div>
                <select style={iSt} value={filters.typeCommerce} onChange={e => setF('typeCommerce', e.target.value)}>
                  <option value="">Tous</option>
                  {Object.entries(TYPE_COMMERCE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>Produit</div>
                <select style={iSt} value={filters.produit} onChange={e => setF('produit', e.target.value)}>
                  <option value="">Tous</option>
                  {Object.entries(PRODUIT_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>Qualification</div>
                <select style={iSt} value={filters.qualificationSysteme} onChange={e => setF('qualificationSysteme', e.target.value)}>
                  <option value="">Toutes</option>
                  {Object.entries(QUALIF_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:10, color:'#12b76a', marginBottom:4, fontWeight:700, textTransform:'uppercase', display:'flex', alignItems:'center', gap:4 }}>
                  <Wallet size={10}/> Commission
                </div>
                <select style={iSt} value={filters.commissionPayee} onChange={e => setF('commissionPayee', e.target.value)}>
                  <option value="">Toutes</option>
                  <option value="avec">Avec commission</option>
                  <option value="payee">✓ Payées</option>
                  <option value="non_payee">⏳ En attente</option>
                </select>
              </div>
            </div>

            {/* Ligne 3 — fournisseurs */}
            <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(3,minmax(0,1fr))', gap:10 }}>
              {[
                ['fournisseurAlarme',   <Shield size={10} color="#f04438"/>,     'Fournisseur alarme',   FOURN_ALARME  ],
                ['fournisseurInternet', <Wifi size={10} color="#3b6cf8"/>,       'Fournisseur internet', FOURN_INTERNET],
                ['fournisseurMobile',   <Smartphone size={10} color="#12b76a"/>,'Fournisseur mobile',   FOURN_MOBILE  ],
              ].map(([k, icon, label, opts]) => (
                <div key={k}>
                  <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase', display:'flex', alignItems:'center', gap:5 }}>
                    {icon} {label}
                  </div>
                  <select style={iSt} value={filters[k]} onChange={e => setF(k, e.target.value)}>
                    <option value="">Tous</option>
                    {Object.entries(opts).map(([ov,ol]) => <option key={ov} value={ov}>{ol}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          BARRE DE RECHERCHE — glow vert au focus
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ position:'relative', marginBottom:16 }}>
        <Search size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color: searchFocused ? '#12b76a' : 'var(--text-muted)', transition:'color 0.2s' }}/>
        <input
          style={{ ...iSt, paddingLeft:40, paddingRight:search?40:14, fontSize:14, height:46, borderRadius:12,
            borderColor: searchFocused ? '#12b76a' : 'var(--border)',
            boxShadow: searchFocused ? '0 0 0 3px rgba(18,183,106,0.1)' : 'none',
            transition:'all 0.2s' }}
          placeholder="Rechercher — entreprise, nom, téléphone, email, ville..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {search && (
          <button onClick={() => setSearch('')}
            style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer', color:'var(--text-muted)', padding:'3px 6px', display:'flex', alignItems:'center' }}>
            <X size={12}/>
          </button>
        )}
      </div>

      {/* ── Compteur résultats ─────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontWeight:700, color:'var(--text-primary)', fontSize:15 }}>{sorted.length}</span>
          <span>fiche{sorted.length !== 1 ? 's' : ''}{(search||hasFilters) ? ' trouvée' : ' au total'}</span>
          {(search||hasFilters) && (
            <span style={{ fontSize:11, background:'rgba(18,183,106,0.1)', color:'#12b76a', padding:'2px 10px', borderRadius:20, fontWeight:700 }}>
              Filtres actifs
            </span>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          GRILLE DE CARDS
          Mobile  : 1 colonne
          Desktop : auto-fill minmax(300px, 1fr)
          Chaque card : fadeSlideUp avec délai 0.04s entre chaque
          ════════════════════════════════════════════════════════════════ */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'40vh' }}>
          <div style={{ width:36, height:36, border:'3px solid rgba(18,183,106,0.2)', borderTopColor:'#12b76a', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
        </div>
      ) : sorted.length === 0 ? (
        <div className="empty-state">
          <Building2 size={40}/>
          <p>{search||hasFilters ? 'Aucun résultat' : 'Aucune fiche'}</p>
          <button className="btn btn-primary" onClick={openAdd} style={{ marginTop:16 }}><Plus size={14}/> Ajouter</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(300px,1fr))', gap: isMobile?12:16 }}>
          {sorted.map((p, i) => {
            const statusColor = STATUS_COLORS[p.status] || '#8b8b9e';
            const leadColor   = LEAD_COLORS[p.leadType] || '#8b8b9e';
            const lastNote    = dernNote(p);
            return (
              <div key={p._id}
                onClick={() => openFiche(p)}
                style={{
                  background:'var(--bg-card)',
                  borderRadius:16, padding: isMobile?16:20,
                  cursor:'pointer', transition:'all 0.2s',
                  border:`1px solid var(--border)`,
                  borderTop:`3px solid ${statusColor}`,
                  boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
                  // fadeSlideUp avec délai progressif
                  animation:`fadeSlideUp 0.4s ${Math.min(i * 0.04, 0.5)}s ease both`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform='translateY(-4px)';
                  e.currentTarget.style.boxShadow=`0 12px 32px rgba(0,0,0,0.12), 0 0 0 1px ${statusColor}40`;
                  e.currentTarget.style.borderColor=`${statusColor}60`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform='';
                  e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)';
                  e.currentTarget.style.borderColor='var(--border)';
                }}>

                {/* ── Avatar + Nom + Score urgence ── */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <div className={`avatar ${AV_COLORS[i%AV_COLORS.length]}`} style={{ width:44, height:44, fontSize:15, flexShrink:0 }}>{ini(p)}</div>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'var(--text-primary)' }}>
                      {p.entreprise || `${p.prenom} ${p.nom}`.trim() || 'Sans nom'}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                      {p.typeClient==='b2b'?'🏢 B2B':'🏠 B2C'}{p.typeCommerce && p.typeCommerce!=='autre' ? ` · ${TYPE_COMMERCE_LABELS[p.typeCommerce]||p.typeCommerce}` : ''}
                    </div>
                  </div>
                  {/* Mini ScoreRing urgence — affiché seulement si > 0 */}
                  {p.urgencyScore > 0 && <MiniScoreRing score={p.urgencyScore}/>}
                </div>

                {/* ── Badges statut + lead type ── */}
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
                  <span className={`badge ${STATUS_CLASS[p.status]||'badge-p0'}`}>{STATUS_LABELS[p.status]}</span>
                  <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:`${leadColor}18`, color:leadColor, border:`1px solid ${leadColor}30` }}>
                    {LEAD_TYPES[p.leadType]||p.leadType}
                  </span>
                </div>

                {/* ── Produits ── */}
                {(p.produits||[]).length > 0 && (
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
                    {p.produits.map(code => <ProduitBadge key={code} code={code}/>)}
                  </div>
                )}

                {/* ── Fournisseurs actuel ── */}
                <div style={{ display:'flex', flexDirection:'column', gap:3, marginBottom:8 }}>
                  {p.fournisseurAlarme && !['inconnu','aucun'].includes(p.fournisseurAlarme) && (
                    <span style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:5 }}>
                      <Shield size={10} color="#f04438"/> {FOURN_ALARME[p.fournisseurAlarme]}
                      {p.fournisseurProposeAlarme && !['aucun'].includes(p.fournisseurProposeAlarme) && <span style={{ color:'#f04438', fontWeight:600 }}>→ {FOURN_ALARME[p.fournisseurProposeAlarme]}</span>}
                    </span>
                  )}
                  {p.fournisseurInternet && !['inconnu','aucun'].includes(p.fournisseurInternet) && (
                    <span style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:5 }}>
                      <Wifi size={10} color="#3b6cf8"/> {FOURN_INTERNET[p.fournisseurInternet]}
                      {p.fournisseurProposeInternet && !['aucun'].includes(p.fournisseurProposeInternet) && <span style={{ color:'#3b6cf8', fontWeight:600 }}>→ {FOURN_INTERNET[p.fournisseurProposeInternet]}</span>}
                    </span>
                  )}
                  {p.fournisseurMobile && !['inconnu','aucun'].includes(p.fournisseurMobile) && (
                    <span style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:5 }}>
                      <Smartphone size={10} color="#12b76a"/> {FOURN_MOBILE[p.fournisseurMobile]}
                      {p.fournisseurProposeMobile && !['aucun'].includes(p.fournisseurProposeMobile) && <span style={{ color:'#12b76a', fontWeight:600 }}>→ {FOURN_MOBILE[p.fournisseurProposeMobile]}</span>}
                    </span>
                  )}
                </div>

                {/* ── Qualification système ── */}
                {p.qualificationSysteme && p.qualificationSysteme!=='inconnu' && (
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8, background:'var(--bg-secondary)', padding:'4px 8px', borderRadius:6, display:'inline-block' }}>
                    🔒 {QUALIF_LABELS[p.qualificationSysteme]}
                  </div>
                )}

                {/* ── Résumé tronqué ── */}
                {p.summary && (
                  <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:8, lineHeight:1.5, background:'var(--bg-secondary)', padding:'8px 10px', borderRadius:8, borderLeft:`3px solid ${leadColor}`, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    {p.summary}
                  </div>
                )}

                {/* ── Dernière note ── */}
                {lastNote && (
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8, background:'var(--bg-secondary)', padding:'6px 10px', borderRadius:8, borderLeft:'3px solid #12b76a', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', fontStyle:'italic' }}>
                    💬 {lastNote}
                  </div>
                )}

                {/* ── Contact ── */}
                <div style={{ display:'flex', flexDirection:'column', gap:3, marginBottom:8 }}>
                  {p.telephone && <span style={{ fontSize:12, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:6 }}><Phone size={11}/>{p.telephone}</span>}
                  {p.email     && <span style={{ fontSize:12, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}><Mail size={11}/>{p.email}</span>}
                  {p.ville     && <span style={{ fontSize:12, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:6 }}><MapPin size={11}/>{p.ville}</span>}
                  {(p.prenom||p.nom) && <span style={{ fontSize:12, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:6 }}><User size={11}/>{p.prenom} {p.nom}</span>}
                  <span style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}><Clock size={10}/>{fmtDate(p.createdAt)}</span>
                </div>

                {/* ── Badge commission ── */}
                <div onClick={e => e.stopPropagation()}>
                  <CommissionBadge fiche={p} onToggle={togglePaiement}/>
                </div>

                {/* ── Actions rapides ── */}
                <div style={{ display:'flex', gap:6, marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                  <button onClick={e => openEdit(p,e)}
                    style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'6px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', cursor:'pointer', fontSize:11, color:'var(--text-muted)', transition:'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#3b6cf8'; e.currentTarget.style.color='#3b6cf8'; e.currentTarget.style.background='rgba(59,108,248,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.background='var(--bg-secondary)'; }}>
                    <Edit2 size={12}/> Modifier
                  </button>
                  <button onClick={e => handleDelete(p,e)}
                    style={{ width:34, display:'flex', alignItems:'center', justifyContent:'center', padding:'6px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', cursor:'pointer', fontSize:11, color:'var(--text-muted)', transition:'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#f04438'; e.currentTarget.style.color='#f04438'; e.currentTarget.style.background='rgba(240,68,56,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.background='var(--bg-secondary)'; }}>
                    <Trash2 size={12}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          ULTRA-FICHE — modal plein écran
          ════════════════════════════════════════════════════════════════ */}
      {modal === 'fiche' && selected && (
        <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) setModal(null); }} style={{ alignItems:'flex-start', padding: isMobile?'0':'20px', overflowY:'auto' }}>
          <div style={{ background:'var(--bg-card)', borderRadius: isMobile?0:16, width:'100%', maxWidth:940, margin:'0 auto', overflow:'hidden', boxShadow:'0 25px 60px rgba(0,0,0,0.3)' }}>

            {/* En-tête avec gradient selon statut */}
            <div style={{ background:`linear-gradient(135deg,${STATUS_COLORS[selected.status]||'#12b76a'}20,transparent)`, borderBottom:`3px solid ${STATUS_COLORS[selected.status]||'#12b76a'}`, padding: isMobile?'20px 16px 16px':'28px 28px 20px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div className={`avatar ${AV_COLORS[0]}`} style={{ width: isMobile?48:64, height: isMobile?48:64, fontSize: isMobile?18:22, flexShrink:0 }}>{ini(selected)}</div>
                  <div>
                    <h2 style={{ margin:'0 0 4px', fontSize: isMobile?18:22 }}>{selected.entreprise || `${selected.prenom} ${selected.nom}`.trim() || 'Sans nom'}</h2>
                    <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:8 }}>
                      {selected.typeClient==='b2b'?'🏢 B2B':'🏠 B2C'} · {TYPE_COMMERCE_LABELS[selected.typeCommerce]||''} {selected.ville?`· ${selected.ville}`:''}
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <span className={`badge ${STATUS_CLASS[selected.status]||'badge-p0'}`}>{STATUS_LABELS[selected.status]}</span>
                      <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background:`${LEAD_COLORS[selected.leadType]||'#8b8b9e'}20`, color:LEAD_COLORS[selected.leadType]||'#8b8b9e' }}>{LEAD_TYPES[selected.leadType]}</span>
                      {(selected.produits||[]).map(c => <ProduitBadge key={c} code={c}/>)}
                    </div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}><X size={16}/></button>
              </div>
            </div>

            <div style={{ padding: isMobile?'16px':'28px' }}>

              {/* ── Pipeline stepper horizontal ── */}
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>Pipeline</div>
                <div style={{ display:'flex', gap: isMobile?4:8, flexWrap:'wrap' }}>
                  {Object.entries(STATUS_LABELS).map(([k,v]) => (
                    <button key={k} onClick={() => changeStatus(selected,k)}
                      style={{ padding: isMobile?'5px 10px':'6px 14px', borderRadius:20, fontSize: isMobile?11:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                        border:`2px solid ${selected.status===k?STATUS_COLORS[k]:'var(--border)'}`,
                        background:selected.status===k?STATUS_COLORS[k]:'var(--bg-secondary)',
                        color:selected.status===k?'#fff':'var(--text-secondary)' }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Bloc commission dans l'ultra-fiche ── */}
              {(selected.commissionTotale > 0 || selected.commissionFixe > 0) && (
                <div style={{ marginBottom:24, background: selected.commissionPayee ? 'rgba(18,183,106,0.06)' : 'rgba(247,144,9,0.06)', borderRadius:14, padding:'18px 20px', border:`1px solid ${selected.commissionPayee ? '#12b76a' : '#f79009'}30` }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Wallet size={18} color={selected.commissionPayee ? '#12b76a' : '#f79009'}/>
                      <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>Commission</span>
                    </div>
                    <button onClick={() => togglePaiement(selected)}
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer', border:'none',
                        background: selected.commissionPayee ? '#12b76a' : '#f79009', color:'#fff', transition:'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.transform='scale(1.04)'}
                      onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                      {selected.commissionPayee ? <><CheckCircle size={13}/> Payée ✓</> : <><XCircle size={13}/> Marquer payée</>}
                    </button>
                  </div>

                  {/* Barre de progression commission */}
                  <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(3,1fr)', gap:10, marginBottom:12 }}>
                    {[
                      { label:'Commission fixe',  value:`${(selected.commissionFixe||0).toFixed(2)} TND`,  color:'#3b6cf8' },
                      { label:'Commission extra', value:`${(selected.commissionExtra||0).toFixed(2)} TND`, color:'#a764f8' },
                      { label:'Total',            value:`${(selected.commissionTotale||0).toFixed(2)} TND`, color: selected.commissionPayee?'#12b76a':'#f79009' },
                    ].map(s => (
                      <div key={s.label} style={{ background:'var(--bg-card)', borderRadius:10, padding:'10px 14px', textAlign:'center', transition:'transform 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                        <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>{s.label}</div>
                        <div style={{ fontSize: isMobile?16:18, fontWeight:700, color:s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  {selected.dateVente && (
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                      📅 Date de vente : {fmtDate(selected.dateVente)}
                      {selected.datePaiementCommission && ` · Payée le : ${fmtDate(selected.datePaiementCommission)}`}
                    </div>
                  )}
                </div>
              )}

              {/* ── Infos 3 colonnes (1 sur mobile) ── */}
              <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
                <FicheSection title="Contact">
                  <InfoRow icon={<User size={12}/>}  label="Prénom"    val={selected.prenom}    />
                  <InfoRow icon={<User size={12}/>}  label="Nom"       val={selected.nom}       />
                  <InfoRow icon={<Tag size={12}/>}   label="Sexe"      val={selected.sexe==='homme'?'Homme':selected.sexe==='femme'?'Femme':null} />
                  <InfoRow icon={<Phone size={12}/>} label="Téléphone" val={selected.telephone} />
                  <InfoRow icon={<Mail size={12}/>}  label="Email"     val={selected.email}     />
                </FicheSection>
                <FicheSection title="Localisation">
                  <InfoRow icon={<MapPin size={12}/>} label="Adresse"          val={selected.adresse}         />
                  <InfoRow icon={<MapPin size={12}/>} label="Ancienne adresse" val={selected.ancienneAdresse} />
                  <InfoRow icon={<MapPin size={12}/>} label="Ville"            val={selected.ville}           />
                  <InfoRow icon={<Tag size={12}/>}    label="Région"           val={selected.region}          />
                </FicheSection>
                <FicheSection title="Système">
                  <InfoRow icon={<Shield size={12}/>}   label="Qualification" val={QUALIF_LABELS[selected.qualificationSysteme]} />
                  <InfoRow icon={<Calendar size={12}/>} label="Ajouté le"     val={fmtDate(selected.createdAt)} />
                </FicheSection>
              </div>

              {/* ── Fournisseurs avec hover slide ── */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>Fournisseurs — Actuel → Proposé</div>
                <div style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
                  <FournisseurRow icon={<Shield size={13} color="#f04438"/>}     color="#f04438" label="Alarme"   actuel={getFournLabel('alarme',   selected.fournisseurAlarme)}   propose={getFournLabel('alarme',   selected.fournisseurProposeAlarme)}/>
                  <FournisseurRow icon={<Wifi size={13} color="#3b6cf8"/>}       color="#3b6cf8" label="Internet" actuel={getFournLabel('internet', selected.fournisseurInternet)} propose={getFournLabel('internet', selected.fournisseurProposeInternet)}/>
                  <FournisseurRow icon={<Smartphone size={13} color="#12b76a"/>} color="#12b76a" label="Mobile"  actuel={getFournLabel('mobile',   selected.fournisseurMobile)}   propose={getFournLabel('mobile',   selected.fournisseurProposeMobile)}/>
                </div>
              </div>

              {/* ── Résumé ── */}
              {selected.summary && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>Résumé</div>
                  <div style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'14px 16px', fontSize:13, color:'var(--text-secondary)', lineHeight:1.7, borderLeft:'3px solid #12b76a', whiteSpace:'pre-wrap' }}>{selected.summary}</div>
                </div>
              )}

              {/* ── Texte source ── */}
              {selected.sourceText && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>Texte source</div>
                  <div style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'14px 16px', fontSize:12, color:'var(--text-secondary)', lineHeight:1.6, borderLeft:'3px solid var(--border)', whiteSpace:'pre-wrap', maxHeight:160, overflowY:'auto' }}>{selected.sourceText}</div>
                </div>
              )}

              {/* ── Notes avec timeline ── */}
              <div>
                <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 }}>
                  Notes ({selected.notes?.length||0})
                </div>
                {selected.notes?.length > 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                    {[...selected.notes].reverse().map((n, idx) => {
                      const realIdx = (selected.notes.length-1) - idx;
                      return (
                        <div key={idx} style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'var(--text-secondary)', lineHeight:1.5, borderLeft:'3px solid #12b76a', display:'flex', alignItems:'flex-start', gap:10, transition:'transform 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.transform='translateX(3px)'}
                          onMouseLeave={e => e.currentTarget.style.transform='translateX(0)'}>
                          <span style={{ flex:1 }}>{n}</span>
                          <button onClick={() => deleteNote(selected, realIdx)}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', flexShrink:0, padding:'2px', borderRadius:4, transition:'color 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.color='var(--danger)'}
                            onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}><Trash2 size={13}/></button>
                        </div>
                      );
                    })}
                  </div>
                ) : <div style={{ color:'var(--text-muted)', fontSize:13, padding:'12px 0', marginBottom:12 }}>Aucune note pour l'instant</div>}
                <textarea className="input" style={{ resize:'vertical', minHeight:80, marginBottom:8 }} placeholder="Ajouter une note..." value={noteText} onChange={e => setNoteText(e.target.value)}/>
                <button className="btn btn-primary" onClick={() => addNote(selected)} style={{ width:'100%' }}>
                  <Plus size={13}/> Ajouter la note
                </button>
              </div>
            </div>

            {/* Footer ultra-fiche */}
            <div style={{ padding: isMobile?'12px 16px':'16px 28px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
              <button className="btn btn-danger btn-sm" onClick={e => handleDelete(selected,e)}><Trash2 size={13}/> Supprimer</button>
              <button className="btn btn-primary btn-sm" onClick={e => openEdit(selected,e)}><Edit2 size={13}/> Modifier</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODAL ADD / EDIT — 5 onglets
          Mobile : plein écran / Desktop : centré maxWidth 680px
          ════════════════════════════════════════════════════════════════ */}
      {(modal==='add'||modal==='edit') && (
        <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) setModal(null); }}>
          <div style={{ background:'var(--bg-card)', borderRadius: isMobile?0:16, width:'100%', maxWidth:680, margin:'auto', overflow:'hidden', boxShadow:'0 25px 60px rgba(0,0,0,0.3)', maxHeight: isMobile?'100vh':'90vh', display:'flex', flexDirection:'column' }}>

            {/* Header modal avec gradient selon statut sélectionné */}
            <div style={{ background:`linear-gradient(135deg,${STATUS_COLORS[form.status]||'#12b76a'}18,transparent)`, borderBottom:`3px solid ${STATUS_COLORS[form.status]||'#12b76a'}`, padding:'20px 24px 0' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div className={`avatar ${AV_COLORS[0]}`} style={{ width:44, height:44, fontSize:16, flexShrink:0 }}>
                    {form.prenom?.[0] || form.entreprise?.[0] || (modal==='add'?'+':'E')}
                  </div>
                  <div>
                    <h2 style={{ margin:0, fontSize:17 }}>
                      {modal==='add' ? 'Nouvelle fiche' : (form.entreprise || `${form.prenom} ${form.nom}`.trim() || 'Modifier')}
                    </h2>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                      {modal==='add' ? 'Remplis les informations ci-dessous' : 'Modification de la fiche'}
                    </div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}><X size={16}/></button>
              </div>
              {/* Onglets */}
              <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
                {TABS.map((tab, idx) => (
                  <button key={idx} onClick={() => setActiveTab(idx)}
                    style={{ padding:'10px 14px', fontSize: isMobile?11:12, fontWeight:600, cursor:'pointer', border:'none',
                      borderBottom: activeTab===idx ? `2px solid ${STATUS_COLORS[form.status]||'#12b76a'}` : '2px solid transparent',
                      background:'transparent',
                      color: activeTab===idx ? (STATUS_COLORS[form.status]||'#12b76a') : 'var(--text-muted)',
                      transition:'all 0.15s', whiteSpace:'nowrap' }}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Corps du modal — scrollable */}
            <div style={{ overflowY:'auto', flex:1, padding:'20px 24px' }}>

              {/* ── Onglet 0 : Contact ── */}
              {activeTab === 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeSlideUp 0.2s ease both' }}>
                  <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:12 }}>
                    {[['prenom','Prénom','Marc'],['nom','Nom','Tremblay'],['telephone','Téléphone','514-555-0101'],['email','Email','contact@exemple.com']].map(([k,l,ph]) => (
                      <div key={k} className="form-group">
                        <label className="form-label">{l}</label>
                        <input className="input" placeholder={ph} value={form[k]||''} onChange={e => setFld(k,e.target.value)}/>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:12 }}>
                    <div className="form-group"><label className="form-label">Sexe</label>
                      <select className="select" value={form.sexe} onChange={e => setFld('sexe',e.target.value)}>
                        <option value="inconnu">Inconnu</option><option value="homme">Homme</option><option value="femme">Femme</option>
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Statut</label>
                      <select className="select" value={form.status} onChange={e => setFld('status',e.target.value)}>
                        {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:12 }}>
                    <div className="form-group"><label className="form-label">Adresse</label><input className="input" placeholder="123 rue..." value={form.adresse||''} onChange={e => setFld('adresse',e.target.value)}/></div>
                    <div className="form-group"><label className="form-label">Ancienne adresse</label><input className="input" placeholder="Ancienne adresse..." value={form.ancienneAdresse||''} onChange={e => setFld('ancienneAdresse',e.target.value)}/></div>
                    <div className="form-group"><label className="form-label">Ville</label>
                      <select className="select" value={form.ville} onChange={e => setFld('ville',e.target.value)}>
                        {VILLES.filter(v=>v).map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Urgence (0-10)</label>
                      <input type="number" min="0" max="10" className="input" value={form.urgencyScore} onChange={e => setFld('urgencyScore',Number(e.target.value))}/>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Onglet 1 : Entreprise ── */}
              {activeTab === 1 && (
                <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeSlideUp 0.2s ease both' }}>
                  <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:12 }}>
                    <div className="form-group"><label className="form-label">Nom de l'entreprise</label><input className="input" placeholder="Restaurant Belle Vue..." value={form.entreprise||''} onChange={e => setFld('entreprise',e.target.value)}/></div>
                    <div className="form-group"><label className="form-label">Type client</label>
                      <select className="select" value={form.typeClient} onChange={e => setFld('typeClient',e.target.value)}>
                        <option value="b2b">🏢 B2B — Commerce</option><option value="b2c">🏠 B2C — Résidentiel</option>
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Type de commerce</label>
                      <select className="select" value={form.typeCommerce} onChange={e => setFld('typeCommerce',e.target.value)}>
                        {Object.entries(TYPE_COMMERCE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Type de lead</label>
                      <select className="select" value={form.leadType} onChange={e => setFld('leadType',e.target.value)}>
                        {Object.entries(LEAD_TYPES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">URL source</label><input className="input" placeholder="https://..." value={form.sourceUrl||''} onChange={e => setFld('sourceUrl',e.target.value)}/></div>
                  </div>
                  <div>
                    <label className="form-label" style={{ marginBottom:8, display:'block' }}>Produits d'intérêt</label>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {Object.entries(PRODUIT_LABELS).map(([k,v]) => {
                        const sel   = (form.produits||[]).includes(k);
                        const color = PRODUIT_COLORS[k]||'#8b8b9e';
                        const Icon  = PRODUIT_ICONS[k]||Tag;
                        return (
                          <button key={k} type="button" onClick={() => toggleProduit(k)}
                            style={{ padding:'8px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                              border:`2px solid ${sel?color:'var(--border)'}`,
                              background:sel?`${color}18`:'var(--bg-secondary)',
                              color:sel?color:'var(--text-muted)',
                              display:'flex', alignItems:'center', gap:6,
                              transform: sel ? 'scale(1.05)' : 'scale(1)' }}>
                            <Icon size={13}/> {v}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Onglet 2 : Système ── */}
              {activeTab === 2 && (
                <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeSlideUp 0.2s ease both' }}>
                  <div className="form-group">
                    <label className="form-label">Qualification du système existant</label>
                    <select className="select" value={form.qualificationSysteme} onChange={e => setFld('qualificationSysteme',e.target.value)}>
                      {Object.entries(QUALIF_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  {[
                    { label:'Alarme / Sécurité', icon:<Shield size={14} color="#f04438"/>, color:'#f04438', aKey:'fournisseurAlarme',   pKey:'fournisseurProposeAlarme',   list:FOURN_ALARME   },
                    { label:'Internet',           icon:<Wifi size={14} color="#3b6cf8"/>,   color:'#3b6cf8', aKey:'fournisseurInternet', pKey:'fournisseurProposeInternet', list:FOURN_INTERNET },
                    { label:'Mobile',             icon:<Smartphone size={14} color="#12b76a"/>, color:'#12b76a', aKey:'fournisseurMobile', pKey:'fournisseurProposeMobile', list:FOURN_MOBILE },
                  ].map(({ label, icon, color, aKey, pKey, list }) => (
                    <div key={label} style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'14px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>{icon}<span style={{ fontSize:13, fontWeight:600 }}>{label}</span></div>
                      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr auto 1fr', gap:10, alignItems:'center' }}>
                        <div>
                          <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>Actuel</div>
                          <select className="select" value={form[aKey]} onChange={e => setFld(aKey,e.target.value)}>
                            {Object.entries(list).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                        {!isMobile && <div style={{ textAlign:'center', color:'var(--text-muted)', fontSize:20, paddingTop:16 }}>→</div>}
                        <div>
                          <div style={{ fontSize:10, color, fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>Proposé</div>
                          <select className="select" value={form[pKey]} onChange={e => setFld(pKey,e.target.value)} style={{ borderColor:`${color}40` }}>
                            {Object.entries(list).filter(([k]) => k!=='inconnu').map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Onglet 3 : Commission ── */}
              {activeTab === 3 && (
                <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeSlideUp 0.2s ease both' }}>

                  {/* Preview total animé */}
                  <div style={{ background: form.commissionPayee ? 'rgba(18,183,106,0.08)' : 'rgba(247,144,9,0.08)', borderRadius:14, padding:'22px', border:`2px solid ${form.commissionPayee ? '#12b76a' : '#f79009'}30`, textAlign:'center' }}>
                    <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:6 }}>Total commission</div>
                    <div style={{ fontSize:36, fontWeight:800, color: form.commissionPayee ? '#12b76a' : '#f79009', lineHeight:1 }}>
                      {((parseFloat(form.commissionFixe)||0) + (parseFloat(form.commissionExtra)||0)).toFixed(2)} TND
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:8, display:'flex', justifyContent:'center', gap:16 }}>
                      {(parseFloat(form.commissionFixe)||0) > 0 && <span>Fixe : <strong style={{color:'var(--text-primary)'}}>{(parseFloat(form.commissionFixe)||0).toFixed(2)} TND</strong></span>}
                      {(parseFloat(form.commissionExtra)||0) > 0 && <span>Extra : <strong style={{color:'var(--text-primary)'}}>{(parseFloat(form.commissionExtra)||0).toFixed(2)} TND</strong></span>}
                    </div>
                  </div>

                  {/* 2 champs commission */}
                  <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:12 }}>
                    <div className="form-group">
                      <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <Wallet size={13} color="#3b6cf8"/> Commission fixe (TND)
                      </label>
                      <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
                        value={form.commissionFixe||''}
                        onChange={e => {
                          const v = parseFloat(e.target.value)||0;
                          setForm(f => ({ ...f, commissionFixe:v, commissionTotale:(v + (parseFloat(f.commissionExtra)||0)) }));
                        }}/>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Ta commission de base</div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <Wallet size={13} color="#a764f8"/> Commission extra (TND)
                      </label>
                      <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
                        value={form.commissionExtra||''}
                        onChange={e => {
                          const v = parseFloat(e.target.value)||0;
                          setForm(f => ({ ...f, commissionExtra:v, commissionTotale:((parseFloat(f.commissionFixe)||0) + v) }));
                        }}/>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Pour équipements additionnels</div>
                    </div>
                  </div>

                  {/* Date de vente */}
                  <div className="form-group">
                    <label className="form-label">Date de vente</label>
                    <DatePicker value={form.dateVente ? form.dateVente.slice(0,10) : ''} onChange={v => setFld('dateVente', v)} placeholder="Choisir une date de vente"/>
                  </div>

                  {/* Toggle payée */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg-secondary)', borderRadius:12, padding:'16px 18px' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>Statut du paiement</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>
                        {form.commissionPayee ? `✓ Payée${form.datePaiementCommission ? ` le ${fmtDate(form.datePaiementCommission)}` : ''}` : '⏳ En attente de paiement'}
                      </div>
                    </div>
                    <button type="button"
                      onClick={() => { setFld('commissionPayee', !form.commissionPayee); if (!form.commissionPayee) setFld('datePaiementCommission', new Date().toISOString().slice(0,10)); }}
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 22px', borderRadius:20, fontSize:13, fontWeight:700, cursor:'pointer', border:'none',
                        background: form.commissionPayee ? '#12b76a' : '#f79009', color:'#fff', transition:'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.transform='scale(1.03)'}
                      onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                      {form.commissionPayee ? <><CheckCircle size={15}/> Payée</> : <><XCircle size={15}/> Non payée</>}
                    </button>
                  </div>

                  {form.commissionPayee && (
                    <div className="form-group">
                      <label className="form-label">Date de paiement</label>
                      <DatePicker value={form.datePaiementCommission ? form.datePaiementCommission.slice(0,10) : ''} onChange={v => setFld('datePaiementCommission', v)} placeholder="Choisir une date de paiement"/>
                    </div>
                  )}
                </div>
              )}

              {/* ── Onglet 4 : Résumé ── */}
              {activeTab === 4 && (
                <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeSlideUp 0.2s ease both' }}>
                  <div className="form-group">
                    <label className="form-label">Résumé de l'opportunité</label>
                    <textarea className="input" style={{ resize:'vertical', minHeight:100 }} placeholder="Pourquoi ce lead est pertinent..." value={form.summary||''} onChange={e => setFld('summary',e.target.value)}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Texte source</label>
                    <textarea className="input" style={{ resize:'vertical', minHeight:100 }} placeholder="Colle ici le texte..." value={form.sourceText||''} onChange={e => setFld('sourceText',e.target.value)}/>
                  </div>
                </div>
              )}
            </div>

            {/* Footer modal */}
            <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg-card)' }}>
              {/* Indicateurs d'onglet */}
              <div style={{ display:'flex', gap:6 }}>
                {TABS.map((_, idx) => (
                  <button key={idx} onClick={() => setActiveTab(idx)}
                    style={{ width:8, height:8, borderRadius:'50%', border:'none', cursor:'pointer',
                      background: activeTab===idx ? (STATUS_COLORS[form.status]||'#12b76a') : 'var(--border)',
                      padding:0, transition:'all 0.15s',
                      transform: activeTab===idx ? 'scale(1.4)' : 'scale(1)' }}/>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn" onClick={() => setModal(null)}>Annuler</button>
                {activeTab < TABS.length - 1 ? (
                  <button className="btn btn-primary" onClick={() => setActiveTab(t => t+1)}>Suivant →</button>
                ) : (
                  <button className="btn btn-primary" onClick={handleSubmit}>{modal==='add' ? '✓ Ajouter' : '✓ Sauvegarder'}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Keyframes animations ── */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes commPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(247,144,9,0); }
          50%       { box-shadow: 0 0 0 4px rgba(247,144,9,0.15); }
        }
      `}</style>
    </div>
  );
}
