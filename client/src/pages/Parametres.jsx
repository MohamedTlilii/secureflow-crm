// ════════════════════════════════════════════════════════════════════════════
// client/src/pages/Parametres.jsx
// ════════════════════════════════════════════════════════════════════════════
import { useEffect, useState, useRef } from 'react';
import api from '../api';
import {
  Settings, MapPin, Building2, TrendingUp, Star, Shield, Wifi, Smartphone, Tv, Camera, Receipt,
  Plus, X, Save, CheckCircle, AlertCircle, ChevronRight, Loader, Trash2, Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

const slugify = s =>
  s.toLowerCase()
   .normalize('NFD').replace(/[̀-ͯ]/g, '')
   .trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const TABS = [
  { id:'villes',        label:'Villes',        icon:MapPin,     color:'#38bdf8', simple:true  },
  { id:'typeCommerce',  label:'Commerce',      icon:Building2,  color:'#f79009', simple:false },
  { id:'typeLead',      label:'Lead',          icon:TrendingUp, color:'#a764f8', simple:false },
  { id:'qualification', label:'Qualification', icon:Star,       color:'#f04438', simple:false },
  { id:'services',      label:'Services',      icon:Shield,     color:'#6366f1', simple:false },
];

const ICON_OPTIONS = [
  { key:'shield',     Icon:Shield,     label:'Alarme'       },
  { key:'wifi',       Icon:Wifi,       label:'Internet'     },
  { key:'smartphone', Icon:Smartphone, label:'Mobile'       },
  { key:'tv',         Icon:Tv,         label:'TV'           },
  { key:'camera',     Icon:Camera,     label:'Kit caméras'  },
  { key:'receipt',    Icon:Receipt,    label:'Interac'      },
];

// ── Tag chip avec bouton × ───────────────────────────────────────────────
function Tag({ label, onRemove, color }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        display:'inline-flex', alignItems:'center', gap:6,
        padding:'5px 10px 5px 12px', borderRadius:20,
        background: hov ? `${color}22` : 'rgba(255,255,255,0.05)',
        border:`1px solid ${hov ? color+'66' : 'rgba(255,255,255,0.1)'}`,
        fontSize:12, fontWeight:500, color:'var(--text-primary)',
        transition:'all 0.15s', cursor:'default'
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {label}
      <button
        onClick={onRemove}
        style={{
          background:'none', border:'none', cursor:'pointer',
          padding:0, display:'flex', alignItems:'center',
          color: hov ? '#ef4444' : 'rgba(255,255,255,0.4)',
          transition:'color 0.15s'
        }}>
        <X size={11}/>
      </button>
    </div>
  );
}

// ── Section pour liste simple (villes) ──────────────────────────────────
function SimpleSection({ items, color, placeholder, onAdd, onRemove }) {
  const [val, setVal] = useState('');
  const inputRef = useRef(null);

  const add = () => {
    const v = val.trim();
    if (!v) return;
    if (items.includes(v)) { toast.error('Déjà dans la liste'); return; }
    onAdd(v);
    setVal('');
    inputRef.current?.focus();
  };

  return (
    <div style={{ animation:'fadeSlideUp 0.2s ease both' }}>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <input
          ref={inputRef}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder={placeholder}
          style={{
            flex:1, padding:'9px 14px', borderRadius:10, border:`1px solid rgba(255,255,255,0.12)`,
            background:'rgba(255,255,255,0.05)', color:'var(--text-primary)', fontSize:13,
            outline:'none', transition:'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = color}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
        />
        <button
          onClick={add}
          style={{
            display:'flex', alignItems:'center', gap:6, padding:'9px 16px',
            borderRadius:10, border:`1px solid ${color}44`, background:`${color}18`,
            color, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
            whiteSpace:'nowrap'
          }}
          onMouseEnter={e => { e.currentTarget.style.background=`${color}30`; e.currentTarget.style.borderColor=color; }}
          onMouseLeave={e => { e.currentTarget.style.background=`${color}18`; e.currentTarget.style.borderColor=`${color}44`; }}
        >
          <Plus size={13}/> Ajouter
        </button>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {items.map((v, i) => (
          <Tag key={i} label={v} color={color} onRemove={() => onRemove(i)}/>
        ))}
        {items.length === 0 && (
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:12, fontStyle:'italic' }}>
            Aucune entrée — ajoutez-en une ci-dessus
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section pour liste clé/label ─────────────────────────────────────────
function KeyLabelSection({ items, color, placeholder, onAdd, onRemove, getItemColor }) {
  const [val, setVal] = useState('');
  const inputRef = useRef(null);

  const add = () => {
    const label = val.trim();
    if (!label) return;
    const key = slugify(label);
    if (!key) return;
    if (items.some(it => it.key === key)) { toast.error('Déjà dans la liste'); return; }
    onAdd({ key, label });
    setVal('');
    inputRef.current?.focus();
  };

  return (
    <div style={{ animation:'fadeSlideUp 0.2s ease both' }}>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <input
          ref={inputRef}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder={placeholder}
          style={{
            flex:1, padding:'9px 14px', borderRadius:10, border:`1px solid rgba(255,255,255,0.12)`,
            background:'rgba(255,255,255,0.05)', color:'var(--text-primary)', fontSize:13,
            outline:'none', transition:'border-color 0.2s'
          }}
          onFocus={e => e.target.style.borderColor = color}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
        />
        <button
          onClick={add}
          style={{
            display:'flex', alignItems:'center', gap:6, padding:'9px 16px',
            borderRadius:10, border:`1px solid ${color}44`, background:`${color}18`,
            color, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
            whiteSpace:'nowrap'
          }}
          onMouseEnter={e => { e.currentTarget.style.background=`${color}30`; e.currentTarget.style.borderColor=color; }}
          onMouseLeave={e => { e.currentTarget.style.background=`${color}18`; e.currentTarget.style.borderColor=`${color}44`; }}
        >
          <Plus size={13}/> Ajouter
        </button>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {items.map((it, i) => (
          <Tag key={it.key} label={it.label} color={getItemColor ? getItemColor(it) : color} onRemove={() => onRemove(i)}/>
        ))}
        {items.length === 0 && (
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:12, fontStyle:'italic' }}>
            Aucune entrée
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section pour gérer les services dynamiques (fournisseurs Actuel + Proposé) ──
function ServiceSection({ services, onUpdate, isMobile }) {
  const [expanded,    setExpanded]    = useState(null);
  const [adding,      setAdding]      = useState(false);
  const [newLabel,    setNewLabel]    = useState('');
  const [newColor,    setNewColor]    = useState('#6366f1');
  const [newIcon,     setNewIcon]     = useState('shield');
  const [editingIdx,  setEditingIdx]  = useState(null);
  const [editLabel,   setEditLabel]   = useState('');
  const [editColor,   setEditColor]   = useState('');

  const startEdit = (e, idx) => {
    e.stopPropagation();
    setEditingIdx(idx);
    setEditLabel(services[idx].label);
    setEditColor(services[idx].color);
  };

  const saveEdit = (idx) => {
    const label = editLabel.trim();
    if (!label) { setEditingIdx(null); return; }
    onUpdate((services||[]).map((s, i) => i === idx ? { ...s, label, color: editColor } : s));
    setEditingIdx(null);
    toast.success('Service mis à jour !');
  };

  const addService = () => {
    const label = newLabel.trim();
    if (!label) return;
    const id = slugify(label);
    if (!id) return;
    if ((services||[]).some(s => s.id === id)) { toast.error('Service déjà existant'); return; }
    onUpdate([...(services||[]), {
      id, label, color: newColor, icon: newIcon,
      actuel:      [{ key:'inconnu', label:'Inconnu' }, { key:'autre', label:'Autre' }],
      propose:     [{ key:'aucun',   label:'Aucun'   }, { key:'autre', label:'Autre' }],
      equipements: [],
    }]);
    setNewLabel(''); setNewIcon('shield'); setAdding(false);
    toast.success(`Service "${label}" créé !`);
  };

  const removeService = (idx) => {
    if (!window.confirm(`Supprimer le service "${services[idx].label}" ?`)) return;
    onUpdate((services||[]).filter((_, i) => i !== idx));
  };

  const updateList = (idx, listKey, newList) =>
    onUpdate((services||[]).map((s, i) => i === idx ? { ...s, [listKey]: newList } : s));

  return (
    <div>
      {(services || []).map((svc, idx) => (
        <div key={svc.id} style={{ marginBottom: 10, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
          {/* Accordéon header */}
          {editingIdx === idx ? (
            <div onClick={e => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: `${svc.color}10` }}>
              {(() => { const opt = ICON_OPTIONS.find(o => o.key === svc.icon); const Ic = opt ? opt.Icon : Shield; return <Ic size={16} color={editColor} style={{ flexShrink:0 }}/>; })()}
              <input
                autoFocus
                value={editLabel}
                onChange={e => setEditLabel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(idx); if (e.key === 'Escape') setEditingIdx(null); }}
                style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: `1px solid ${editColor}66`, background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, outline: 'none' }}
              />
              <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)}
                style={{ width: 34, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}/>
              <button onClick={() => saveEdit(idx)}
                style={{ background: editColor, border: 'none', borderRadius: 7, cursor: 'pointer', color: '#fff', padding: '5px 12px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                OK
              </button>
              <button onClick={() => setEditingIdx(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px', display: 'flex', alignItems: 'center' }}>
                <X size={14}/>
              </button>
            </div>
          ) : (
            <div
              onClick={() => setExpanded(expanded === idx ? null : idx)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', cursor: 'pointer', transition: 'background 0.15s', background: expanded === idx ? `${svc.color}12` : 'transparent' }}>
              {(() => { const opt = ICON_OPTIONS.find(o => o.key === svc.icon); const Ic = opt ? opt.Icon : Shield; return <Ic size={16} color={svc.color} style={{ flexShrink:0 }}/>; })()}
              <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{svc.label}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginRight: 4 }}>
                {svc.actuel?.length || 0} actuel · {svc.propose?.length || 0} proposé
              </span>
              <button
                onClick={e => startEdit(e, idx)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: '2px 6px', borderRadius: 6, transition: 'color 0.15s', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = svc.color}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
              ><Edit2 size={13}/></button>
              <button
                onClick={e => { e.stopPropagation(); removeService(idx); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: '2px 6px', borderRadius: 6, transition: 'color 0.15s', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
              ><Trash2 size={13}/></button>
              <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.4)', transform: expanded === idx ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}/>
            </div>
          )}

          {/* Accordéon body */}
          {expanded === idx && (
            <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeSlideUp 0.2s ease both' }}>
              {/* Ligne 1 : Fournisseurs Actuel + Proposé */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                    Fournisseurs — Actuel
                  </div>
                  <KeyLabelSection
                    items={svc.actuel || []}
                    color={svc.color}
                    placeholder="Ex: Nouveau fournisseur..."
                    onAdd={item => updateList(idx, 'actuel', [...(svc.actuel||[]), item])}
                    onRemove={i => updateList(idx, 'actuel', (svc.actuel||[]).filter((_,j) => j !== i))}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: svc.color, marginBottom: 10 }}>
                    Fournisseurs — Proposé
                  </div>
                  <KeyLabelSection
                    items={svc.propose || []}
                    color={svc.color}
                    placeholder="Ex: Notre offre..."
                    onAdd={item => updateList(idx, 'propose', [...(svc.propose||[]), item])}
                    onRemove={i => updateList(idx, 'propose', (svc.propose||[]).filter((_,j) => j !== i))}
                  />
                </div>
              </div>
              {/* Ligne 2 : Équipements base + extra */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'rgba(255,255,255,0.6)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>⚙</span> Équipements
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                  {/* Pack de base */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: svc.color, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, padding: '3px 10px', background: `${svc.color}15`, borderRadius: 6, display: 'inline-block' }}>
                      Pack de base
                    </div>
                    <KeyLabelSection
                      items={(svc.equipements||[]).filter(e => e.category === 'base')}
                      color={svc.color}
                      getItemColor={it => it.color || svc.color}
                      placeholder="Ex: Panneau, Détecteur..."
                      onAdd={item => updateList(idx, 'equipements', [...(svc.equipements||[]), { ...item, category:'base', color: svc.color }])}
                      onRemove={i => {
                        const list = (svc.equipements||[]).filter(e => e.category === 'base');
                        const key  = list[i]?.key;
                        if (key) updateList(idx, 'equipements', (svc.equipements||[]).filter(e => e.key !== key));
                      }}
                    />
                  </div>
                  {/* Équipements extra */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#f79009', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, padding: '3px 10px', background: 'rgba(247,144,9,0.12)', borderRadius: 6, display: 'inline-block' }}>
                      Équipements extra
                    </div>
                    <KeyLabelSection
                      items={(svc.equipements||[]).filter(e => e.category === 'extra')}
                      color="#f79009"
                      getItemColor={it => it.color || '#f79009'}
                      placeholder="Ex: Caméra, Thermostat..."
                      onAdd={item => {
                        const EXTRA_COLORS = ['#0ea5e9','#a855f7','#94a3b8','#f97316','#b91c1c','#84cc16','#14b8a6','#f59e0b','#10b981','#6366f1','#38bdf8','#4ade80','#ec4899','#facc15','#fb923c','#e879f9','#c084fc','#22d3ee'];
                        const used  = (svc.equipements||[]).filter(e => e.category === 'extra').map(e => e.color);
                        const color = EXTRA_COLORS.find(c => !used.includes(c)) || '#f79009';
                        updateList(idx, 'equipements', [...(svc.equipements||[]), { ...item, category:'extra', color }]);
                      }}
                      onRemove={i => {
                        const list = (svc.equipements||[]).filter(e => e.category === 'extra');
                        const key  = list[i]?.key;
                        if (key) updateList(idx, 'equipements', (svc.equipements||[]).filter(e => e.key !== key));
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Ajouter un nouveau service */}
      {adding ? (
        <div style={{ border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: '16px', background: 'rgba(99,102,241,0.05)', animation: 'fadeSlideUp 0.2s ease both' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>Nouveau service</div>
          {/* Icône */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Icône</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ICON_OPTIONS.map(({ key, Icon, label }) => {
                const sel = newIcon === key;
                return (
                  <button key={key} type="button" onClick={() => setNewIcon(key)} title={label}
                    style={{ width: 38, height: 38, borderRadius: 9, border: `2px solid ${sel ? newColor : 'rgba(255,255,255,0.1)'}`, background: sel ? `${newColor}22` : 'rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                    <Icon size={15} color={sel ? newColor : 'rgba(255,255,255,0.5)'}/>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Nom du service</div>
              <input
                value={newLabel} autoFocus
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addService()}
                placeholder="Ex: Abonnement TV..."
                style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#a78bfa'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Couleur</div>
              <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
                style={{ width: 48, height: 40, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'none', cursor: 'pointer', padding: 2 }}/>
            </div>
            <button onClick={addService}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1px solid #6366f144', background: '#6366f118', color: '#a78bfa', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <Plus size={13}/> Créer
            </button>
            <button onClick={() => { setAdding(false); setNewLabel(''); setNewIcon('shield'); }}
              style={{ display: 'flex', alignItems: 'center', padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}>
              <X size={13}/>
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, border: '1px dashed rgba(99,102,241,0.35)', background: 'transparent', color: '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', marginTop: (services||[]).length > 0 ? 8 : 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.07)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'; }}>
          <Plus size={14}/> Ajouter un service
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function Parametres() {
  const isMobile = useIsMobile();
  const [settings, setSettings] = useState(null);
  const [original, setOriginal] = useState(null);
  const [activeTab, setActiveTab]   = useState('villes');
  const [saving, setSaving]         = useState(false);
  const [loading, setLoading]       = useState(true);

  const dirty = JSON.stringify(settings) !== JSON.stringify(original);

  // ── Fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/api/settings').then(r => {
      setSettings(r.data);
      setOriginal(JSON.parse(JSON.stringify(r.data)));
    }).catch(() => toast.error('Impossible de charger les paramètres'))
      .finally(() => setLoading(false));
  }, []);

  // ── Save ───────────────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true);
    try {
      await api.put('/api/settings', settings);
      setOriginal(JSON.parse(JSON.stringify(settings)));
      toast.success('Paramètres sauvegardés !');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers d'update ───────────────────────────────────────────────────
  const updateKey = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  const addSimple = (key, val) => updateKey(key, [...(settings[key]||[]), val]);
  const removeSimple = (key, idx) => updateKey(key, settings[key].filter((_,i) => i !== idx));

  const addKL = (key, item) => updateKey(key, [...(settings[key]||[]), item]);
  const removeKL = (key, idx) => updateKey(key, settings[key].filter((_,i) => i !== idx));

  const tab = TABS.find(t => t.id === activeTab);

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:16 }}>
      <Loader size={32} color="#12b76a" style={{ animation:'spin 1s linear infinite' }}/>
      <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13 }}>Chargement des paramètres…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!settings) return (
    <div style={{ textAlign:'center', padding:40, color:'rgba(255,255,255,0.5)' }}>
      <AlertCircle size={32} style={{ marginBottom:12 }}/>
      <div>Impossible de charger les paramètres</div>
    </div>
  );

  return (
    <div style={{ padding: isMobile ? '16px 12px 100px' : '24px 32px 40px' }}>
      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      {/* ── HEADER glassmorphism ────────────────────────────────────────── */}
      <div style={{
        background:'rgba(2,8,16,0.97)', borderRadius:20, padding: isMobile ? '18px 16px' : '26px 30px',
        backdropFilter:'blur(40px)', marginBottom:20,
        border:'1px solid rgba(255,255,255,0.07)',
        boxShadow:'0 8px 40px rgba(0,0,0,0.4)',
        position:'relative', overflow:'hidden'
      }}>
        {/* Glow BG */}
        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)', pointerEvents:'none' }}/>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{
              width:46, height:46, borderRadius:13,
              background:'linear-gradient(135deg,#6366f1,#a78bfa)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 4px 20px rgba(99,102,241,0.4)'
            }}>
              <Settings size={22} color="#fff"/>
            </div>
            <div>
              <h1 style={{ margin:0, fontSize: isMobile?18:22, fontWeight:800 }}>Paramètres</h1>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>
                Gérez les listes du formulaire et des filtres
              </div>
            </div>
          </div>

          <button
            onClick={save}
            disabled={!dirty || saving}
            style={{
              display:'flex', alignItems:'center', gap:8, padding:'10px 20px',
              borderRadius:12, border:'none', cursor: dirty ? 'pointer' : 'not-allowed',
              background: dirty ? 'linear-gradient(135deg,#6366f1,#a78bfa)' : 'rgba(255,255,255,0.06)',
              color: dirty ? '#fff' : 'rgba(255,255,255,0.3)',
              fontSize:13, fontWeight:700,
              boxShadow: dirty ? '0 4px 14px rgba(99,102,241,0.4)' : 'none',
              transition:'all 0.2s'
            }}
          >
            {saving
              ? <><Loader size={14} style={{ animation:'spin 1s linear infinite' }}/> Sauvegarde…</>
              : dirty
              ? <><Save size={14}/> Sauvegarder</>
              : <><CheckCircle size={14}/> Sauvegardé</>
            }
          </button>
        </div>

        {dirty && (
          <div style={{
            marginTop:14, padding:'8px 14px', borderRadius:8,
            background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)',
            fontSize:12, color:'#f59e0b', display:'flex', alignItems:'center', gap:6
          }}>
            <AlertCircle size={12}/> Modifications non sauvegardées — cliquez sur Sauvegarder
          </div>
        )}
      </div>

      {/* ── TABS ────────────────────────────────────────────────────────── */}
      <div style={{
        background:'rgba(2,8,16,0.95)', borderRadius:16, marginBottom:16,
        border:'1px solid rgba(255,255,255,0.07)', backdropFilter:'blur(20px)',
        overflow:'hidden'
      }}>
        <div style={{ display:'flex', overflowX:'auto', padding:'6px 8px', gap:4, scrollbarWidth:'none' }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{
                  display:'flex', alignItems:'center', gap:7, padding:'8px 14px',
                  borderRadius:10, border:'none', cursor:'pointer', whiteSpace:'nowrap',
                  background: active ? `${t.color}1e` : 'transparent',
                  color: active ? t.color : 'rgba(255,255,255,0.5)',
                  fontSize:12, fontWeight: active ? 700 : 500,
                  borderBottom: active ? `2px solid ${t.color}` : '2px solid transparent',
                  transition:'all 0.15s'
                }}>
                <Icon size={14}/> {t.label}
                {active && <ChevronRight size={10}/>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONTENU ─────────────────────────────────────────────────────── */}
      <div style={{
        background:'rgba(2,8,16,0.97)', borderRadius:18, padding: isMobile ? '18px 16px' : '24px 28px',
        border:'1px solid rgba(255,255,255,0.07)', backdropFilter:'blur(20px)',
        boxShadow:'0 4px 24px rgba(0,0,0,0.3)'
      }}>

        {/* Header de section */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          {(() => { const Icon = tab.icon; return <Icon size={18} color={tab.color}/>; })()}
          <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:tab.color }}>{tab.label}</h2>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${tab.color}40,transparent)` }}/>
        </div>

        {/* ── Villes — liste simple ── */}
        {activeTab === 'villes' && (
          <SimpleSection
            items={settings.villes || []}
            color={tab.color}
            placeholder="Ex: Brossard, Sainte-Julie..."
            onAdd={v => addSimple('villes', v)}
            onRemove={i => removeSimple('villes', i)}
          />
        )}

        {/* ── Commerce, Lead, Qualification — liste clé/label ── */}
        {activeTab === 'typeCommerce' && (
          <KeyLabelSection
            items={settings.typeCommerce || []}
            color={tab.color}
            placeholder="Ex: Épicerie coréenne, Studio photo..."
            onAdd={item => addKL('typeCommerce', item)}
            onRemove={i => removeKL('typeCommerce', i)}
          />
        )}
        {activeTab === 'typeLead' && (
          <KeyLabelSection
            items={settings.typeLead || []}
            color={tab.color}
            placeholder="Ex: Recommandation LinkedIn..."
            onAdd={item => addKL('typeLead', item)}
            onRemove={i => removeKL('typeLead', i)}
          />
        )}
        {activeTab === 'qualification' && (
          <KeyLabelSection
            items={settings.qualificationSysteme || []}
            color={tab.color}
            placeholder="Ex: Système +15 ans..."
            onAdd={item => addKL('qualificationSysteme', item)}
            onRemove={i => removeKL('qualificationSysteme', i)}
          />
        )}

        {/* ── Services dynamiques ── */}
        {activeTab === 'services' && (
          <ServiceSection
            services={settings.services || []}
            onUpdate={svcs => updateKey('services', svcs)}
            isMobile={isMobile}
          />
        )}
      </div>

      {/* ── FAB mobile Sauvegarder ──────────────────────────────────────── */}
      {isMobile && dirty && (
        <button
          onClick={save}
          style={{
            position:'fixed', bottom:80, right:16, zIndex:200,
            display:'flex', alignItems:'center', gap:8,
            padding:'12px 20px', borderRadius:20, border:'none',
            background:'linear-gradient(135deg,#6366f1,#a78bfa)',
            color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer',
            boxShadow:'0 4px 20px rgba(99,102,241,0.5)',
            animation:'fadeSlideUp 0.2s ease both'
          }}>
          <Save size={14}/> Sauvegarder
        </button>
      )}
    </div>
  );
}
