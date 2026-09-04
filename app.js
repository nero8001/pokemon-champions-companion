const API='https://pokeapi.co/api/v2';
const LOCAL='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/';
const sprite=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const shiny=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
const $=id=>document.getElementById(id);
let mons=[],current=null,isShiny=false;
const localized={de:{pokemon:{},move:{},ability:{},type:{},item:{},form:{}},en:{pokemon:{},move:{},ability:{},type:{},item:{},form:{}}};
let uiLang=localStorage.getItem('ccc-language')==='en'?'en':'de';
function csvFields(line){const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q}else if(c===','&&!q){out.push(cur);cur=''}else cur+=c}out.push(cur);return out}
async function loadCSV(lang,kind,file,languageId){const c=new AbortController(),tm=setTimeout(()=>c.abort(),12000);let r;try{r=await fetch(LOCAL+file,{cache:'no-store',signal:c.signal})}finally{clearTimeout(tm)}if(!r.ok)throw Error(r.status);const t=await r.text(),lines=t.split(/\r?\n/);for(let i=1;i<lines.length;i++){if(!lines[i])continue;const row=csvFields(lines[i]);if(row.length>=3&&row[1]===String(languageId))localized[lang][kind][row[0]]=row[2]}}
async function loadLanguages(){const jobs=[];for(const [lang,id] of [['de',6],['en',9]])for(const [kind,file] of [['pokemon','pokemon_species_names.csv'],['move','move_names.csv'],['ability','ability_names.csv'],['type','type_names.csv'],['item','item_names.csv'],['form','pokemon_form_names.csv']])jobs.push(loadCSV(lang,kind,file,id));return Promise.allSettled(jobs)}
function dataName(kind,id,fallback=''){return localized[uiLang]?.[kind]?.[String(id)]||localized.en?.[kind]?.[String(id)]||fallback||null}
const deP=id=>dataName('pokemon',id);const deM=id=>dataName('move',id);const deA=id=>dataName('ability',id);const deT=id=>dataName('type',id);const deI=id=>dataName('item',id);const deF=id=>dataName('form',id);
const rid=u=>{const m=String(u).match(/\/(\d+)\/?$/);return m?m[1]:null};
const title=s=>String(s||'').split('-').map(x=>x[0]?x[0].toUpperCase()+x.slice(1):x).join(' ');
const formSuffixMap={
  mega:'Mega', 'mega-x':'Mega X', 'mega-y':'Mega Y',
  gmax:'Gigadynamax', alola:'Alola-Form', galar:'Galar-Form', hisui:'Hisui-Form', paldea:'Paldea-Form',
  origin:'Urform', altered:'Wandelform', therian:'Tiergeistform', incarnate:'Inkarnationsform',
  resolute:'Resolutform', ordinary:'Normalform', pirouette:'Pirouettenform', school:'Schwarmform',
  solo:'Solofrom', midday:'Tagform', midnight:'Nachtform', dusk:'Zwielichtform', dawn:'Morgenform',
  sunny:'Sonnenform', rainy:'Regenform', snowy:'Schneeflockenform', heat:'Hitzemodul', wash:'Waschmodul',
  frost:'Gefriermodul', fan:'Ventilatormodul', mow:'Rasenmähermodul', blade:'Klingenform', shield:'Schildform',
  complete:'Komplettform', 10:'10%-Form', 50:'50%-Form', 100:'100%-Form', small:'Klein', large:'Groß',
  school:'Schwarmform', gulping:'Schlingform', gorging:'Stopfform', hangry:'Heißhungerform',
  'low-key':'Low-Key-Form', amped:'High-Voltage-Form', crown:'Kronenform', hero:'Heldenform',
  bloodmoon:'Blutmondform', teal:'Türkis', wells:'Quellform', hearthflame:'Ofenform', cornerstone:'Felsform',
  hearthflame:'Ofenform', cornerstone:'Felsform', cornerstone:'Felsform', artful:'Prunkform'
};
function formDisplayName(fp,speciesId,speciesName,formResourceId=null){
 const pokemonId=fp?.id?String(fp.id):rid(fp?.url||'');
 const formId=formResourceId?String(formResourceId):String(fp?.formResourceId||'');
 const official=formId?dataName('form',formId,''):'';
 if(official){
   const base=dataName('pokemon',speciesId,speciesName||title(fp?.name));
   const raw=String(fp?.name||'').toLowerCase();
   const baseRaw=String(speciesName||'').toLowerCase();
   if(raw===baseRaw||raw===baseRaw+'-normal')return base;
   // PokeAPI's localized form name is already the official display name in most cases.
   // If it is only a generic form label, prepend the species name.
   const generic=['mega','mega x','mega y','gigantamax','alolan form','galarian form','hisuian form','paldean form','origin forme','altered forme','therian forme','incarnate forme','school form','solo form','midday form','midnight form','dusk form','dawn form','sunny form','rainy form','snowy form','heat rotom','wash rotom','frost rotom','fan rotom','mow rotom','blade forme','shield forme','complete forme','small size','large size','gulping form','gorging form','hangry mode','low key form','amped form','crowned form','hero form','bloodmoon form','teal mask','wellspring mask','hearthflame mask','cornerstone mask','artful form'];
   return generic.includes(official.toLowerCase()) && base ? `${base} – ${official}` : official;
 }
 const base=dataName('pokemon',speciesId,speciesName||title(fp?.name));
 const raw=String(fp?.name||'').toLowerCase(),sr=String(speciesName||'').toLowerCase();
 if(raw===sr||raw===sr+'-normal')return base;
 const suffix=raw.startsWith(sr+'-')?raw.slice(sr.length+1):raw;
 const map={mega:'Mega', 'mega-x':'Mega X','mega-y':'Mega Y',gmax:'Gigantamax',alola:'Alolan Form',galar:'Galarian Form',hisui:'Hisuian Form',paldea:'Paldean Form',origin:'Origin Forme',altered:'Altered Forme',therian:'Therian Forme',incarnate:'Incarnate Forme',school:'School Form',solo:'Solo Form',midday:'Midday Form',midnight:'Midnight Form',dusk:'Dusk Form',dawn:'Dawn Form',sunny:'Sunny Form',rainy:'Rainy Form',snowy:'Snowy Form',heat:'Heat Rotom',wash:'Wash Rotom',frost:'Frost Rotom',fan:'Fan Rotom',mow:'Mow Rotom',blade:'Blade Forme',shield:'Shield Forme',complete:'Complete Forme',small:'Small Size',large:'Large Size',gulping:'Gulping Form',gorging:'Gorging Form',hangry:'Hangry Mode','low-key':'Low Key Form',amped:'Amped Form',crowned:'Crowned Form',hero:'Hero Form',bloodmoon:'Bloodmoon Form',teal:'Teal Mask',wellspring:'Wellspring Mask',hearthflame:'Hearthflame Mask',cornerstone:'Cornerstone Mask',artful:'Artful Form',combat:'Combat Form',water:'Water Form',fire:'Fire Form',ice:'Ice Form',stellar:'Stellar Form'};
 return map[suffix]?`${base} – ${map[suffix]}`:`${base} – ${title(suffix)}`;
}
const typeRelationsCache=new Map();
const allTypeIds=Array.from({length:18},(_,i)=>i+1);
async function getTypeRelations(p){
  const types=p.types||[]; if(!types.length)return {weak:[],resist:[],immune:[]};
  const defending=types.map(t=>String(rid(t.type.url)));
  const mult={}; allTypeIds.forEach(id=>mult[id]=1);
  for(const typeId of defending){
    let data=typeRelationsCache.get(typeId);
    if(!data){data=await json(`${API}/type/${typeId}`);typeRelationsCache.set(typeId,data)}
    for(const x of data.damage_relations.double_damage_from||[])mult[rid(x.url)]*=2;
    for(const x of data.damage_relations.half_damage_from||[])mult[rid(x.url)]*=.5;
    for(const x of data.damage_relations.no_damage_from||[])mult[rid(x.url)]=0;
  }
  const weak=[],resist=[],immune=[];
  for(const id of allTypeIds){const name=deT(id)||title((typeRelationsCache.get(String(id))||{}).name||'');if(!name)continue;if(mult[id]>1)weak.push({name,m:mult[id]});else if(mult[id]===0)immune.push({name});else if(mult[id]<1)resist.push({name,m:mult[id]})}
  return {weak,resist,immune};
}
function relationPills(arr,showMultiplier=false){return arr.length?arr.map(x=>`<span class="pill">${x.name}${showMultiplier?` ×${x.m}`:''}</span>`).join(''):'<span class="muted">Keine</span>';}
async function json(u,timeout=15000){const c=new AbortController(),tm=setTimeout(()=>c.abort(),timeout);try{const r=await fetch(u,{signal:c.signal});if(!r.ok)throw Error(r.status);return await r.json()}finally{clearTimeout(tm)}}

const UI={de:{pokedex:'Pokédex',calculator:'Battle Calculator',dexHero:'Deutsche Pokémon-Daten und Kampfvorbereitung.',calcHero:'Level 50 · Statuswertpunkte · Wesen · Status · Statuswertänderungen.',searchPokemon:'Pokémon suchen',searchPlaceholder:'Name oder Pokédex-Nummer',attacker:'Angreifer',defender:'Verteidiger',pokemonSearch:'Pokémon suchen',form:'Form',moveSearch:'Attacke suchen',nature:'Wesen',itemSearch:'Item suchen',spTitle:'Statuswertpunkte-Verteilung',spHelp:'Max. 32 pro Statuswert · 66 insgesamt',field:'Feldstatus',weather:'Wetter',fieldHelp:'Feld und Wetter werden bei der Schadensberechnung berücksichtigt.',attackButton:'Attacke',preliminary:'Die Schadensberechnung bleibt bis zum verifizierten Champions-Regelsatz vorläufig.',loading:'Pokémon werden geladen …',loadError:'Pokémon konnten nicht geladen werden.'},en:{pokedex:'Pokédex',calculator:'Battle Calculator',dexHero:'Official Pokémon data and battle preparation.',calcHero:'Level 50 · Stat Points · Nature · Status · Stat changes.',searchPokemon:'Search Pokémon',searchPlaceholder:'Name or Pokédex number',attacker:'Attacker',defender:'Defender',pokemonSearch:'Search Pokémon',form:'Form',moveSearch:'Search Move',nature:'Nature',itemSearch:'Search Item',spTitle:'Stat Point Distribution',spHelp:'Max. 32 per stat · 66 total',field:'Field',weather:'Weather',fieldHelp:'Field and weather are included in the damage calculation.',attackButton:'Move',preliminary:'Damage calculation remains preliminary until the verified Champions ruleset.',loading:'Loading Pokémon …',loadError:'Pokémon could not be loaded.'}};
function t(k){return UI[uiLang]?.[k]??UI.en[k]??k}
function applyLanguage(){document.documentElement.lang=uiLang;const sel=$('languageSelect');if(sel)sel.value=uiLang;document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=t(e.dataset.i18n));const ph=$('search');if(ph)ph.placeholder=t('searchPlaceholder');const navs=document.querySelectorAll('.nav');if(navs[0])navs[0].textContent=t('pokedex');if(navs[1])navs[1].textContent=t('calculator');const heads=document.querySelectorAll('.calc-title h2');if(heads[0])heads[0].textContent=t('attacker');if(heads[1])heads[1].textContent=t('defender');document.querySelectorAll('#attackerCard>label:first-of-type,#defenderCard>label:first-of-type').forEach(e=>e.childNodes[0].textContent=t('pokemonSearch')+'\n      ');const ml=document.querySelector('#moveSearch')?.parentElement;if(ml)ml.childNodes[0].textContent=t('moveSearch')+'\n      ';document.querySelectorAll('.combatant-card-v14 h3').forEach(e=>e.textContent=t('spTitle'));document.querySelectorAll('.sp-help').forEach(e=>e.textContent=t('spHelp'));const fl=document.querySelectorAll('.field-controls-v16 .twocol label');if(fl[0])fl[0].childNodes[0].textContent=t('field');if(fl[1])fl[1].childNodes[0].textContent=t('weather');const fh=document.querySelector('.field-help');if(fh)fh.textContent=t('fieldHelp');if($('calcButton'))$('calcButton').textContent=t('attackButton');const no=document.querySelector('.notice');if(no)no.textContent=t('preliminary');const sts=statusOptions();['atkStatus','defStatus'].forEach(id=>{const e=$(id);if(e)e.innerHTML=sts.map(x=>`<option>${x}</option>`).join('')});const fieldNames=uiLang==='en'?['No Terrain','Electric Terrain','Grassy Terrain','Psychic Terrain','Misty Terrain']:['Kein Feld','Elektrofeld','Grasfeld','Psychofeld','Nebelfeld'];const weatherNames=uiLang==='en'?['No Weather','Sun','Rain','Sandstorm','Snow']:['Kein Wetter','Sonnenschein','Regen','Sandsturm','Schnee'];const fs=$('fieldStatus'),ws=$('weatherStatus');if(fs)[...fs.options].forEach((o,i)=>o.textContent=fieldNames[i]);if(ws)[...ws.options].forEach((o,i)=>o.textContent=weatherNames[i]);const fp=$('atkSearch');if(fp)fp.placeholder=t('searchPlaceholder');const dp=$('defSearch');if(dp)dp.placeholder=t('searchPlaceholder');const ip=$('atkItemSearch');if(ip)ip.placeholder=t('itemSearch');const ip2=$('defItemSearch');if(ip2)ip2.placeholder=t('itemSearch');const mi=$('moveSearch');if(mi)mi.placeholder=t('moveSearch');}
function setLanguage(lang){uiLang=lang==='en'?'en':'de';localStorage.setItem('ccc-language',uiLang);applyLanguage();fillOptions();if(mons.length)render(mons.slice(0,24));if(calcState.attacker)updateCalcSide('atk');if(calcState.defender)updateCalcSide('def');if(calcState.attacker)loadCalcMoves()}

function nav(){document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));b.classList.add('active');$(b.dataset.page).classList.add('active');scrollTo(0,0)})}
function render(list){$('grid').innerHTML=list.map(p=>`<article class="poke"><button data-id="${p.id}"><div class="pic"><img src="${sprite(p.id)}" alt="${deP(p.id)||title(p.name)}"></div><div class="no">#${String(p.id).padStart(4,'0')}</div><div class="name">${deP(p.id)||title(p.name)}</div></button></article>`).join('');document.querySelectorAll('.poke button').forEach(b=>b.onclick=()=>open(+b.dataset.id))}
function search(){const q=$('search').value.trim().toLowerCase();if(!q){$('suggestions').innerHTML='';render(mons.slice(0,24));return}const m=mons.filter(p=>p.name.includes(q)||(deP(p.id)||'').toLowerCase().includes(q)||String(p.id)===q||String(p.id).padStart(4,'0')===q).slice(0,8);$('suggestions').innerHTML=m.map(p=>`<button class="suggest" data-id="${p.id}"><img src="${sprite(p.id)}"><span>${deP(p.id)||title(p.name)}<br><small>#${String(p.id).padStart(4,'0')}</small></span></button>`).join('');document.querySelectorAll('.suggest').forEach(b=>b.onclick=()=>open(+b.dataset.id));render(m)}
async function open(id){$('modal').hidden=false;document.body.style.overflow='hidden';$('modalbody').innerHTML='<p>Daten werden geladen …</p>';try{const [p,s]=await Promise.all([json(`${API}/pokemon/${id}`),json(`${API}/pokemon-species/${id}`)]);current={p,s};isShiny=false;await detail(p,s)}catch(e){console.error(e);$('modalbody').innerHTML='<h2>Fehler</h2><p>Die Pokémon-Daten konnten nicht geladen werden.</p>'}}
function maxLevel50Stats(p,natureIndex){
  const n=natureData[Number(natureIndex)||0];
  return calcStatKeys.map((key,i)=>{
    const base=p.stats[i]?.base_stat||0;
    const raw=Math.floor(((2*base+31+63)*50)/100);
    if(i===0) return raw+52;
    const neutral=raw+5;
    return Math.floor(neutral*(n[1]===key?1.1:n[2]===key?0.9:1));
  });
}
const natureStatLabels={de:{atk:'Angriff',def:'Verteidigung',spa:'Sp. Angriff',spd:'Sp. Verteidigung',spe:'Initiative',neutral:'neutral'},en:{atk:'Attack',def:'Defense',spa:'Sp. Atk',spd:'Sp. Def',spe:'Speed',neutral:'neutral'}};
const natureEnglish={Hart:'Adamant',Solo:'Lonely',Mutig:'Brave',Frech:'Naughty',Kühn:'Bold',Pfiffig:'Impish',Locker:'Lax',Lasch:'Relaxed',Mäßig:'Modest',Mild:'Mild',Ruhig:'Quiet',Hitzig:'Rash',Scheu:'Timid',Hastig:'Hasty',Froh:'Jolly',Naiv:'Naive',Still:'Calm',Zart:'Gentle',Sacht:'Careful',Forsch:'Sassy',Robust:'Hardy',Ernst:'Serious',Kauzig:'Bashful',Zaghaft:'Quirky',Doche:'Docile'};
function natureLabel(n){const labels=natureStatLabels[uiLang]||natureStatLabels.en;if(n[1]==='neutral')return `${uiLang==='en'?(natureEnglish[n[0]]||n[0]):n[0]} (neutral)`;const name=uiLang==='en'?(natureEnglish[n[0]]||n[0]):n[0];return `${name} (+${labels[n[1]]}, −${labels[n[2]]})`}
function statLabel(i){return (uiLang==='en'?['HP','Attack','Defense','Sp. Atk','Sp. Def','Speed']:['KP','Angriff','Verteidigung','Sp. Angriff','Sp. Verteidigung','Initiative'])[i]}
function statusOptions(){return uiLang==='en'?['None','Sleep','Poison','Badly Poisoned','Burn','Paralysis','Frozen']:['Keine','Schlaf','Gift','Schwere Vergiftung','Verbrennung','Paralyse','Eingefroren']}
function natureOptionsHtml(selected=0){return natureData.map((n,i)=>`<option value="${i}" ${i===Number(selected)?'selected':''}>${natureLabel(n)}</option>`).join('')}
function maxStatsHtml(p){
  const vals=maxLevel50Stats(p,0);
  return `<div class="maxstats" id="maxStatsBox">${vals.map((v,i)=>`<div class="maxstat"><span>${statLabel(i)}</span><b id="dexMaxStat${i}">${v}</b></div>`).join('')}</div>`;
}
async function detail(p,s){
  const pname=deP(p.id)||deF(p.id)||title(p.name);const abilities=await Promise.all(p.abilities.map(async x=>deA(rid(x.ability.url))||title(x.ability.name)));
  const grouped={};p.moves.forEach(x=>(x.version_group_details||[]).forEach(v=>{let key='Weitere';const m=v.move_learn_method?.name;if(m==='level-up')key='Durch Levelaufstieg';else if(m==='machine')key='TM / VM';else if(m==='tutor')key='Attacken-Lehrer';else if(m==='egg')key='Ei-Attacke';else if(m==='stadium-surfing-pikachu')key='Spezial';if(!grouped[key])grouped[key]=[];const entry={id:rid(x.move.url),name:x.move.name,level:v.level_learned_at||0};if(!grouped[key].some(a=>a.id===entry.id))grouped[key].push(entry)}));
  let moveHtml='';for(const group of ['Durch Levelaufstieg','TM / VM','Attacken-Lehrer','Ei-Attacke','Spezial','Weitere']){if(!grouped[group])continue;const entries=await Promise.all(grouped[group].map(async m=>({...m,de:deM(m.id)||title(m.name)})));entries.sort((a,b)=>group==='Durch Levelaufstieg'?(a.level-b.level||a.de.localeCompare(b.de,'de')):a.de.localeCompare(b.de,'de'));const groupLabel=uiLang==='en'?({'Durch Levelaufstieg':'Level Up','TM / VM':'TM / HM','Attacken-Lehrer':'Move Tutor','Ei-Attacke':'Egg Move','Spezial':'Special','Weitere':'Other'}[group]||group):group;moveHtml+=`<div class="move-group"><h4>${groupLabel} <span class="move-meta">(${entries.length})</span></h4><div class="move-list">${entries.map(m=>`<div class="move-item"><span class="move-name">${m.de}</span>${group==='Durch Levelaufstieg'?`<span class="move-meta">Lv. ${m.level}</span>`:''}</div>`).join('')}</div></div>`}
  const langName=uiLang==='en'?'en':'de';const flavor=(s.flavor_text_entries||[]).find(x=>x.language?.name===langName)|| (s.flavor_text_entries||[]).find(x=>x.language?.name==='en');const genus=(s.genera||[]).find(x=>x.language?.name===langName)|| (s.genera||[]).find(x=>x.language?.name==='en');
  const stats=p.stats.map(x=>`<div class="stat"><span>${({hp:uiLang==='en'?'HP':'KP',attack:uiLang==='en'?'Attack':'Angriff',defense:uiLang==='en'?'Defense':'Verteidigung','special-attack':uiLang==='en'?'Sp. Atk':'Sp. Angriff','special-defense':uiLang==='en'?'Sp. Def':'Sp. Verteidigung',speed:uiLang==='en'?'Speed':'Initiative'})[x.stat.name]}</span><div class="bar"><i style="width:${Math.min(100,x.base_stat/2)}%"></i></div><b>${x.base_stat}</b></div>`).join('');
  const formRows=await Promise.all((s.varieties||[]).map(async v=>{const id=rid(v.pokemon.url);if(!id)return '';let fp=null,formId=null;try{fp=await json(v.pokemon.url);formId=rid(fp?.forms?.[0]?.url||'')}catch(e){}const name=formDisplayName(fp||{id,name:v.pokemon.name},s.id,s.name,formId);return `<button type="button" class="form-choice ${Number(id)===Number(p.id)?'active':''}" data-form-url="${v.pokemon.url}" data-form-id="${id}"><img src="${sprite(id)}" alt=""><span>${name}</span></button>`;}));
  const forms=formRows.filter(Boolean).join('');
  const types=p.types.map(t=>`<span class="pill">${deT(rid(t.type.url))||title(t.type.name)}</span>`).join('');
  const relations=await getTypeRelations(p);
  $('modalbody').innerHTML=`<div class="detail"><div class="detailpic"><img id="ds" src="${isShiny?shiny(p.id):sprite(p.id)}" alt="${pname}"></div><div><h2>${pname}</h2><div>#${String(p.id).padStart(4,'0')} · ${p.height/10} m · ${p.weight/10} kg</div><p>${types}</p><button id="sh" class="pill ${isShiny?'active':''}">✨ Shiny</button></div></div><div class="section"><h3>${uiLang==='en'?'Select Form':'Form auswählen'}</h3><div class="form-buttons" id="forms">${forms||'—'}</div></div><div class="section"><h3>${uiLang==='en'?'Strengths & Weaknesses':'Stärken & Schwächen'}</h3><div class="relation-grid"><div><strong>${uiLang==='en'?'Resistances':'Stärken / Resistenzen'}</strong><div>${relationPills(relations.resist,true)}</div></div><div><strong>${uiLang==='en'?'Weaknesses':'Schwächen'}</strong><div>${relationPills(relations.weak,true)}</div></div><div><strong>${uiLang==='en'?'Immunities':'Immunitäten'}</strong><div>${relationPills(relations.immune)}</div></div></div></div><div class="section"><h3>${uiLang==='en'?'Pokédex Description':'Pokédex-Beschreibung'}</h3><p class="description">${flavor?flavor.flavor_text.replace(/[\n\f]/g,' '):(uiLang==='en'?'No description available.':'Keine deutsche Beschreibung vorhanden.')}</p>${genus?`<p class="flavor">${genus.genus}</p>`:''}</div><div class="section"><h3>${uiLang==='en'?'Abilities':'Fähigkeiten'}</h3><p>${abilities.join(', ')||'—'}</p></div><div class="section"><h3>${uiLang==='en'?'Base Stats':'Basiswerte'}</h3>${stats}</div><div class="section"><h3>${uiLang==='en'?'Max Stats at Level 50':'Maximalwerte auf Level 50'}</h3><p class="muted">${uiLang==='en'?'IV 31 · 252 EVs in the selected stat · no item or battle bonuses':'IV 31 · 252 EVs im jeweiligen Statuswert · ohne Item- oder Kampfboni'}</p><label class="nature-inline">${uiLang==='en'?'Nature':'Wesen'}<select id="dexNature">${natureOptionsHtml(0)}</select></label>${maxStatsHtml(p)}</div><div class="section"><h3>${uiLang==='en'?'Moves':'Attacken'}</h3><div class="move-groups">${moveHtml||'<p>Keine Attacken gefunden.</p>'}</div></div>`;
  $('sh').onclick=()=>{isShiny=!isShiny;$('ds').src=isShiny?shiny(p.id):sprite(p.id);$('sh').classList.toggle('active',isShiny)};
  document.querySelectorAll('#forms .form-choice').forEach(btn=>btn.onclick=async()=>{try{const fp=await json(btn.dataset.formUrl);current={p:fp,s};isShiny=false;await detail(fp,s)}catch(e){console.error(e)}})
  $('dexNature').addEventListener('change',()=>{
    const vals=maxLevel50Stats(p,$('dexNature').value);
    vals.forEach((v,i)=>$(`dexMaxStat${i}`).textContent=v);
  });
}

function calcEV(side){const t=calcStatKeys.reduce((a,k)=>a+(Math.max(0,Math.min(32,+($(`${side}-${k}`).value)||0))),0);$(`${side}Total`).textContent=`Statuswertpunkte: ${t} / 66`;$(`${side}Total`).style.color=t>66?'#ff9a9a':''}
const natureData=[['Hart','atk','spa'],['Solo','atk','def'],['Mutig','atk','spe'],['Frech','atk','spd'],['Kühn','def','atk'],['Pfiffig','def','spa'],['Locker','def','spe'],['Lasch','def','spd'],['Mäßig','spa','atk'],['Mild','spa','def'],['Ruhig','spa','spe'],['Hitzig','spa','spd'],['Scheu','spe','atk'],['Hastig','spe','def'],['Froh','spe','spa'],['Naiv','spe','spd'],['Still','spd','atk'],['Zart','spd','def'],['Sacht','spd','spa'],['Forsch','spd','spe'],['Robust','neutral','neutral'],['Ernst','neutral','neutral'],['Kauzig','neutral','neutral'],['Zaghaft','neutral','neutral'],['Doche','neutral','neutral']];const calcStatKeys=['hp','atk','def','spa','spd','spe'];const calcStatLabels=['KP','Angriff','Verteidigung','Sp. Angriff','Sp. Verteidigung','Initiative'];
const calcStatuses=['Keine','Schlaf','Gift','Schwere Vergiftung','Verbrennung','Paralyse','Eingefroren'];const stages=['0','+1','+2','+3','+4','+5','+6'];
let calcItems=[];
function makeEVInputs(side){const target=$(side==='atk'?'atkEV':'defEV');target.innerHTML=calcStatKeys.map((k,i)=>`<label>${statLabel(i)}<input id="${side}-${k}" type="number" min="0" max="32" step="1" value="0"></label>`).join('');calcStatKeys.forEach(k=>$(`${side}-${k}`).addEventListener('input',()=>{calcEV(side);updateCalcSide(side)}))}
function fillOptions(){const nat=natureData.map((n,i)=>`<option value="${i}">${natureLabel(n)}</option>`).join('');$('atkNature').innerHTML=nat;$('defNature').innerHTML=nat;const items=calcItems.map(x=>`<option value="${x.id}">${dataName('item',x.id,x.raw)||x.raw}</option>`).join('');$('atkItem').innerHTML=items;$('defItem').innerHTML=items;const sts=statusOptions().map(x=>`<option>${x}</option>`).join('');['atkStatus','defStatus'].forEach(id=>$(id).innerHTML=sts);['atkBoost','atkSpABoost','atkSpeedBoost','defBoost','defSpDBoost','defSpeedBoost'].forEach(id=>$(id).innerHTML=stages.map(x=>`<option>${x}</option>`).join(''))}
function natureMultiplier(index,key){const n=natureData[Number(index)||0];return n[1]===key?1.1:n[2]===key?.9:1}
function calcLevel50Stats(p,side){const vals=[];const nature=$(side==='atk'?'atkNature':'defNature').value;calcStatKeys.forEach((key,i)=>{const base=p.stats[i]?.base_stat||0,sp=Math.max(0,Math.min(32,Number($(`${side}-${key}`).value)||0));if(i===0)vals.push(base+sp+75);else vals.push(Math.floor((base+sp+20)*natureMultiplier(nature,key)))});return vals}
function updateCalcSide(side){const p=calcState[side==='atk'?'attacker':'defender'];const box=$(side==='atk'?'attackerPreview':'defenderPreview');if(!p){box.textContent='Noch kein Pokémon ausgewählt.';calcEV(side);return}const vals=calcLevel50Stats(p,side);box.innerHTML=`<img src="${sprite(p.id)}" alt=""><div><b>${calcDisplayName(p)}</b><div class="statsline">${vals.map((v,i)=>`${statLabel(i)} ${v}`).join(' · ')}</div></div>`;calcEV(side)}
function calcDisplayName(p){return p._formName||dataName('pokemon',p.speciesId||p.id,p.name)||title(p.name)}

function setupSearchBox(inputId,listId,side,itemsProvider,onPick){
 const input=$(inputId),list=$(listId);let lastItems=[];
 function matches(q){q=q.trim().toLocaleLowerCase(uiLang==='de'?'de-DE':'en-US');return itemsProvider().filter(x=>String(x.id)===q||x.name.toLocaleLowerCase(uiLang==='de'?'de-DE':'en-US')===q||x.label.toLocaleLowerCase(uiLang==='de'?'de-DE':'en-US')===q||x.name.toLocaleLowerCase(uiLang==='de'?'de-DE':'en-US').includes(q)||x.label.toLocaleLowerCase(uiLang==='de'?'de-DE':'en-US').includes(q))}
 function draw(items){lastItems=items.slice(0,12);list.innerHTML=lastItems.map((x,i)=>`<button type="button" class="calc-suggest" data-index="${i}"><img src="${sprite(x.id)}" alt=""><span>${x.label}<small>${x.meta||''}</small></span></button>`).join('');list.hidden=!lastItems.length;list.querySelectorAll('button').forEach(b=>b.onclick=()=>{const x=lastItems[+b.dataset.index];input.value=x.label;list.hidden=true;onPick(x)})}
 function chooseExact(){const q=input.value.trim();if(!q)return false;const exact=itemsProvider().find(x=>String(x.id)===q||x.name.toLocaleLowerCase(uiLang==='de'?'de-DE':'en-US')===q.toLocaleLowerCase(uiLang==='de'?'de-DE':'en-US')||x.label.toLocaleLowerCase(uiLang==='de'?'de-DE':'en-US')===q.toLocaleLowerCase(uiLang==='de'?'de-DE':'en-US'));if(exact){list.hidden=true;input.value=exact.label;onPick(exact);return true}return false}
 input.addEventListener('input',()=>{const q=input.value.trim();draw(q?matches(q):itemsProvider().slice(0,12))});
 input.addEventListener('focus',()=>{const q=input.value.trim();draw(q?matches(q):itemsProvider().slice(0,12))});
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();if(!chooseExact()&&lastItems[0]){const x=lastItems[0];input.value=x.label;list.hidden=true;onPick(x)}}});
 input.addEventListener('blur',()=>setTimeout(()=>{if(!list.contains(document.activeElement))chooseExact()},120));
 document.addEventListener('click',e=>{if(e.target!==input&&!list.contains(e.target))list.hidden=true});
}
function pokemonSearchItems(){return mons.map(p=>({id:p.id,name:p.name,label:deP(p.id)||title(p.name),meta:`#${String(p.id).padStart(4,'0')}`}))}
function moveSearchItems(){return calcState.moves.map(m=>({id:m.id,name:m.name,label:m.label,meta:`${m.type||''} · ${m.cls||''}`}))}
async function selectCalcPokemon(side,item){
 const key=side==='atk'?'attacker':'defender',search=$(`${side}Search`);
 if(!item||!item.id)return;
 try{
  search.disabled=true;
  const p=await json(`${API}/pokemon/${item.id}`);
  p.speciesId=rid(p.species?.url)||item.id;
  p._formName=dataName('pokemon',p.speciesId,item.label||title(p.name))||item.label||title(p.name);
  // Commit the selection immediately. Loading species/forms must never make the selection disappear.
  calcState[key]=p;
  search.value=calcDisplayName(p);
  updateCalcSide(side);
  let species=null;
  try{species=await json(`${API}/pokemon-species/${p.speciesId}`)}catch(e){console.warn('Species:',e)}
  if(species)await loadCalcForms(side,species,p.id);
  else {const sel=$(side==='atk'?'atkForm':'defForm');sel.innerHTML=`<option value="${p.id}">${calcDisplayName(p)}</option>`;sel.value=String(p.id);sel.disabled=true;calcState.forms[key]=[p]}
  if(side==='atk')await loadCalcMoves();
 }catch(e){console.error(e);search.value=item.label||'';calcState[key]=null;updateCalcSide(side)}
 finally{search.disabled=false}
}
async function loadCalcForms(side,species,selectedId){
 const key=side==='atk'?'attacker':'defender',forms=[];
 for(const v of species.varieties||[]){
  const id=rid(v.pokemon.url);if(!id)continue;
  try{
   const fp=await json(v.pokemon.url);
   fp.speciesId=species.id;
   fp.formResourceId=rid(fp?.forms?.[0]?.url||'');
   fp._formName=formDisplayName(fp,species.id,species.name,fp.formResourceId);
   forms.push(fp);
  }catch(e){console.warn('Form:',e)}
 }
 calcState.forms[key]=forms;
 const sel=$(side==='atk'?'atkForm':'defForm');
 sel.innerHTML=forms.length?forms.map(fp=>`<option value="${fp.id}">${fp._formName}</option>`).join(''):`<option value="${selectedId||''}">${uiLang==='en'?'Select Pokémon first …':'Erst Pokémon auswählen …'}</option>`;
 sel.disabled=forms.length<=1;
 const wanted=String(selectedId??calcState[key]?.id??'');
 if(forms.some(fp=>String(fp.id)===wanted))sel.value=wanted;
}
async function changeCalcForm(side,id){
 const key=side==='atk'?'attacker':'defender';
 const p=(calcState.forms[key]||[]).find(x=>String(x.id)===String(id));if(!p)return;
 calcState[key]=p;
 $(side==='atk'?'atkSearch':'defSearch').value=calcDisplayName(p);
 updateCalcSide(side);
 if(side==='atk')await loadCalcMoves();
}
async function loadCalcMoves(){const p=calcState.attacker;const input=$('moveSearch');calcState.moves=[];$('moveSuggestions').innerHTML='';$('moveInfo').textContent=p?`${t('moveSearch')} …`:`${uiLang==='en'?'Choose an attacker, then a move.':'Wähle einen Angreifer und danach eine Attacke.'}`;if(!p)return;try{const data=await json(`${API}/pokemon/${p.id}`),seen=new Set();for(const x of data.moves||[]){const id=rid(x.move.url);if(!id||seen.has(id))continue;seen.add(id);let info={id,name:x.move.name,label:dataName('move',id,x.move.name)||title(x.move.name),type:'',cls:''};calcState.moves.push(info)}calcState.moves.sort((a,b)=>a.label.localeCompare(b.label,'de'));input.disabled=false;input.placeholder=t('moveSearch')+' …';input.value='';}catch(e){input.disabled=true;input.placeholder=uiLang==='en'?'Moves could not be loaded':'Attacken konnten nicht geladen werden'}}
async function showMoveInfoById(id){if(!id)return;calcState.selectedMove=id;try{const m=await json(`${API}/move/${id}`);const type=dataName('type',rid(m.type?.url),m.type?.name)||title(m.type?.name||'—');const cls=uiLang==='en'?(m.damage_class?.name==='physical'?'Physical':m.damage_class?.name==='special'?'Special':'Status'):(m.damage_class?.name==='physical'?'Physisch':m.damage_class?.name==='special'?'Speziell':'Status');$('moveInfo').innerHTML=`<b>${dataName('move',id,m.name)||title(m.name)}</b> · ${type} · ${cls} · ${uiLang==='en'?'Power':'Stärke'}: ${m.power??'—'} · ${uiLang==='en'?'Accuracy':'Genauigkeit'}: ${m.accuracy??'—'}`;const entry=calcState.moves.find(x=>x.id===id);if(entry){entry.type=type;entry.cls=cls}}catch(e){$('moveInfo').textContent='Attackendaten konnten nicht geladen werden.'}}
const fieldEffects={none:{type:null},electric:{labelDe:'Elektrofeld',labelEn:'Electric Terrain',type:'electric',boost:1.3},grassy:{labelDe:'Grasfeld',labelEn:'Grassy Terrain',type:'grass',boost:1.3},psychic:{labelDe:'Psychofeld',labelEn:'Psychic Terrain',type:'psychic',boost:1.3},misty:{labelDe:'Nebelfeld',labelEn:'Misty Terrain',dragonReduction:.5}};
const fieldLabel=e=>e===fieldEffects.none?(uiLang==='en'?'No Terrain':'Kein Feld'):(uiLang==='en'?e.labelEn:e.labelDe);
const weatherEffects={none:{},sun:{labelDe:'Sonnenschein',labelEn:'Sun',boostType:'fire',boost:1.5,nerfType:'water',nerf:.5},rain:{labelDe:'Regen',labelEn:'Rain',boostType:'water',boost:1.5,nerfType:'fire',nerf:.5},sand:{labelDe:'Sandsturm',labelEn:'Sandstorm'},snow:{labelDe:'Schnee',labelEn:'Snow'}};
const weatherLabel=e=>e===weatherEffects.none?(uiLang==='en'?'No Weather':'Kein Wetter'):(uiLang==='en'?e.labelEn:e.labelDe);
function getSelectedField(){return fieldEffects[$('fieldStatus')?.value||'none']||fieldEffects.none}
function getSelectedWeather(){return weatherEffects[$('weatherStatus')?.value||'none']||weatherEffects.none}
function typeNameFromMove(m){return m.type?.name||''}
function terrainGrounded(p){
  // Flying-Pokémon erhalten keine Terrain-Boni. Eine spätere Ability-Auswahl kann
  // zusätzlich Levitate berücksichtigen; aktuell ist diese im Calculator nicht wählbar.
  return !(p?.types||[]).some(t=>t.type?.name==='flying');
}
function fieldWeatherPowerMultiplier(m,a,d){
  const field=getSelectedField(),weather=getSelectedWeather(),type=typeNameFromMove(m);
  let mult=1,notes=[];
  const groundedA=terrainGrounded(a),groundedD=terrainGrounded(d);
  if(groundedA&&field.type===type){mult*=field.boost;notes.push(`${fieldLabel(field)}: ×${field.boost}`)}
  if(field.dragonReduction===.5&&type==='dragon'&&groundedD){mult*=.5;notes.push('Nebelfeld: ×0,5 gegen Boden-Pokémon')}
  if(weather.boostType===type){mult*=weather.boost;notes.push(`${weatherLabel(weather)}: ×${weather.boost}`)}
  if(weather.nerfType===type){mult*=weather.nerf;notes.push(`${weatherLabel(weather)}: ×${weather.nerf}`)}
  const moveName=m.name||'';
  if(field.type&&groundedA&&moveName==='expanding-force'){mult*=1.5;notes.push('Expanding Force im Feld: ×1,5')}
  if(field.type&&groundedA&&moveName==='terrain-pulse'){mult*=2;notes.push('Terrain-Puls im Feld: ×2')}
  if(field.type==='misty'&&groundedA&&moveName==='misty-explosion'){mult*=1.5;notes.push('Misty Explosion im Nebelfeld: ×1,5')}
  if(field.type==='grassy'&&groundedD&&['earthquake','bulldoze','magnitude'].includes(moveName)){mult*=.5;notes.push('Grasfeld gegen Boden-Attacke: ×0,5')}
  return {mult,notes};
}
function applyWeatherDefense(m,d,defense,physical){
  const weather=getSelectedWeather();
  if(weather===weatherEffects.sand&&!physical&&(d.types||[]).some(t=>t.type?.name==='rock'))return Math.floor(defense*1.5);
  if(weather===weatherEffects.snow&&physical&&(d.types||[]).some(t=>t.type?.name==='ice'))return Math.floor(defense*1.5);
  return defense;
}
async function calculateDamage(){
 const a=calcState.attacker,d=calcState.defender,mid=calcState.selectedMove;
 if(!a||!d||!mid){$('damageResult').innerHTML=`<div class="damage-box">${uiLang==='en'?'Please select an attacker, defender and move.':'Bitte Angreifer, Verteidiger und Attacke auswählen.'}</div>`;return}
 try{
  const m=await json(`${API}/move/${mid}`);
  if(!m.power){$('damageResult').innerHTML=`<div class="damage-box">${uiLang==='en'?'This move has no fixed base power. No direct damage value is shown.':'Diese Attacke hat keinen festen Basiswert. Eine direkte Schadenszahl wird dafür nicht angezeigt.'}</div>`;return}
  const av=calcLevel50Stats(a,'atk'),dv=calcLevel50Stats(d,'def');
  const physical=m.damage_class?.name==='physical';
  const attack=av[physical?1:3];
  let defense=dv[physical?2:4];
  defense=applyWeatherDefense(m,d,defense,physical);
  let basePower=m.power;
  const fw=fieldWeatherPowerMultiplier(m,a,d);
  basePower=Math.floor(basePower*fw.mult);
  const base=Math.floor(Math.floor(Math.floor((2*50/5+2)*basePower*attack/Math.max(1,defense))/50)+2);
  const field=getSelectedField(),weather=getSelectedWeather();
  const notes=fw.notes.slice();
  if(weather===weatherEffects.sand&&!physical&&(d.types||[]).some(t=>t.type?.name==='rock'))notes.push('Sandsturm: +50% Sp. Verteidigung des Gestein-Pokémon');
  if(weather===weatherEffects.snow&&physical&&(d.types||[]).some(t=>t.type?.name==='ice'))notes.push('Schnee: +50% Verteidigung des Eis-Pokémon');
  const env=[fieldLabel(field),weatherLabel(weather)].filter(x=>x!==fieldLabel(fieldEffects.none)&&x!==weatherLabel(weatherEffects.none)).join(' · ');
  $('damageResult').innerHTML=`<div class="damage-box"><div class="damage-number">${base}</div><div class="damage-muted">${deM(mid)||title(m.name)} · ${uiLang==='en'?'preliminary base calculation':'vorläufige Basisberechnung'} · ${physical?(uiLang==='en'?'Physical':'physisch'):(uiLang==='en'?'Special':'speziell')}${env?' · '+env:''}</div>${notes.length?`<div class="damage-muted">${notes.join(' · ')}</div>`:''}</div>`;
 }catch(e){console.error(e);$('damageResult').innerHTML=`<div class="damage-box">${uiLang==='en'?'Calculation could not be completed.':'Berechnung konnte nicht durchgeführt werden.'}</div>`}
}
async function loadAllItems(){const d=await json(`${API}/item?limit=10000`);calcItems=d.results.map((x,i)=>{const id=i+1;return{id,name:title(x.name),raw:x.name}}).sort((a,b)=>a.name.localeCompare(b.name,'en'));}

function setupItemSearchV14(side){
  const input=$(side==='atk'?'atkItemSearch':'defItemSearch');
  const select=$(side==='atk'?'atkItem':'defItem');
  if(!input||!select)return;
  const all=Array.from(select.options).map(o=>({value:o.value,label:o.textContent}));
  function draw(){
    const q=input.value.trim().toLocaleLowerCase(uiLang==='de'?'de-DE':'en-US');
    Array.from(select.options).forEach(o=>{
      o.hidden=!!q&&!o.textContent.toLocaleLowerCase(uiLang==='de'?'de-DE':'en-US').includes(q);
    });
    const visible=Array.from(select.options).find(o=>!o.hidden);
    if(q&&visible) select.value=visible.value;
  }
  input.addEventListener('input',draw);
  input.addEventListener('focus',draw);
  select.addEventListener('change',()=>{
    const o=select.selectedOptions[0];
    if(o) input.value=o.textContent;
  });
}


async function switchCombatantsV14(){
 const oldA=calcState.attacker,oldD=calcState.defender;
 const oldAForms=calcState.forms.attacker,oldDForms=calcState.forms.defender;

 const pairs=[['atkNature','defNature'],['atkItem','defItem'],['atkItemSearch','defItemSearch'],['atkStatus','defStatus'],['atkBoost','defBoost'],['atkSpABoost','defSpDBoost'],['atkSpeedBoost','defSpeedBoost']];
 for(const [a,b] of pairs){const A=$(a),B=$(b);if(A&&B){const v=A.value;A.value=B.value;B.value=v}}
 for(const k of calcStatKeys){const A=$(`atk-${k}`),B=$(`def-${k}`);if(A&&B){const v=A.value;A.value=B.value;B.value=v}}

 calcState.attacker=oldD;calcState.defender=oldA;
 calcState.forms.attacker=oldDForms;calcState.forms.defender=oldAForms;
 calcState.selectedMove=null;calcState.moves=[];

 async function refresh(side,p){
  const key=side==='atk'?'attacker':'defender';
  const search=$(side==='atk'?'atkSearch':'defSearch');
  const form=$(side==='atk'?'atkForm':'defForm');
  if(!p){
   search.value='';form.innerHTML='<option>Erst Pokémon auswählen …</option>';form.disabled=true;
   calcState.forms[key]=[];updateCalcSide(side);return;
  }
  search.value=calcDisplayName(p);
  const speciesId=p.speciesId||rid(p.species?.url)||p.id;
  const species=await json(`${API}/pokemon-species/${speciesId}`);
  await loadCalcForms(side,species,p.id);
  calcState[key]=p;form.value=String(p.id);updateCalcSide(side);
 }
 try{
  await Promise.all([refresh('atk',calcState.attacker),refresh('def',calcState.defender)]);
  $('moveSearch').value='';$('moveSuggestions').innerHTML='';$('moveSuggestions').hidden=true;
  $('moveInfo').textContent=calcState.attacker?'Attacke suchen …':'Wähle zuerst einen Angreifer.';
  if(calcState.attacker)await loadCalcMoves();else $('moveSearch').disabled=true;
 }catch(e){console.error(e)}
}

function setupCalculator(){makeEVInputs('atk');makeEVInputs('def');fillOptions();
 setupSearchBox('atkSearch','atkSuggestions','atk',pokemonSearchItems,x=>selectCalcPokemon('atk',x));
 setupSearchBox('defSearch','defSuggestions','def',pokemonSearchItems,x=>selectCalcPokemon('def',x));
 setupSearchBox('moveSearch','moveSuggestions','move',moveSearchItems,x=>{calcState.selectedMove=x.id;$('moveSearch').value=x.label;$('moveSuggestions').hidden=true;showMoveInfoById(x.id)});
 ['atkNature','atkItem','atkStatus','atkBoost','atkSpABoost','atkSpeedBoost'].forEach(id=>$(id).addEventListener('change',()=>updateCalcSide('atk')));
 ['defNature','defItem','defStatus','defBoost','defSpDBoost','defSpeedBoost'].forEach(id=>$(id).addEventListener('change',()=>updateCalcSide('def')));
 $('atkForm').addEventListener('change',()=>changeCalcForm('atk',$('atkForm').value));$('defForm').addEventListener('change',()=>changeCalcForm('def',$('defForm').value));$('calcButton').addEventListener('click',calculateDamage);
 setupItemSearchV14('atk');setupItemSearchV14('def');$('switchCombatants').addEventListener('click',switchCombatantsV14);$('fieldStatus').addEventListener('change',()=>{if(calcState.selectedMove)showMoveInfoById(calcState.selectedMove)});$('weatherStatus').addEventListener('change',()=>{if(calcState.selectedMove)showMoveInfoById(calcState.selectedMove)});
}
async function init(){
 nav();setupCalculator();applyLanguage();$('languageSelect')?.addEventListener('change',e=>setLanguage(e.target.value));
 $('search').oninput=search;$('clear').onclick=()=>{$('search').value='';$('suggestions').innerHTML='';render(mons.slice(0,24));$('search').focus()};$('close').onclick=()=>{$('modal').hidden=true;document.body.style.overflow=''};$('backdrop').onclick=()=>{$('modal').hidden=true;document.body.style.overflow=''};document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('modal').hidden=true;document.body.style.overflow=''}});
 $('status').textContent=t('loading');
 loadLanguages().then(()=>{applyLanguage();if(mons.length)render(mons.slice(0,24))});
 json(`${API}/pokemon?limit=1025`).then(d=>{mons=d.results.map((p,i)=>({name:p.name,id:i+1}));$('status').textContent=uiLang==='en'?`${mons.length} Pokémon loaded`:`${mons.length} Pokémon geladen`;render(mons.slice(0,24));applyLanguage()}).catch(e=>{console.error(e);$('status').textContent=t('loadError')});
 loadAllItems().then(()=>{fillOptions();setupItemSearchV14('atk');setupItemSearchV14('def')}).catch(e=>console.warn('Items:',e));
}
init();
