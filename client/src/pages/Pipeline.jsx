// import { useEffect, useState } from 'react';
// import axios from 'axios';
// import { ArrowRight } from 'lucide-react';
// import toast from 'react-hot-toast';

// const STAGES = [
//   { key:'01_Inbox', label:'Inbox', color:'#8b8b9e' },
//   { key:'02_Qualifying', label:'Qualification', color:'#f79009' },
//   { key:'03_Proposal', label:'Proposition', color:'#3b6cf8' },
//   { key:'04_Closed', label:'Gagné', color:'#12b76a' },
//   { key:'99_Dead', label:'Perdu', color:'#4a4a5e' },
// ];

// const AV = ['av-blue','av-teal','av-amber','av-coral','av-purple'];

// export default function Pipeline() {
//   const [prospects, setProspects] = useState([]);

//   useEffect(() => {
//     axios.get('/api/prospects').then(r => setProspects(r.data));
//   }, []);

//   const advance = async (p) => {
//     const order = STAGES.map(s=>s.key);
//     const idx = order.indexOf(p.stage);
//     if (idx < order.length-1) {
//       await axios.put(`/api/prospects/${p._id}`, { stage: order[idx+1] });
//       const r = await axios.get('/api/prospects');
//       setProspects(r.data);
//       toast.success(`Déplacé → ${STAGES[idx+1].label}`);
//     }
//   };

//   const ini = p => ((p.prenom[0]||'')+(p.nom[0]||'')).toUpperCase();

//   return (
//     <div className="animate-fade">
//       <div className="page-header">
//         <h1>Pipeline</h1>
//         <p>Vue kanban de votre tunnel de vente</p>
//       </div>
//       <div style={{display:'grid',gridTemplateColumns:'repeat(5,minmax(0,1fr))',gap:12,alignItems:'start'}}>
//         {STAGES.map(stage => {
//           const items = prospects.filter(p => p.stage === stage.key);
//           return (
//             <div key={stage.key} style={{background:'var(--bg-secondary)',borderRadius:16,padding:12,border:'1px solid var(--border)'}}>
//               <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
//                 <div style={{display:'flex',alignItems:'center',gap:6}}>
//                   <div style={{width:8,height:8,borderRadius:'50%',background:stage.color}} />
//                   <span style={{fontSize:12,fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{stage.label}</span>
//                 </div>
//                 <span style={{fontSize:11,fontWeight:700,background:'var(--bg-card)',color:'var(--text-muted)',borderRadius:20,padding:'2px 8px',border:'1px solid var(--border)'}}>{items.length}</span>
//               </div>
//               <div style={{display:'flex',flexDirection:'column',gap:8}}>
//                 {items.map((p,i) => (
//                   <div key={p._id} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,padding:12,cursor:'pointer',transition:'border-color 0.15s'}}
//                     onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-hover)'}
//                     onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
//                     <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
//                       <div className={`avatar ${AV[i%AV.length]}`} style={{width:28,height:28,fontSize:11}}>{ini(p)}</div>
//                       <div style={{flex:1,minWidth:0}}>
//                         <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.prenom} {p.nom}</div>
//                         <div style={{fontSize:11,color:'var(--text-muted)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.entreprise||'Particulier'}</div>
//                       </div>
//                     </div>
//                     <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:8}}>{p.ville} · {p.type}</div>
//                     {stage.key !== '04_Closed' && stage.key !== '99_Dead' && (
//                       <button className="btn btn-sm" style={{width:'100%',justifyContent:'center',fontSize:11}} onClick={()=>advance(p)}>
//                         Avancer <ArrowRight size={11}/>
//                       </button>
//                     )}
//                   </div>
//                 ))}
//                 {items.length === 0 && <div style={{textAlign:'center',padding:'20px 0',color:'var(--text-muted)',fontSize:12}}>Vide</div>}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }
import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const STAGES = [
  { key:'01_Inbox', label:'Inbox', color:'#8b8b9e' },
  { key:'02_Qualifying', label:'Qualification', color:'#f79009' },
  { key:'03_Proposal', label:'Proposition', color:'#3b6cf8' },
  { key:'04_Closed', label:'Gagné', color:'#12b76a' },
  { key:'99_Dead', label:'Perdu', color:'#4a4a5e' },
];

const AV = ['av-blue','av-teal','av-amber','av-coral','av-purple'];

export default function Pipeline() {
  const [prospects, setProspects] = useState([]);

  const fetchProspects = () => {
    axios.get('/api/prospects').then(r => setProspects(r.data));
  };

  useEffect(() => {
    fetchProspects();
  }, []);

  // --- LOGIQUE DRAG & DROP ---
  const onDragStart = (e, id) => {
    e.dataTransfer.setData("prospectId", id);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = async (e, targetStage) => {
    const id = e.dataTransfer.getData("prospectId");
    await axios.put(`/api/prospects/${id}`, { stage: targetStage });
    fetchProspects();
    toast.success("Étape mise à jour");
  };

  const advance = async (p) => {
    const order = STAGES.map(s=>s.key);
    const idx = order.indexOf(p.stage);
    if (idx < order.length-1) {
      await axios.put(`/api/prospects/${p._id}`, { stage: order[idx+1] });
      fetchProspects();
      toast.success(`Déplacé → ${STAGES[idx+1].label}`);
    }
  };

  const ini = p => ((p.prenom[0]||'')+(p.nom[0]||'')).toUpperCase();

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1>Pipeline</h1>
        <p>Vue kanban de votre tunnel de vente</p>
      </div>
      <div style={{
        display:'flex',           // ✅ On passe en Flex pour que les colonnes soient côte à côte
  gap:12,                   // ✅ L'espace entre les colonnes
  alignItems:'flex-start',  // ✅ Empêche les colonnes de s'étirer bizarrement vers le bas
  paddingBottom: 20,
  overflowX: 'auto'  
        
      }}>
        {STAGES.map(stage => {
          const items = prospects.filter(p => p.stage === stage.key);
          return (
            <div 
              key={stage.key} 
              onDragOver={onDragOver} // ✅ Zone de drop
              onDrop={(e) => onDrop(e, stage.key)} // ✅ Action de lâcher
              style={{
                background:'var(--bg-secondary)',
                borderRadius:16,
                padding:12,
                border:'1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:stage.color}} />
                  <span style={{fontSize:12,fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{stage.label}</span>
                </div>
                <span style={{fontSize:11,fontWeight:700,background:'var(--bg-card)',color:'var(--text-muted)',borderRadius:20,padding:'2px 8px',border:'1px solid var(--border)'}}>{items.length}</span>
              </div>
              
              <div style={{display:'flex',flexDirection:'column',gap:8, flex: 1}}>
                {items.map((p,i) => (
               <div 
  key={p._id} 
  draggable
  onDragStart={(e) => onDragStart(e, p._id)}
  style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: 12,
    cursor: 'grab',
    transition: 'border-color 0.15s',
    
    // ✅ FORCE LA TAILLE DES CARTES ICI
    width: '240px',          // 🔹 Taille fixe pour toutes les cartes
    minWidth: '240px',       // 🔹 Empêche de rétrécir
    boxSizing: 'border-box', // 🔹 Garde le padding à l'intérieur
    overflow: 'hidden'       // 🔹 Coupe le texte qui dépasse trop
  }}
>


                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                      <div className={`avatar ${AV[i%AV.length]}`} style={{width:28,height:28,fontSize:11}}>{ini(p)}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.prenom} {p.nom}</div>
                        <div style={{fontSize:11,color:'var(--text-muted)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.entreprise||'Particulier'}</div>
                      </div>
                    </div>
                    <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:8}}>{p.ville} · {p.type}</div>
                    {stage.key !== '04_Closed' && stage.key !== '99_Dead' && (
                      <button className="btn btn-sm" style={{width:'100%',justifyContent:'center',fontSize:11}} onClick={(e)=>{e.stopPropagation(); advance(p)}}>
                        Avancer <ArrowRight size={11}/>
                      </button>
                    )}
                  </div>
                ))}
                {items.length === 0 && <div style={{textAlign:'center',padding:'20px 0',color:'var(--text-muted)',fontSize:12, flex: 1}}>Vide</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
