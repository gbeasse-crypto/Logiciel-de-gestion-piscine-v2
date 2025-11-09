// Modification : la répétition pour AT/AAC se fait de la semaine 26 à la semaine 36

import React, { useEffect, useMemo, useState } from "react";

// ==========================\n// THEME & UI PRIMITIVES\n// ==========================\nconst THEME = { a: "#0a3d62", b: "#2e8b8b", surface: "linear-gradient(180deg,#0a3d62 0%,#1e5f74 40%,#2e8b8b 100%)" };

const Btn = (p) => (
  <button {...p} className={(p.className||"")+" transition active:scale-[.98] disabled:opacity-50"} />
);
const Input = (p) => (
  <input {...p} className={(p.className||"")+" border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#2e8b8b]/40"} />
);
const Select = (p) => (
  <select {...p} className={(p.className||"")+" border rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-[#2e8b8b]/40"} />
);

// ==========================\n// HELPERS (dates, storage)
// ==========================
function useLocalStorage(key, initial) {
  const init = () => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw);
    } catch (_) {}
    return typeof initial === "function" ? initial() : initial;
  };
  const [val, setVal] = useState(init);
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {} }, [key, val]);
  return [val, setVal];
}

const dkey = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x.toISOString().slice(0,10); };
const startOfISOWeek=(d)=>{ const x=new Date(d); const w=(x.getDay()+6)%7; x.setDate(x.getDate()-w); x.setHours(0,0,0,0); return x; };
const isoWeek=(date)=>{ const dd=new Date(date); dd.setHours(0,0,0,0); dd.setDate(dd.getDate()+3-((dd.getDay()+6)%7)); const week1=new Date(dd.getFullYear(),0,4); week1.setDate(week1.getDate()+3-((week1.getDay()+6)%7)); return 1+Math.round((dd-week1)/(7*86400000)); };

// (Placeholders business rules)
function holidaySet(_y){ return new Set(); }
function getZoneBRanges(){ return []; }
function isInRanges(_d,_ranges){ return false; }

// ==========================
// CONST DATA
// ==========================
const ETABS = ["Piscine de Bréquigny","Piscine de Villejean","Piscine Saint‑Georges","Piscine des Gayeulles"]; 
const CORPS = ["ETAPS","AT","AAC","ATSEM","ADM"]; // Ajout AT & AAC

const SEED=[
  {id:1,firstName:"Alice",lastName:"Martin",email:"alice@exemple.com",site:ETABS[0],contract:"Titulaire",team:"ETAPS",quotite:"100%",phone:"06 11 22 33 44"},
  {id:2,firstName:"Karim",lastName:"Ben Ali",email:"karim@exemple.com",site:ETABS[1],contract:"Contractuel",team:"AT",quotite:"90%",phone:"06 22 33 44 55"},
  {id:3,firstName:"Léa",lastName:"Dupont",email:"lea@exemple.com",site:ETABS[2],contract:"Vacataire",team:"AAC",quotite:"80%",phone:"06 33 44 55 66"}
];

// === Activités ETAPS + couleurs ===
const ACTIVITIES={
  'Enseignement/Surveillance':'#2563eb',
  'Congés':'#ef4444',
  'Arrêt Maladie':'#f97316',
  'Heures supplémentaires':'#a855f7',
  'Récupération':'#10b981',
  'Journée Direction (JD)':'#0ea5a5',
  'Journée pas comme les autres (JPCLA)':'#f59e0b',
  'Formation':'#3b82f6',
  'ASA Mariage/PACS/Décès':'#e11d48',
  'ASA Enfant Malade':'#db2777',
  'ASA déménagement':'#9333ea',
  'ASA Concours':'#22c55e',
  'Réunion':'#64748b',
  'back office/Caisse':'#0ea5a5',
  'Nettoyage/Entretien':'#16a34a'
};
const activityColor=(name)=>ACTIVITIES[name]||THEME.b;
const extractActivity=(label)=>{const m=/\(([^)]+)\)$/.exec(label||''); return m?m[1]:''};
const extractRange=(label)=>{const m=/^([^ (]+-[^ (]+)/.exec(label||''); return m?m[1]:label};

// ==========================
// HEADER
// ==========================
function Header({tab,setTab}){
  const tabs=['Dashboard','Agents','Planification','Annualisation','Formation','Congés','Sécurité'];
  const map={Dashboard:'Dashboard',Agents:'Agents',Planification:'Planification',Annualisation:'Annualisation',Formation:'Formation',Congés:'Congés / Absences',Sécurité:'Sécurité'};
  return (
    <header className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl" style={{background:`linear-gradient(90deg,${THEME.a},${THEME.b})`}} />
        <h1 className="text-xl font-semibold">Logiciel RH</h1>
      </div>
      <div className="flex flex-wrap gap-2 bg-white/70 p-2 rounded-xl border">
        {tabs.map(t=> (
          <Btn key={t} onClick={()=>setTab(t)} className={'px-3 py-1.5 rounded-full border '+(tab===t? 'bg-slate-900 text-white' : 'bg-white hover:bg-slate-100')}>{map[t]}</Btn>
        ))}
      </div>
    </header>
  );
}

// ==========================
// DASHBOARD (simple)
// ==========================
function Dashboard(){
  const [agents]=useLocalStorage('agents',()=>SEED);
  const bySite=useMemo(()=>Object.entries(agents.reduce((m,a)=>{m[a.site]=(m[a.site]||0)+1;return m;},{})),[agents]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-2xl border p-4"><p className="text-xs text-slate-500">Effectif</p><p className="text-2xl font-semibold">{agents.length}</p></div>
      <div className="bg-white rounded-2xl border p-4"><p className="text-xs text-slate-500">Demandes en attente</p><p className="text-2xl font-semibold">3</p></div>
      <div className="bg-white rounded-2xl border p-4"><p className="text-xs text-slate-500">Jours fériés (mois)</p><p className="text-2xl font-semibold">2</p></div>
      <div className="md:col-span-3 bg-white rounded-2xl border p-4"><p className="font-semibold mb-2">Répartition par établissement</p><ul className="text-sm text-slate-700 space-y-1">{bySite.map(([k,v])=> <li key={k} className="flex justify-between"><span>{k}</span><span className="font-medium">{v}</span></li>)}</ul></div>
    </div>
  );
}

// ==========================
// AGENTS SCREEN
// ==========================
function Employees(){
  const [agents,setAgents]=useLocalStorage("agents",()=>SEED);
  const [slotsByDate,setSlotsByDate]=useLocalStorage("planningSlotsByDate",{});
  const [show,setShow]=useState(false); const [edit,setEdit]=useState(null); const [confirm,setConfirm]=useState(null);
  const [etab,setEtab]=useState("Tous"); const [corp,setCorp]=useState("Tous"); const [q,setQ]=useState("");
  const empty={firstName:"",lastName:"",email:"",site:"",contract:"",team:"",quotite:"",phone:""};
  const [form,setForm]=useState(empty);
  const flt=useMemo(()=>agents.filter(a=> (etab==="Tous"||a.site===etab)&&(corp==="Tous"||a.team===corp)&&(`${a.firstName} ${a.lastName}`.toLowerCase().includes(q.toLowerCase()))),[agents,etab,corp,q]);
  const submit=(e)=>{e.preventDefault(); const id=edit?edit.id:(agents.length?Math.max(...agents.map(a=>a.id))+1:1); const next={id,...form}; setAgents(edit?agents.map(a=>a.id===id?next:a):[...agents,next]); setEdit(null); setForm(empty); setShow(false);} 
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 bg-white/80 p-4 rounded-xl border items-end">
        <div className="min-w-[220px]"><label className="text-sm font-medium">Établissement</label><Select value={etab} onChange={e=>setEtab(e.target.value)} className="mt-1 w-full border-2 border-slate-400 focus:border-slate-700"><option>Tous</option>{ETABS.map(x=><option key={x}>{x}</option>)}</Select></div>
        <div className="min-w-[220px]"><label className="text-sm font-medium">Corps de métier</label><Select value={corp} onChange={e=>setCorp(e.target.value)} className="mt-1 w-full border-2 border-slate-400 focus:border-slate-700"><option>Tous</option>{CORPS.map(x=><option key={x}>{x}</option>)}</Select></div>
        <div className="grow min-w-[240px]"><label className="text-sm font-medium">Recherche</label><Input placeholder="Nom, prénom…" value={q} onChange={e=>setQ(e.target.value)} className="mt-1 w-full border-2 border-slate-400 focus:border-slate-700"/></div>
        <Btn onClick={()=>{setForm(empty);setEdit(null);setShow(true);}} className="ml-auto bg-gradient-to-r from-[#0a3d62] to-[#2e8b8b] text-white px-3 py-2 rounded-lg">+ Ajouter un agent</Btn>
      </div>
      <div className="overflow-x-auto bg-white rounded-2xl border shadow">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left"><tr><th className="p-3">Nom</th><th className="p-3">Corps</th><th className="p-3">Établissement</th><th className="p-3">Contrat</th><th className="p-3">Quotité</th><th className="p-3">Email</th><th className="p-3">Téléphone</th><th className="p-3 text-center">Actions</th></tr></thead>
          <tbody>
            {flt.map(a=> (
              <tr key={a.id} className="border-t">
                <td className="p-3 font-medium">{a.firstName} {a.lastName}</td>
                <td className="p-3 text-gray-600">{a.team||"—"}</td>
                <td className="p-3 text-gray-600">{a.site||"—"}</td>
                <td className="p-3 text-gray-600">{a.contract||"—"}</td>
                <td className="p-3 text-gray-600">{a.quotite||"—"}</td>
                <td className="p-3 text-gray-600">{a.email||"—"}</td>
                <td className="p-3 text-gray-600">{a.phone||"—"}</td>
                <td className="p-3 text-center"><div className="inline-flex gap-3"><Btn onClick={()=>{setEdit(a);setForm(a);setShow(true);}} className="text-blue-600">✏️</Btn><Btn onClick={()=>setConfirm({id:a.id,label:`${a.firstName} ${a.lastName}`})} className="text-red-600">🗑️</Btn></div></td>
              </tr>
            ))}
            {flt.length===0&&(<tr><td className="p-6 text-center text-gray-500" colSpan={8}>Aucun agent</td></tr>)}
          </tbody>
        </table>
      </div>

      {show&&(
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4" onClick={()=>setShow(false)}>
          <form onClick={(e)=>e.stopPropagation()} onSubmit={submit} className="bg-white rounded-xl p-6 grid grid-cols-2 gap-3 w-full max-w-2xl">
            <h3 className="col-span-2 text-lg font-semibold">{edit?"Modifier l'agent":"Nouvel agent"}</h3>
            <Input placeholder="Prénom" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} required/>
            <Input placeholder="Nom" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} required/>
            <Input placeholder="Email pro" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
            <Input placeholder="Téléphone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
            <Select value={form.site} onChange={e=>setForm({...form,site:e.target.value})}><option value="">Établissement</option>{ETABS.map(x=><option key={x}>{x}</option>)}</Select>
            <Select value={form.contract} onChange={e=>setForm({...form,contract:e.target.value})}><option value="">Type de contrat</option><option>Titulaire</option><option>Contractuel</option><option>Vacataire</option></Select>
            <Select value={form.team} onChange={e=>setForm({...form,team:e.target.value})}><option value="">Corps de métier</option>{CORPS.map(x=><option key={x}>{x}</option>)}</Select>
            <Select value={form.quotite} onChange={e=>setForm({...form,quotite:e.target.value})}><option value="">Quotité</option><option>100%</option><option>90%</option><option>80%</option><option>50%</option></Select>
            <div className="col-span-2 flex justify-end gap-2 mt-2"><Btn type="button" onClick={()=>setShow(false)} className="px-3 py-2 rounded-lg border">Annuler</Btn><Btn type="submit" className="px-3 py-2 rounded-lg bg-blue-600 text-white">Enregistrer</Btn></div>
          </form>
        </div>
      )}

      {confirm&&(
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4" onClick={()=>setConfirm(null)}>
          <div className="bg-white rounded-2xl shadow border w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <div className="px-5 py-4" style={{background:`linear-gradient(90deg,${THEME.a},${THEME.b})`}}><h3 className="text-white text-lg font-semibold">Confirmer la suppression</h3></div>
            <div className="p-5"><p className="text-sm">Supprimer <b>{confirm.label}</b> ?</p></div>
            <div className="px-5 pb-5 flex justify-end gap-2"><Btn onClick={()=>setConfirm(null)} className="px-3 py-2 rounded-lg border">Annuler</Btn><Btn onClick={()=>{setAgents(agents.filter(x=>x.id!==confirm.id)); setSlotsByDate(prev=>{ const next={...prev}; delete next[confirm.id]; return next; }); setConfirm(null);}} className="px-3 py-2 rounded-lg bg-red-600 text-white">Supprimer</Btn></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================
// PLANNING — Hebdomadaire
// ==========================
function PlanningWeekly(){
  const [agents]=useLocalStorage('agents',()=>SEED);
  const [slotsByDate,setSlotsByDate]=useLocalStorage('planningSlotsByDate',{});
  const [weekOffset,setWeekOffset]=useState(0);
  const DAYS=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
  const start=startOfISOWeek(new Date(new Date().getTime()+weekOffset*7*86400000));
  const days=DAYS.map((_,i)=> new Date(start.getTime()+i*86400000));
  const weekNumber=(function(){const d=new Date(start); d.setDate(d.getDate()+3-((d.getDay()+6)%7)); const first=new Date(d.getFullYear(),0,4); first.setDate(first.getDate()+3-((first.getDay()+6)%7)); return 1+Math.round((d-first)/(7*86400000));})();
  const monthLabel=new Intl.DateTimeFormat('fr-FR',{month:'long',year:'numeric'}).format(start);
  const todayKey=dkey(new Date());

  // Filtres (comme en vue Week-end)
  const [filterEtab,setFilterEtab]=useState('Tous');
  const [filterCorp,setFilterCorp]=useState('Tous');
  const [filterQuery,setFilterQuery]=useState('');
  const filteredAgents = useMemo(()=>
    agents.filter(a=>
      (filterEtab==='Tous'||a.site===filterEtab) &&
      (filterCorp==='Tous'||a.team===filterCorp) &&
      (`${a.firstName} ${a.lastName}`.toLowerCase().includes(filterQuery.toLowerCase()))
    )
  ,[agents,filterEtab,filterCorp,filterQuery]);

  const getSlots=(id,key)=> (slotsByDate?.[id]?.[key])||[];
  const setSlots=(id,key,next)=> setSlotsByDate(prev=>{const q={...prev}; const a={...(q[id]||{})}; a[key]=next; q[id]=a; return q;});

  // Suppression robuste + confirmation (modal)
  const deleteSlot=(agentId,dateKey,index)=> setSlotsByDate(prev=>{ const next={...prev}; const agentDays={...(next[agentId]||{})}; const list=[...(agentDays[dateKey]||[])]; list.splice(index,1); agentDays[dateKey]=list; next[agentId]=agentDays; return next; });
  const [slotConfirm, setSlotConfirm] = useState(null);

  // === AT/AAC — Ajout de créneaux (samedi/dimanche) avec fréquences 3/6 semaines ===
  const [weEditor,setWeEditor]=useState({open:false, agentId:"", day:"samedi", repeat:true, freq:3, excludeFeries:false, excludeVacancesB:false, ranges:[{start:'',end:'',activity:''}]});
  const atAacAgents=filteredAgents.filter(a=> a.team==='AT' || a.team==='AAC');
  const computeInfo=function(day,freq){ return "AT week-end: répéter le "+day+" de la semaine 26 à la semaine 36 (année N) — fréquence "+freq+" semaines."; };
  const openWEAdd=function(day, presetId){ setWeEditor({open:true, agentId:(presetId || (atAacAgents[0]&&atAacAgents[0].id) || ""), day:day, repeat:true, freq:3, excludeFeries:false, excludeVacancesB:false, ranges:[{start:'',end:'',activity:''}]}); };
  const applyWeekendRepeat=function(agentId, day, freq, formats, opts){
    const wd = day==='samedi'?6:0; // Saturday=6, Sunday=0
    const N = new Date().getFullYear();
    // Premier samedi/dimanche à partir de la S26 (année N)
    let d=new Date(N,0,1);
    while(!(isoWeek(d)>=26 && d.getDay()===wd)) d.setDate(d.getDate()+1);
    const end=new Date(N,11,31);
    const isHoliday=function(dt){ const y=dt.getFullYear(); const s=holidaySet(y); return s.has(dkey(dt)); };

    const isZoneB=function(dt){ return isInRanges(dt,getZoneBRanges()); };
    for(; d<=end; d.setDate(d.getDate()+7*freq)){
      const wk=isoWeek(d);
      const inWindow=(d.getFullYear()===N && wk>=26 && wk<=36);
      if(!inWindow) continue;
      if(opts.excludeFeries && isHoliday(d)) continue;
      if(opts.excludeVacancesB && isZoneB(d)) continue;
      const key=dkey(d);
      setSlots(agentId,key,[].concat(getSlots(agentId,key), formats));
    }
  };
    const isZoneB=function(dt){ return isInRanges(dt,getZoneBRanges()); };
    for(; d<=end; d.setDate(d.getDate()+7*freq)){
      const wk=isoWeek(d);
      const inWindow=((d.getFullYear()===N && wk>=35) || (d.getFullYear()===N+1 && wk<=26));
      if(!inWindow) { if(d.getFullYear()>N+1 || (d.getFullYear()===N+1 && wk>26)) break; else continue; }
      if(opts.excludeFeries && isHoliday(d)) continue;
      if(opts.excludeVacancesB && isZoneB(d)) continue;
      const key=dkey(d);
      setSlots(agentId,key,[].concat(getSlots(agentId,key), formats));
    }
  };
  const saveWEEditor=function(e){
    e.preventDefault();
    if(!weEditor.agentId) { setWeEditor(function(p){return Object.assign({},p,{open:false});}); return; }
    const cleaned=(weEditor.ranges||[]).filter(function(r){ return r.start && r.end; });
    if(cleaned.length===0){ setWeEditor(function(p){return Object.assign({},p,{open:false});}); return; }
    const formats=cleaned.map(function(r){ return r.start+'-'+r.end+(r.activity?(' ('+r.activity+')'):''); });
    if(weEditor.repeat){
      applyWeekendRepeat(weEditor.agentId, weEditor.day, weEditor.freq, formats, {excludeFeries:weEditor.excludeFeries, excludeVacancesB:weEditor.excludeVacancesB});
    }
    setWeEditor(function(p){return Object.assign({},p,{open:false});});
  };

  // Editor state (multi-lignes + répétitions S37→S25)
  const [editor,setEditor]=useState({open:false,agentId:null,dateKey:'',ranges:[{start:'',end:'',activity:''}],index:null,repeat:false,excludeFeries:true,excludeVacancesB:true});
  const openAdd=(id,dt)=>{
    const wd = dt && typeof dt.getDay==='function' ? dt.getDay() : -1; // 0:dim, 6:sam
    const ag = agents.find(x=> String(x.id)===String(id));
    const team = (ag && ag.team) || '';
    const isATAAC = (team==='AT' || team==='AAC');
    if(isATAAC && (wd===6 || wd===0)){
      // Ouvre directement l'éditeur AT/AAC pour le week-end
      openWEAdd(wd===6?'samedi':'dimanche', ag ? ag.id : id);
      return;
    }
    // Sinon, éditeur ETAPS/classique
    setEditor({open:true,agentId:id,dateKey:dkey(dt),ranges:[{start:'',end:'',activity:''}],index:null,repeat:false,excludeFeries:true,excludeVacancesB:true});
  };
  const openEdit=(id,dt,idx)=>{ const key=dkey(dt); const cur=getSlots(id,key)[idx]||''; const parts=cur.split(' '); const se=parts[0]||''; const act=parts.slice(1).join(' ').replace(/[()]/g,''); const [s,e]=(se.split('-')); setEditor({open:true,agentId:id,dateKey:key,ranges:[{start:s||'',end:e||'',activity:act}],index:idx,repeat:false,excludeFeries:true,excludeVacancesB:true}); };

  const saveEditor=(e)=>{
    e.preventDefault();
    const isTime=(t)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t);
    const cleaned=(editor.ranges||[]).filter(r=>isTime(r.start)&&isTime(r.end));
    if(cleaned.length===0){ setEditor(p=>({...p,open:false})); return; }
    const formats=cleaned.map(r=>`${r.start}-${r.end}${r.activity?` (${r.activity})`:''}`);
    const key=editor.dateKey;
    const applyAt=(agentId,k,fs)=>{ const a=[...getSlots(agentId,k)]; if(typeof editor.index==='number' && k===editor.dateKey){ a[editor.index]=fs[0]; fs.slice(1).forEach(x=>a.push(x)); } else { fs.forEach(x=>a.push(x)); } setSlots(agentId,k,a); };

    if(!editor.repeat){ applyAt(editor.agentId,key,formats); setEditor(p=>({...p,open:false})); return; }

    // Répéter même jour de la semaine — de S37 (année N) à S25 (année N+1)
    const base=new Date(editor.dateKey); const N=base.getFullYear(); const targetWd=(base.getDay()+6)%7; const startRange=new Date(N,0,1); const endRange=new Date(N+1,11,31);
    const isHoliday=(dt)=>{ const y=dt.getFullYear(); const s=holidaySet(y); if(s.has(dkey(dt))) return true; const s2=holidaySet(y+1); return s2.has(dkey(dt)); };
    const isZoneB=(dt)=> isInRanges(dt,getZoneBRanges());

    for(let d=new Date(startRange); d<=endRange; d.setDate(d.getDate()+1)){
      const wd=(d.getDay()+6)%7; if(wd!==targetWd) continue;
      const wk=isoWeek(d); const inWindow=((d.getFullYear()===N && wk>=37) || (d.getFullYear()===N+1 && wk<=25)); if(!inWindow) continue;
      if(editor.excludeFeries && isHoliday(d)) continue;
      if(editor.excludeVacancesB && isZoneB(d)) continue;
      applyAt(editor.agentId,dkey(d),formats);
    }
    setEditor(p=>({...p,open:false}));
  };

  const totalFor=(a)=> days.reduce((acc,dt)=> acc + getSlots(a.id,dkey(dt)).reduce((m,r)=>{const p=extractRange(r).split('-'); const s=p[0]||'00:00'; const e=p[1]||'00:00'; const sh=parseInt(s.split(':')[0]||'0',10), sm=parseInt(s.split(':')[1]||'0',10); const eh=parseInt(e.split(':')[0]||'0',10), em=parseInt(e.split(':')[1]||'0',10); return m+Math.max(0,(eh*60+em)-(sh*60+sm));},0),0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 p-4 rounded-xl border items-end" style={{background:THEME.surface}}>
        <div className="min-w-[200px] text-white"><label className="block text-sm font-medium">Établissement</label><Select value={filterEtab} onChange={(e)=>setFilterEtab(e.target.value)} className="mt-1 w-full"><option>Tous</option>{ETABS.map(x=><option key={x}>{x}</option>)}</Select></div>
        <div className="min-w-[200px] text-white"><label className="block text-sm font-medium">Corps de métier</label><Select value={filterCorp} onChange={(e)=>setFilterCorp(e.target.value)} className="mt-1 w-full"><option>Tous</option>{CORPS.map(x=><option key={x}>{x}</option>)}</Select></div>
        <div className="grow min-w-[240px] text-white"><label className="block text-sm font-medium">Recherche agent</label><Input placeholder="Prénom Nom" value={filterQuery} onChange={(e)=>setFilterQuery(e.target.value)} className="mt-1 w-full"/></div>
        
        <div className="ml-auto flex items-center gap-2 text-sm text-white">
          <Btn onClick={()=>setWeekOffset(weekOffset-1)} className="px-2 py-1 rounded-md border border-white/50">◀︎</Btn>
          <div>Sem. {weekNumber} — {monthLabel}</div>
          <Btn onClick={()=>setWeekOffset(weekOffset+1)} className="px-2 py-1 rounded-md border border-white/50">▶︎</Btn>
          <Btn onClick={()=>setWeekOffset(0)} className="px-2 py-1 rounded-md border border-white/50">Aujourd'hui</Btn>
        </div>
      </div>

      {/* Légende des activités */}
      <div className="bg-white rounded-2xl border p-3">
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-white/70">
          <span className="text-xs font-semibold text-slate-600 mr-2">Légende activités :</span>
          {Object.entries(ACTIVITIES).map(([label,col])=> (
            <span key={label} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-white shadow" style={{background:col}}>
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{background:'#ffffffaa'}}></span>
              <span>{label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-6 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="p-3 w-64">Agent</th>
              {days.map((dt,i)=> { const key=dkey(dt); const isToday=(key===todayKey); return (
                <th key={i} className="p-3 text-center">
                  <div className="flex flex-col items-center">
                    <div className="font-medium">{['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'][i]}</div>
                    <div className={`text-xs mt-1 w-6 h-6 flex items-center justify-center rounded-full border ${isToday?'border-blue-600 bg-blue-100 text-blue-600 font-semibold':'border-slate-300 bg-slate-50 text-slate-600'}`}>{dt.getDate()}</div>
                  </div>
                </th>
              ); })}
              <th className="p-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredAgents.map(a=> (
              <tr key={a.id} className="border-t align-top">
                <td className="p-3"><div className="font-semibold">{a.firstName} {a.lastName}</div><div className="text-slate-600">{a.site}</div><div className="text-slate-600">{a.team}</div></td>
                {days.map((dt,i)=>{ const key=dkey(dt); return (
                  <td key={i} className="p-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-1">
                        {getSlots(a.id,key).map((v,idx)=>{ const act=extractActivity(v); const rng=extractRange(v); const col=activityColor(act); return (
                          <span key={idx} className="inline-flex items-center gap-1">
                            <button type="button" onClick={()=>openEdit(a.id,dt,idx)} className="inline-flex items-center justify-center px-2 py-1 rounded-md text-xs text-white shadow whitespace-nowrap" style={{background:col,minWidth:'fit-content'}} title="Modifier le créneau">{rng}</button>
                            <button type="button" onClick={(e)=>{ e.stopPropagation(); setSlotConfirm({ agentId: a.id, key, index: idx, label: v }); }} className="text-red-600 text-xs" title="Supprimer">🗑️</button>
                          </span>
                        );})}
                      </div>
                      <Btn onClick={()=>openAdd(a.id,dt)} className="self-start text-xs px-2 py-1 rounded-md border">+ Créneau</Btn>
                    </div>
                  </td>
                );})}
                <td className="p-3 font-semibold">{(()=>{const total=totalFor(a); return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;})()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {slotConfirm&&(
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4" onClick={()=>setSlotConfirm(null)}>
          <div className="bg-white rounded-2xl shadow border w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <div className="px-5 py-4" style={{background:`linear-gradient(90deg,${THEME.a},${THEME.b})`}}>
              <h3 className="text-white text-lg font-semibold">Supprimer le créneau ?</h3>
            </div>
            <div className="p-5 text-sm">Créneau : <b>{slotConfirm?.label}</b></div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <Btn onClick={()=>setSlotConfirm(null)} className="px-3 py-2 rounded-lg border">Annuler</Btn>
              <Btn onClick={()=>{ deleteSlot(slotConfirm.agentId, slotConfirm.key, slotConfirm.index); setSlotConfirm(null); }} className="px-3 py-2 rounded-lg bg-red-600 text-white">Supprimer</Btn>
            </div>
          </div>
        </div>
      )}

      {weEditor.open && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4" onClick={()=>setWeEditor(p=>Object.assign({},p,{open:false}))}>
          <form onClick={(e)=>e.stopPropagation()} onSubmit={saveWEEditor} className="bg-white rounded-2xl overflow-hidden border shadow-2xl w-full max-w-2xl">
            <div className="px-6 py-4" style={{background:`linear-gradient(90deg,${THEME.a},${THEME.b})`}}>
              <h3 className="text-lg text-white font-semibold">Ajouter des créneaux (AT/AAC)</h3>
            </div>
            <div className="p-6 space-y-3">
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={weEditor.repeat} onChange={(e)=>setWeEditor(p=>Object.assign({},p,{repeat:e.target.checked}))}/> Répéter</label>
              <div className="text-xs text-slate-500">{computeInfo(weEditor.day,weEditor.freq)}</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Agent (AT/AAC)</label>
                  <Select value={weEditor.agentId} onChange={(e)=>setWeEditor(p=>Object.assign({},p,{agentId:e.target.value}))} className="w-full mt-1">
                    {atAacAgents.length===0 && <option value="">Aucun agent AT/AAC</option>}
                    {atAacAgents.map(a=> <option key={a.id} value={a.id}>{a.firstName} {a.lastName} — {a.team}</option>)}
                  </Select>
                </div>
                <div>
                  <label className="text-sm">Jour</label>
                  <Select value={weEditor.day} onChange={(e)=>setWeEditor(p=>Object.assign({},p,{day:e.target.value}))} className="w-full mt-1">
                    <option value="samedi">Samedi</option>
                    <option value="dimanche">Dimanche</option>
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm">Fréquence week-end AT/AAC</label>
                  <Select value={weEditor.freq} onChange={(e)=>setWeEditor(p=>Object.assign({},p,{freq:Number(e.target.value)}))} className="w-full mt-1">
                    <option value={3}>Toutes les 3 semaines</option>
                    <option value={6}>Toutes les 6 semaines</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={weEditor.excludeFeries} onChange={(e)=>setWeEditor(p=>Object.assign({},p,{excludeFeries:e.target.checked}))}/> Exclure jours fériés</label>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={weEditor.excludeVacancesB} onChange={(e)=>setWeEditor(p=>Object.assign({},p,{excludeVacancesB:e.target.checked}))}/> Exclure vacances scolaires Zone B</label>
              </div>

              <div className="space-y-3 mt-2">
                {(weEditor.ranges||[]).map((r,idx)=> (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-3"><label className="text-sm">Début</label><Input type="time" value={r.start} onChange={(e)=>setWeEditor(p=>{const arr=[...p.ranges]; arr[idx]=Object.assign({},arr[idx],{start:e.target.value}); return Object.assign({},p,{ranges:arr});})} className="w-full mt-1"/></div>
                    <div className="col-span-3"><label className="text-sm">Fin</label><Input type="time" value={r.end} onChange={(e)=>setWeEditor(p=>{const arr=[...p.ranges]; arr[idx]=Object.assign({},arr[idx],{end:e.target.value}); return Object.assign({},p,{ranges:arr});})} className="w-full mt-1"/></div>
                    <div className="col-span-5"><label className="text-sm">Activité</label>
                      <Select value={r.activity} onChange={(e)=>setWeEditor(p=>{const arr=[...p.ranges]; arr[idx]=Object.assign({},arr[idx],{activity:e.target.value}); return Object.assign({},p,{ranges:arr});})} className="w-full mt-1">
                        <option value="">Choisir</option>
                        {Object.keys(ACTIVITIES).map((k)=>(<option key={k}>{k}</option>))}
                      </Select>
                    </div>
                    <div className="col-span-1 flex justify-end"><Btn type="button" onClick={()=>setWeEditor(p=>{const arr=[...p.ranges]; arr.splice(idx,1); return Object.assign({},p,{ranges:arr.length?arr:[{start:'',end:'',activity:''}]});})} className="px-2 py-2 rounded-lg border" title="Supprimer la ligne">🗑️</Btn></div>
                  </div>
                ))}
                <Btn type="button" onClick={()=>setWeEditor(p=>Object.assign({},p,{ranges:[...p.ranges,{start:'',end:'',activity:''}]}))} className="px-3 py-2 rounded-lg border">+ Ajouter un créneau</Btn>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Btn type="button" onClick={()=>setWeEditor(p=>Object.assign({},p,{open:false}))} className="px-3 py-2 rounded-lg border">Annuler</Btn>
                <Btn type="submit" className="px-3 py-2 rounded-lg text-white" style={{background:`linear-gradient(90deg,${THEME.a},${THEME.b})`}}>Enregistrer</Btn>
              </div>
            </div>
          </form>
        </div>
      )}

      {editor.open&&(
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4" onClick={()=>setEditor(p=>({...p,open:false}))}>
          <form onClick={(e)=>e.stopPropagation()} onSubmit={saveEditor} className="bg-white rounded-2xl overflow-hidden border shadow-2xl w-full max-w-2xl">
            <div className="px-6 py-4" style={{background:`linear-gradient(90deg,${THEME.a},${THEME.b})`}}>
              <h3 className="text-white text-lg font-semibold">{typeof editor.index==='number'?"Modifier":"Ajouter"} un créneau</h3>
            </div>
            <div className="p-6">
              <div className="text-sm text-slate-600 mb-3">Date sélectionnée : {editor.dateKey}</div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={editor.excludeFeries} onChange={(e)=>setEditor(p=>({...p,excludeFeries:e.target.checked}))}/> Exclure jours fériés</label>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={editor.excludeVacancesB} onChange={(e)=>setEditor(p=>({...p,excludeVacancesB:e.target.checked}))}/> Exclure vacances scolaires Zone B</label>
              </div>
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editor.repeat} onChange={(e)=>setEditor(p=>({...p,repeat:e.target.checked}))}/> Répéter chaque même jour (S37 → S25)</label>

              <div className="space-y-3 mt-4 mb-3">
                {(editor.ranges||[]).map((r,idx)=> (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-3"><label className="text-sm">Début</label><Input type="time" value={r.start} onChange={(e)=>setEditor(p=>{const arr=[...p.ranges]; arr[idx]={...arr[idx],start:e.target.value}; return {...p,ranges:arr};})} className="w-full mt-1"/></div>
                    <div className="col-span-3"><label className="text-sm">Fin</label><Input type="time" value={r.end} onChange={(e)=>setEditor(p=>{const arr=[...p.ranges]; arr[idx]={...arr[idx],end:e.target.value}; return {...p,ranges:arr};})} className="w-full mt-1"/></div>
                    <div className="col-span-5"><label className="text-sm">Activité</label>
                      <Select value={r.activity} onChange={(e)=>setEditor(p=>{const arr=[...p.ranges]; arr[idx]={...arr[idx],activity:e.target.value}; return {...p,ranges:arr};})} className="w-full mt-1">
                        <option value="">Choisir</option>
                        {Object.keys(ACTIVITIES).map((k)=>(<option key={k}>{k}</option>))}
                      </Select>
                    </div>
                    <div className="col-span-1 flex justify-end"><Btn type="button" onClick={()=>setEditor(p=>{const arr=[...p.ranges]; arr.splice(idx,1); return {...p,ranges:arr.length?arr:[{start:'',end:'',activity:''}]};})} className="px-2 py-2 rounded-lg border" title="Supprimer la ligne">🗑️</Btn></div>
                  </div>
                ))}
                <Btn type="button" onClick={()=>setEditor(p=>({...p,ranges:[...p.ranges,{start:'',end:'',activity:''}]}))} className="px-3 py-2 rounded-lg border">+ Ajouter un créneau</Btn>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Btn type="button" onClick={()=>setEditor(p=>({...p,open:false}))} className="px-3 py-2 rounded-lg border">Annuler</Btn>
                <Btn type="submit" className="px-3 py-2 rounded-lg text-white" style={{background:`linear-gradient(90deg,${THEME.a},${THEME.b})`}}>Enregistrer</Btn>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ==========================
// PLANNING — Week-end (lecture seule, synchronisé avec Hebdo)
// ==========================
function WeekendPlanning(){
  const [agents]=useLocalStorage('agents',()=>SEED);
  const [slotsByDate]=useLocalStorage('planningSlotsByDate',{});
  const [query,setQuery]=useState('');
  const [etab,setEtab]=useState('Tous');
  const [corp,setCorp]=useState('Tous');
  const [month,setMonth]=useState(new Date().getMonth()+1);
  const year=new Date().getFullYear();

  const firstDay=new Date(year,month-1,1);
  let d=new Date(firstDay); while(d.getDay()!==6){ d.setDate(d.getDate()+1); }
  const weekends=[]; while(d.getMonth()===firstDay.getMonth()){ const sat=new Date(d); const sun=new Date(d); sun.setDate(sun.getDate()+1); weekends.push({sat,sun,week:isoWeek(sat)}); d.setDate(d.getDate()+7); }

  const monthLabel=new Intl.DateTimeFormat('fr-FR',{month:'long',year:'numeric'}).format(firstDay);
  const fmtDate=(dd)=> new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short'}).format(dd).replace('.','');
  const getSlots=(id,key)=> (slotsByDate?.[id]?.[key])||[];
  const fmtName=(a)=> `${a.firstName} ${a.lastName? a.lastName.charAt(0).toUpperCase()+'.': ''}`;
  const extractMinutes=(t)=>{const [h,m]=t.split(':').map(Number); return (h*60+m);};
  const totalMin=(ranges)=> ranges.reduce((m,r)=>{const [s,e]=extractRange(r).split('-'); return m+Math.max(0,extractMinutes(e)-extractMinutes(s));},0);
  const fmtDur=(min)=> `${String(Math.floor(min/60)).padStart(2,'0')}h${String(min%60).padStart(2,'0')}`;

  const filteredAgents=agents.filter(a=> (etab==='Tous'||a.site===etab) && (corp==='Tous'||a.team===corp));
  const listForDate=(dt)=>{ const key=dkey(dt); return filteredAgents.map(a=>{ const ranges=getSlots(a.id,key); if(!ranges.length) return null; return {id:a.id, name:fmtName(a), ranges, total:totalMin(ranges)}; }).filter(Boolean).filter(x=> !query || x.name.toLowerCase().includes(query.toLowerCase())).sort((a,b)=> a.name.localeCompare(b.name)); };

  const AgentCard=({name,total,ranges,color})=> (
    <div className="rounded-lg border border-slate-200 p-2 shadow-sm text-left bg-white/80">
      <div className="flex items-center justify-between">
        <div className="font-medium" style={{color}}>{name}</div>
        <div className="text-[11px] text-slate-500">{fmtDur(total)}</div>
      </div>
      <div className="mt-1 flex flex-wrap gap-1 justify-start">
        {ranges.map((rg,i)=>{ const act=extractActivity(rg); const rng=extractRange(rg); const col=activityColor(act); return (
          <span key={i} className="inline-flex items-center justify-center px-2 py-1 rounded-md text-xs text-white shadow whitespace-nowrap" style={{background:col, minWidth:'fit-content'}}>{rng}</span>
        );})}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 p-4 rounded-xl border items-end" style={{background:THEME.surface}}>
        <div className="min-w-[200px] text-white"><label className="block text-sm font-medium">Établissement</label><Select value={etab} onChange={(e)=>setEtab(e.target.value)} className="mt-1 w-full"><option>Tous</option>{ETABS.map(x=><option key={x}>{x}</option>)}</Select></div>
        <div className="min-w-[200px] text-white"><label className="block text-sm font-medium">Corps de métier</label><Select value={corp} onChange={(e)=>setCorp(e.target.value)} className="mt-1 w-full"><option>Tous</option>{CORPS.map(x=><option key={x}>{x}</option>)}</Select></div>
        <div className="min-w-[160px] text-white"><label className="block text-sm font-medium">Mois</label><Select value={month} onChange={(e)=>setMonth(Number(e.target.value))} className="mt-1 w-full">{Array.from({length:12},(_,i)=>(<option key={i+1} value={i+1}>{new Intl.DateTimeFormat('fr-FR',{month:'long'}).format(new Date(year,i,1))}</option>))}</Select></div>
        <div className="grow min-w-[240px] text-white"><label className="block text-sm font-medium">Recherche agent</label><Input placeholder="Prénom + initiale (ex: Alice M.)" value={query} onChange={(e)=>setQuery(e.target.value)} className="mt-1 w-full"/></div>
      </div>

      <div className="bg-white rounded-2xl border p-3">
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-white/70 justify-center">
          <span className="text-xs font-semibold text-slate-600 mr-2">Légende activités :</span>
          {Object.entries(ACTIVITIES).map(([label,col])=> (
            <span key={label} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-white shadow" style={{background:col}}>
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{background:'#ffffffaa'}}></span>
              <span>{label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow overflow-hidden">
        <table className="w-full text-sm text-center">
          <thead style={{background:`linear-gradient(90deg,${THEME.a},${THEME.b})`}} className="text-center text-white"><tr><th className="p-3 text-center w-[110px]">Semaine</th><th className="p-3 text-center">Samedi</th><th className="p-3 text-center">Dimanche</th></tr></thead>
          <tbody>
            {weekends.map((w,idx)=>{ const satRows=listForDate(w.sat); const sunRows=listForDate(w.sun); return (
              <tr key={idx} className="border-t align-top text-center">
                <td className="p-3 font-semibold align-middle bg-slate-50">{w.week}<div className="text:[11px] text-slate-500">{monthLabel}</div></td>
                <td className="p-3 align-top"><div className="text-xs text-slate-500 mb-2">{fmtDate(w.sat)}</div>{satRows.length===0 && <div className="text-slate-400">—</div>}{satRows.length>0 && (<div className="grid gap-2 max-h-80 overflow-auto" style={{gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))'}}>{satRows.map((r,i)=> (<AgentCard key={i} name={r.name} total={r.total} ranges={r.ranges} color="#0a3d62"/>))}</div>)}</td>
                <td className="p-3 align-top"><div className="text-xs text-slate-500 mb-2">{fmtDate(w.sun)}</div>{sunRows.length===0 && <div className="text-slate-400">—</div>}{sunRows.length>0 && (<div className="grid gap-2 max-h-80 overflow-auto" style={{gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))'}}>{sunRows.map((r,i)=> (<AgentCard key={i} name={r.name} total={r.total} ranges={r.ranges} color="#2e8b8b"/>))}</div>)}</td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================
// PLANNING ROUTER
// ==========================
function PlanningRouter(){
  const [sub,setSub]=useLocalStorage('planningSub', 'hebdo');
  const tabs=[
    {key:'hebdo',label:'Hebdomadaire'},
    {key:'weekend',label:'Week-end'},
    {key:'vac_scol',label:'Vacances scolaires'},
    {key:'vac_ete',label:'Vacances estivales'},
    {key:'feries',label:'Jours fériés'},
  ];
  const TabBtn=({k,label})=> <Btn onClick={()=>setSub(k)} className={`px-3 py-1.5 rounded-full border ${sub===k? 'bg-slate-900 text-white' : 'bg-white hover:bg-slate-100'}`}>{label}</Btn>;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 bg-white/70 p-2 rounded-xl border">{tabs.map(t=> <TabBtn key={t.key} k={t.key} label={t.label}/>)}</div>
      {sub==='hebdo'&&<PlanningWeekly/>}
      {sub==='weekend'&&<WeekendPlanning/>}
      {sub==='vac_scol'&&<div className="bg-white rounded-2xl border p-6">Vue <b>Vacances scolaires</b> — à relier au calendrier scolaire.</div>}
      {sub==='vac_ete'&&<div className="bg-white rounded-2xl border p-6">Vue <b>Vacances estivales</b>.</div>}
      {sub==='feries'&&<div className="bg-white rounded-2xl border p-6">Vue <b>Jours fériés</b>.</div>}
    </div>
  );
}

// Placeholders
const Annualisation=()=> <div className="bg-white rounded-2xl border p-6">Module Annualisation</div>;
const Formation=()=> <div className="bg-white rounded-2xl border p-6">Module Formation</div>;
const Leaves=()=> <div className="bg-white rounded-2xl border p-6">Module Congés / Absences</div>;
const Security=()=> <div className="bg-white rounded-2xl border p-6">Module Sécurité</div>;

function Shell(){
  const [tab,setTab]=useLocalStorage('tab','Planification');
  return (
    <div className="min-h-screen" style={{background:THEME.surface}}>
      <Header tab={tab} setTab={setTab}/>
      <main className="max-w-7xl mx-auto p-4 text-black">
        {tab==='Dashboard' && <Dashboard/>}
        {tab==='Agents' && <Employees/>}
        {tab==='Planification' && <PlanningRouter/>}
        {tab==='Annualisation' && <Annualisation/>}
        {tab==='Formation' && <Formation/>}
        {tab==='Congés' && <Leaves/>}
        {tab==='Sécurité' && <Security/>}
      </main>
    </div>
  );
}

// ==========================
// RUNTIME SELF-CHECK
// ==========================
(function runtimeTests(){
  try {
    console.assert(typeof isoWeek === 'function', 'isoWeek doit exister');
    const k=dkey(new Date('2025-11-08'));
    console.assert(k==='2025-11-08', 'dkey format yyyy-mm-dd');
    const slotsByDate={ 1: { '2025-11-08': ['08:00-12:00 (Enseignement/Surveillance)','13:30-16:30 (Congés)'] } };
    const getSlotsLocal=(id,key)=> (slotsByDate?.[id]?.[key])||[];
    console.assert(Array.isArray(getSlotsLocal(1,'2025-11-08')), 'getSlotsLocal returns array');
    console.assert(extractRange('08:00-12:00 (Enseignement/Surveillance)')==='08:00-12:00','extractRange ok');
    console.assert(extractActivity('08:00-12:00 (Enseignement/Surveillance)')==='Enseignement/Surveillance','extractActivity ok');
    console.log('%cSelf-check OK','color:green');
  } catch(e){ console.error('Self-check failed', e); }
})();

export default function App(){
  return <Shell/>;
}
