// ════════════════════════════════════════════════════════════════════════════
// client/src/pages/SolutionExpress.jsx
// ════════════════════════════════════════════════════════════════════════════
// RESPONSIVE  : iPhone 12 Pro Max (430px) — breakpoint 768px
// DESIGN      : Header glassmorphism, cards animées, filtres modernes
// ANIMATIONS  : fadeSlideUp cards, hover glow, AnimatedNumber, ScoreRing mini
// LOGIQUE     : Toutes les fonctionnalités originales intactes
// API         : GET/POST/PUT/DELETE /api/solution-express
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import AnimatedNumber from '../components/AnimatedNumber';
import api from '../api';
import {
  Plus, MapPin, Phone, X, Edit2, Trash2,
  AlertTriangle, Mail, Calendar, Clock, Tag, Search,
  User, Building2, Shield, Wifi, Smartphone,
  Tv, Camera, Receipt,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, FileText, Lock,
  DollarSign, CheckCircle, XCircle, TrendingUp, Filter, Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';

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
  const safeVal  = typeof value === 'string' ? value : '';
  const today    = new Date();
  const initDate = safeVal ? new Date(safeVal + 'T12:00:00') : today;
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

  const displayValue = safeVal ? new Date(safeVal + 'T12:00:00').toLocaleDateString('fr-CA', { day:'numeric', month:'long', year:'numeric' }) : '';

  return (
    <div style={{ position:'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', color: value ? 'var(--text-primary)' : '#ffffff', fontSize:13, textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:8, transition:'border-color 0.15s' }}
        onFocus={e => e.currentTarget.style.borderColor='#12b76a'}
        onBlur={e => e.currentTarget.style.borderColor='var(--border)'}>
        <Calendar size={14} color={safeVal ? '#12b76a' : '#ffffff'}/>
        {displayValue || placeholder}
        {safeVal && <button type="button" onClick={e => { e.stopPropagation(); onChange(''); }} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#ffffff', padding:0, fontSize:14, lineHeight:1 }}>×</button>}
      </button>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:1000, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.2)', padding:14, minWidth:260 }}>
          {/* Navigation mois */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <button type="button" onClick={prevM} style={{ width:28, height:28, borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-secondary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#ffffff' }}>
              <ChevronLeft size={14}/>
            </button>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', textTransform:'capitalize' }}>{monthName}</span>
            <button type="button" onClick={nextM} style={{ width:28, height:28, borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-secondary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#ffffff' }}>
              <ChevronRight size={14}/>
            </button>
          </div>
          {/* Jours semaine */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
            {days.map((d,i) => <div key={i} style={{ textAlign:'center', fontSize:9, color:'#ffffff', fontWeight:700, padding:'3px 0' }}>{d}</div>)}
          </div>
          {/* Grille jours */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
            {Array(offset).fill(null).map((_,i) => <div key={`e${i}`}/>)}
            {Array(daysInMonth).fill(null).map((_,i) => {
              const day     = i + 1;
              const y       = current.year, m = String(current.month+1).padStart(2,'0'), d = String(day).padStart(2,'0');
              const dateStr = `${y}-${m}-${d}`;
              const isSel   = safeVal === dateStr;
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


const TYPE_COMMERCE_LABELS = {};

const STATUS_LABELS = {
  new:'Nouveau', contacted:'Contacté',
  proposal:'Soumission',
  installation_en_cours:'Installation en cours', installe:'Installé',
  installation_annulee:'Installation annulée'
};
const STATUS_CLASS = {
  new:'badge-p0', contacted:'badge-p1',
  proposal:'badge-p3',
  installation_en_cours:'badge-p1', installe:'badge-won',
  installation_annulee:'badge-dead'
};
const STATUS_COLORS = {
  new:'#3b6cf8', contacted:'#f79009',
  proposal:'#a764f8',
  installation_en_cours:'#f97316', installe:'#22c55e',
  installation_annulee:'#be123c'
};

const LEAD_TYPES = {
  nouvelle_entreprise:'Nouvelle entreprise', demenagement:'Déménagement',
  reouverture:'Réouverture', commerce_existant:'Commerce existant', autre:'Autre'
};
const LEAD_PALETTE_COLORS = ['#12b76a','#0077b5','#f79009','#a764f8','#f04438','#61DAFB','#8b8b9e'];
// Couleurs statiques de base utilisées comme fallback uniquement
const LEAD_COLORS_STATIC = {
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

const fromArr = arr => arr ? Object.fromEntries(arr.map(({key,label}) => [key,label])) : {};

const ICON_MAP = {
  shield: Shield, wifi: Wifi, smartphone: Smartphone,
  tv: Tv, camera: Camera, receipt: Receipt,
};

// Fallback statique si l'API settings est indisponible
const FOURN_ALARME          = { inconnu:'Inconnu', protectron:'Protectron', adt:'ADT', telus_alarme:'Telus', bell_alarme:'Bell', api_alarm:'API', stanley:'Stanley', securitas:'Securitas', gardaworld:'GardaWorld', alarme_mirabel:'Alarme Mirabel', alarme_signal_teck:'Signal Teck', bigbrothers:'Bigbrothers', allo_alarme:'Alloo Alarme', protection_incendie_laval:'Protection Incendie Laval', multialarme:'MultiAlarme', alarme_expert:'Alarme Expert', autre:'Autre' };
const FOURN_ALARME_PROPOSE  = { aucun:'Aucun', gardaworld:'GardaWorld', telus_alarme:'Telus', autre:'Autre' };
const FOURN_INTERNET        = { inconnu:'Inconnu', bell_internet:'Bell', virgin:'Virgin', lucky_mobile:'Lucky Mobile', telus_internet:'Telus', koodo:'Koodo', public_mobile:'Public Mobile', rogers:'Rogers', fido:'Fido', chatr:'Chatr', videotron:'Vidéotron', fizz:'Fizz', cogeco:'Cogeco', distributel:'Distributel', teksavvy:'TekSavvy', ebox:'EBox', autre:'Autre' };
const FOURN_INTERNET_PROPOSE = { aucun:'Aucun', rogers_comwave:'Rogers ComeWave', rogers_5g:'Rogers 5G', ebox:'EBox' };
const FOURN_MOBILE          = { inconnu:'Inconnu', bell_mobile:'Bell', virgin_plus:'Virgin', lucky_mobile:'Lucky Mobile', telus_mobile:'Telus', koodo:'Koodo', public_mobile:'Public Mobile', rogers:'Rogers', fido:'Fido', chatr:'Chatr', videotron:'Vidéotron', fizz:'Fizz', autre:'Autre' };
const FOURN_MOBILE_PROPOSE  = { aucun:'Aucun', rogers:'Rogers' };

const DEFAULT_SERVICES = [
  { id:'alarme',   label:'Alarme',   color:'#f04438', icon:'shield',
    actuel:  Object.entries(FOURN_ALARME).map(([key,label])=>({key,label})),
    propose: Object.entries(FOURN_ALARME_PROPOSE).map(([key,label])=>({key,label})) },
  { id:'internet', label:'Internet', color:'#3b6cf8', icon:'wifi',
    actuel:  Object.entries(FOURN_INTERNET).map(([key,label])=>({key,label})),
    propose: Object.entries(FOURN_INTERNET_PROPOSE).map(([key,label])=>({key,label})) },
  { id:'mobile',   label:'Mobile',   color:'#12b76a', icon:'smartphone',
    actuel:  Object.entries(FOURN_MOBILE).map(([key,label])=>({key,label})),
    propose: Object.entries(FOURN_MOBILE_PROPOSE).map(([key,label])=>({key,label})) },
];

const EMPTY_FORM = {
  sourceText:'', sourceUrl:'',
  entreprise:'', typeCommerce:'autre', typeClient:'b2b',
  ancienneAdresse:'',
  prenom:'', nom:'', sexe:'inconnu', telephone:'', email:'',
  adresse:'', ville:'', region:'',
  leadType:'nouvelle_entreprise',
  qualificationSysteme:'inconnu',
  produits:[],
  fournisseurs: {},
  equipements:  {},
  status:'new', urgencyScore:0, summary:'',
  motifAnnulation:'',
  commissionFixe:0, commissionExtra:0,
  commissionTotale:0, commissionPayee:false,
  dateVente:'', datePaiementCommission:'',
};

const EMPTY_FILTERS = {
  status:'', typeClient:'', typeCommerce:'', ville:'',
  produit:'', qualificationSysteme:'', leadType:'',
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
    <div style={{ background:'rgba(4,10,24,0.95)', borderRadius:10, padding:'14px 16px', border:'1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ fontSize:10, color:'#ffffff', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>{title}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>{children}</div>
    </div>
  );
}

// Ligne d'info avec icône dans l'ultra-fiche
function InfoRow({ icon, label, val }) {
  if (!val || val === 'inconnu' || val === 'aucun') return null;
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
      <span style={{ color:'#ffffff', marginTop:2, flexShrink:0 }}>{icon}</span>
      <div>
        <div style={{ fontSize:10, color:'#ffffff', fontWeight:600, textTransform:'uppercase' }}>{label}</div>
        <div style={{ fontSize:13, color:'var(--text-primary)', wordBreak:'break-word' }}>{val}</div>
      </div>
    </div>
  );
}

// Ligne fournisseur actuel → proposé
function FournisseurRow({ icon, color, label, actuel, propose }) {
  if (!actuel && !propose) return null;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, transition:'transform 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.transform='translateX(3px)'}
      onMouseLeave={e => e.currentTarget.style.transform='translateX(0)'}>
      <span style={{ flexShrink:0 }}>{icon}</span>
      <span style={{ fontSize:11, color:'#ffffff', fontWeight:600, textTransform:'uppercase', minWidth:52 }}>{label}</span>
      {actuel  && <span style={{ fontSize:12, color:'var(--text-primary)', background:'var(--bg-secondary)', padding:'2px 8px', borderRadius:6 }}>{actuel}</span>}
      {actuel && propose && <span style={{ fontSize:12, color:'#ffffff' }}>→</span>}
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
  const [showFilters, setShowFilters] = useState(true);
  const [modal, setModal]             = useState(null);
  const [selected, setSelected]       = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [noteText, setNoteText]       = useState('');
  const [activeTab, setActiveTab]     = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [fetchError, setFetchError]       = useState(false);
  const [settings, setSettings]           = useState(null);
  const [anneeFiltre, setAnneeFiltre]     = useState(String(new Date().getFullYear()));
  const [motifPending, setMotifPending]   = useState(null);
  const toggleInProgress = useRef(new Set());

  // ── Chargement settings dynamiques — rechargé au retour sur l'onglet ──
  useEffect(() => {
    const loadSettings = () => api.get('/api/settings').then(r => setSettings(r.data)).catch(() => {});
    loadSettings();
    const onVisible = () => { if (document.visibilityState === 'visible') loadSettings(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const dVilles   = useMemo(() => settings?.villes || [], [settings]);
  const dCommerce = useMemo(() => settings ? fromArr(settings.typeCommerce) : TYPE_COMMERCE_LABELS, [settings]);
  const dLead     = useMemo(() => settings ? fromArr(settings.typeLead) : LEAD_TYPES, [settings]);
  const dQualif   = useMemo(() => settings ? fromArr(settings.qualificationSysteme) : QUALIF_LABELS, [settings]);

  // Couleurs dynamiques des types de lead — indexées par position dans settings
  const dLeadColors = useMemo(() => {
    const types = settings?.typeLead || Object.keys(LEAD_TYPES).map(key => ({ key }));
    const map = {};
    types.forEach((t, i) => {
      map[t.key] = LEAD_PALETTE_COLORS[i % LEAD_PALETTE_COLORS.length];
    });
    // Garde les couleurs statiques en fallback pour les clés non trouvées dans settings
    return { ...LEAD_COLORS_STATIC, ...map };
  }, [settings]);

  // Villes disponibles pour le FILTRE (issues des données réelles, pas des settings)
  const dFiltrVilles = useMemo(() =>
    [...new Set(fiches.map(f => f.ville).filter(Boolean))].sort(),
    [fiches]
  );

  const dServices = useMemo(() => {
    const svcs = settings?.services || DEFAULT_SERVICES;
    return svcs.map(s => ({
      ...s,
      actuelMap:          fromArr(s.actuel),
      proposeMap:         fromArr(s.propose),
      equipementsMap:     fromArr(s.equipements || []),
      equipementsDetails: Object.fromEntries((s.equipements||[]).map(e => [e.key, e])),
    }));
  }, [settings]);

  const getFournLabel = (svcId, val) => {
    if (!val || val === 'inconnu' || val === 'aucun') return null;
    const svc = dServices.find(s => s.id === svcId);
    if (!svc) return val;
    return svc.actuelMap[val] || svc.proposeMap[val] || val;
  };

  // ── Fetch toutes les fiches ───────────────────────────────────────────
  const fetchFiches = useCallback(async () => {
    try {
      const r = await api.get('/api/solution-express');
      const data = Array.isArray(r.data) ? r.data : [];
      setFiches(data);
      setFetchError(false);
      return data;
    } catch { toast.error('Erreur chargement'); setFetchError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFiches(); }, [fetchFiches]);

  // ── Helpers ───────────────────────────────────────────────────────────
  const setF    = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const setFld  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const ini     = p => ((p.prenom?.[0] || p.entreprise?.[0] || 'S')).toUpperCase();
  const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-CA', { year:'numeric', month:'short', day:'numeric', timeZone:'UTC' }) : '—';
  const hasFilters = Object.values(filters).some(v => v !== '');
  const dernNote   = p => p.notes?.length > 0 ? p.notes[p.notes.length - 1] : null;

  // ── Toggle produit dans le formulaire ────────────────────────────────
  const toggleProduit = (code) => {
    const list = form.produits || [];
    setFld('produits', list.includes(code) ? list.filter(x => x !== code) : [...list, code]);
  };

  // ── Toggle équipement dans le formulaire ─────────────────────────────
  const toggleEquipement = (svcId, key) => {
    setForm(prev => {
      const list = prev.equipements?.[svcId] || [];
      return {
        ...prev,
        equipements: {
          ...prev.equipements,
          [svcId]: list.includes(key) ? list.filter(x => x !== key) : [...list, key]
        }
      };
    });
  };

  // ── Toggle payé/non payé depuis la card ──────────────────────────────
  const togglePaiement = async (p) => {
    if (toggleInProgress.current.has(p._id)) return;
    toggleInProgress.current.add(p._id);
    try {
      const nowPaid = !p.commissionPayee;
      await api.put(`/api/solution-express/${p._id}`, {
        commissionPayee: nowPaid,
        datePaiementCommission: nowPaid ? new Date().toISOString() : null,
      });
      toast.success(nowPaid ? '✓ Commission marquée payée !' : 'Commission marquée non payée');
      const fresh = await fetchFiches();
      if (fresh && selected?._id === p._id) {
        const freshFiche = fresh.find(x => x._id === p._id);
        if (freshFiche) setSelected(freshFiche);
      }
    } catch { toast.error('Erreur mise à jour commission'); }
    finally { toggleInProgress.current.delete(p._id); }
  };

  // ── Années disponibles + filtre par année ────────────────────────────
  const annees = useMemo(() =>
    [...new Set(fiches.map(f => new Date(f.dateVente||f.createdAt||Date.now()).getUTCFullYear()))].sort((a,b) => b-a),
    [fiches]
  );
  const fichesByAnnee = useMemo(() =>
    anneeFiltre === 'tout' ? fiches : fiches.filter(f => String(new Date(f.dateVente||f.createdAt||Date.now()).getUTCFullYear()) === anneeFiltre),
    [fiches, anneeFiltre]
  );

  // ── Filtrage + recherche ──────────────────────────────────────────────
  const afterSearch = fichesByAnnee.filter(p => {
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
    if (filters.commissionPayee === 'payee'     && !p.commissionPayee)  return false;
    if (filters.commissionPayee === 'non_payee' && p.commissionPayee)   return false;
    if (filters.commissionPayee === 'avec'      && !p.commissionTotale) return false;
    return true;
  });

  // ── Tri ───────────────────────────────────────────────────────────────
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'date_desc':       return new Date(b.dateVente||b.createdAt) - new Date(a.dateVente||a.createdAt);
      case 'date_asc':        return new Date(a.dateVente||a.createdAt) - new Date(b.dateVente||b.createdAt);
      case 'urgency_desc':    return b.urgencyScore - a.urgencyScore;
      case 'commission_desc': return (b.commissionTotale||0) - (a.commissionTotale||0);
      case 'entreprise':      return (a.entreprise||'').localeCompare(b.entreprise||'');
      case 'status':          return (a.status||'').localeCompare(b.status||'');
      default:                return 0;
    }
  });

  // ── Stats pour le header glassmorphism ────────────────────────────────
  const totalFiches    = fichesByAnnee.length;
  const totalInstalle  = fichesByAnnee.filter(f => f.status === 'installe').length;
  const totalPipeline  = fichesByAnnee.filter(f => ['contacted','proposal','installation_en_cours'].includes(f.status)).length;
  const convRate       = totalFiches > 0 ? Math.round((totalInstalle / totalFiches) * 100) : 0;

  // ── Ouvrir modals ─────────────────────────────────────────────────────
  const openAdd = () => {
    const fournisseurs = Object.fromEntries(dServices.map(s => [s.id, { actuel: 'inconnu', propose: 'aucun' }]));
    const equipements  = Object.fromEntries(dServices.map(s => [s.id, []]));
    setForm({ ...EMPTY_FORM, fournisseurs, equipements });
    setActiveTab(0); setModal('add');
  };
  const openEdit = (p, e) => {
    if (e) e.stopPropagation();
    const base      = p.fournisseurs || {};
    const baseEquip = p.equipements  || {};
    const fournisseurs = Object.fromEntries(dServices.map(s => [s.id, base[s.id]      || { actuel: 'inconnu', propose: 'aucun' }]));
    const equipements  = Object.fromEntries(dServices.map(s => [s.id, baseEquip[s.id] || []]));
    setForm({ ...p, fournisseurs, equipements });
    setSelected(p); setActiveTab(0); setModal('edit');
  };
  const openFiche = (p, e) => { if(e) e.stopPropagation(); setSelected(p); setModal('fiche'); };

  // ── Soumettre formulaire add/edit ─────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.prenom?.trim())    { toast.error('Prénom requis');               return; }
    if (!form.nom?.trim())       { toast.error('Nom requis');                  return; }
    if (!form.telephone?.trim()) { toast.error('Téléphone requis');            return; }
    if (!form.email?.trim())     { toast.error('Email requis');                return; }
    if (!form.adresse?.trim())   { toast.error('Adresse requise');             return; }
    if (!form.entreprise?.trim()){ toast.error('Nom de l\'entreprise requis'); return; }
    if (!form.dateVente)         { toast.error('Date de vente requise');       return; }
    try {
      const payload = {
        ...form,
        commissionTotale: (parseFloat(form.commissionFixe)||0) + (parseFloat(form.commissionExtra)||0)
      };
      if (modal === 'add') { await api.post('/api/solution-express', payload); toast.success('Fiche ajoutée !'); }
      else { await api.put(`/api/solution-express/${selected._id}`, payload); toast.success('Mis à jour !'); }
      setModal(null); await fetchFiches();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  // ── Supprimer fiche ───────────────────────────────────────────────────
  const handleDelete = async (p, e) => {
    if(e) e.stopPropagation();
    if (!confirm('Supprimer cette fiche ?')) return;
    try { await api.delete(`/api/solution-express/${p._id}`); toast.success('Supprimé'); setModal(null); await fetchFiches(); }
    catch { toast.error('Erreur suppression'); }
  };

  // ── Ajouter note ──────────────────────────────────────────────────────
  const addNote = async (p) => {
    if (!noteText.trim()) return;
    try {
      const updatedNotes = [...(p.notes||[]), noteText.trim()];
      await api.put(`/api/solution-express/${p._id}`, { notes: updatedNotes });
      toast.success('Note ajoutée ✓');
      setNoteText('');
      setSelected(prev => ({ ...prev, notes: updatedNotes }));
      await fetchFiches();
    } catch { toast.error('Erreur note'); }
  };

  // ── Supprimer note ────────────────────────────────────────────────────
  const deleteNote = async (p, idx) => {
    if (!confirm('Supprimer cette note ?')) return;
    try {
      const updatedNotes = (p.notes||[]).filter((_,i) => i !== idx);
      await api.put(`/api/solution-express/${p._id}`, { notes: updatedNotes });
      toast.success('Note supprimée');
      setSelected(prev => ({ ...prev, notes: updatedNotes }));
      await fetchFiches();
    } catch { toast.error('Erreur suppression note'); }
  };

  // ── Changer statut depuis l'ultra-fiche ───────────────────────────────
  const changeStatus = (p, newStatus) => {
    if (newStatus === 'installation_annulee') { setMotifPending({ fiche: p }); return; }
    api.put(`/api/solution-express/${p._id}`, { status: newStatus })
      .then(() => { setSelected(prev => ({ ...prev, status: newStatus })); fetchFiches(); toast.success('Statut mis à jour'); })
      .catch(() => toast.error('Erreur statut'));
  };

  const confirmAnnulation = (motif) => {
    const { fiche } = motifPending;
    setMotifPending(null);
    api.put(`/api/solution-express/${fiche._id}`, { status: 'installation_annulee', motifAnnulation: motif })
      .then(() => { setSelected(prev => ({ ...prev, status: 'installation_annulee', motifAnnulation: motif })); fetchFiches(); toast.success('Installation annulée'); })
      .catch(() => toast.error('Erreur statut'));
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
      <div style={{ padding:'1.5px', borderRadius:22, background:'linear-gradient(135deg,#2215d470,#12b76a40,#61DAFB25)', marginBottom:24, animation:'fadeSlideUp 0.4s ease both' }}>
      <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:'20.5px', padding: isMobile ? '18px 16px' : '28px 32px', backdropFilter:'blur(40px)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-80, left:-60, width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(34,21,212,0.18) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-40, right:-20, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(18,183,106,0.14) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1 }}>
        {/* Ligne 1 : Icône + Titre + Bouton nouveau */}
        <div style={{ display:'flex', alignItems: isMobile?'flex-start':'center', justifyContent:'space-between', flexDirection: isMobile?'column':'row', gap: isMobile?12:0, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#2215d4,#12b76a)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 28px rgba(34,21,212,0.55)', flexShrink:0 }}>
              <Building2 size={26} color="#fff"/>
            </div>
            <div>
              <h1 style={{ margin:0, fontSize: isMobile?20:24 }}>Solution Express</h1>
              <p style={{ color:'#ffffff', fontSize:13, margin:0, marginTop:2 }}>
                CRM personnel · <span style={{ color:'#12b76a', fontWeight:700 }}>{totalFiches}</span> fiche{totalFiches!==1?'s':''}
              </p>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            {!isMobile && (
              <div style={{ fontSize:12, color:'#efefef', background:'var(--bg-card)', padding:'6px 14px', borderRadius:8, border:'1px solid var(--border)', textTransform:'capitalize', whiteSpace:'nowrap' }}>
                {new Date().toLocaleDateString('fr-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
              </div>
            )}
            <select value={anneeFiltre} onChange={e => setAnneeFiltre(e.target.value)}
              style={{ fontSize:12, padding:'7px 14px', borderRadius:9, border:'1px solid var(--bg-card)', background:'var(--bg-card)', color:'#ffffff', cursor:'pointer', outline:'none', fontWeight:700 }}>
              <option value="tout">Toutes les années</option>
              {annees.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
            <button className="btn btn-primary" onClick={openAdd}
              style={{ display:'flex', alignItems:'center', gap:8, padding: isMobile?'9px 16px':'10px 20px', fontSize:13, fontWeight:700, borderRadius:12, boxShadow:'0 4px 14px rgba(18,183,106,0.35)', transition:'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform='scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
              <Plus size={16}/> Nouvelle fiche
            </button>
          </div>
        </div>

        {/* Ligne 2 : Stats rapides + barre conversion */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(4,1fr)', gap:10, marginBottom:16 }}>
          {[
            { label:'Total',      value:totalFiches,   color:'#12b76a', suffix:' fiches' },
            { label:'Installés',  value:totalInstalle, color:'#22c55e', suffix:'' },
            { label:'Pipeline',   value:totalPipeline, color:'#f79009', suffix:'' },
            { label:'Installation',value:convRate,     color:'#61DAFB', suffix:'%' },
          ].map((s,i) => (
            <div key={i} style={{ background:`${s.color}12`, borderRadius:10, padding:'10px 14px', border:`1px solid ${s.color}25`, animation:`fadeSlideUp 0.4s ${i*0.05}s ease both` }}>
              <div style={{ fontSize:10, color:s.color, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize: isMobile?18:22, fontWeight:800 }}>
                <AnimatedNumber value={s.value} decimals={0} suffix={s.suffix} color={s.color}/>
              </div>
            </div>
          ))}
        </div>

        {/* Barre de conversion animée */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:11, color:'#ffffff' }}>
            <span>Taux d'installation</span>
            <span style={{ fontWeight:700, color:'#12b76a' }}>{convRate}%</span>
          </div>
          <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:3, background:'linear-gradient(90deg,#2215d4,#12b76a,#61DAFB)', width:`${convRate}%`, transition:'width 1.2s ease', boxShadow:'0 0 12px rgba(18,183,106,0.5)' }}/>
          </div>
        </div>
        </div>{/* /zIndex:1 */}
      </div>{/* /glassmorphism */}
      </div>{/* /gradient border */}

      {/* ════════════════════════════════════════════════════════════════
          FILTRES — glassmorphism subtil
          Mobile : caché par défaut / Desktop : visible par défaut
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ padding:'1px', borderRadius:18, background:'linear-gradient(135deg,#2215d430,#12b76a20,#61DAFB10)', marginBottom:20 }}>
      <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:17, padding:14, backdropFilter:'blur(20px)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: showFilters ? 14 : 0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Filter size={13} color="#ffffff"/>
            <span style={{ fontSize:11, color:'#ffffff', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8 }}>Filtres</span>
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
              style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer', color:'#ffffff', padding:'5px 8px', display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600 }}>
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
                ['leadType',  'Type lead',   dLead],
                ['ville',     'Ville',       Object.fromEntries(dFiltrVilles.map(v=>[v,v]))],
              ].map(([k, l, opts]) => (
                <div key={k}>
                  <div style={{ fontSize:10, color:'#ffffff', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>{l}</div>
                  <select style={iSt} value={filters[k]} onChange={e => setF(k, e.target.value)}>
                    <option value="">Tous</option>
                    {Object.entries(opts).map(([ov,ol]) => <option key={ov} value={ov}>{ol}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <div style={{ fontSize:10, color:'#ffffff', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>Trier par</div>
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
                <div style={{ fontSize:10, color:'#ffffff', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>Type commerce</div>
                <select style={iSt} value={filters.typeCommerce} onChange={e => setF('typeCommerce', e.target.value)}>
                  <option value="">Tous</option>
                  {Object.entries(dCommerce).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
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

            {/* Ligne 3 — Filtre rapide par type de service */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <div style={{ fontSize:10, color:'#ffffff', fontWeight:700, textTransform:'uppercase', display:'flex', alignItems:'center', marginRight:4 }}>Service :</div>
              {dServices.map(svc => {
                const SvcIcon = ICON_MAP[svc.icon] || Shield;
                const active  = filters.produit === svc.id;
                return (
                  <button key={svc.id}
                    onClick={() => setF('produit', active ? '' : svc.id)}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 13px', borderRadius:20, border:`1px solid ${active ? svc.color : 'rgba(255,255,255,0.15)'}`, background: active ? `${svc.color}22` : 'transparent', color: active ? svc.color : '#ffffff', fontSize:12, fontWeight: active ? 700 : 500, cursor:'pointer', transition:'all 0.15s' }}>
                    <SvcIcon size={11}/> {svc.label}
                  </button>
                );
              })}
            </div>

          </div>
        )}
      </div>
      </div>{/* /gradient border filters */}

      {/* ════════════════════════════════════════════════════════════════
          BARRE DE RECHERCHE — glow vert au focus
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ position:'relative', marginBottom:16 }}>
        <Search size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color: searchFocused ? '#12b76a' : '#ffffff', transition:'color 0.2s' }}/>
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
            style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer', color:'#ffffff', padding:'3px 6px', display:'flex', alignItems:'center' }}>
            <X size={12}/>
          </button>
        )}
      </div>

      {/* ── Compteur résultats ─────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontSize:12, color:'#ffffff', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
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
          <div style={{ position:'relative', width:44, height:44 }}>
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid rgba(129,140,248,0.12)' }}/>
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid transparent', borderTopColor:'#818cf8', animation:'spin 0.9s linear infinite' }}/>
            <div style={{ position:'absolute', inset:4, borderRadius:'50%', border:'2px solid transparent', borderBottomColor:'rgba(16,185,129,0.5)', animation:'spin 1.5s linear infinite reverse' }}/>
          </div>
        </div>
      ) : fetchError ? (
        <div className="empty-state">
          <AlertTriangle size={40} color="#f04438"/>
          <p style={{ color:'#ffffff' }}>Erreur de chargement</p>
          <button className="btn btn-primary" onClick={fetchFiches} style={{ marginTop:16 }}>Réessayer</button>
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
            const leadColor   = dLeadColors[p.leadType] || '#8b8b9e';
            const lastNote    = dernNote(p);
            return (
              <div key={p._id}
                onClick={() => openFiche(p)}
                style={{
                  background:'rgba(2,8,16,0.97)',
                  borderRadius:16, padding: isMobile?16:20,
                  cursor:'pointer', transition:'all 0.2s',
                  border:`1px solid ${statusColor}30`,
                  borderTop:`3px solid ${statusColor}`,
                  boxShadow:`0 2px 16px rgba(0,0,0,0.15)`,
                  backdropFilter:'blur(20px)',
                  animation:`fadeSlideUp 0.4s ${Math.min(i * 0.04, 0.5)}s ease both`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform='translateY(-4px)';
                  e.currentTarget.style.boxShadow=`0 16px 40px rgba(0,0,0,0.2), 0 0 0 1px ${statusColor}50`;
                  e.currentTarget.style.borderColor=`${statusColor}60`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform='';
                  e.currentTarget.style.boxShadow=`0 2px 16px rgba(0,0,0,0.15)`;
                  e.currentTarget.style.borderColor=`${statusColor}30`;
                }}>

                {/* ── Avatar + Nom + Score urgence ── */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <div className={`avatar ${AV_COLORS[i%AV_COLORS.length]}`} style={{ width:44, height:44, fontSize:15, flexShrink:0 }}>{ini(p)}</div>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'var(--text-primary)' }}>
                      {p.typeClient === 'b2c' ? `${p.prenom||''} ${p.nom||''}`.trim() || 'Sans nom' : p.entreprise || `${p.prenom||''} ${p.nom||''}`.trim() || 'Sans nom'}
                    </div>
                    {p.typeClient === 'b2b' && (`${p.prenom||''} ${p.nom||''}`.trim()) && (
                      <div style={{ fontSize:11, color:'#ffffff', marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {`${p.prenom||''} ${p.nom||''}`.trim()}
                      </div>
                    )}
                    <div style={{ fontSize:11, color:'#ffffff', marginTop:2 }}>
                      {p.typeClient==='b2b'?'🏢 B2B':'🏠 B2C'}{p.typeCommerce && p.typeCommerce!=='autre' ? ` · ${dCommerce[p.typeCommerce]||p.typeCommerce}` : ''}
                    </div>
                  </div>
                  {/* Mini ScoreRing urgence — affiché seulement si > 0 */}
                  {p.urgencyScore > 0 && <MiniScoreRing score={p.urgencyScore}/>}
                </div>

                {/* ── Badges statut + lead type ── */}
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom: p.status==='installation_annulee'&&p.motifAnnulation?4:10 }}>
                  <span className={`badge ${STATUS_CLASS[p.status]||'badge-p0'}`}>{STATUS_LABELS[p.status]}</span>
                  <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:`${leadColor}18`, color:leadColor, border:`1px solid ${leadColor}30` }}>
                    {dLead[p.leadType]||p.leadType}
                  </span>
                </div>
                {p.status === 'installation_annulee' && p.motifAnnulation && (
                  <div style={{ fontSize:10, color:'#be123c', fontWeight:600, marginBottom:8, padding:'3px 8px', borderRadius:6, background:'rgba(190,18,60,0.08)', border:'1px solid rgba(190,18,60,0.2)', display:'inline-block' }}>
                    ✕ {p.motifAnnulation}
                  </div>
                )}

                {/* ── Produits ── */}
                {(p.produits||[]).length > 0 && (
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
                    {p.produits.map(code => {
                      const svc = dServices.find(s => s.id === code);
                      if (!svc) return null;
                      const SvcIcon = ICON_MAP[svc.icon] || Tag;
                      return (
                        <span key={code} style={{ fontSize:10, fontWeight:600, padding:'3px 9px', borderRadius:20, background:`${svc.color}18`, color:svc.color, display:'inline-flex', alignItems:'center', gap:4, border:`1px solid ${svc.color}30` }}>
                          <SvcIcon size={9}/> {svc.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* ── Fournisseurs actuel ── */}
                <div style={{ display:'flex', flexDirection:'column', gap:3, marginBottom:8 }}>
                  {dServices.map(svc => {
                    const f = p.fournisseurs?.[svc.id];
                    if (!f) return null;
                    const actuelLabel  = f.actuel  !== 'inconnu' ? (svc.actuelMap[f.actuel]   || f.actuel)  : null;
                    const proposeLabel = f.propose !== 'aucun'   ? (svc.proposeMap[f.propose] || f.propose) : null;
                    if (!actuelLabel && !proposeLabel) return null;
                    const SvcIcon = ICON_MAP[svc.icon] || Shield;
                    return (
                      <span key={svc.id} style={{ fontSize:11, color:'#ffffff', display:'flex', alignItems:'center', gap:5 }}>
                        <SvcIcon size={10} color={svc.color}/>
                        {actuelLabel && <span>{actuelLabel}</span>}
                        {actuelLabel && proposeLabel && <span style={{ color:svc.color, fontWeight:600 }}>→ {proposeLabel}</span>}
                        {!actuelLabel && proposeLabel && <span style={{ color:svc.color, fontWeight:600 }}>→ {proposeLabel}</span>}
                      </span>
                    );
                  })}
                </div>

                {/* ── Équipements ── */}
                {dServices.some(svc => (p.equipements?.[svc.id]||[]).length > 0) && (
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:8 }}>
                    {dServices.flatMap(svc =>
                      (p.equipements?.[svc.id]||[]).map(eqKey => {
                        const detail = svc.equipementsDetails?.[eqKey];
                        const label  = detail?.label || svc.equipementsMap[eqKey];
                        if (!label) return null;
                        const color  = detail?.color || (detail?.category === 'extra' ? '#f79009' : svc.color);
                        return (
                          <span key={`${svc.id}:${eqKey}`} style={{ fontSize:9, padding:'2px 7px', borderRadius:10, background:`${color}12`, color, border:`1px solid ${color}25`, fontWeight:600 }}>
                            {label}
                          </span>
                        );
                      }).filter(Boolean)
                    )}
                  </div>
                )}

                {/* ── Qualification système ── */}
                {p.qualificationSysteme && p.qualificationSysteme!=='inconnu' && (
                  <div style={{ fontSize:11, color:'#ffffff', marginBottom:8, background:'var(--bg-secondary)', padding:'4px 8px', borderRadius:6, display:'inline-block' }}>
                    🔒 {dQualif[p.qualificationSysteme]||p.qualificationSysteme}
                  </div>
                )}

                {/* ── Résumé tronqué ── */}
                {p.summary && (
                  <div style={{ fontSize:12, color:'#ffffff', marginBottom:8, lineHeight:1.5, background:'var(--bg-secondary)', padding:'8px 10px', borderRadius:8, borderLeft:`3px solid ${leadColor}`, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    {p.summary}
                  </div>
                )}

                {/* ── Dernière note ── */}
                {lastNote && (
                  <div style={{ fontSize:11, color:'#ffffff', marginBottom:8, background:'var(--bg-secondary)', padding:'6px 10px', borderRadius:8, borderLeft:'3px solid #12b76a', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', fontStyle:'italic' }}>
                    💬 {lastNote}
                  </div>
                )}

                {/* ── Contact ── */}
                <div style={{ display:'flex', flexDirection:'column', gap:3, marginBottom:8 }}>
                  {p.telephone && <span style={{ fontSize:12, color:'#ffffff', display:'flex', alignItems:'center', gap:6 }}><Phone size={11}/>{p.telephone}</span>}
                  {p.email     && <span style={{ fontSize:12, color:'#ffffff', display:'flex', alignItems:'center', gap:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}><Mail size={11}/>{p.email}</span>}
                  {p.ville     && <span style={{ fontSize:12, color:'#ffffff', display:'flex', alignItems:'center', gap:6 }}><MapPin size={11}/>{p.ville}</span>}
                  {(p.prenom||p.nom) && <span style={{ fontSize:12, color:'#ffffff', display:'flex', alignItems:'center', gap:6 }}><User size={11}/>{p.prenom} {p.nom}</span>}
                  {p.dateVente && <span style={{ fontSize:11, color:'#ffffff', display:'flex', alignItems:'center', gap:6 }}><Calendar size={10}/>{fmtDate(p.dateVente)}</span>}
                </div>

                {/* ── Badge commission ── */}
                <div onClick={e => e.stopPropagation()}>
                  <CommissionBadge fiche={p} onToggle={togglePaiement}/>
                </div>

                {/* ── Actions rapides ── */}
                <div style={{ display:'flex', gap:6, marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                  <button onClick={e => openEdit(p,e)}
                    style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'6px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', cursor:'pointer', fontSize:11, color:'#ffffff', transition:'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#3b6cf8'; e.currentTarget.style.color='#3b6cf8'; e.currentTarget.style.background='rgba(59,108,248,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='#ffffff'; e.currentTarget.style.background='var(--bg-secondary)'; }}>
                    <Edit2 size={12}/> Modifier
                  </button>
                  <button onClick={e => handleDelete(p,e)}
                    style={{ width:34, display:'flex', alignItems:'center', justifyContent:'center', padding:'6px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', cursor:'pointer', fontSize:11, color:'#ffffff', transition:'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#f04438'; e.currentTarget.style.color='#f04438'; e.currentTarget.style.background='rgba(240,68,56,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='#ffffff'; e.currentTarget.style.background='var(--bg-secondary)'; }}>
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
          <div style={{ background:'rgba(3,8,26,0.98)', borderRadius: isMobile?0:16, width:'100%', maxWidth:940, margin:'0 auto', overflow:'hidden', boxShadow:`0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px ${STATUS_COLORS[selected.status]||'#12b76a'}30`, backdropFilter:'blur(40px)' }}>

            {/* En-tête avec gradient selon statut */}
            <div style={{ background:`linear-gradient(135deg,${STATUS_COLORS[selected.status]||'#12b76a'}20,transparent)`, borderBottom:`3px solid ${STATUS_COLORS[selected.status]||'#12b76a'}`, padding: isMobile?'20px 16px 16px':'28px 28px 20px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div className={`avatar ${AV_COLORS[0]}`} style={{ width: isMobile?48:64, height: isMobile?48:64, fontSize: isMobile?18:22, flexShrink:0 }}>{ini(selected)}</div>
                  <div>
                    <h2 style={{ margin:'0 0 4px', fontSize: isMobile?18:22 }}>{selected.typeClient === 'b2c' ? `${selected.prenom||''} ${selected.nom||''}`.trim() || 'Sans nom' : selected.entreprise || `${selected.prenom||''} ${selected.nom||''}`.trim() || 'Sans nom'}</h2>
                    <div style={{ fontSize:13, color:'#ffffff', marginBottom:8 }}>
                      {selected.typeClient==='b2b'?'🏢 B2B':'🏠 B2C'} · {dCommerce[selected.typeCommerce]||''} {selected.ville?`· ${selected.ville}`:''}
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <span className={`badge ${STATUS_CLASS[selected.status]||'badge-p0'}`}>{STATUS_LABELS[selected.status]}</span>
                      <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background:`${dLeadColors[selected.leadType]||'#8b8b9e'}20`, color:dLeadColors[selected.leadType]||'#8b8b9e' }}>{dLead[selected.leadType]||selected.leadType}</span>
                      {(selected.produits||[]).map(code => {
                        const svc = dServices.find(s => s.id === code);
                        if (!svc) return null;
                        const SvcIcon = ICON_MAP[svc.icon] || Tag;
                        return (
                          <span key={code} style={{ fontSize:10, fontWeight:600, padding:'3px 9px', borderRadius:20, background:`${svc.color}18`, color:svc.color, display:'inline-flex', alignItems:'center', gap:4, border:`1px solid ${svc.color}30` }}>
                            <SvcIcon size={9}/> {svc.label}
                          </span>
                        );
                      })}
                    </div>
                    {selected.status === 'installation_annulee' && selected.motifAnnulation && (
                      <div style={{ marginTop:10, display:'inline-flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:10, background:'rgba(190,18,60,0.08)', border:'1px solid rgba(190,18,60,0.25)' }}>
                        <span style={{ fontSize:12, color:'#be123c', fontWeight:700 }}>✕ Motif d'annulation :</span>
                        <span style={{ fontSize:12, color:'#fca5a5', fontWeight:600 }}>{selected.motifAnnulation}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}><X size={16}/></button>
              </div>
            </div>

            <div style={{ padding: isMobile?'16px':'28px' }}>

              {/* ── Pipeline stepper horizontal ── */}
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:11, color:'#ffffff', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>Pipeline</div>
                <div style={{ display:'flex', gap: isMobile?4:8, flexWrap:'wrap' }}>
                  {Object.entries(STATUS_LABELS).map(([k,v]) => (
                    <button key={k} onClick={() => changeStatus(selected,k)}
                      style={{ padding: isMobile?'5px 10px':'6px 14px', borderRadius:20, fontSize: isMobile?11:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                        border:`2px solid ${selected.status===k?STATUS_COLORS[k]:'var(--border)'}`,
                        background:selected.status===k?STATUS_COLORS[k]:'rgba(5,12,32,0.9)',
                        color:selected.status===k?'#fff':'#ffffff' }}>
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
                      <div key={s.label} style={{ background:'rgba(4,10,24,0.95)', borderRadius:10, padding:'10px 14px', textAlign:'center', border:'1px solid rgba(255,255,255,0.05)', transition:'transform 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                        <div style={{ fontSize:10, color:'#ffffff', fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>{s.label}</div>
                        <div style={{ fontSize: isMobile?16:18, fontWeight:700, color:s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
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
                  <InfoRow icon={<Shield size={12}/>}   label="Qualification" val={dQualif[selected.qualificationSysteme]} />
                  <InfoRow icon={<Calendar size={12}/>} label="Ajouté le"     val={fmtDate(selected.createdAt)} />
                </FicheSection>
              </div>

              {/* ── Fournisseurs avec hover slide ── */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, color:'#ffffff', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>Fournisseurs — Actuel → Proposé</div>
                <div style={{ background:'rgba(4,10,24,0.95)', borderRadius:10, padding:'16px', border:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column', gap:12 }}>
                  {dServices.map(svc => {
                    const SvcIcon = ICON_MAP[svc.icon] || Shield;
                    const f      = selected.fournisseurs?.[svc.id];
                    const equips = (selected.equipements?.[svc.id] || [])
                      .map(k => ({ detail: svc.equipementsDetails?.[k], label: svc.equipementsMap[k] }))
                      .filter(e => e.label);
                    return (
                      <div key={svc.id}>
                        <FournisseurRow
                          icon={<SvcIcon size={13} color={svc.color}/>}
                          color={svc.color} label={svc.label}
                          actuel={getFournLabel(svc.id, f?.actuel)}
                          propose={getFournLabel(svc.id, f?.propose)}
                        />
                        {equips.length > 0 && (
                          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:6, paddingLeft:22 }}>
                            {equips.map(({ detail, label }) => {
                              const color = detail?.color || (detail?.category === 'extra' ? '#f79009' : svc.color);
                              return (
                                <span key={label} style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:`${color}12`, color, border:`1px solid ${color}25`, fontWeight:600 }}>
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Résumé ── */}
              {selected.summary && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, color:'#ffffff', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>Résumé</div>
                  <div style={{ background:'rgba(4,10,24,0.95)', borderRadius:10, padding:'14px 16px', fontSize:13, color:'#ffffff', lineHeight:1.7, borderLeft:'3px solid #12b76a', border:'1px solid rgba(255,255,255,0.05)', borderLeftWidth:3, whiteSpace:'pre-wrap' }}>{selected.summary}</div>
                </div>
              )}

              {/* ── URL source ── */}
              {selected.sourceUrl && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, color:'#ffffff', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>URL source</div>
                  <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:12, color:'#3b6cf8', wordBreak:'break-all', display:'block', background:'rgba(4,10,24,0.95)', borderRadius:10, padding:'10px 14px', border:'1px solid rgba(255,255,255,0.05)' }}>
                    {selected.sourceUrl}
                  </a>
                </div>
              )}

              {/* ── Texte source ── */}
              {selected.sourceText && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, color:'#ffffff', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>Texte source</div>
                  <div style={{ background:'rgba(4,10,24,0.95)', borderRadius:10, padding:'14px 16px', fontSize:12, color:'#ffffff', lineHeight:1.6, borderLeft:'3px solid rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.05)', borderLeftWidth:3, whiteSpace:'pre-wrap', maxHeight:160, overflowY:'auto' }}>{selected.sourceText}</div>
                </div>
              )}

              {/* ── Notes avec timeline ── */}
              <div>
                <div style={{ fontSize:11, color:'#ffffff', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 }}>
                  Notes ({selected.notes?.length||0})
                </div>
                {selected.notes?.length > 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                    {[...selected.notes].reverse().map((n, idx) => {
                      const realIdx = (selected.notes.length-1) - idx;
                      return (
                        <div key={realIdx} style={{ background:'rgba(4,10,24,0.95)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#ffffff', lineHeight:1.5, borderLeft:'3px solid #12b76a', border:'1px solid rgba(255,255,255,0.05)', borderLeftWidth:3, display:'flex', alignItems:'flex-start', gap:10, transition:'transform 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.transform='translateX(3px)'}
                          onMouseLeave={e => e.currentTarget.style.transform='translateX(0)'}>
                          <span style={{ flex:1 }}>{n}</span>
                          <button onClick={() => deleteNote(selected, realIdx)}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'#ffffff', flexShrink:0, padding:'2px', borderRadius:4, transition:'color 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.color='var(--danger)'}
                            onMouseLeave={e => e.currentTarget.style.color='#ffffff'}><Trash2 size={13}/></button>
                        </div>
                      );
                    })}
                  </div>
                ) : <div style={{ color:'#ffffff', fontSize:13, padding:'12px 0', marginBottom:12 }}>Aucune note pour l'instant</div>}
                <textarea className="input" style={{ resize:'vertical', minHeight:80, marginBottom:8 }} placeholder="Ajouter une note..." value={noteText} onChange={e => setNoteText(e.target.value)}/>
                <button className="btn btn-primary" onClick={() => addNote(selected)} style={{ width:'100%' }}>
                  <Plus size={13}/> Ajouter la note
                </button>
              </div>
            </div>

            {/* Footer ultra-fiche */}
            <div style={{ padding: isMobile?'12px 16px':'16px 28px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', justifyContent:'space-between', background:'rgba(3,8,26,0.98)' }}>
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
          <div style={{ background:'rgba(3,8,26,0.98)', borderRadius: isMobile?0:16, width:'100%', maxWidth:680, margin:'auto', overflow:'hidden', boxShadow:`0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px ${STATUS_COLORS[form.status]||'#12b76a'}30`, backdropFilter:'blur(40px)', maxHeight: isMobile?'100vh':'90vh', display:'flex', flexDirection:'column' }}>

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
                    <div style={{ fontSize:12, color:'#ffffff' }}>
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
                      color: activeTab===idx ? (STATUS_COLORS[form.status]||'#12b76a') : '#ffffff',
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
                        {dVilles.filter(v=>v).map(v => <option key={v}>{v}</option>)}
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
                        {Object.entries(dCommerce).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Type de lead</label>
                      <select className="select" value={form.leadType} onChange={e => setFld('leadType',e.target.value)}>
                        {Object.entries(dLead).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">URL source</label><input className="input" placeholder="https://..." value={form.sourceUrl||''} onChange={e => setFld('sourceUrl',e.target.value)}/></div>
                  </div>
                  <div>
                    <label className="form-label" style={{ marginBottom:8, display:'block' }}>Produits d'intérêt</label>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {dServices.map(svc => {
                        const sel     = (form.produits||[]).includes(svc.id);
                        const SvcIcon = ICON_MAP[svc.icon] || Tag;
                        return (
                          <button key={svc.id} type="button" onClick={() => toggleProduit(svc.id)}
                            style={{ padding:'8px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                              border:`2px solid ${sel ? svc.color : 'var(--border)'}`,
                              background: sel ? `${svc.color}18` : 'var(--bg-secondary)',
                              color: sel ? svc.color : '#ffffff',
                              display:'flex', alignItems:'center', gap:6,
                              transform: sel ? 'scale(1.05)' : 'scale(1)' }}>
                            <SvcIcon size={13}/> {svc.label}
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
                      {Object.entries(dQualif).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  {dServices.map(svc => {
                    const SvcIcon = ICON_MAP[svc.icon] || Shield;
                    const f = form.fournisseurs?.[svc.id] || { actuel: 'inconnu', propose: 'aucun' };
                    const setFourn = (k, v) => setForm(prev => ({
                      ...prev,
                      fournisseurs: { ...prev.fournisseurs, [svc.id]: { ...(prev.fournisseurs?.[svc.id]||{}), [k]: v } }
                    }));
                    return (
                      <div key={svc.id} style={{ background:'rgba(4,10,24,0.95)', borderRadius:10, padding:'14px 16px', border:'1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                          <SvcIcon size={14} color={svc.color}/><span style={{ fontSize:13, fontWeight:600 }}>{svc.label}</span>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr auto 1fr', gap:10, alignItems:'center' }}>
                          <div>
                            <div style={{ fontSize:10, color:'#ffffff', fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>Actuel</div>
                            <select className="select" value={f.actuel} onChange={e => setFourn('actuel', e.target.value)}>
                              {(svc.actuel||[]).map(({key,label}) => <option key={key} value={key}>{label}</option>)}
                            </select>
                          </div>
                          {!isMobile && <div style={{ textAlign:'center', color:'#ffffff', fontSize:20, paddingTop:16 }}>→</div>}
                          <div>
                            <div style={{ fontSize:10, color:svc.color, fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>Proposé</div>
                            <select className="select" value={f.propose} onChange={e => setFourn('propose', e.target.value)} style={{ borderColor:`${svc.color}40` }}>
                              {(svc.propose||[]).map(({key,label}) => <option key={key} value={key}>{label}</option>)}
                            </select>
                          </div>
                        </div>
                        {/* ── Équipements : 2 sections indépendantes ── */}
                        {(svc.equipements||[]).length > 0 && (
                          <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', gap:14 }}>

                            {/* Pack de base */}
                            {(svc.equipements||[]).some(e => e.category === 'base') && (
                              <div>
                                <div style={{ fontSize:10, fontWeight:700, color:svc.color, textTransform:'uppercase', letterSpacing:0.6, marginBottom:8, padding:'3px 10px', background:`${svc.color}15`, borderRadius:5, display:'inline-block' }}>
                                  Pack de base
                                </div>
                                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                  {(svc.equipements||[])
                                    .filter(e => e.category === 'base')
                                    .map(eq => {
                                      const sel   = (form.equipements?.[svc.id]||[]).includes(eq.key);
                                      const color = eq.color || svc.color;
                                      return (
                                        <button
                                          key={eq.key}
                                          type="button"
                                          onClick={() => toggleEquipement(svc.id, eq.key)}
                                          style={{
                                            padding:'6px 13px', borderRadius:20, fontSize:12, fontWeight:600,
                                            cursor:'pointer', transition:'all 0.15s', userSelect:'none',
                                            border:`2px solid ${sel ? color : 'rgba(255,255,255,0.1)'}`,
                                            background: sel ? `${color}22` : 'rgba(255,255,255,0.03)',
                                            color: sel ? color : 'rgba(255,255,255,0.5)',
                                            boxShadow: sel ? `0 0 10px ${color}40` : 'none',
                                            transform: sel ? 'scale(1.05)' : 'scale(1)'
                                          }}
                                        >
                                          {sel ? '✓ ' : ''}{eq.label}
                                        </button>
                                      );
                                    })}
                                </div>
                              </div>
                            )}

                            {/* Équipements extra */}
                            {(svc.equipements||[]).some(e => e.category === 'extra') && (
                              <div>
                                <div style={{ fontSize:10, fontWeight:700, color:'#f79009', textTransform:'uppercase', letterSpacing:0.6, marginBottom:8, padding:'3px 10px', background:'rgba(247,144,9,0.12)', borderRadius:5, display:'inline-block' }}>
                                  Équipements extra
                                </div>
                                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                  {(svc.equipements||[])
                                    .filter(e => e.category === 'extra')
                                    .map(eq => {
                                      const sel   = (form.equipements?.[svc.id]||[]).includes(eq.key);
                                      const color = eq.color || '#f79009';
                                      return (
                                        <button
                                          key={eq.key}
                                          type="button"
                                          onClick={() => toggleEquipement(svc.id, eq.key)}
                                          style={{
                                            padding:'6px 13px', borderRadius:20, fontSize:12, fontWeight:600,
                                            cursor:'pointer', transition:'all 0.15s', userSelect:'none',
                                            border:`2px solid ${sel ? color : 'rgba(255,255,255,0.1)'}`,
                                            background: sel ? `${color}22` : 'rgba(255,255,255,0.03)',
                                            color: sel ? color : 'rgba(255,255,255,0.5)',
                                            boxShadow: sel ? `0 0 10px ${color}40` : 'none',
                                            transform: sel ? 'scale(1.05)' : 'scale(1)'
                                          }}
                                        >
                                          {sel ? '✓ ' : ''}{eq.label}
                                        </button>
                                      );
                                    })}
                                </div>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Onglet 3 : Commission ── */}
              {activeTab === 3 && (
                <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeSlideUp 0.2s ease both' }}>

                  {/* Preview total animé */}
                  <div style={{ background: form.commissionPayee ? 'rgba(18,183,106,0.08)' : 'rgba(247,144,9,0.08)', borderRadius:14, padding:'22px', border:`2px solid ${form.commissionPayee ? '#12b76a' : '#f79009'}30`, textAlign:'center' }}>
                    <div style={{ fontSize:11, color:'#ffffff', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:6 }}>Total commission</div>
                    <div style={{ fontSize:36, fontWeight:800, color: form.commissionPayee ? '#12b76a' : '#f79009', lineHeight:1 }}>
                      {((parseFloat(form.commissionFixe)||0) + (parseFloat(form.commissionExtra)||0)).toFixed(2)} TND
                    </div>
                    <div style={{ fontSize:12, color:'#ffffff', marginTop:8, display:'flex', justifyContent:'center', gap:16 }}>
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
                      <div style={{ fontSize:11, color:'#ffffff', marginTop:4 }}>Ta commission de base</div>
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
                      <div style={{ fontSize:11, color:'#ffffff', marginTop:4 }}>Pour équipements additionnels</div>
                    </div>
                  </div>

                  {/* Date de vente */}
                  <div className="form-group">
                    <label className="form-label">Date de vente</label>
                    <DatePicker value={form.dateVente ? form.dateVente.slice(0,10) : ''} onChange={v => setFld('dateVente', v)} placeholder="Choisir une date de vente"/>
                  </div>

                  {/* Toggle payée */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(4,10,24,0.95)', borderRadius:12, padding:'16px 18px', border:'1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>Statut du paiement</div>
                      <div style={{ fontSize:11, color:'#ffffff', marginTop:3 }}>
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
            <div style={{ padding:'14px 24px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(3,8,26,0.98)' }}>
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

      {/* ── Modal motif d'annulation ── */}
      {motifPending && (
        <div onClick={() => setMotifPending(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(6px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'var(--bg-card)', borderRadius:20, padding:24, width:'100%', maxWidth:360, border:'1px solid rgba(240,68,56,0.3)', boxShadow:'0 20px 60px rgba(0,0,0,0.5)', animation:'fadeSlideUp 0.2s ease both' }}>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>⚠️ Motif d'annulation</div>
            <div style={{ fontSize:12, color:'#ffffff', marginBottom:16 }}>Pourquoi cette installation a-t-elle été annulée ?</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {(settings?.motifsAnnulation?.length ? settings.motifsAnnulation : ['Prix trop élevé','Délai trop long','Concurrent','Client non disponible','Autre']).map(motif => (
                <button key={motif} onClick={() => confirmAnnulation(motif)}
                  style={{ padding:'10px 16px', borderRadius:10, border:'1px solid rgba(240,68,56,0.3)', background:'rgba(240,68,56,0.06)', color:'#f04438', fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(240,68,56,0.14)'; e.currentTarget.style.borderColor='#f04438'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(240,68,56,0.06)'; e.currentTarget.style.borderColor='rgba(240,68,56,0.3)'; }}>
                  {motif}
                </button>
              ))}
              <button onClick={() => confirmAnnulation('')} style={{ padding:'8px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(255,255,255,0.4)', fontSize:12, cursor:'pointer', marginTop:4 }}>
                Annuler sans motif
              </button>
            </div>
            <button onClick={() => setMotifPending(null)} style={{ marginTop:12, width:'100%', padding:'8px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'#ffffff', cursor:'pointer', fontSize:13 }}>
              ← Retour
            </button>
          </div>
        </div>
      )}

      {/* ── Keyframes animations ── */}
      <style>{`
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes commPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(247,144,9,0); }
          50%       { box-shadow: 0 0 0 4px rgba(247,144,9,0.15); }
        }
      `}</style>
    </div>
  );
}
