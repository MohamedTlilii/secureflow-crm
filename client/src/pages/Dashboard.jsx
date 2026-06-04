// ════════════════════════════════════════════════════════════════════════════
// client/src/pages/Dashboard.jsx
// Solution Express uniquement
// ════════════════════════════════════════════════════════════════════════════
// RESPONSIVE  : iPhone 12 Pro Max (430px) et tous les mobiles (breakpoint 768px)
// DESIGN      : Header glassmorphism, ScoreRings animés, chiffres animés
// FILTRE      : Un seul filtre année global — tout la page change selon l'année
// LOGIQUE     : Fetch /api/solution-express + calcul frontend de toutes les stats
// API         : GET /api/solution-express + GET /api/settings
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../api';
import AnimatedNumber from '../components/AnimatedNumber';
import {
  Users, TrendingUp, CheckCircle, AlertCircle, Clock, XCircle,
  MapPin, Zap, Building2, Shield, Wallet,
  Target,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';

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

// ── Palette couleurs leads (index-stable) ─────────────────────────────────
const LEAD_PALETTE = ['#12b76a','#0077b5','#f79009','#a764f8','#f04438','#61DAFB','#8b8b9e'];
const STATUS_COLORS    = { new:'#3b6cf8', contacted:'#f79009', proposal:'#a764f8', installation_en_cours:'#f97316', installe:'#22c55e', installation_annulee:'#be123c' };
const STATUS_LABELS_FR = { new:'Nouveau', contacted:'Contacté', proposal:'Soumission', installation_en_cours:'Installation en cours', installe:'Installé', installation_annulee:'Installation annulée' };

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
          <div style={{ fontSize:8, color:'#ffffff', fontWeight:600, textTransform:'uppercase', lineHeight:1.2 }}>{label}</div>
        </div>
      </div>
      <div style={{ fontSize:11, color:'#ffffff', textAlign:'center' }}>{sublabel}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL : Dashboard
// ════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const isMobile = useIsMobile();

  // ── États ─────────────────────────────────────────────────────────────
  const [loading, setLoading]         = useState(true);
  const [seFiches, setSeFiches]       = useState([]);
  const [settings, setSettings]       = useState({ services: [] });
  const [anneeGlobal, setAnneeGlobal] = useState(String(new Date().getFullYear()));
  const [dashMois, setDashMois]       = useState('tout');
  const [commFiltre, setCommFiltre]   = useState('tout');

  // ── Fetch données ─────────────────────────────────────────────────────
  const fetchAll = useCallback(() => {
    api.get('/api/solution-express')
      .then(r => setSeFiches(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error('Impossible de charger les données'))
      .finally(() => setLoading(false));
    api.get('/api/settings')
      .then(r => setSettings(r.data || { services: [] }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAll();
    const onVisible = () => { if (!document.hidden) fetchAll(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchAll]);

// ── Lookups dynamiques depuis settings ────────────────────────────────
  const qualifLbl = useMemo(() =>
    Object.fromEntries((settings.qualificationSysteme||[]).map(q => [q.key, q.label])),
    [settings.qualificationSysteme]
  );
  const leadTypeLbl = useMemo(() =>
    Object.fromEntries((settings.typeLead||[]).map(t => [t.key, t.label])),
    [settings.typeLead]
  );
  const leadTypeClr = useMemo(() => {
    const map = {};
    (settings.typeLead||[]).forEach((t, i) => { map[t.key] = LEAD_PALETTE[i % LEAD_PALETTE.length]; });
    return map;
  }, [settings.typeLead]);
  const commerceLbl = useMemo(() =>
    Object.fromEntries((settings.typeCommerce||[]).map(t => [t.key, t.label])),
    [settings.typeCommerce]
  );
  const fournLbl = useMemo(() => {
    const map = {};
    (settings.services||[]).forEach(svc => {
      [...(svc.actuel||[]), ...(svc.propose||[])].forEach(item => {
        if (item.key && item.label) map[item.key] = item.label;
      });
    });
    return map;
  }, [settings.services]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ position:'relative', width:44, height:44 }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid rgba(16,185,129,0.12)' }}/>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid transparent', borderTopColor:'#10b981', animation:'spin 0.9s linear infinite' }}/>
        <div style={{ position:'absolute', inset:4, borderRadius:'50%', border:'2px solid transparent', borderBottomColor:'rgba(59,130,246,0.5)', animation:'spin 1.5s linear infinite reverse' }}/>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Années disponibles — toujours inclure l'année courante ───────────
  const currentYear = new Date().getFullYear();
  const annees = [...new Set([currentYear, ...seFiches.map(f => new Date(f.dateVente||f.createdAt||Date.now()).getUTCFullYear())])].sort((a,b) => b-a);

  // ── Fiches filtrées par année + mois global ──────────────────────────
  const fiches = (() => {
    let r = anneeGlobal === 'tout' ? seFiches : seFiches.filter(f => String(new Date(f.dateVente||f.createdAt||Date.now()).getUTCFullYear()) === anneeGlobal);
    if (anneeGlobal !== 'tout' && dashMois !== 'tout') r = r.filter(f => new Date(f.dateVente||f.createdAt||Date.now()).getUTCMonth() === Number(dashMois));
    return r;
  })();

  // ── Stats calculées depuis fiches filtrées ────────────────────────────

  // Statuts
  const seStatuts = {
    new:                    fiches.filter(f => f.status === 'new').length,
    contacted:              fiches.filter(f => f.status === 'contacted').length,
    proposal:               fiches.filter(f => f.status === 'proposal').length,
    installation_en_cours:  fiches.filter(f => f.status === 'installation_en_cours').length,
    installe:               fiches.filter(f => f.status === 'installe').length,
    installation_annulee:   fiches.filter(f => f.status === 'installation_annulee').length,
  };
  const totalSE    = fiches.length;
  const b2b        = fiches.filter(f => f.typeClient === 'b2b').length;
  const b2c        = fiches.filter(f => f.typeClient === 'b2c').length;
  const won        = seStatuts.installe;
  const convRate   = totalSE > 0 ? Math.round((won / totalSE) * 100) : 0;

  // Top villes
  const cityMap = {};
  fiches.forEach(f => { if(f.ville) cityMap[f.ville] = (cityMap[f.ville]||0) + 1; });
  const byCity = Object.entries(cityMap).map(([_id,count]) => ({_id,count})).sort((a,b) => b.count-a.count);

  // Produits
  const produitMap = {};
  fiches.forEach(f => (f.produits||[]).forEach(p => { produitMap[p] = (produitMap[p]||0) + 1; }));
  const byProduit = Object.entries(produitMap).map(([_id,count]) => ({_id,count})).sort((a,b) => b.count-a.count);

  // Qualification
  const qualifMap = {};
  fiches.forEach(f => { if(f.qualificationSysteme && f.qualificationSysteme !== 'inconnu' && f.qualificationSysteme !== '') qualifMap[f.qualificationSysteme] = (qualifMap[f.qualificationSysteme]||0) + 1; });
  const byQualif = Object.entries(qualifMap).map(([_id,count]) => ({_id,count})).sort((a,b) => b.count-a.count);

  // Fournisseurs proposés — lecture depuis f.fournisseurs (nouveau format, toujours peuplé par migration GET)
  const fournMap = {};
  fiches.forEach(f => {
    Object.values(f.fournisseurs || {}).forEach(svc => {
      const propose = svc?.propose;
      if (propose && !['inconnu','aucun',''].includes(propose))
        fournMap[propose] = (fournMap[propose] || 0) + 1;
    });
  });
  const byFourn = Object.entries(fournMap).map(([_id,count]) => ({_id,count})).sort((a,b) => b.count-a.count);

  // Types de lead
  const leadMap = {};
  fiches.forEach(f => { if(f.leadType) leadMap[f.leadType] = (leadMap[f.leadType]||0) + 1; });
  const byLeadType = Object.entries(leadMap).map(([_id,count]) => ({_id,count})).sort((a,b) => b.count-a.count);

  // Types de commerce
  const commerceMapB2B = {};
  const commerceMapB2C = {};
  fiches.forEach(f => {
    if (!f.typeCommerce || f.typeCommerce === 'autre') return;
    if (f.typeClient === 'b2c') commerceMapB2C[f.typeCommerce] = (commerceMapB2C[f.typeCommerce]||0) + 1;
    else commerceMapB2B[f.typeCommerce] = (commerceMapB2B[f.typeCommerce]||0) + 1;
  });
  const byCommerce    = Object.entries(commerceMapB2B).map(([_id,count]) => ({_id,count})).sort((a,b) => b.count-a.count);
  const byCommerceB2C = Object.entries(commerceMapB2C).map(([_id,count]) => ({_id,count})).sort((a,b) => b.count-a.count);

  // Leads récents (triés par date)
  const recentProspects = [...fiches].sort((a,b) => new Date(b.dateVente||b.createdAt) - new Date(a.dateVente||a.createdAt)).slice(0,6);

  // Pipeline data pour graphique
  const pipelineData = [
    { name:'Nouveau',          value:seStatuts.new,                   color:'#3b6cf8' },
    { name:'Contacté',         value:seStatuts.contacted,             color:'#f79009' },
    { name:'Soumission',       value:seStatuts.proposal,              color:'#a764f8' },
    { name:`En cours (${seStatuts.installation_en_cours})`, value:seStatuts.installation_en_cours, color:'#f97316' },
    { name:'Installé',         value:seStatuts.installe,              color:'#22c55e' },
    { name:'Install. annulée', value:seStatuts.installation_annulee,  color:'#be123c' },
  ].filter(x => x.value > 0);

  // Commissions — fiches déjà filtrées par année + mois via `fiches`
  const commHistorique = fiches.filter(f => (f.commissionTotale||0) > 0 || (f.commissionFixe||0) > 0);
  const commFiches = commHistorique.filter(c =>
    commFiltre === 'tout' ? true : commFiltre === 'payee' ? c.commissionPayee : !c.commissionPayee
  );
  const commActives    = commFiches.filter(c => c.status !== 'installation_annulee');
  const commAnnulees   = commFiches.filter(c => c.status === 'installation_annulee').length;
  const commTotalGagne = commActives.reduce((s,c) => s+(c.commissionTotale||0), 0);
  const commTotalPaye  = commActives.filter(c=>c.commissionPayee).reduce((s,c) => s+(c.commissionTotale||0), 0);
  const commEnAttente  = commTotalGagne - commTotalPaye;
  const commVals       = commActives.map(c=>c.commissionTotale||0).filter(v=>v>0);
  const commMax        = commVals.length > 0 ? Math.max(...commVals) : 0;
  const commMin        = commVals.length > 0 ? Math.min(...commVals) : 0;

  return (
    <div className="animate-fade">

      {/* ════════════════════════════════════════════════════════════════
          HEADER ULTRA-MODERN
          Gradient border + Aurora orbs + glassmorphism
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ padding:'1.5px', borderRadius:22, background:'linear-gradient(135deg,#12b76a60,#61DAFB30,#a78bfa25)', marginBottom:24, animation:'fadeSlideUp 0.4s ease both' }}>
      <div style={{
        background:'rgba(2,8,16,0.97)',
        borderRadius:'20.5px', padding: isMobile ? '20px 16px' : '28px 32px',
        backdropFilter:'blur(40px)',
        position:'relative', overflow:'hidden'
      }}>
        {/* Aurora orbs */}
        <div style={{ position:'absolute', top:-80, left:-60, width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(18,183,106,0.18) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:-20, right:-40, width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle,rgba(97,218,251,0.12) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-60, right:100, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(167,139,250,0.10) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1 }}>

        {/* Ligne 1 : Titre + filtre année global */}
        <div style={{ display:'flex', alignItems: isMobile?'flex-start':'center', justifyContent:'space-between', flexDirection: isMobile?'column':'row', gap: isMobile?12:0, marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#12b76a,#61DAFB)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 28px rgba(18,183,106,0.5)', flexShrink:0 }}>
              <Target size={26} color="#fff"/>
            </div>
            <div>
              <h1 style={{ margin:0, fontSize: isMobile?20:24 }}>Dashboard</h1>
              <p style={{ color: 'white', fontSize: 13, margin: 0, marginTop: 2 }}>
  Solution Express · <span style={{ color: '#2a99de', fontWeight: 700 }}>{totalSE}</span> Fiche{totalSE > 1 ? 's' : ''}
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
            <select value={anneeGlobal} onChange={e => { setAnneeGlobal(e.target.value); setDashMois('tout'); }}
              style={{ fontSize:12, padding:'7px 14px', borderRadius:9, border:'1px solid var(--bg-card)', background:'var(--bg-card)', color:'#ffffff', cursor:'pointer', outline:'none', fontWeight:700 }}>
              <option value="tout">Toutes les années</option>
              {annees.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
            {anneeGlobal !== 'tout' && (
              <select value={dashMois} onChange={e => setDashMois(e.target.value)}
                style={{ fontSize:12, padding:'7px 14px', borderRadius:9, border:'1px solid var(--bg-card)', background:'var(--bg-card)', color:'#ffffff', cursor:'pointer', outline:'none', fontWeight:700 }}>
                <option value="tout">Tous les mois</option>
                {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m,i) => (
                  <option key={i} value={String(i)}>{m}</option>
                ))}
              </select>
            )}
                        

           
          </div>
        </div>

        {/* Ligne 2 : Score conversion + Rings */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexDirection: isMobile?'column':'row', gap:20 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize: isMobile?22:28, fontWeight:800, color:'var(--text-primary)', marginBottom:4 }}>
              <AnimatedNumber value={convRate} decimals={0} suffix="% de conversion" color="var(--text-primary)"/>
            </div>
            <div style={{ fontSize:12, color:'white', marginBottom:12 }}>
              {won} installé{won!==1?'s':''} sur {totalSE} fiche{totalSE!==1?'s':''}
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
              <ScoreRing value={won}                             max={totalSE||1} color="#22c55e" label="Installés"    sublabel={`sur ${totalSE}`}/>
              <ScoreRing value={seStatuts.installation_en_cours} max={totalSE||1} color="#f97316" label="En cours"     sublabel="installation"/>
              <ScoreRing value={seStatuts.proposal}              max={totalSE||1} color="#a764f8" label="Soumissions"  sublabel={`${seStatuts.proposal} fiches`}/>
            </div>
          )}
        </div>
        </div>{/* /zIndex:1 */}
      </div>{/* /glassmorphism */}
      </div>{/* /gradient border */}

      {/* ════════════════════════════════════════════════════════════════
          4 STATS CARDS
          Mobile : 2 colonnes / Desktop : 4 colonnes
          Toutes calculées depuis fiches filtrées
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(5,1fr)', gap: isMobile?10:14, marginBottom:24 }}>
        {[
          { label:'Total fiches',          value:totalSE,                              sub:`${b2b} B2B · ${b2c} B2C`,                    icon:Users,       color:'#3b6cf8'  },
          { label:'Installés',             value:won,                                  sub:`Taux d'installation ${convRate}%`,             icon:CheckCircle, color:'#22c55e'  },
          { label:'Installation en cours', value:seStatuts.installation_en_cours,      sub:`${seStatuts.installation_en_cours} en cours`, icon:AlertCircle, color:'#f97316'  },
          { label:'Soumissions',           value:seStatuts.proposal,                   sub:`${seStatuts.proposal} fiches`,                icon:Clock,       color:'#a764f8'  },
          { label:'Annulées',              value:seStatuts.installation_annulee||0,    sub:`installations annulées`,                      icon:XCircle,     color:'#be123c'  },
        ].map((s,i) => (
          <div key={i} style={{ padding:'1px', borderRadius:14, background:`linear-gradient(135deg,${s.color}60,${s.color}20)`, animation:`fadeSlideUp 0.4s ${i*0.07}s ease both` }}>
            <div className="stat-card" style={{ background:'rgba(2,8,16,0.97)', borderRadius:13, height:'100%', transition:'transform 0.2s,box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 12px 32px ${s.color}25`; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
                  <div className="stat-sub">{s.sub}</div>
                </div>
                <div style={{ width:42, height:42, borderRadius:12, background:`${s.color}20`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 0 18px ${s.color}30` }}>
                  <s.icon size={19} color={s.color}/>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* ════════════════════════════════════════════════════════════════
          COMMISSIONS — filtrées par année globale
          $ → TND, DollarSign → Wallet
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom:24, animation:'fadeSlideUp 0.4s 0.15s ease both', padding:'1.5px', borderRadius:18, background:'linear-gradient(135deg,#12b76a40,#61DAFB20,#a78bfa10)' }}>
        <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:'16.5px', padding: isMobile?'16px':'20px', backdropFilter:'blur(20px)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:'rgba(18,183,106,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Wallet size={18} color="#12b76a"/>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Mes commissions</div>
              <div style={{ fontSize:11, color:'#ffffff' }}>
                Solution Express · {anneeGlobal === 'tout' ? 'historique complet' : anneeGlobal}
              </div>
            </div>
          </div>

          {/* Barre objectif annuel */}
          {anneeGlobal !== 'tout' && ((settings.objectifAnnuel||{})[anneeGlobal] > 0) && (() => {
            const obj = (settings.objectifAnnuel||{})[anneeGlobal];
            const pct = Math.min(100, Math.round((commTotalGagne / obj) * 100));
            return (
              <div style={{ marginBottom:14, background:'rgba(18,183,106,0.05)', borderRadius:12, padding:'12px 16px', border:'1px solid rgba(18,183,106,0.15)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#ffffff', marginBottom:6 }}>
                  <span>Objectif {anneeGlobal}</span>
                  <span style={{ fontWeight:700, color: pct >= 100 ? '#12b76a' : '#f79009' }}>
                    {commTotalGagne.toFixed(0)} / {obj} TND — {pct}%
                  </span>
                </div>
                <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:3, background: pct >= 100 ? 'linear-gradient(90deg,#12b76a,#61DAFB)' : 'linear-gradient(90deg,#3b6cf8,#12b76a)', width:`${pct}%`, transition:'width 1.2s ease' }}/>
                </div>
              </div>
            );
          })()}

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
                <div style={{ fontSize:11, color:'#ffffff', marginTop:6 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Stats commissions ligne 2 */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(4,1fr)', gap:12, marginBottom:14 }}>
            <div style={{ background:'rgba(167,100,248,0.06)', borderRadius:12, padding:'14px 18px', border:'1px solid rgba(167,100,248,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:10, color:'#a764f8', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 }}>Maximum</div>
                <div style={{ fontSize:20, fontWeight:700, color:'#a764f8' }}>{commMax.toFixed(2)} TND</div>
              </div>
              <div style={{ fontSize:28, opacity:0.15 }}>↑</div>
            </div>
            <div style={{ background:'rgba(139,139,158,0.06)', borderRadius:12, padding:'14px 18px', border:'1px solid rgba(139,139,158,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:10, color:'#ffffff', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 }}>Minimum</div>
                <div style={{ fontSize:20, fontWeight:700, color:'#ffffff' }}>{commMin.toFixed(2)} TND</div>
              </div>
              <div style={{ fontSize:28, opacity:0.15 }}>↓</div>
            </div>
            <div style={{ background:'rgba(18,183,106,0.06)', borderRadius:12, padding:'14px 18px', border:'1px solid rgba(18,183,106,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:10, color:'#12b76a', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 }}>Commissions</div>
                <div style={{ fontSize:20, fontWeight:700, color:'#12b76a' }}>{commActives.length}</div>
                <div style={{ fontSize:11, color:'#ffffff', marginTop:4 }}>Solution Express</div>
              </div>
              <div style={{ fontSize:24, opacity:0.2 }}>✅</div>
            </div>
            <div style={{ background:'rgba(190,18,60,0.06)', borderRadius:12, padding:'14px 18px', border:'1px solid rgba(190,18,60,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:10, color:'#be123c', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 }}>Annulées</div>
                <div style={{ fontSize:20, fontWeight:700, color:'#be123c' }}>{commAnnulees}</div>
                <div style={{ fontSize:11, color:'#ffffff', marginTop:4 }}>installations</div>
              </div>
              <div style={{ fontSize:24, opacity:0.2 }}>❌</div>
            </div>
          </div>

          {/* Historique commissions */}
          <div style={{ background:'var(--bg-card)', borderRadius:16, overflow:'hidden', border:'1px solid var(--border)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'10px 16px', gap:8, flexWrap:'wrap' }}>
              {[['tout','Tout'],['payee','✓ Payée'],['non_payee','⏳ En attente']].map(([k,l]) => {
                const active = commFiltre === k;
                const activeColor = k === 'payee' ? '#12b76a' : k === 'non_payee' ? '#f79009' : 'var(--accent)';
                const activeBg = k === 'payee' ? 'rgba(18,183,106,0.1)' : k === 'non_payee' ? 'rgba(247,144,9,0.1)' : 'rgba(59,108,248,0.1)';
                return (
                  <button key={k} onClick={() => setCommFiltre(k)}
                    style={{ padding:'4px 14px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                      border:`1px solid ${active ? activeColor : 'var(--border)'}`,
                      background: active ? activeBg : 'transparent',
                      color: active ? activeColor : '#ffffff' }}>
                    {l}
                  </button>
                );
              })}
              <div style={{ marginLeft:'auto', fontSize:11, color:'#ffffff', display:'flex', alignItems:'center', gap:6 }}>
                <span>{commActives.length} active{commActives.length!==1?'s':''}</span>
                {commAnnulees > 0 && <span style={{ color:'#be123c', fontWeight:700 }}>· {commAnnulees} annulée{commAnnulees>1?'s':''}</span>}
              </div>
            </div>
            <div style={{ padding:'8px 0' }}>
              {commFiches.length > 0 ? [...commFiches].sort((a,b) => new Date(b.dateVente||b.createdAt) - new Date(a.dateVente||a.createdAt)).map((c,i) => {
                const annulee = c.status === 'installation_annulee';
                const paid    = !annulee && !!c.commissionPayee;
                const color   = annulee ? '#be123c' : paid ? '#12b76a' : '#f79009';
                const fixed = c.commissionFixe || 0;
                const extra = c.commissionExtra || 0;
                const date = new Date(c.dateVente || c.createdAt).toLocaleDateString('fr-CA', { timeZone:'UTC' });
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap: isMobile?10:12, padding: isMobile?'10px 14px':'10px 16px', borderBottom:i < commFiches.length-1 ? '1px solid var(--border)' : 'none', transition:'all 0.15s', background: annulee ? 'rgba(190,18,60,0.04)' : 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background= annulee ? 'rgba(190,18,60,0.08)' : 'var(--bg-secondary)'; if(!isMobile) e.currentTarget.style.transform='translateX(3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background= annulee ? 'rgba(190,18,60,0.04)' : 'transparent'; e.currentTarget.style.transform='translateX(0)'; }}>
                    <div style={{ width:38, height:38, borderRadius:9, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Wallet size={15} color={color}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color: annulee ? '#be123c' : 'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {c.entreprise||`${c.prenom||''} ${c.nom||''}`.trim()||'Sans nom'}
                      </div>
                      <div style={{ fontSize:11, color:'#ffffff', marginTop:1 }}>
                        {c.ville||'—'} · {date}
                        {annulee && c.motifAnnulation && <span style={{ color:'#be123c', marginLeft:6 }}>· {c.motifAnnulation}</span>}
                      </div>
                    </div>
                    {!isMobile && fixed > 0 && (
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:11, color:'#ffffff' }}>Fixe : {fixed.toFixed(2)} TND</div>
                        {extra > 0 && <div style={{ fontSize:11, color:'#ffffff' }}>Extra : {extra.toFixed(2)} TND</div>}
                      </div>
                    )}
                    <div style={{ textAlign:'right', flexShrink:0, minWidth: isMobile?80:90 }}>
                      <div style={{ fontSize: isMobile?14:16, fontWeight:700, color }}>
                        {(c.commissionTotale||0).toFixed(2)} TND
                      </div>
                      <div style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, display:'inline-block', marginTop:2,
                        background:`${color}18`, color }}>
                        {annulee ? '❌ Annulée' : paid ? '✓ Payée' : '⏳ En attente'}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ textAlign:'center', padding:'24px 0', color:'#ffffff', fontSize:13 }}>
                  Aucune commission pour cette période
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          PIPELINE + PRODUITS
          Mobile : 1 colonne / Desktop : 2 colonnes
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:14, marginBottom:24 }}>
        <div style={{ padding:'1px', borderRadius:18, background:'linear-gradient(135deg,#3b6cf840,#a78bfa20)' }}>
        <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:17, padding: isMobile?'16px':'20px', backdropFilter:'blur(20px)', height:'100%' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15, margin:0 }}>Pipeline global</h3>
            <span style={{ fontSize:12, color:'#ffffff' }}>{totalSE} fiches</span>
          </div>
          <ResponsiveContainer width="100%" height={isMobile?140:200}>
            <BarChart data={pipelineData} barSize={isMobile?18:30} margin={{ top:20, right:0, left:0, bottom:0 }}>
              <XAxis dataKey="name" tick={{ fill:'#ffffff', fontSize: isMobile?9:10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'#ffffff', fontSize:11 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} cursor={{ fill:'rgba(255,255,255,0.03)' }}/>
              <Bar dataKey="value" radius={[6,6,0,0]}
                label={{ position:'top', fill:'#ffffff', fontSize:13, fontWeight:700 }}>
                {pipelineData.map((e,i) => <Cell key={i} fill={e.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        </div>{/* /gradient border pipeline */}
        <div style={{ padding:'1px', borderRadius:18, background:'linear-gradient(135deg,#f7900940,#12b76a20)' }}>
        <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:17, padding: isMobile?'16px':'20px', backdropFilter:'blur(20px)', height:'100%' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15, margin:0 }}>Produits d'intérêt</h3>
            <Zap size={14} color="#f79009"/>
          </div>
          {byProduit.length ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {byProduit.map((s,i) => {
                const svc   = (settings.services||[]).find(x => x.id === s._id);
                const label = svc?.label || s._id;
                const color = svc?.color || '#8b8b9e';
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:30, height:30, borderRadius:7, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Zap size={14} color={color}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:13, color:'#ffffff' }}>{label}</span>
                        <span style={{ fontSize:13, fontWeight:700, color }}>{s.count}</span>
                      </div>
                      <ProgressBar value={s.count} max={totalSE} color={color}/>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div style={{ color:'#ffffff', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucun produit</div>}
        </div>
        </div>{/* /gradient border produits */}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          QUALIFICATION + FOURNISSEURS
          Mobile : 1 colonne / Desktop : 2 colonnes
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:14, marginBottom:24 }}>
        <div style={{ padding:'1px', borderRadius:18, background:'linear-gradient(135deg,#f0443840,#a78bfa20)' }}>
        <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:17, padding: isMobile?'16px':'20px', backdropFilter:'blur(20px)', height:'100%' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15, margin:0 }}>Qualification système</h3>
            <Shield size={14} color="#a78bfa"/>
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
                    <span style={{ flex:1, fontSize:12, color:'#ffffff' }}>🔒 {qualifLbl[q._id]||q._id}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{q.count}</span>
                  </div>
                );
              })}
            </div>
          ) : <div style={{ color:'#ffffff', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucune qualification</div>}
        </div>
        </div>{/* /gradient border qualif */}
        <div style={{ padding:'1px', borderRadius:18, background:'linear-gradient(135deg,#3b6cf840,#61DAFB20)' }}>
        <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:17, padding: isMobile?'16px':'20px', backdropFilter:'blur(20px)', height:'100%' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15, margin:0 }}>Top fournisseurs proposés</h3>
            <TrendingUp size={14} color="#61DAFB"/>
          </div>
          {byFourn.length ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {byFourn.map((f,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:22, height:22, borderRadius:6, background:'var(--bg-hover)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#ffffff', flexShrink:0 }}>{i+1}</div>
                  <span style={{ flex:1, fontSize:13, color:'#ffffff' }}>{fournLbl[f._id]||f._id}</span>
                  <span style={{ fontSize:13, fontWeight:700 }}>{f.count}</span>
                  <ProgressBar value={f.count} max={Math.max(...byFourn.map(x=>x.count),1)} color="var(--accent)"/>
                </div>
              ))}
            </div>
          ) : <div style={{ color:'#ffffff', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucun fournisseur</div>}
        </div>
        </div>{/* /gradient border fournisseurs */}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TYPES DE LEAD + TOP VILLES
          Mobile : 1 colonne / Desktop : 2 colonnes
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:14, marginBottom:24 }}>
        <div style={{ padding:'1px', borderRadius:18, background:'linear-gradient(135deg,#12b76a40,#f7900920)' }}>
        <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:17, padding: isMobile?'16px':'20px', backdropFilter:'blur(20px)', height:'100%' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15, margin:0 }}>Types de leads</h3>
            <Building2 size={14} color="#12b76a"/>
          </div>
          {byLeadType.length ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {byLeadType.map((l,i) => {
                const color = leadTypeClr[l._id]||'#8b8b9e';
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0, boxShadow:`0 0 6px ${color}80` }}/>
                    <span style={{ flex:1, fontSize:13, color:'#ffffff' }}>{leadTypeLbl[l._id]||l._id}</span>
                    <span style={{ fontSize:13, fontWeight:700, color }}>{l.count}</span>
                    <ProgressBar value={l.count} max={totalSE} color={color}/>
                  </div>
                );
              })}
            </div>
          ) : <div style={{ color:'#ffffff', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucun type</div>}
        </div>
        </div>{/* /gradient border lead types */}
        <div style={{ padding:'1px', borderRadius:18, background:'linear-gradient(135deg,#61DAFB40,#a78bfa20)' }}>
        <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:17, padding: isMobile?'16px':'20px', backdropFilter:'blur(20px)', height:'100%' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15, margin:0 }}>Top villes</h3>
            <MapPin size={14} color="#61DAFB"/>
          </div>
          {byCity.length ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {byCity.map((c,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, transition:'transform 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.transform='translateX(3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform='translateX(0)'}>
                  <div style={{ width:22, height:22, borderRadius:6, background:'rgba(97,218,251,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#61DAFB', flexShrink:0 }}>{i+1}</div>
                  <span style={{ flex:1, fontSize:13, color:'#ffffff' }}>{c._id}</span>
                  <span style={{ fontSize:13, fontWeight:700 }}>{c.count}</span>
                  <ProgressBar value={c.count} max={totalSE} color="#61DAFB"/>
                </div>
              ))}
            </div>
          ) : <div style={{ color:'#ffffff', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucune ville</div>}
        </div>
        </div>{/* /gradient border villes */}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TYPES DE COMMERCE
          Pleine largeur — grille responsive selon nb items
          ════════════════════════════════════════════════════════════════ */}
      {byCommerce.length > 0 && (
      <div style={{ padding:'1px', borderRadius:18, background:'linear-gradient(135deg,#f7900940,#a78bfa20)', marginBottom:24 }}>
      <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:17, padding: isMobile?'16px':'20px', backdropFilter:'blur(20px)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ fontSize:15, margin:0 }}>Types de commerce</h3>
          <Target size={14} color="#f79009"/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
          {byCommerce.map((c,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:'rgba(247,144,9,0.06)', border:'1px solid rgba(247,144,9,0.12)', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(247,144,9,0.12)'; e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(247,144,9,0.06)'; e.currentTarget.style.transform='translateY(0)'; }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'rgba(247,144,9,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#f79009', flexShrink:0 }}>{i+1}</div>
              <span style={{ flex:1, fontSize:13, color:'#ffffff', lineHeight:1.3 }}>{commerceLbl[c._id]||c._id}</span>
              <span style={{ fontSize:16, fontWeight:700, color:'#f79009', flexShrink:0 }}>{c.count}</span>
            </div>
          ))}
        </div>
      </div>
      </div>
      )}

      {byCommerceB2C.length > 0 && (
      <div style={{ padding:'1px', borderRadius:18, background:'linear-gradient(135deg,#12b76a40,#61DAFB20)', marginBottom:24 }}>
      <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:17, padding: isMobile?'16px':'20px', backdropFilter:'blur(20px)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ fontSize:15, margin:0 }}>B2C</h3>
          <Target size={14} color="#12b76a"/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
          {byCommerceB2C.map((c,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:'rgba(18,183,106,0.06)', border:'1px solid rgba(18,183,106,0.12)', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(18,183,106,0.12)'; e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(18,183,106,0.06)'; e.currentTarget.style.transform='translateY(0)'; }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'rgba(18,183,106,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#12b76a', flexShrink:0 }}>{i+1}</div>
              <span style={{ flex:1, fontSize:13, color:'#ffffff', lineHeight:1.3 }}>{commerceLbl[c._id]||c._id}</span>
              <span style={{ fontSize:16, fontWeight:700, color:'#12b76a', flexShrink:0 }}>{c.count}</span>
            </div>
          ))}
        </div>
      </div>
      </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          LEADS RÉCENTS — filtrés par année globale
          Pleine largeur
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ padding:'1px', borderRadius:18, background:'linear-gradient(135deg,#12b76a40,#61DAFB25,#a78bfa15)' }}>
      <div style={{ background:'rgba(2,8,16,0.97)', borderRadius:17, padding: isMobile?'16px':'20px', backdropFilter:'blur(20px)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ fontSize:15, margin:0 }}>Leads récents</h3>
          <TrendingUp size={14} color="#ffffff"/>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {recentProspects.length ? recentProspects.map((p,i) => {
            const avs       = ['av-blue','av-teal','av-amber','av-coral','av-purple'];
            const name      = p.entreprise||`${p.prenom||''} ${p.nom||''}`.trim()||'Sans nom';
            const ini       = (name[0]||'?').toUpperCase();
            const statColor = STATUS_COLORS[p.status]||'#8b8b9e';
            const annulee   = p.status === 'installation_annulee';
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap: isMobile?10:12, padding:'10px 0', borderBottom:i<recentProspects.length-1?'1px solid var(--border)':'none', transition:'all 0.15s', background: annulee?'rgba(190,18,60,0.04)':'transparent', borderRadius: annulee?8:0 }}
                onMouseEnter={e => { e.currentTarget.style.background= annulee?'rgba(190,18,60,0.08)':'var(--bg-secondary)'; e.currentTarget.style.borderRadius='8px'; e.currentTarget.style.padding='10px 8px'; }}
                onMouseLeave={e => { e.currentTarget.style.background= annulee?'rgba(190,18,60,0.04)':'transparent'; e.currentTarget.style.borderRadius= annulee?'8px':'0'; e.currentTarget.style.padding='10px 0'; }}>
                <div className={`avatar ${avs[i%avs.length]}`} style={{ width:36, height:36, fontSize:13, flexShrink:0 }}>{ini}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color: annulee?'#be123c':undefined }}>{name}</div>
                  <div style={{ fontSize:11, color:'#ffffff' }}>{p.ville||'—'} · {new Date(p.createdAt).toLocaleDateString('fr-CA')}</div>
                  {annulee && p.motifAnnulation && <div style={{ fontSize:10, color:'#be123c', marginTop:1 }}>✕ {p.motifAnnulation}</div>}
                </div>
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:'rgba(18,183,106,0.1)', color:'#12b76a', flexShrink:0 }}>🏢</span>
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:`${statColor}15`, color:statColor, flexShrink:0 }}>{STATUS_LABELS_FR[p.status]||p.status}</span>
              </div>
            );
          }) : <div style={{ color:'#ffffff', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucun lead</div>}
        </div>
      </div>
      </div>{/* /gradient border recent leads */}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}
