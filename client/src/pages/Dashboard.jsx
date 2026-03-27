import { useEffect, useState } from 'react';
import axios from 'axios'; 
import { Users, TrendingUp, Target, CheckCircle, AlertCircle, Clock, MapPin, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b6cf8','#00d4aa','#f79009','#f04438','#a764f8','#ec4899','#10b981','#6366f1'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/stats').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><div style={{width:32,height:32,border:'2px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} /></div>;
  if (!stats) return null;

  const pipelineData = [
    { name: 'Inbox', value: stats.inbox, color: '#8b8b9e' },
    { name: 'Qualification', value: stats.qualifying, color: '#f79009' },
    { name: 'Proposition', value: stats.proposal, color: '#3b6cf8' },
    { name: 'Gagné', value: stats.closed, color: '#12b76a' },
  ];

  const signalLabels = { ouverture:'Nouveau local', recrutement:'Recrutement', 'nouveau-poste':'Nouveau poste', expansion:'Expansion', commentaire:'Commentaire', incident:'Incident', manuel:'Manuel' };

  return (
    <div className="animate-fade">
      <div className="page-header flex-between">
        <div>
          <h1>Dashboard</h1>
          <p>Vue d'ensemble de votre activité de prospection</p>
        </div>
        <div style={{fontSize:12,color:'var(--text-muted)',background:'var(--bg-card)',padding:'6px 12px',borderRadius:8,border:'1px solid var(--border)'}}>
          {new Date().toLocaleDateString('fr-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid-4 mb-6">
        {[
          { label:'Total prospects', value: stats.total, icon: Users, sub:`${stats.b2b} B2B · ${stats.b2c} B2C`, color:'var(--accent)' },
          { label:'Urgents P0', value: stats.p0, icon: AlertCircle, sub:'Action immédiate', color:'var(--danger)' },
          { label:'En cours', value: stats.qualifying + stats.proposal, icon: Clock, sub:`${stats.qualifying} qualif · ${stats.proposal} proposi.`, color:'var(--warning)' },
          { label:'Deals closés', value: stats.closed, icon: CheckCircle, sub:`Taux ${stats.conversionRate}%`, color:'var(--success)' },
        ].map((s,i) => (
          <div key={i} className="stat-card animate-fade" style={{animationDelay:`${i*0.05}s`}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
              <div style={{width:40,height:40,borderRadius:10,background:`${s.color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <s.icon size={18} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-6">
        {/* Pipeline chart */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3 style={{fontSize:15}}>Pipeline de vente</h3>
            <span style={{fontSize:12,color:'var(--text-muted)'}}>{stats.total} prospects</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pipelineData} barSize={32}>
              <XAxis dataKey="name" tick={{fill:'var(--text-muted)',fontSize:11}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:'var(--text-muted)',fontSize:11}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}} cursor={{fill:'rgba(255,255,255,0.03)'}} />
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {pipelineData.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Signaux */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3 style={{fontSize:15}}>Signaux d'intention</h3>
            <Zap size={14} color="var(--warning)" />
          </div>
          {stats.bySignal.length ? (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {stats.bySignal.map((s,i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:COLORS[i%COLORS.length],flexShrink:0}} />
                  <div style={{flex:1,fontSize:13,color:'var(--text-secondary)'}}>{signalLabels[s._id] || s._id}</div>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{s.count}</div>
                  <div style={{width:60,height:4,borderRadius:2,background:'var(--border)',overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:2,background:COLORS[i%COLORS.length],width:`${Math.round((s.count/(stats.total||1))*100)}%`}} />
                  </div>
                </div>
              ))}
            </div>
          ) : <div style={{color:'var(--text-muted)',fontSize:13,textAlign:'center',padding:'20px 0'}}>Aucun signal encore</div>}
        </div>
      </div>

      <div className="grid-2">
        {/* Top villes */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3 style={{fontSize:15}}>Top villes</h3>
            <MapPin size={14} color="var(--text-muted)" />
          </div>
          {stats.byCity.length ? (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {stats.byCity.map((c,i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:'var(--bg-hover)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'var(--text-muted)'}}>{i+1}</div>
                  <div style={{flex:1,fontSize:13,color:'var(--text-secondary)'}}>{c._id}</div>
                  <div style={{fontSize:13,fontWeight:600}}>{c.count}</div>
                </div>
              ))}
            </div>
          ) : <div style={{color:'var(--text-muted)',fontSize:13,textAlign:'center',padding:'20px 0'}}>Aucune donnée</div>}
        </div>

        {/* Prospects récents */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3 style={{fontSize:15}}>Prospects récents</h3>
            <TrendingUp size={14} color="var(--text-muted)" />
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {stats.recentProspects.length ? stats.recentProspects.map((p,i) => {
              const avs = ['av-blue','av-teal','av-amber','av-coral','av-purple'];
              const ini = ((p.prenom||'?')[0]+(p.nom||'?')[0]).toUpperCase();
              const stageLabel = {
                '01_Inbox':'Inbox','02_Qualifying':'Qualification',
                '03_Proposal':'Proposition','04_Closed':'Gagné','99_Dead':'Perdu'
              }[p.stage] || p.stage;
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
                  <div className={`avatar ${avs[i%avs.length]}`}>{ini}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.prenom} {p.nom}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)'}}>{p.entreprise || 'Particulier'} · {p.ville}</div>
                  </div>
                  <span style={{fontSize:11,color:'var(--text-muted)',background:'var(--bg-hover)',padding:'2px 8px',borderRadius:20}}>{stageLabel}</span>
                </div>
              );
            }) : <div style={{color:'var(--text-muted)',fontSize:13,textAlign:'center',padding:'20px 0'}}>Aucun prospect encore</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
