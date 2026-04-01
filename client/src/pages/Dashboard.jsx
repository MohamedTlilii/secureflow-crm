// ════════════════════════════════════════════════════════════════════════════
// client/src/pages/Dashboard.jsx
// Utilise /api/stats — Google Alerts + Solution Express uniquement
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import axios from 'axios';
import api from '../api';

import {
  Users, TrendingUp, CheckCircle, AlertCircle, Clock,
  MapPin, Zap, Bell, Building2, Shield, Wifi, Smartphone, Video
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

api.interceptors.request.use(config => {
  const token = localStorage.getItem('sf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Constantes labels ────────────────────────────────────────────────────────
const PRODUIT_COLORS  = { alarme:'#f04438', cameras:'#a764f8', internet:'#3b6cf8', mobile:'#12b76a', controle_acces:'#f79009', autre:'#8b8b9e' };
const PRODUIT_LABELS  = { alarme:'Alarme', cameras:'Caméras', internet:'Internet', mobile:'Mobile', controle_acces:'Contrôle accès', autre:'Autre' };
const PRODUIT_ICONS   = { alarme:Shield, cameras:Video, internet:Wifi, mobile:Smartphone, controle_acces:Shield, autre:Zap };
const QUALIF_LABELS   = {
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
const LEAD_TYPE_LABELS  = { nouvelle_entreprise:'Nouvelle entreprise', demenagement:'Déménagement', reouverture:'Réouverture', commerce_existant:'Commerce existant', autre:'Autre' };
const LEAD_TYPE_COLORS  = { nouvelle_entreprise:'#12b76a', demenagement:'#0077b5', reouverture:'#f79009', commerce_existant:'#a764f8', autre:'#8b8b9e' };
const ALERT_TYPE_LABELS = { incendie:'Incendie', vol:'Vol', nouvelle_entreprise:'Nouvelle entreprise', ouverture:'Ouverture', demenagement:'Déménagement', reouverture:'Réouverture', incident:'Incident', autre:'Autre' };
const ALERT_TYPE_COLORS = { incendie:'#f04438', vol:'#f79009', nouvelle_entreprise:'#12b76a', ouverture:'#3b6cf8', demenagement:'#0077b5', reouverture:'#f79009', incident:'#a764f8', autre:'#8b8b9e' };
const STATUS_COLORS     = { new:'#3b6cf8', analyzed:'#3b6cf8', contacted:'#f79009', interested:'#12b76a', proposal:'#a764f8', won:'#12b76a', lost:'#f04438', ignored:'#8b8b9e', saved:'#12b76a' };
const STATUS_LABELS_FR  = { new:'Nouveau', analyzed:'Analysé', contacted:'Contacté', interested:'Intéressé', proposal:'Soumission', won:'Gagné', lost:'Perdu', ignored:'Ignoré', saved:'Sauvegardé' };

// ── Mini barre de progression ─────────────────────────────────────────────────
function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value/max)*100) : 0;
  return (
    <div style={{ flex:1, height:5, borderRadius:3, background:'var(--border)', overflow:'hidden' }}>
      <div style={{ height:'100%', borderRadius:3, background:color||'var(--accent)', width:`${pct}%`, transition:'width 0.6s ease' }}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
api.get('/api/stats')
      .then(r => setStats(r.data))
      .catch(err => console.error('Dashboard stats error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div style={{ width:32, height:32, border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
    </div>
  );
  if (!stats) return <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}>Erreur chargement</div>;

  return (
    <div className="animate-fade">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="page-header flex-between">
        <div>
          <h1>Dashboard</h1>
          <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:2 }}>Google Alerts · Solution Express</p>
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)', background:'var(--bg-card)', padding:'6px 12px', borderRadius:8, border:'1px solid var(--border)' }}>
          {new Date().toLocaleDateString('fr-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </div>
      </div>

      {/* ── 4 STATS PRINCIPALES ─────────────────────────────────────────── */}
      <div className="grid-4 mb-6">
        {[
          { label:'Total leads',  value:stats.total,                               sub:`${stats.totalGA} alertes · ${stats.totalSE} Solution Express`, icon:Users,       color:'var(--accent)'  },
          { label:'Urgents',      value:stats.urgent,                              sub:`Score ≥ 7 · Moy. ${stats.avgUrgence}/10`,                       icon:AlertCircle, color:'var(--danger)'  },
          { label:'En pipeline',  value:(stats.seStatuts?.contacted||0)+(stats.seStatuts?.interested||0)+(stats.seStatuts?.proposal||0), sub:`${stats.seStatuts?.proposal||0} soumissions actives`, icon:Clock, color:'var(--warning)' },
          { label:'Gagnés',       value:stats.won,                                 sub:`Taux de conversion ${stats.conversionRate}%`,                   icon:CheckCircle, color:'var(--success)'  },
        ].map((s,i) => (
          <div key={i} className="stat-card animate-fade" style={{ animationDelay:`${i*0.05}s` }}>
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

      {/* ── GOOGLE ALERTS + SOLUTION EXPRESS ────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>

        {/* Google Alerts */}
        <div className="card" style={{ borderTop:'3px solid #ea4335' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{ width:38, height:38, borderRadius:9, background:'rgba(234,67,53,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Bell size={19} color="#ea4335"/>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700 }}>Google Alerts</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>{stats.totalGA} alertes · analysées par Groq AI</div>
            </div>
            <div style={{ marginLeft:'auto', fontSize:28, fontWeight:800, color:'#ea4335' }}>{stats.totalGA}</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {[
              { label:'Nouveau',   value:(stats.gaStatuts?.new||0)+(stats.gaStatuts?.analyzed||0), color:'#3b6cf8' },
              { label:'Contacté',  value:stats.gaStatuts?.contacted||0,                            color:'#f79009' },
              { label:'Sauvegardé',value:stats.gaStatuts?.saved||0,                               color:'#12b76a' },
            ].map(s => (
              <div key={s.label} style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'10px 12px', borderLeft:`3px solid ${s.color}`, textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Solution Express */}
        <div className="card" style={{ borderTop:'3px solid #12b76a' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{ width:38, height:38, borderRadius:9, background:'rgba(18,183,106,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Building2 size={19} color="#12b76a"/>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700 }}>Solution Express</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>{stats.totalSE} fiches · {stats.b2b} B2B · {stats.b2c} B2C</div>
            </div>
            <div style={{ marginLeft:'auto', fontSize:28, fontWeight:800, color:'#12b76a' }}>{stats.totalSE}</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {[
              { label:'Nouveau',    value:stats.seStatuts?.new||0,       color:'#3b6cf8' },
              { label:'Contacté',   value:stats.seStatuts?.contacted||0, color:'#f79009' },
              { label:'Intéressé',  value:stats.seStatuts?.interested||0,color:'#12b76a' },
              { label:'Soumission', value:stats.seStatuts?.proposal||0,  color:'#a764f8' },
              { label:'Gagné',      value:stats.seStatuts?.won||0,       color:'#12b76a' },
              { label:'Perdu',      value:stats.seStatuts?.lost||0,      color:'#f04438' },
            ].map(s => (
              <div key={s.label} style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'8px 10px', borderLeft:`3px solid ${s.color}`, textAlign:'center' }}>
                <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PIPELINE + PRODUITS ──────────────────────────────────────────── */}
      <div className="grid-2 mb-6">

        {/* Pipeline chart */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3 style={{ fontSize:15 }}>Pipeline global</h3>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>{stats.total} leads</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.pipelineData} barSize={30}>
              <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} cursor={{ fill:'rgba(255,255,255,0.03)' }}/>
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {(stats.pipelineData||[]).map((e,i) => <Cell key={i} fill={e.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Produits d'intérêt */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3 style={{ fontSize:15 }}>Produits d'intérêt</h3>
            <Zap size={14} color="var(--warning)"/>
          </div>
          {(stats.byProduit||[]).length ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {stats.byProduit.map((s,i) => {
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
                      <ProgressBar value={s.count} max={stats.totalSE} color={color}/>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucun produit</div>}
        </div>
      </div>

      {/* ── TYPES ALERTES + QUALIFICATION ───────────────────────────────── */}
      <div className="grid-2 mb-6">

        {/* Types d'alertes Google */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3 style={{ fontSize:15 }}>Types d'alertes Google</h3>
            <Bell size={14} color="#ea4335"/>
          </div>
          {(stats.byAlertType||[]).length ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {stats.byAlertType.map((a,i) => {
                const color = ALERT_TYPE_COLORS[a._id] || '#8b8b9e';
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }}/>
                    <span style={{ flex:1, fontSize:13, color:'var(--text-secondary)' }}>{ALERT_TYPE_LABELS[a._id]||a._id}</span>
                    <span style={{ fontSize:13, fontWeight:700, color }}>{a.count}</span>
                    <ProgressBar value={a.count} max={stats.totalGA} color={color}/>
                  </div>
                );
              })}
            </div>
          ) : <div style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucune alerte</div>}
        </div>

        {/* Qualification système */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3 style={{ fontSize:15 }}>Qualification système</h3>
            <Shield size={14} color="var(--text-muted)"/>
          </div>
          {(stats.byQualif||[]).length ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {stats.byQualif.map((q,i) => {
                const colors = ['#f04438','#f79009','#12b76a','#3b6cf8','#a764f8','#8b8b9e'];
                const color  = colors[i%colors.length];
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, background:'var(--bg-secondary)', borderRadius:8, padding:'8px 12px' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }}/>
                    <span style={{ flex:1, fontSize:12, color:'var(--text-secondary)' }}>🔒 {QUALIF_LABELS[q._id]||q._id}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{q.count}</span>
                  </div>
                );
              })}
            </div>
          ) : <div style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucune qualification</div>}
        </div>
      </div>

      {/* ── FOURNISSEURS + TYPES DE LEAD ─────────────────────────────────── */}
      <div className="grid-2 mb-6">

        {/* Top fournisseurs actuels */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3 style={{ fontSize:15 }}>Top fournisseurs actuels</h3>
            <TrendingUp size={14} color="var(--text-muted)"/>
          </div>
          {(stats.byFourn||[]).length ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {stats.byFourn.map((f,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:22, height:22, borderRadius:6, background:'var(--bg-hover)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--text-muted)', flexShrink:0 }}>{i+1}</div>
                  <span style={{ flex:1, fontSize:13, color:'var(--text-secondary)' }}>{FOURN_LABELS[f._id]||f._id}</span>
                  <span style={{ fontSize:13, fontWeight:700 }}>{f.count}</span>
                  <ProgressBar value={f.count} max={Math.max(...(stats.byFourn||[]).map(x=>x.count),1)} color="var(--accent)"/>
                </div>
              ))}
            </div>
          ) : <div style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucun fournisseur</div>}
        </div>

        {/* Types de lead */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3 style={{ fontSize:15 }}>Types de leads</h3>
            <Building2 size={14} color="var(--text-muted)"/>
          </div>
          {(stats.byLeadType||[]).length ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {stats.byLeadType.map((l,i) => {
                const color = LEAD_TYPE_COLORS[l._id] || '#8b8b9e';
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }}/>
                    <span style={{ flex:1, fontSize:13, color:'var(--text-secondary)' }}>{LEAD_TYPE_LABELS[l._id]||l._id}</span>
                    <span style={{ fontSize:13, fontWeight:700, color }}>{l.count}</span>
                    <ProgressBar value={l.count} max={stats.totalSE} color={color}/>
                  </div>
                );
              })}
            </div>
          ) : <div style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucun type</div>}
        </div>
      </div>

      {/* ── TOP VILLES + LEADS RÉCENTS ───────────────────────────────────── */}
      <div className="grid-2">

        {/* Top villes */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3 style={{ fontSize:15 }}>Top villes</h3>
            <MapPin size={14} color="var(--text-muted)"/>
          </div>
          {(stats.byCity||[]).length ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {stats.byCity.map((c,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:22, height:22, borderRadius:6, background:'var(--bg-hover)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--text-muted)', flexShrink:0 }}>{i+1}</div>
                  <span style={{ flex:1, fontSize:13, color:'var(--text-secondary)' }}>{c._id}</span>
                  <span style={{ fontSize:13, fontWeight:700 }}>{c.count}</span>
                  <ProgressBar value={c.count} max={stats.total} color="var(--accent)"/>
                </div>
              ))}
            </div>
          ) : <div style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucune ville</div>}
        </div>

        {/* Leads récents */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3 style={{ fontSize:15 }}>Leads récents</h3>
            <TrendingUp size={14} color="var(--text-muted)"/>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {(stats.recentProspects||[]).length ? stats.recentProspects.map((p,i) => {
              const avs   = ['av-blue','av-teal','av-amber','av-coral','av-purple'];
              const name  = p.entreprise || `${p.prenom||''} ${p.nom||''}`.trim() || 'Sans nom';
              const ini   = (name[0]||'?').toUpperCase();
              const isSE  = p.source === 'solution_express';
              const color = isSE ? '#12b76a' : '#ea4335';
              const src   = isSE ? '🏢' : '🔔';
              const statColor = STATUS_COLORS[p.status] || '#8b8b9e';
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i < stats.recentProspects.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <div className={`avatar ${avs[i%avs.length]}`} style={{ width:36, height:36, fontSize:13, flexShrink:0 }}>{ini}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{p.ville||'—'} · {new Date(p.createdAt).toLocaleDateString('fr-CA')}</div>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:`${color}15`, color, flexShrink:0 }}>{src}</span>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:`${statColor}15`, color:statColor, flexShrink:0 }}>{STATUS_LABELS_FR[p.status]||p.status}</span>
                </div>
              );
            }) : <div style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Aucun lead</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
