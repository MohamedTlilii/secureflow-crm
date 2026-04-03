// ════════════════════════════════════════════════════════════════════════════
// client/src/pages/Dashboard.jsx
// Solution Express uniquement
// ════════════════════════════════════════════════════════════════════════════
// RESPONSIVE  : iPhone 12 Pro Max (430px) et tous les mobiles (breakpoint 768px)
// DESIGN      : Header glassmorphism, ScoreRings animés, chiffres animés
// FILTRE      : Un seul filtre année global — tout la page change selon l'année
// LOGIQUE     : Fetch /api/solution-express + calcul frontend de toutes les stats
// API         : GET /api/stats?periode=tout + GET /api/solution-express
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useRef } from 'react';
import api from '../api';
import {
  Users, TrendingUp, CheckCircle, AlertCircle, Clock,
  MapPin, Zap, Building2, Shield, Wifi, Smartphone, Video, Wallet,
  Target, Filter,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

// ── Constantes labels ─────────────────────────────────────────────────────
const PRODUIT_COLORS = { alarme:'#f04438', cameras:'#a764f8', internet:'#3b6cf8', mobile:'#12b76a', controle_acces:'#f79009', autre:'#8b8b9e' };
const PRODUIT_LABELS = { alarme:'Alarme', cameras:'Caméras', internet:'Internet', mobile:'Mobile', controle_acces:'Contrôle accès', autre:'Autre' };
const PRODUIT_ICONS  = { alarme:Shield, cameras:Video, internet:Wifi, mobile:Smartphone, controle_acces:Shield, autre:Zap };
const QUALIF_LABELS  = {
  pas_de_systeme:'Pas de système', systeme_plus_10_ans:'+10 ans',
  systeme_non_connecte_nouveau_proprio:'Non connecté (nouveau proprio)',
  systeme_non_connecte_insatisfait:'Non connecté (insatisfait)',
  systeme_non_connecte_diy:'Non connecté (DIY)',
  systeme_moins_5_ans_avec_contrat:'-5 ans avec contrat',
  systeme_moins_5_ans_sans_contrat:'-5 ans sans contrat',
  systeme_5_10_ans_panneau_tactile:'5-10 ans (tactile)',
  systeme_5_10_ans_panneau_boutons:'5-10 ans (boutons)',
  inconnu:'Inconnu'
};
const FOURN_LABELS = {
  adt:'ADT', bell_alarme:'Bell Alarme', telus_alarme:'Telus Alarme',
  gardaworld:'GardaWorld', api_alarm:'API Alarm', securitas:'Securitas',
  alarme_mirabel:'Alarme Mirabel', alarme_signal_teck:'Signal Teck', allo_alarme:'AlloAlarme',
  videotron:'Vidéotron', bell_internet:'Bell Internet', cogeco:'Cogeco',
  distributel:'Distributel', teksavvy:'TekSavvy', ebox:'EBox',
  bell_mobile:'Bell Mobile', telus_mobile:'Telus Mobile', rogers:'Rogers',
  fizz:'Fizz', koodo:'Koodo', public_mobile:'Public Mobile',
  fido:'Fido', chatr:'Chatr', virgin_plus:'Virgin Plus',
  inconnu:'Inconnu', aucun:'Aucun', autre:'Autre'
};
const LEAD_TYPE_LABELS = { nouvelle_entreprise:'Nouvelle entreprise', demenagement:'Déménagement', reouverture:'Réouverture', commerce_existant:'Commerce existant', autre:'Autre' };
const LEAD_TYPE_COLORS = { nouvelle_entreprise:'#12b76a', demenagement:'#0077b5', reouverture:'#f79009', commerce_existant:'#a764f8', autre:'#8b8b9e' };
const STATUS_COLORS    = { new:'#3b6cf8', contacted:'#f79009', interested:'#12b76a', proposal:'#a764f8', won:'#12b76a', lost:'#f04438', ignored:'#8b8b9e' };
const STATUS_LABELS_FR = { new:'Nouveau', contacted:'Contacté', interested:'Intéressé', proposal:'Soumission', won:'Gagné', lost:'Perdu', ignored:'Ignoré' };

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT : ProgressBar
// ════════════════════════════════════════════════════════════════════════════
function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value/max)*100) : 0;
  return (
    <div style={{ flex:1, height:5, borderRadius:3, background:'var(--border)', overflow:'hidden' }}>
      <div style={{ height:'100%', borderRadius:3, background:color||'var(--accent)', width:`${pct}%`, transition:'width 0.8s ease' }}/>
    </div>
  );
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
// COMPOSANT : ScoreRing
// Anneau SVG animé — se remplit selon value/max
// ════════════════════════════════════════════════════════════════════════════
function ScoreRing({ value, max, color, label, sublabel }) {
  const [animated, setAnimated] = useState(0);
  const pct  = max > 0 ? (value / max) : 0;
  const r    = 36;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    const timeout = setTimeout(() => setAnimated(pct), 200);
    return () => clearTimeout(timeout);
  }, [pct]);

  const dash = circ * animated;

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <div style={{ position:'relative', width:90, height:90 }}>
        <svg width={90} height={90} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={7}/>
          <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={7}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition:'stroke-dasharray 1s ease' }}/>
        </svg>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
          <div style={{ fontSize:18, fontWeight:800, color, lineHeight:1 }}>{value}</div>
          <div style={{ fontSize:8, color:'rgba(255,255,255,0.5)', fontWeight:600, textTransform:'uppercase', lineHeight:1.2 }}>{label}</div>
        </div>
      </div>
      <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', textAlign:'center' }}>{sublabel}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL : Dashboard
// ════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const isMobile = useIsMobile();

  // ── États ─────────────────────────────────────────────────────────────
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [seFiches, setSeFiches]       = useState([]);   // Toutes les fiches SE
  const [anneeGlobal, setAnneeGlobal] = useState('tout'); // UN seul filtre année pour toute la page
  const [commFiltre, setCommFiltre]   = useState('tout');

  // ── Fetch données ─────────────────────────────────────────────────────
  useEffect(() => {
    // Stats globales (pour commissions déjà calculées côté backend)
    api.get('/api/stats?periode=tout')
      .then(r => setStats(r.data))
      .catch(err => console.error('Dashboard stats error:', err))
      .finally(() => setLoading(false));

    // Toutes les fiches SE — pour filtrage dynamique côté frontend
    api.get('/api/solution-express')
      .then(r => setSeFiches(r.data||[]))
      .catch(err => console.error('SE fetch error:', err));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div style={{ width:36, height:36, border:'3px solid rgba(59,108,248,0.2)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
    </div>
  );
  if (!stats) return <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}>Erreur chargement</div>;

  // ── Années disponibles selon données réelles ──────────────────────────
  const annees = [...new Set(seFiches.map(f => new Date(f.dateVente||f.createdAt).getFullYear()))].sort((a,b) => b-a);

  // ── Fiches filtrées par année globale ─────────────────────────────────
  const fiches = anneeGlobal === 'tout'
    ? seFiches
    : seFiches.filter(f => String(new Date(f.dateVente||f.createdAt).getFullYear()) === anneeGlobal);

  // ── Stats calculées depuis fiches filtrées ────────────────────────────

  // Statuts
  const seStatuts = {
    new:        fiches.filter(f => f.status === 'new').length,
    contacted:  fiches.filter(f => f.status === 'contacted').length,
    interested: fiches.filter(f => f.status === 'interested').length,
    proposal:   fiches.filter(f => f.status === 'proposal').length,
    won:        fiches.filter(f => f.status === 'won').length,
    lost:       fiches.filter(f => f.status === 'lost').length,
  };
  const totalSE    = fiches.length;
  const b2b        = fiches.filter(f => f.typeClient === 'b2b').length;
  const b2c        = fiches.filter(f => f.typeClient === 'b2c').length;
  const won        = seStatuts.won;
  const urgent     = fiches.filter(f => (f.urgencyScore||0) >= 7).length;
  const enPipeline = seStatuts.contacted + seStatuts.interested + seStatuts.proposal;
  const convRate   = totalSE > 0 ? Math.round((won / totalSE) * 100) : 0;
  const avgUrgence = fiches.length > 0
    ? Math.round((fiches.reduce((s,f) => s + (f.urgencyScore||0), 0) / fiches.length) * 10) / 10
    : 0;

  // Top villes
  const cityMap = {};
  fiches.forEach(f => { if(f.ville) cityMap[f.ville] = (cityMap[f.ville]||0) + 1; });
  const byCity = Object.entries(cityMap).map(([_id,count]) => ({_id,count})).sort((a,b) => b.count-a.count).slice(0,8);

  // Produits
  const produitMap = {};
  fiches.forEach(f => (f.produits||[]).forEach(p => { produitMap[p] = (produitMap[p]||0) + 1; }));
  const byProduit = Object.entries(produitMap).map(([_id,count]) => ({_id,count})).sort((a,b) => b.count-a.count);

  // Qualification
  const qualifMap = {};
  fiches.forEach(f => { if(f.qualificationSysteme && f.qualificationSysteme !== 'inconnu' && f.qualificationSysteme !== '') qualifMap[f.qualificationSysteme] = (qualifMap[f.qualificationSysteme]||0) + 1; });
  const byQualif = Object.entries(qualifMap).map(([_id,count]) => ({_id,count})).sort((a,b) => b.count-a.count).slice(0,6);

  // Fournisseurs
  const fournMap = {};
  fiches.forEach(f => {
    [f.fournisseurAlarme, f.fournisseurInternet, f.fournisseurMobile].forEach(fo => {
      if(fo && !['inconnu','aucun',''].includes(fo)) fournMap[fo] = (fournMap[fo]||0) + 1;
    });
  });
  const byFourn = Object.entries(fournMap).map(([_id,count]) => ({_id,count})).sort((a,b) => b.count-a.count).slice(0,6);

  // Types de lead
  const leadMap = {};
  fiches.forEach(f => { if(f.leadType) leadMap[f.leadType] = (leadMap[f.leadType]||0) + 1; });
  const byLeadType = Object.entries(leadMap).map(([_id,count]) => ({_id,count})).sort((a,b) => b.count-a.count);

  // Leads récents (triés par date)
  const recentProspects = [...fiches].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0,6);

  // Pipeline data pour graphique
  const pipelineData = [
    { name:'Nouveau',    value:seStatuts.new,        color:'#3b6cf8' },
    { name:'Contacté',   value:seStatuts.contacted,  color:'#f79009' },
    { name:'Intéressé',  value:seStatuts.interested, color:'#12b76a' },
    { name:'Soumission', value:seStatuts.proposal,   color:'#a764f8' },
    { name:'Gagné',      value:seStatuts.won,        color:'#12b76a' },
    { name:'Perdu',      value:seStatuts.lost,       color:'#f04438' },
  ].filter(x => x.value > 0);

  // Commissions filtrées par année
  const commissions = stats.commissions;
  const commFiches = (commissions?.historique||[]).filter(c => {
    const yr = new Date(c.dateVente||c.createdAt).getFullYear();
    const yearOk   = anneeGlobal === 'tout' || String(yr) === anneeGlobal;
    const statutOk = commFiltre === 'tout' ? true : commFiltre === 'payee' ? c.commissionPayee : !c.commissionPayee;
    return yearOk && statutOk;
  });
  const commTotalGagne = commFiches.reduce((s,c) => s+(c.commissionTotale||0), 0);
  const commTotalPaye  = commFiches.filter(c=>c.commissionPayee).reduce((s,c) => s+(c.commissionTotale||0), 0);
  const commEnAttente  = commTotalGagne - commTotalPaye;
  const commVals       = commFiches.map(c=>c.commissionTotale||0).filter(v=>v>0);
  const commMax        = commVals.length > 0 ? Math.max(...commVals) : 0;
  const commMin        = commVals.length > 0 ? Math.min(...commVals) : 0;

  return (
    <div className="animate-fade">

      {/* ════════════════════════════════════════════════════════════════
          HEADER GLASSMORPHISM
          Gradient bleu/vert + filtre année global + ScoreRings + barre conversion
          ════════════════════════════════════════════════════════════════ */}
      <div style={{
        background:'linear-gradient(135deg,rgba(59,108,248,0.12),rgba(18,183,106,0.08),rgba(59,108,248,0.06))',
        borderRadius:20, padding: isMobile ? '20px 16px' : '24px 28px',
        marginBottom:24, border:'1px solid rgba(59,108,248,0.2)',
        boxShadow:'0 8px 32px rgba(59,108,248,0.1)',
        backdropFilter:'blur(10px)',
        animation:'fadeSlideUp 0.4s ease both'
      }}>

        {/* Ligne 1 : Titre + filtre année global */}
        <div style={{ display:'flex', alignItems: isMobile?'flex-start':'center', justifyContent:'space-between', flexDirection: isMobile?'column':'row', gap: isMobile?12:0, marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#3b6cf8,#12b76a)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 20px rgba(59,108,248,0.4)', flexShrink:0 }}>
              <Target size={26} color="#fff"/>
            </div>
            <div>
              <h1 style={{ margin:0, fontSize: isMobile?20:24 }}>Dashboard</h1>
              <p style={{ color: 'white', fontSize: 13, margin: 0, marginTop: 2 }}>
  Solution Express · <span style={{ color: '#2a99de', fontWeight: 700 }}>{totalSE}</span> Fiche{totalSE !== 1 ? 's' : ''}
  {anneeGlobal !== 'tout' && <span style={{ color: '#2a99de', fontWeight: 700 }}> · {anneeGlobal}</span>}
</p>
            </div>
          </div>

          {/* Filtre année global — contrôle TOUTE la page */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
             {!isMobile && (
              <div style={{ fontSize:12, color:'#efefef', background:'var(--bg-card)', padding:'6px 14px', borderRadius:8, border:'1px solid var(--border)', textTransform:'capitalize' }}>
  {new Date().toLocaleDateString('fr-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
</div>
            )}
            <select value={anneeGlobal} onChange={e => setAnneeGlobal(e.target.value)}
              style={{ fontSize:12, padding:'7px 14px', borderRadius:9, border:'1px solid var(--bg-card)', background:'var(--bg-card)', color:'#cfd1d2', cursor:'pointer', outline:'none', fontWeight:700 }}>
              <option value="tout">Toutes les années</option>
              {annees.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
                        

           
          </div>
        </div>

        {/* Ligne 2 : Score conversion + Rings */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexDirection: isMobile?'column':'row', gap:20 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize: isMobile?22:28, fontWeight:800, color:'var(--text-primary)', marginBottom:4 }}>
              <AnimatedNumber value={convRate} decimals={0} suffix="% de conversion" color="var(--text-primary)"/>
            </div>
            <div style={{ fontSize:12, color:'white', marginBottom:12 }}>
              {won} gagné{won!==1?'s':''} sur {totalSE} fiche{totalSE!==1?'s':''}
            </div>
            {/* Barre conversion animée */}
            <div style={{ height:8, borderRadius:4, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:4, background:'linear-gradient(90deg,#3b6cf8,#12b76a)', width:`${convRate}%`, transition:'width 1.2s ease' }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:10, color:'white' }}>
              <span>0%</span><span>100%</span>
            </div>
          </div>

          {/* ScoreRings — cachés sur mobile */}
          {!isMobile && (
            <div style={{ display:'flex', gap:28, flexShrink:0 }}>
              <ScoreRing value={won}        max={totalSE||1} color="#12b76a" label="Gagnés"   sublabel={`sur ${totalSE}`}/>
              <ScoreRing value={enPipeline} max={totalSE||1} color="#f79009" label="Pipeline"  sublabel={`${seStatuts.proposal} soumissions`}/>
              <ScoreRing value={urgent}     max={totalSE||1} color="#f04438" label="Urgents"   sublabel="score ≥7"/>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          4 STATS CARDS
          Mobile : 2 colonnes / Desktop : 4 colonnes
          Toutes calculées depuis fiches filtrées
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(4,1fr)', gap: isMobile?10:14, marginBottom:24 }}>
        {[
          { label:'Total fiches',  value:totalSE,    sub:`${b2b} B2B · ${b2c} B2C`,              icon:Users,       color:'var(--accent)'  },
          { label:'Urgents',       value:urgent,     sub:`Score ≥7 · Moy. ${avgUrgence}/10`,      icon:AlertCircle, color:'var(--danger)'  },
          { label:'En pipeline',   value:enPipeline, sub:`${seStatuts.proposal} soumissions`,      icon:Clock,       color:'var(--warning)' },
          { label:'Gagnés',        value:won,        sub:`Taux de conversion ${convRate}%`,        icon:CheckCircle, color:'var(--success)'  },
        ].map((s,i) => (
          <div key={i} className="stat-card animate-fade" style={{ animationDelay:`${i*0.06}s`, transition:'transform 0.15s,box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
              <div style={{ width:40, height:40, borderRadius:10, background:`${s.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <s.icon size={18} color={s.color}/>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          SOLUTION EXPRESS STATUTS
          6 statuts filtrés par année globale
          Mobile : 3 colonnes / Desktop : 6 colonnes
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ background:'var(--bg-card)', borderRadius:16, padding: isMobile?'16px':'20px', marginBottom:24, border:'1px solid var(--border)', borderTop:'3px solid #12b76a', boxShadow:'0 4px 20px rgba(0,0,0,0.06)', animation:'fadeSlideUp 0.4s 0.1s ease both' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <div style={{ width:38, height:38, borderRadius:9, background:'rgba(18,183,106,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Building2 size={19} color="#12b76a"/>
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:700 }}>Solution Express</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{totalSE} fiches · {b2b} B2B · {b2c} B2C</div>
          </div>
          <div style={{ marginLeft:'auto', fontSize:28, fontWeight:800, color:'#12b76a' }}>{totalSE}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'repeat(3,1fr)':'repeat(6,1fr)', gap: isMobile?8:10 }}>
          {[
            { label:'Nouveau',    value:seStatuts.new,        color:'#3b6cf8' },
            { label:'Contacté',   value:seStatuts.contacted,  color:'#f79009' },
            { label:'Intéressé',  value:seStatuts.interested, color:'#12b76a' },
            { label:'Soumission', value:seStatuts.proposal,   color:'#a764f8' },
            { label:'Gagné',      value:seStatuts.won,        color:'#12b76a' },
            { label:'Perdu',      value:seStatuts.lost,       color:'#f04438' },
          ].map((s,i) => (
            <div key={s.label} style={{ background:'var(--bg-secondary)', borderRadius:10, padding: isMobile?'10px 8px':'12px 10px', borderLeft:`3px solid ${s.color}`, textAlign:'center', position:'relative', overflow:'hidden', transition:'transform 0.15s', cursor:'default' }}
              onMouseEnter={e => e.currentTarget.style.transform='scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
              <div style={{ position:'absolute', bottom:-8, right:-4, fontSize:36, fontWeight:900, color:s.color, opacity:0.05, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize: isMobile?20:24, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize: isMobile?9:10, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginTop:2 }}>{s.label}</div>
              <div style={{ marginTop:6, height:3, borderRadius:2, background:'var(--border)', overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:2, background:s.color, width:`${totalSE>0?Math.round((s.value/totalSE)*100):0}%`, transition:'width 1s ease' }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          COMMISSIONS — filtrées par année globale
          $ → TND, DollarSign → Wallet
          ════════════════════════════════════════════════════════════════ */}
      {commissions && (
        <div style={{ marginBottom:24, animation:'fadeSlideUp 0.4s 0.15s ease both' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:'rgba(18,183,106,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Wallet size={18} color="#12b76a"/>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Mes commissions</div>
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                Solution Express · {anneeGlobal === 'tout' ? 'historique complet' : anneeGlobal}
              </div>
            </div>
          </div>

          {/* Stats commissions ligne 1 */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr 1fr', gap:12, marginBottom:10 }}>
            {[
              { label:'Total gagné',   value:`${commTotalGagne.toFixed(2)} TND`, color:'#12b76a', bg:'rgba(18,183,106,0.06)', border:'rgba(18,183,106,0.15)', sub:'toutes commissions' },
              { label:'✓ Payé',        value:`${commTotalPaye.toFixed(2)} TND`,  color:'#3b6cf8', bg:'rgba(59,108,248,0.06)',  border:'rgba(59,108,248,0.15)',  sub:'commissions reçues' },
              { label:'⏳ En attente', value:`${commEnAttente.toFixed(2)} TND`,  color:'#f79009', bg:'rgba(247,144,9,0.06)',   border:'rgba(247,144,9,0.15)',   sub:'à recevoir' },
            ].map((s,i) => (
              <div key={i} style={{ background:s.bg, borderRadius:12, padding:'16px 18px', border:`1px solid ${s.border}`, transition:'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                <div style={{ fontSize:10, color:s.color, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:22, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Stats commissions ligne 2 */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'1fr 1fr 1fr', gap:12, marginBottom:14 }}>
            <div style={{ background:'rgba(167,100,248,0.06)', borderRadius:12, padding:'14px 18px', border:'1px solid rgba(167,100,248,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:10, color:'#a764f8', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 }}>Maximum</div>
                <div style={{ fontSize:20, fontWeight:700, color:'#a764f8' }}>{commMax.toFixed(2)} TND</div>
              </div>
              <div style={{ fontSize:28, opacity:0.15 }}>↑</div>
            </div>
            <div style={{ background:'rgba(139,139,158,0.06)', borderRadius:12, padding:'14px 18px', border:'1px solid rgba(139,139,158,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:10, color:'#8b8b9e', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 }}>Minimum</div>
                <div style={{ fontSize:20, fontWeight:700, color:'#8b8b9e' }}>{commMin.toFixed(2)} TND</div>
              </div>
              <div style={{ fontSize:28, opacity:0.15 }}>↓</div>
            </div>
            <div style={{ background:'rgba(18,183,106,0.06)', borderRadius:12, padding:'14px 18px', border:'1px solid rgba(18,183,106,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between', gridColumn: isMobile?'1 / -1':'auto' }}>
              <div>
                <div style={{ fontSize:10, color:'#12b76a', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 }}>Ventes gagnées</div>
                <div style={{ fontSize:20, fontWeight:700, color:'#12b76a' }}>{commFiches.length}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Solution Express</div>
              </div>
              <div style={{ fontSize:24, opacity:0.2 }}>🏆</div>
            </div>
          </div>

          {/* Historique commissions */}
          <div style={{ background:'var(--bg-card)', borderRadius:16, overflow:'hidden', border:'1px solid var(--border)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'10px 16px', gap:8, flexWrap:'wrap' }}>
              {[['tout','Tout'],['payee','✓ Payée'],['non_payee','⏳ En attente']].map(([k,l]) => (
                <button key={k} onClick={() => setCommFiltre(k)}
                  style={{ padding:'4px 14px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                    border:`1px solid ${commFiltre===k?(k==='payee'?'#12b76a':k==='non_payee'?'#f79009':'var(--accent)'):'var(--border)'}`,
                    background: commFiltre===k?(k==='payee'?'rgba(18,183,106,0.1)':k==='non_payee'?'rgba(247,144,9,0.1)':'rgba(59,108,248,0.1)'):'transparent',
                    color: commFiltre===k?(k==='payee'?'#12b76a':k==='non_payee'?'#f79009':'var(--accent)'):'var(--text-muted)' }}>
                  {l}
                </button>
              ))}
              <div style={{ marginLeft:'auto', fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center' }}>
                {commFiches.length} entrée{commFiches.length!==1?'s':''}
              </div>
            </div>
            <div style={{ padding:'8px 0' }}>
              {commFiches.length > 0 ? commFiches.map((c,i,arr) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap: isMobile?10:12, padding: isMobile?'10px 14px':'10px 16px', borderBottom:i<arr.length-1?'1px solid var(--border)':'none', transition:'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='var(--bg-secondary)'; if(!isMobile) e.currentTarget.style.transform='translateX(3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.transform='translateX(0)'; }}>
                  <div style={{ width:38, height:38, borderRadius:9, background:c.commissionPayee?'rgba(18,183,106,0.1)':'rgba(247,144,9,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Wallet size={15} color={c.commissionPayee?'#12b76a':'#f79009'}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {c.entreprise||`${c.prenom||''} ${c.nom||''}`.trim()||'Sans nom'}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>
                      {c.ville||'—'} · {c.dateVente?new Date(c.dateVente).toLocaleDateString('fr-CA'):new Date(c.createdAt).toLocaleDateString('fr-CA')}
                    </div>
                  </div>
                  {!isMobile && c.commissionFixe > 0 && (
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>Fixe : {(c.commissionFixe||0).toFixed(2)} TND</div>
                      {c.commissionExtra > 0 && <div style={{ fontSize:11, color:'var(--text-muted)' }}>Extra : {(c.commissionExtra||0).toFixed(2)} TND</div>}
                    </div>
                  )}
                  <div style={{ textAlign:'right', flexShrink:0, minWidth: isMobile?80:90 }}>
                    <div style={{ fontSize: isMobile?14:16, fontWeight:700, color:c.commissionPayee?'#12b76a':'#f79009' }}>
                      {(c.commissionTotale||0).toFixed(2)} TND
                    </div>
                    <div style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, display:'inline-block', marginTop:2,
                      background:c.commissionPayee?'rgba(18,183,106,0.1)':'rgba(247,144,9,0.1)',
                      color:c.commissionPayee?'#12b76a':'#f79009' }}>
                      {c.commissionPayee?'✓ Payée':'⏳ En attente'}
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-muted)', fontSize:13 }}>
                  Aucune commission pour cette période
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          PIPELINE + PRODUITS
          Mobile : 1 colonne / Desktop : 2 colonnes
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:14, marginBottom:24 }}>
        <div style={{ background:'var(--bg-card)', borderRadius:16, padding: isMobile?'16px':'20px', border:'1px solid var(--border)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15, margin:0 }}>Pipeline global</h3>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>{totalSE} fiches</span>
          </div>
          <ResponsiveContainer width="100%" height={isMobile?140:200}>
            <BarChart data={pipelineData} barSize={isMobile?18:30}>
              <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize: isMobile?9:10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} cursor={{ fill:'rgba(255,255,255,0.03)' }}/>
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {pipelineData.map((e,i) => <Cell key={i} fill={e.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background:'var(--bg-card)', borderRadius:16, padding: isMobile?'16px':'20px', border:'1px solid var(--border)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15, margin:0 }}>Produits d'intérêt</h3>
            <Zap size={14} color="var(--warning)"/>
          </div>
          {byProduit.length ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {byProduit.map((s,i) => {
                const Icon  = PRODUIT_ICONS[s._id] || Zap;
                const color = PRODUIT_COLORS[s._id] || '#8b8b9e';
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:30, height:30, borderRadius:7, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon size={14} color={color}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{PRODUIT_LABELS[s._id]||s._id}</span>
                        <span style={{ fontSize:13, fontWeight:700, color }}>{s.count}</span>
                      </div>
                      <ProgressBar value={s.count} max={totalSE} color={color}/>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucun produit</div>}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          QUALIFICATION + FOURNISSEURS
          Mobile : 1 colonne / Desktop : 2 colonnes
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:14, marginBottom:24 }}>
        <div style={{ background:'var(--bg-card)', borderRadius:16, padding: isMobile?'16px':'20px', border:'1px solid var(--border)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15, margin:0 }}>Qualification système</h3>
            <Shield size={14} color="var(--text-muted)"/>
          </div>
          {byQualif.length ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {byQualif.map((q,i) => {
                const colors = ['#f04438','#f79009','#12b76a','#3b6cf8','#a764f8','#8b8b9e'];
                const color  = colors[i%colors.length];
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, background:'var(--bg-secondary)', borderRadius:8, padding:'8px 12px', transition:'transform 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.transform='translateX(3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform='translateX(0)'}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }}/>
                    <span style={{ flex:1, fontSize:12, color:'var(--text-secondary)' }}>🔒 {QUALIF_LABELS[q._id]||q._id}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{q.count}</span>
                  </div>
                );
              })}
            </div>
          ) : <div style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucune qualification</div>}
        </div>
        <div style={{ background:'var(--bg-card)', borderRadius:16, padding: isMobile?'16px':'20px', border:'1px solid var(--border)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15, margin:0 }}>Top fournisseurs actuels</h3>
            <TrendingUp size={14} color="var(--text-muted)"/>
          </div>
          {byFourn.length ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {byFourn.map((f,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:22, height:22, borderRadius:6, background:'var(--bg-hover)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--text-muted)', flexShrink:0 }}>{i+1}</div>
                  <span style={{ flex:1, fontSize:13, color:'var(--text-secondary)' }}>{FOURN_LABELS[f._id]||f._id}</span>
                  <span style={{ fontSize:13, fontWeight:700 }}>{f.count}</span>
                  <ProgressBar value={f.count} max={Math.max(...byFourn.map(x=>x.count),1)} color="var(--accent)"/>
                </div>
              ))}
            </div>
          ) : <div style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucun fournisseur</div>}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TYPES DE LEAD + TOP VILLES
          Mobile : 1 colonne / Desktop : 2 colonnes
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:14, marginBottom:24 }}>
        <div style={{ background:'var(--bg-card)', borderRadius:16, padding: isMobile?'16px':'20px', border:'1px solid var(--border)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15, margin:0 }}>Types de leads</h3>
            <Building2 size={14} color="var(--text-muted)"/>
          </div>
          {byLeadType.length ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {byLeadType.map((l,i) => {
                const color = LEAD_TYPE_COLORS[l._id]||'#8b8b9e';
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }}/>
                    <span style={{ flex:1, fontSize:13, color:'var(--text-secondary)' }}>{LEAD_TYPE_LABELS[l._id]||l._id}</span>
                    <span style={{ fontSize:13, fontWeight:700, color }}>{l.count}</span>
                    <ProgressBar value={l.count} max={totalSE} color={color}/>
                  </div>
                );
              })}
            </div>
          ) : <div style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucun type</div>}
        </div>
        <div style={{ background:'var(--bg-card)', borderRadius:16, padding: isMobile?'16px':'20px', border:'1px solid var(--border)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15, margin:0 }}>Top villes</h3>
            <MapPin size={14} color="var(--text-muted)"/>
          </div>
          {byCity.length ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {byCity.map((c,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, transition:'transform 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.transform='translateX(3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform='translateX(0)'}>
                  <div style={{ width:22, height:22, borderRadius:6, background:'var(--bg-hover)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--text-muted)', flexShrink:0 }}>{i+1}</div>
                  <span style={{ flex:1, fontSize:13, color:'var(--text-secondary)' }}>{c._id}</span>
                  <span style={{ fontSize:13, fontWeight:700 }}>{c.count}</span>
                  <ProgressBar value={c.count} max={totalSE} color="var(--accent)"/>
                </div>
              ))}
            </div>
          ) : <div style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucune ville</div>}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          LEADS RÉCENTS — filtrés par année globale
          Pleine largeur
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ background:'var(--bg-card)', borderRadius:16, padding: isMobile?'16px':'20px', border:'1px solid var(--border)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ fontSize:15, margin:0 }}>Leads récents</h3>
          <TrendingUp size={14} color="var(--text-muted)"/>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {recentProspects.length ? recentProspects.map((p,i) => {
            const avs       = ['av-blue','av-teal','av-amber','av-coral','av-purple'];
            const name      = p.entreprise||`${p.prenom||''} ${p.nom||''}`.trim()||'Sans nom';
            const ini       = (name[0]||'?').toUpperCase();
            const statColor = STATUS_COLORS[p.status]||'#8b8b9e';
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap: isMobile?10:12, padding:'10px 0', borderBottom:i<recentProspects.length-1?'1px solid var(--border)':'none', transition:'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background='var(--bg-secondary)'; e.currentTarget.style.borderRadius='8px'; e.currentTarget.style.padding='10px 8px'; }}
                onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.padding='10px 0'; }}>
                <div className={`avatar ${avs[i%avs.length]}`} style={{ width:36, height:36, fontSize:13, flexShrink:0 }}>{ini}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{p.ville||'—'} · {new Date(p.createdAt).toLocaleDateString('fr-CA')}</div>
                </div>
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:'rgba(18,183,106,0.1)', color:'#12b76a', flexShrink:0 }}>🏢</span>
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:`${statColor}15`, color:statColor, flexShrink:0 }}>{STATUS_LABELS_FR[p.status]||p.status}</span>
              </div>
            );
          }) : <div style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucun lead</div>}
        </div>
      </div>

      {/* Keyframes animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}
