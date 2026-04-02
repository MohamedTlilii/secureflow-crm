// ════════════════════════════════════════════════════════════════════════════
// client/src/pages/Commissions.jsx
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  DollarSign, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  TrendingUp, Building2, MapPin, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('sf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-CA', { year:'numeric', month:'short', day:'numeric' }) : '—';
const fmtMoney = v => `${(v||0).toFixed(2)} TND`;

// ════════════════════════════════════════════════════════════════════════════
// CALENDRIER MODERNE
// ════════════════════════════════════════════════════════════════════════════
function CalendrierModerne({ commissions, onSelectDate, selectedDate }) {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const firstDay    = new Date(current.year, current.month, 1).getDay();
  const offset      = firstDay === 0 ? 6 : firstDay - 1;
  const monthName   = new Date(current.year, current.month).toLocaleDateString('fr-CA', { month:'long', year:'numeric' });
  const days        = ['L','M','M','J','V','S','D'];

  const prevMonth = () => setCurrent(c => ({ year: c.month===0?c.year-1:c.year, month: c.month===0?11:c.month-1 }));
  const nextMonth = () => setCurrent(c => ({ year: c.month===11?c.year+1:c.year, month: c.month===11?0:c.month+1 }));

  // Index par date
  const byDate = {};
  commissions.forEach(c => {
    const d = new Date(c.dateVente || c.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (!byDate[key]) byDate[key] = { total:0, payee:0, attente:0, items:[] };
    byDate[key].total += c.commissionTotale||0;
    if (c.commissionPayee) byDate[key].payee += c.commissionTotale||0;
    else byDate[key].attente += c.commissionTotale||0;
    byDate[key].items.push(c);
  });

  // Total du mois affiché
  const totalMois = Object.entries(byDate)
    .filter(([k]) => k.startsWith(`${current.year}-${String(current.month+1).padStart(2,'0')}`))
    .reduce((s,[,v]) => s + v.total, 0);

  return (
    <div className="card" style={{ padding:0, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={prevMonth} style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>
          <ChevronLeft size={16}/>
        </button>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', textTransform:'capitalize' }}>{monthName}</div>
          {totalMois > 0 && <div style={{ fontSize:11, color:'#12b76a', fontWeight:600, marginTop:2 }}>{fmtMoney(totalMois)} ce mois</div>}
        </div>
        <button onClick={nextMonth} style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>
          <ChevronRight size={16}/>
        </button>
      </div>

      <div style={{ padding:'16px' }}>
        {/* Jours semaine */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:8 }}>
          {days.map((d,i) => (
            <div key={i} style={{ textAlign:'center', fontSize:10, color:'var(--text-muted)', fontWeight:700, padding:'4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Grille jours */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
          {Array(offset).fill(null).map((_,i) => <div key={`e${i}`}/>)}
          {Array(daysInMonth).fill(null).map((_,i) => {
            const day      = i + 1;
            const date     = new Date(current.year, current.month, day);
            const key      = `${current.year}-${String(current.month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const data     = byDate[key];
            const isToday  = date.toDateString() === today.toDateString();
            const isSel    = selectedDate && date.toDateString() === selectedDate.toDateString();
            const hasData  = !!data;

            return (
              <div key={day}
                onClick={() => hasData ? onSelectDate(date, data.items) : onSelectDate(null, [])}
                style={{
                  borderRadius:8, padding:'5px 3px', textAlign:'center', cursor: hasData ? 'pointer' : 'default', transition:'all 0.12s',
                  background: isSel ? '#12b76a' : isToday ? 'rgba(59,108,248,0.12)' : hasData ? 'rgba(18,183,106,0.07)' : 'transparent',
                  border: isSel ? '2px solid #12b76a' : isToday ? '1px solid #3b6cf8' : hasData ? '1px solid rgba(18,183,106,0.25)' : '1px solid transparent',
                  minHeight:46,
                }}
                onMouseEnter={e => { if(hasData && !isSel) e.currentTarget.style.background='rgba(18,183,106,0.14)'; }}
                onMouseLeave={e => { if(hasData && !isSel) e.currentTarget.style.background='rgba(18,183,106,0.07)'; }}
              >
                <div style={{ fontSize:12, fontWeight: isToday||isSel||hasData ? 700 : 400, color: isSel ? '#fff' : isToday ? '#3b6cf8' : 'var(--text-primary)' }}>
                  {day}
                </div>
                {hasData && (
                  <>
                    <div style={{ fontSize:8, fontWeight:700, color: isSel?'rgba(255,255,255,0.9)':'#12b76a', marginTop:1, lineHeight:1 }}>
                      {data.total >= 1000 ? `${(data.total/1000).toFixed(1)}k` : data.total.toFixed(0)}$
                    </div>
                    <div style={{ display:'flex', justifyContent:'center', gap:2, marginTop:2 }}>
                      {data.payee > 0   && <div style={{ width:3, height:3, borderRadius:'50%', background: isSel?'rgba(255,255,255,0.8)':'#12b76a' }}/>}
                      {data.attente > 0 && <div style={{ width:3, height:3, borderRadius:'50%', background: isSel?'rgba(255,255,255,0.6)':'#f79009' }}/>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div style={{ display:'flex', gap:12, marginTop:14, paddingTop:12, borderTop:'1px solid var(--border)', fontSize:10, color:'var(--text-muted)', flexWrap:'wrap' }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:7, height:7, borderRadius:'50%', background:'#12b76a', display:'inline-block' }}/> Payée</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:7, height:7, borderRadius:'50%', background:'#f79009', display:'inline-block' }}/> En attente</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:7, height:7, borderRadius:'50%', background:'#3b6cf8', display:'inline-block' }}/> Aujourd'hui</span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function Commissions() {
  const [fiches, setFiches]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filtre, setFiltre]         = useState('tout');
  const [annee, setAnnee]           = useState('tout');
  const [selectedDate, setSelectedDate]   = useState(null);
  const [selectedVentes, setSelectedVentes] = useState([]);

  const fetchFiches = useCallback(async () => {
    try {
      const r = await axios.get('/api/solution-express');
      setFiches((r.data||[]).filter(x => (x.commissionTotale||0) > 0 || (x.commissionFixe||0) > 0));
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFiches(); }, [fetchFiches]);

  const togglePaiement = async (fiche) => {
    try {
      await axios.put(`/api/solution-express/${fiche._id}`, {
        ...fiche,
        commissionPayee: !fiche.commissionPayee,
        datePaiementCommission: !fiche.commissionPayee ? new Date().toISOString() : null,
      });
      toast.success(!fiche.commissionPayee ? '✓ Commission payée !' : 'Marquée non payée');
      // Mise à jour locale du selectedVentes aussi
      setSelectedVentes(prev => prev.map(v => v._id === fiche._id ? {...v, commissionPayee: !fiche.commissionPayee} : v));
      fetchFiches();
    } catch { toast.error('Erreur'); }
  };

  const annees = Array.from({ length: new Date().getFullYear() - 2025 }, (_, i) => new Date().getFullYear() - i);

  const filtered = fiches.filter(c => {
    const yr      = new Date(c.dateVente || c.createdAt).getFullYear();
    const anneeOk = annee === 'tout' || String(yr) === annee;
    const statOk  = filtre === 'tout' ? true : filtre === 'payee' ? c.commissionPayee : !c.commissionPayee;
    return anneeOk && statOk;
  });

  const totalGagne = filtered.reduce((s,c) => s + (c.commissionTotale||0), 0);
  const totalPaye  = filtered.filter(c => c.commissionPayee).reduce((s,c) => s + (c.commissionTotale||0), 0);
  const enAttente  = totalGagne - totalPaye;
  const vals       = filtered.map(c => c.commissionTotale||0).filter(v => v > 0);
  const maximum    = vals.length > 0 ? Math.max(...vals) : 0;
  const minimum    = vals.length > 0 ? Math.min(...vals) : 0;

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div style={{ width:32, height:32, border:'2px solid var(--border)', borderTopColor:'#12b76a', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
    </div>
  );

  return (
    <div className="animate-fade">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="page-header flex-between">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,#12b76a,#0e9558)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(18,183,106,0.3)' }}>
            <DollarSign size={22} color="#fff"/>
          </div>
          <div>
            <h1>Commissions</h1>
            <p style={{ color:'var(--text-muted)', fontSize:13 }}>Solution Express · {fiches.length} vente{fiches.length!==1?'s':''}</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Filtres statut */}
          <div style={{ display:'flex', gap:5, background:'var(--bg-secondary)', borderRadius:10, padding:4, border:'1px solid var(--border)' }}>
            {[['tout','Tout'],['payee','✓ Payée'],['non_payee','⏳ Attente']].map(([k,l]) => (
              <button key={k} onClick={() => setFiltre(k)}
                style={{ padding:'5px 14px', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer', border:'none', transition:'all 0.15s',
                  background: filtre===k ? (k==='payee'?'#12b76a':k==='non_payee'?'#f79009':'var(--accent)') : 'transparent',
                  color: filtre===k ? '#fff' : 'var(--text-muted)' }}>
                {l}
              </button>
            ))}
          </div>
          {/* Année */}
          <select value={annee} onChange={e => setAnnee(e.target.value)}
            style={{ fontSize:12, padding:'7px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', cursor:'pointer', outline:'none', fontWeight:600 }}>
            <option value="tout">Toutes les années</option>
            {annees.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <div style={{ fontSize:12, color:'var(--text-muted)', background:'var(--bg-card)', padding:'7px 14px', borderRadius:8, border:'1px solid var(--border)' }}>
            {new Date().toLocaleDateString('fr-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </div>
        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', gap:12, marginBottom:24 }}>

        {/* Total — grande carte */}
        <div style={{ background:'linear-gradient(135deg,rgba(18,183,106,0.1),rgba(18,183,106,0.03))', borderRadius:14, padding:'20px 24px', border:'1px solid rgba(18,183,106,0.2)', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'rgba(18,183,106,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <TrendingUp size={24} color="#12b76a"/>
          </div>
          <div>
            <div style={{ fontSize:11, color:'#12b76a', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 }}>Total gagné</div>
            <div style={{ fontSize:30, fontWeight:700, color:'#12b76a', lineHeight:1 }}>{fmtMoney(totalGagne)}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{filtered.length} vente{filtered.length!==1?'s':''} · {fmtMoney(totalGagne/Math.max(filtered.length,1))} en moyenne</div>
          </div>
        </div>

        {/* Payé */}
        <div style={{ background:'rgba(59,108,248,0.06)', borderRadius:14, padding:'18px 16px', border:'1px solid rgba(59,108,248,0.15)', textAlign:'center' }}>
          <div style={{ fontSize:10, color:'#3b6cf8', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>✓ Payé</div>
          <div style={{ fontSize:22, fontWeight:700, color:'#3b6cf8', lineHeight:1 }}>{fmtMoney(totalPaye)}</div>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:6 }}>{filtered.filter(c=>c.commissionPayee).length} vente{filtered.filter(c=>c.commissionPayee).length!==1?'s':''}</div>
        </div>

        {/* En attente */}
        <div style={{ background:'rgba(247,144,9,0.06)', borderRadius:14, padding:'18px 16px', border:'1px solid rgba(247,144,9,0.15)', textAlign:'center' }}>
          <div style={{ fontSize:10, color:'#f79009', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>⏳ Attente</div>
          <div style={{ fontSize:22, fontWeight:700, color:'#f79009', lineHeight:1 }}>{fmtMoney(enAttente)}</div>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:6 }}>{filtered.filter(c=>!c.commissionPayee).length} vente{filtered.filter(c=>!c.commissionPayee).length!==1?'s':''}</div>
        </div>

        {/* Max */}
        <div style={{ background:'rgba(167,100,248,0.06)', borderRadius:14, padding:'18px 16px', border:'1px solid rgba(167,100,248,0.15)', textAlign:'center' }}>
          <div style={{ fontSize:10, color:'#a764f8', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>Maximum</div>
          <div style={{ fontSize:22, fontWeight:700, color:'#a764f8', lineHeight:1 }}>{fmtMoney(maximum)}</div>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:6 }}>meilleure vente</div>
        </div>

        {/* Min */}
        <div style={{ background:'rgba(139,139,158,0.06)', borderRadius:14, padding:'18px 16px', border:'1px solid rgba(139,139,158,0.15)', textAlign:'center' }}>
          <div style={{ fontSize:10, color:'#8b8b9e', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>Minimum</div>
          <div style={{ fontSize:22, fontWeight:700, color:'#8b8b9e', lineHeight:1 }}>{fmtMoney(minimum)}</div>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:6 }}>plus petite vente</div>
        </div>
      </div>

      {/* ── CALENDRIER + LISTE ────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:20, alignItems:'flex-start' }}>

        {/* Colonne gauche — Calendrier + détail jour */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <CalendrierModerne
            commissions={filtered}
            selectedDate={selectedDate}
            onSelectDate={(date, ventes) => { setSelectedDate(date); setSelectedVentes(ventes); }}
          />

          {/* Détail du jour sélectionné */}
          {selectedDate && selectedVentes.length > 0 && (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'rgba(18,183,106,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:6 }}>
                  <Calendar size={13} color="#12b76a"/>
                  {selectedDate.toLocaleDateString('fr-CA', { weekday:'long', day:'numeric', month:'long' })}
                </div>
                <button onClick={() => { setSelectedDate(null); setSelectedVentes([]); }}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:16, lineHeight:1 }}>×</button>
              </div>
              <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:8 }}>
                {selectedVentes.map((c, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg-secondary)', borderRadius:8, padding:'10px 12px', gap:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {c.entreprise || `${c.prenom||''} ${c.nom||''}`.trim() || 'Sans nom'}
                      </div>
                      {c.ville && <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{c.ville}</div>}
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color: c.commissionPayee?'#12b76a':'#f79009' }}>{fmtMoney(c.commissionTotale)}</div>
                      <div style={{ fontSize:9, color: c.commissionPayee?'#12b76a':'#f79009', fontWeight:600 }}>{c.commissionPayee?'✓ Payée':'⏳ Attente'}</div>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop:'1px solid var(--border)', paddingTop:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:11, color:'var(--text-muted)' }}>Total du jour</span>
                  <span style={{ fontSize:16, fontWeight:700, color:'#12b76a' }}>
                    {fmtMoney(selectedVentes.reduce((s,c) => s+(c.commissionTotale||0), 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite — Liste */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>

          {/* Header liste */}
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>Historique des ventes</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {filtered.length > 0 && (
                <div style={{ fontSize:11, color:'var(--text-muted)', background:'var(--bg-secondary)', padding:'3px 10px', borderRadius:20, border:'1px solid var(--border)' }}>
                  <span style={{ fontWeight:700, color:'var(--text-primary)' }}>{filtered.length}</span> vente{filtered.length!==1?'s':''}
                </div>
              )}
            </div>
          </div>

          {/* Rows */}
          {filtered.length > 0 ? (
            <div>
              {[...filtered]
                .sort((a,b) => new Date(b.dateVente||b.createdAt) - new Date(a.dateVente||a.createdAt))
                .map((c, i, arr) => (
                <div key={c._id}
                  style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderBottom: i<arr.length-1?'1px solid var(--border)':'none', transition:'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>

                  {/* Icône statut */}
                  <div style={{ width:42, height:42, borderRadius:11, background: c.commissionPayee?'rgba(18,183,106,0.1)':'rgba(247,144,9,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${c.commissionPayee?'rgba(18,183,106,0.2)':'rgba(247,144,9,0.2)'}` }}>
                    <DollarSign size={17} color={c.commissionPayee?'#12b76a':'#f79009'}/>
                  </div>

                  {/* Nom + infos */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {c.entreprise || `${c.prenom||''} ${c.nom||''}`.trim() || 'Sans nom'}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      {c.ville && <span style={{ display:'flex', alignItems:'center', gap:3 }}><MapPin size={9}/>{c.ville}</span>}
                      <span style={{ display:'flex', alignItems:'center', gap:3 }}><Calendar size={9}/>{fmtDate(c.dateVente || c.createdAt)}</span>
                      {c.commissionPayee && c.datePaiementCommission && (
                        <span style={{ color:'#12b76a' }}>· Payée le {fmtDate(c.datePaiementCommission)}</span>
                      )}
                    </div>
                  </div>

                  {/* Détail fixe + extra */}
                  {(c.commissionFixe > 0 || c.commissionExtra > 0) && (
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      {c.commissionFixe  > 0 && <div style={{ fontSize:11, color:'var(--text-muted)' }}>Fixe : <strong style={{color:'var(--text-secondary)'}}>{fmtMoney(c.commissionFixe)}</strong></div>}
                      {c.commissionExtra > 0 && <div style={{ fontSize:11, color:'var(--text-muted)' }}>Extra : <strong style={{color:'var(--text-secondary)'}}>{fmtMoney(c.commissionExtra)}</strong></div>}
                    </div>
                  )}

                  {/* Total */}
                  <div style={{ textAlign:'right', flexShrink:0, minWidth:80 }}>
                    <div style={{ fontSize:19, fontWeight:700, color: c.commissionPayee?'#12b76a':'#f79009', lineHeight:1 }}>
                      {fmtMoney(c.commissionTotale)}
                    </div>
                  </div>

                  {/* Bouton toggle */}
                  <button onClick={() => togglePaiement(c)}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0, transition:'all 0.15s',
                      border:`1px solid ${c.commissionPayee?'rgba(18,183,106,0.3)':'rgba(247,144,9,0.3)'}`,
                      background: c.commissionPayee?'rgba(18,183,106,0.08)':'rgba(247,144,9,0.08)',
                      color: c.commissionPayee?'#12b76a':'#f79009' }}>
                    {c.commissionPayee
                      ? <><CheckCircle size={13}/> Payée</>
                      : <><XCircle size={13}/> En attente</>}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
              <div style={{ width:60, height:60, borderRadius:16, background:'var(--bg-secondary)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <DollarSign size={28} style={{ opacity:0.3 }}/>
              </div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text-secondary)', marginBottom:6 }}>Aucune commission</div>
              <div style={{ fontSize:12 }}>Ajoute une commission dans Solution Express</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
