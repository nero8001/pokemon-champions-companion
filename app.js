const API='https://pokeapi.co/api/v2';
const LOCAL='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/';
const sprite=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const shiny=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
const $=id=>document.getElementById(id);
let mons=[],current=null,isShiny=false;
const localized={de:{pokemon:{},move:{},ability:{},type:{},item:{},form:{}},en:{pokemon:{},move:{},ability:{},type:{},item:{},form:{}}};

function csvFields(line){const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='\"'){if(q&&line[i+1]==='\"'){cur+='\"';i++;}else q=!q}else if(c===','&&!q){out.push(cur);cur=''}else cur+=c}out.push(cur);return out}
async function loadLocalizedCSV(lang,kind,file,languageId){const r=await fetch(LOCAL+file);if(!r.ok)throw Error(r.status);const t=await r.text(),lines=t.split(/\r?\n/);for(let i=1;i<lines.length;i++){if(!lines[i])continue;const row=csvFields(lines[i]);if(row.length>=3&&row[1]===String(languageId))localized[lang][kind][row[0]]=row[2]}}
async function loadLanguages(){const files=[['pokemon','pokemon_species_names.csv'],['move','move_names.csv'],['ability','ability_names.csv'],['type','type_names.csv'],['item','item_names.csv'],['form','pokemon_form_names.csv']];await Promise.all(files.flatMap(([k,f])=>[loadLocalizedCSV('de',k,f,6),loadLocalizedCSV('en',k,f,9)]))}
function currentDataName(kind,id){return localized[uiLang]?.[kind]?.[String(id)]||localized.en?.[kind]?.[String(id)]||null}
const deP=id=>currentDataName('pokemon',id);
const deM=id=>currentDataName('move',id);
const deA=id=>currentDataName('ability',id);
const deT=id=>currentDataName('type',id);
const deI=id=>currentDataName('item',id);
const deF=id=>currentDataName('form',id);
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
function formDisplayName(fp,speciesId,speciesName){
  const base=currentDataName('pokemon',speciesId)||title(speciesName||fp.name);
  const raw=String(fp.name||'').toLowerCase();
  const speciesRaw=String(speciesName||'').toLowerCase();
  if(raw===speciesRaw || raw===speciesRaw+'-normal') return base;
  let suffix=raw.startsWith(speciesRaw+'-')?raw.slice(speciesRaw.length+1):raw;
  if(!suffix || suffix==='normal') return base;
  const direct={
    'mega':'Mega','mega-x':'Mega X','mega-y':'Mega Y','gmax':'Gigadynamax',
    'alola':'Alola-Form','galar':'Galar-Form','hisui':'Hisui-Form','paldea':'Paldea-Form',
    'origin':'Urform','altered':'Wandelform','therian':'Tiergeistform','incarnate':'Inkarnationsform',
    'resolute':'Resolutform','ordinary':'Normalform','pirouette':'Pirouettenform','school':'Schwarmform',
    'solo':'Solokämpferform','midday':'Tagform','midnight':'Nachtform','dusk':'Zwielichtform','dawn':'Morgenform',
    'sunny':'Sonnenform','rainy':'Regenform','snowy':'Schneeflockenform','heat':'Hitzemodul','wash':'Waschmodul',
    'frost':'Gefriermodul','fan':'Ventilatormodul','mow':'Rasenmähermodul','blade':'Klingenform','shield':'Schildform',
    'complete':'Komplettform','10':'10%-Form','50':'50%-Form','100':'100%-Form','small':'Kleinform','large':'Großform',
    'gulping':'Schlingform','gorging':'Stopfform','hangry':'Heißhungerform','low-key':'Low-Key-Form','amped':'High-Voltage-Form',
    'crowned':'Kronenform','crown':'Kronenform','hero':'Heldenform','bloodmoon':'Blutmondform','teal':'Türkisform',
    'wellspring':'Quellform','wells':'Quellform','hearthflame':'Ofenform','cornerstone':'Felsform','artful':'Prunkform',
    'combat':'Kampfgestalt','water':'Wasserform','fire':'Feuerform','ice':'Eisform','stellar':'Sternenform'
  };
  if(suffix.startsWith('mega-')) return `Mega ${base} ${title(suffix.slice(5))}`;
  if(suffix.startsWith('gmax-')) return `Gigadynamax ${base}`;
  if(direct[suffix]) return `${direct[suffix]} ${base}`;
  return `${base} – ${title(suffix)}`;
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
async function json(u){const r=await fetch(u);if(!r.ok)throw Error(r.status);return r.json()}

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
function natureOptionsHtml(selected=0){return natureData.map((n,i)=>`<option value="${i}" ${i===Number(selected)?'selected':''}>${natureLabel(n)}</option>`).join('')}
function maxStatsHtml(p){
  const vals=maxLevel50Stats(p,0);
  return `<div class="maxstats" id="maxStatsBox">${vals.map((v,i)=>`<div class="maxstat"><span>${calcStatLabels[i]}</span><b id="dexMaxStat${i}">${v}</b></div>`).join('')}</div>`;
}
async function detail(p,s){
  const pname=currentDataName('pokemon',p.id)||title(p.name);const abilities=await Promise.all(p.abilities.map(async x=>currentDataName('ability',rid(x.ability.url))||title(x.ability.name)));
  const grouped={};p.moves.forEach(x=>(x.version_group_details||[]).forEach(v=>{let key='Weitere';const m=v.move_learn_method?.name;if(m==='level-up')key='Durch Levelaufstieg';else if(m==='machine')key='TM / VM';else if(m==='tutor')key='Attacken-Lehrer';else if(m==='egg')key='Ei-Attacke';else if(m==='stadium-surfing-pikachu')key='Spezial';if(!grouped[key])grouped[key]=[];const entry={id:rid(x.move.url),name:x.move.name,level:v.level_learned_at||0};if(!grouped[key].some(a=>a.id===entry.id))grouped[key].push(entry)}));
  let moveHtml='';for(const group of ['Durch Levelaufstieg','TM / VM','Attacken-Lehrer','Ei-Attacke','Spezial','Weitere']){if(!grouped[group])continue;const entries=await Promise.all(grouped[group].map(async m=>({...m,de:currentDataName('move',m.id)||title(m.name)})));entries.sort((a,b)=>group==='Durch Levelaufstieg'?(a.level-b.level||a.de.localeCompare(b.de,'de')):a.de.localeCompare(b.de,'de'));moveHtml+=`<div class="move-group"><h4>${group} <span class="move-meta">(${entries.length})</span></h4><div class="move-list">${entries.map(m=>`<div class="move-item"><span class="move-name">${m.de}</span>${group==='Durch Levelaufstieg'?`<span class="move-meta">Lv. ${m.level}</span>`:''}</div>`).join('')}</div></div>`}
  const flavor=(s.flavor_text_entries||[]).find(x=>x.language?.name==='de'),genus=(s.genera||[]).find(x=>x.language?.name==='de');
  const stats=p.stats.map(x=>`<div class="stat"><span>${({hp:'KP',attack:'Angriff',defense:'Verteidigung','special-attack':'Sp. Angriff','special-defense':'Sp. Verteidigung',speed:'Initiative'})[x.stat.name]}</span><div class="bar"><i style="width:${Math.min(100,x.base_stat/2)}%"></i></div><b>${x.base_stat}</b></div>`).join('');
  const forms=s.varieties.map(v=>{const id=rid(v.pokemon.url);const name=formDisplayName({name:v.pokemon.name},s.id,s.name);return `<button type="button" class="form-choice ${Number(id)===Number(p.id)?'active':''}" data-form-url="${v.pokemon.url}" data-form-id="${id}"><img src="${sprite(id)}" alt=""><span>${name}</span></button>`}).join('');
  const types=p.types.map(t=>`<span class="pill">${currentDataName('type',rid(t.type.url))||title(t.type.name)}</span>`).join('');
  const relations=await getTypeRelations(p);
  $('modalbody').innerHTML=`<div class="detail"><div class="detailpic"><img id="ds" src="${isShiny?shiny(p.id):sprite(p.id)}" alt="${pname}"></div><div><h2>${pname}</h2><div>#${String(p.id).padStart(4,'0')} · ${p.height/10} m · ${p.weight/10} kg</div><p>${types}</p><button id="sh" class="pill ${isShiny?'active':''}">✨ Shiny</button></div></div><div class="section"><h3>Form auswählen</h3><div class="form-buttons" id="forms">${forms||'—'}</div></div><div class="section"><h3>Stärken & Schwächen</h3><div class="relation-grid"><div><strong>Stärken / Resistenzen</strong><div>${relationPills(relations.resist,true)}</div></div><div><strong>Schwächen</strong><div>${relationPills(relations.weak,true)}</div></div><div><strong>Immunitäten</strong><div>${relationPills(relations.immune)}</div></div></div></div><div class="section"><h3>Pokédex-Beschreibung</h3><p class="description">${flavor?flavor.flavor_text.replace(/[\n\f]/g,' '):'Keine deutsche Beschreibung vorhanden.'}</p>${genus?`<p class="flavor">${genus.genus}</p>`:''}</div><div class="section"><h3>Fähigkeiten</h3><p>${abilities.join(', ')||'—'}</p></div><div class="section"><h3>Basiswerte</h3>${stats}</div><div class="section"><h3>Maximalwerte auf Level 50</h3><p class="muted">IV 31 · 252 EVs im jeweiligen Statuswert · ohne Item- oder Kampfboni</p><label class="nature-inline">Wesen<select id="dexNature">${natureOptionsHtml(0)}</select></label>${maxStatsHtml(p)}</div><div class="section"><h3>Attacken</h3><div class="move-groups">${moveHtml||'<p>Keine Attacken gefunden.</p>'}</div></div>`;
  $('sh').onclick=()=>{isShiny=!isShiny;$('ds').src=isShiny?shiny(p.id):sprite(p.id);$('sh').classList.toggle('active',isShiny)};
  document.querySelectorAll('#forms .form-choice').forEach(btn=>btn.onclick=async()=>{try{const fp=await json(btn.dataset.formUrl);current={p:fp,s};isShiny=false;await detail(fp,s)}catch(e){console.error(e)}})
  $('dexNature').addEventListener('change',()=>{
    const vals=maxLevel50Stats(p,$('dexNature').value);
    vals.forEach((v,i)=>$(`dexMaxStat${i}`).textContent=v);
  });
}

function calcEV(side){const t=calcStatKeys.reduce((a,k)=>a+(Math.max(0,Math.min(32,+($(`${side}-${k}`).value)||0))),0);$(`${side}Total`).textContent=`Statuswertpunkte: ${t} / 66`;$(`${side}Total`).style.color=t>66?'#ff9a9a':''}
const natureData=[['Hart','atk','spa'],['Solo','atk','def'],['Mutig','atk','spe'],['Frech','atk','spd'],['Brav','atk','spe'],['Kühn','def','atk'],['Pfiffig','def','spa'],['Locker','def','spe'],['Lasch','def','spd'],['Mäßig','spa','atk'],['Mild','spa','def'],['Ruhig','spa','spe'],['Hitzig','spa','spd'],['Still','spd','atk'],['Zart','spd','def'],['Sacht','spd','spa'],['Forsch','spd','spe'],['Scheu','spe','atk'],['Hastig','spe','def'],['Froh','spe','spa'],['Naiv','spe','spd'],['Ernst','neutral','neutral'],['Kauzig','neutral','neutral'],['Robust','neutral','neutral'],['Zaghaft','neutral','neutral'],['Doche','neutral','neutral']];
const natureStatLabels={atk:'Angriff',def:'Verteidigung',spa:'Sp. Angriff',spd:'Sp. Verteidigung',spe:'Initiative',neutral:'neutral'};
function natureLabel(n){
  const name=n[0],up=natureStatLabels[n[1]]||n[1],down=natureStatLabels[n[2]]||n[2];
  return n[1]==='neutral' ? `${name} (neutral)` : `${name} (+${up}, −${down})`;
}

const calcStatKeys=['hp','atk','def','spa','spd','spe'];const calcStatLabels=['KP','Angriff','Verteidigung','Sp. Angriff','Sp. Verteidigung','Initiative'];
const calcStatuses=['Keine','Schlaf','Gift','Schwere Vergiftung','Verbrennung','Paralyse','Eingefroren'];const stages=['0','+1','+2','+3','+4','+5','+6'];
let calcItems=[];
function makeEVInputs(side){const target=$(side==='atk'?'atkEV':'defEV');target.innerHTML=calcStatKeys.map((k,i)=>`<label>${calcStatLabels[i]}<input id="${side}-${k}" type="number" min="0" max="32" step="1" value="0"></label>`).join('');calcStatKeys.forEach(k=>$(`${side}-${k}`).addEventListener('input',()=>{calcEV(side);updateCalcSide(side)}))}
function fillOptions(){const nat=natureData.map((n,i)=>`<option value="${i}">${natureLabel(n)}</option>`).join('');$('atkNature').innerHTML=nat;$('defNature').innerHTML=nat;const items=calcItems.map(x=>`<option value="${x.id}">${x.name}</option>`).join('');$('atkItem').innerHTML=items;$('defItem').innerHTML=items;['atkStatus','defStatus'].forEach(id=>$(id).innerHTML=calcStatuses.map(x=>`<option>${x}</option>`).join(''));['atkBoost','atkSpABoost','atkSpeedBoost','defBoost','defSpDBoost','defSpeedBoost'].forEach(id=>$(id).innerHTML=stages.map(x=>`<option>${x}</option>`).join(''))}
function natureMultiplier(index,key){const n=natureData[Number(index)||0];return n[1]===key?1.1:n[2]===key?.9:1}
function calcLevel50Stats(p,side){const vals=[];const nature=$(side==='atk'?'atkNature':'defNature').value;calcStatKeys.forEach((key,i)=>{const base=p.stats[i]?.base_stat||0,sp=Math.max(0,Math.min(32,Number($(`${side}-${key}`).value)||0));if(i===0)vals.push(base+sp+75);else vals.push(Math.floor((base+sp+20)*natureMultiplier(nature,key)))});return vals}
function updateCalcSide(side){const p=calcState[side==='atk'?'attacker':'defender'];const box=$(side==='atk'?'attackerPreview':'defenderPreview');if(!p){box.textContent=T('noPokemon');calcEV(side);return}const vals=calcLevel50Stats(p,side);box.innerHTML=`<img src="${sprite(p.id)}" alt=""><div><b>${calcDisplayName(p)}</b><div class="statsline">${vals.map((v,i)=>`${calcStatLabels[i]} ${v}`).join(' · ')}</div></div>`;calcEV(side)}
function calcDisplayName(p){return p._formName||deP(p.speciesId||p.id)||title(p.name)}

function setupSearchBox(inputId,listId,side,itemsProvider,onPick){const input=$(inputId),list=$(listId);let lastItems=[];function draw(items){lastItems=items.slice(0,12);list.innerHTML=lastItems.map((x,i)=>`<button type="button" class="calc-suggest" data-index="${i}"><img src="${sprite(x.id)}" alt=""><span>${x.label}<small>${x.meta||''}</small></span></button>`).join('');list.hidden=!lastItems.length;list.querySelectorAll('button').forEach(b=>b.onclick=()=>{const x=lastItems[+b.dataset.index];input.value=x.label;list.hidden=true;onPick(x)})}
 input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();if(!q){draw(itemsProvider().slice(0,12));return}draw(itemsProvider().filter(x=>x.label.toLowerCase().includes(q)||x.name.toLowerCase().includes(q)||String(x.id)===q).slice(0,12))});input.addEventListener('focus',()=>{const q=input.value.trim().toLowerCase();draw(q?itemsProvider().filter(x=>x.label.toLowerCase().includes(q)||x.name.toLowerCase().includes(q)||String(x.id)===q):itemsProvider().slice(0,12))});document.addEventListener('click',e=>{if(e.target!==input&&!list.contains(e.target))list.hidden=true})}
function pokemonSearchItems(){return mons.map(p=>({id:p.id,name:p.name,label:currentDataName('pokemon',p.id)||title(p.name),meta:`#${String(p.id).padStart(4,'0')}`}))}
function moveSearchItems(){return calcState.moves.map(m=>({id:m.id,name:m.name,label:m.label,meta:`${m.type||''} · ${m.cls||''}`}))}
async function selectCalcPokemon(side,item){
 const key=side==='atk'?'attacker':'defender',search=$(`${side}Search`);
 try{
  search.disabled=true;
  const p=await json(`${API}/pokemon/${item.id}`);
  const speciesId=rid(p.species?.url)||item.id;
  const species=await json(`${API}/pokemon-species/${speciesId}`);
  p.speciesId=speciesId;p._formName=currentDataName('pokemon',speciesId)||item.label;
  calcState[key]=p;
  search.value=calcDisplayName(p);
  updateCalcSide(side);
  await loadCalcForms(side,species,p.id);
  if(side==='atk')await loadCalcMoves();
 }catch(e){console.error(e)}
 finally{search.disabled=false}
}
async function loadCalcForms(side,species,selectedId){
 const key=side==='atk'?'attacker':'defender',forms=[];
 for(const v of species.varieties||[]){
  const id=rid(v.pokemon.url);if(!id)continue;
  try{const fp=await json(v.pokemon.url);fp.speciesId=species.id;fp._formName=formDisplayName(fp,species.id,species.name);forms.push(fp)}catch(e){}
 }
 calcState.forms[key]=forms;
 const sel=$(side==='atk'?'atkForm':'defForm');
 sel.innerHTML=forms.map(fp=>`<option value="${fp.id}">${fp._formName}</option>`).join('');
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
async function loadCalcMoves(){const p=calcState.attacker;const input=$('moveSearch');calcState.moves=[];$('moveSuggestions').innerHTML='';$('moveInfo').textContent=p?'Attacke suchen …':'Wähle zuerst einen Angreifer.';if(!p)return;try{const data=await json(`${API}/pokemon/${p.id}`),seen=new Set();for(const x of data.moves||[]){const id=rid(x.move.url);if(!id||seen.has(id))continue;seen.add(id);let info={id,name:x.move.name,label:currentDataName('move',id)||title(x.move.name),type:'',cls:''};calcState.moves.push(info)}calcState.moves.sort((a,b)=>a.label.localeCompare(b.label,'de'));input.disabled=false;input.placeholder=T('attackSearch');input.value='';}catch(e){input.disabled=true;input.placeholder='Attacken konnten nicht geladen werden'}}
async function showMoveInfoById(id){if(!id)return;calcState.selectedMove=id;try{const m=await json(`${API}/move/${id}`);const type=deT(rid(m.type?.url))||title(m.type?.name||'—');const cls=m.damage_class?.name==='physical'?'Physisch':m.damage_class?.name==='special'?'Speziell':'Status';$('moveInfo').innerHTML=`<b>${deM(id)||title(m.name)}</b> · ${type} · ${cls} · Stärke: ${m.power??'—'} · Genauigkeit: ${m.accuracy??'—'}`;const entry=calcState.moves.find(x=>x.id===id);if(entry){entry.type=type;entry.cls=cls}}catch(e){$('moveInfo').textContent='Attackendaten konnten nicht geladen werden.'}}
const fieldEffects={
  none:{label:'Kein Feld'},
  electric:{label:'Elektrofeld',type:'electric',boost:1.3},
  grassy:{label:'Grasfeld',type:'grass',boost:1.3},
  psychic:{label:'Psychofeld',type:'psychic',boost:1.3},
  misty:{label:'Nebelfeld',dragonReduction:.5}
};
const weatherEffects={
  none:{label:'Kein Wetter'},
  sun:{label:'Sonnenschein',boostType:'fire',boost:1.5,nerfType:'water',nerf:.5},
  rain:{label:'Regen',boostType:'water',boost:1.5,nerfType:'fire',nerf:.5},
  sand:{label:'Sandsturm'},
  snow:{label:'Schnee'}
};
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
  if(groundedA&&field.type===type){mult*=field.boost;notes.push(`${field.label}: ×${field.boost}`)}
  if(field.dragonReduction===.5&&type==='dragon'&&groundedD){mult*=.5;notes.push('Nebelfeld: ×0,5 gegen Boden-Pokémon')}
  if(weather.boostType===type){mult*=weather.boost;notes.push(`${weather.label}: ×${weather.boost}`)}
  if(weather.nerfType===type){mult*=weather.nerf;notes.push(`${weather.label}: ×${weather.nerf}`)}
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
 if(!a||!d||!mid){$('damageResult').innerHTML='<div class="damage-box">Bitte Angreifer, Verteidiger und Attacke auswählen.</div>';return}
 try{
  const m=await json(`${API}/move/${mid}`);
  if(!m.power){$('damageResult').innerHTML='<div class="damage-box">Diese Attacke hat keinen festen Basiswert. Eine direkte Schadenszahl wird dafür nicht angezeigt.</div>';return}
  const av=calcLevel50Stats(a,'atk'),dv=calcLevel50Stats(d,'def');
  const physical=m.damage_class?.name==='physical';
  const attack=av[physical?1:3];
  let defense=dv[physical?2:4];
  defense=applyWeatherDefense(m,d,defense,physical);
  let basePower=m.power;
  const fw=fieldWeatherPowerMultiplier(m,a,d);
  basePower=Math.floor(basePower*fw.mult);
  let base=Math.floor(Math.floor(Math.floor((2*50/5+2)*basePower*attack/Math.max(1,defense))/50)+2);
  const field=getSelectedField(),weather=getSelectedWeather();
  const notes=fw.notes.slice();
  if(weather===weatherEffects.sand&&!physical&&(d.types||[]).some(t=>t.type?.name==='rock'))notes.push('Sandsturm: +50% Sp. Verteidigung des Gestein-Pokémon');
  if(weather===weatherEffects.snow&&physical&&(d.types||[]).some(t=>t.type?.name==='ice'))notes.push('Schnee: +50% Verteidigung des Eis-Pokémon');
  const hp=Math.max(1,dv[0]);
  const pct=Math.min(100,Math.max(0,(base/hp)*100));
  const remaining=Math.max(0,hp-base);
  const label=currentDataName('move',mid)||title(m.name);
  const env=[field.label,weather.label].filter(x=>x!=='Kein Feld'&&x!=='Kein Wetter').join(' · ');
  $('damageResult').innerHTML=`<div class="damage-box">
   <div class="damage-number">${base} KP</div>
   <div class="damage-percent">${pct.toFixed(1).replace('.',',')} % Schaden</div>
   <div class="hpbar-wrap"><div class="hpbar"><div class="hpbar-fill" style="width:${Math.max(0,100-pct)}%"></div></div><div class="hpbar-label">${remaining} / ${hp} KP verbleibend</div></div>
   <div class="damage-muted">${label} · vorläufige Basisberechnung · ${physical?'physisch':'speziell'}${env?' · '+env:''}</div>
   ${notes.length?`<div class="damage-muted">${notes.join(' · ')}</div>`:''}
  </div>`;
 }catch(e){console.error(e);$('damageResult').innerHTML='<div class="damage-box">Berechnung konnte nicht durchgeführt werden.</div>'}
}
async function loadAllItems(){const d=await json(`${API}/item?limit=10000`);calcItems=d.results.map((x,i)=>{const id=i+1;return{id,name:currentDataName('item',id)||title(x.name),raw:x.name}}).sort((a,b)=>a.name.localeCompare(b.name,'de'));}

function setupItemSearchV14(side){
  const input=$(side==='atk'?'atkItemSearch':'defItemSearch');
  const select=$(side==='atk'?'atkItem':'defItem');
  if(!input||!select)return;
  const all=Array.from(select.options).map(o=>({value:o.value,label:o.textContent}));
  function draw(){
    const q=input.value.trim().toLocaleLowerCase();
    Array.from(select.options).forEach(o=>{
      o.hidden=!!q&&!o.textContent.toLocaleLowerCase().includes(q);
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
   search.value='';form.innerHTML=`<option>${T('choosePokemon')}</option>`;form.disabled=true;
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

/* ---------- UI language ---------- */
const UI_LANG_KEY='pcc-language';
let uiLang=localStorage.getItem(UI_LANG_KEY)||'de';

const UI_TEXT={
 de:{
  navDex:'Pokédex',navCalc:'Battle Calculator',searchLabel:'Pokémon suchen',search:'Name oder Pokédex-Nummer',
  attacker:'Angreifer',defender:'Verteidiger',form:'Form',nature:'Wesen',item:'Item',
  attack:'Attacke',attackSearch:'Attacke suchen …',noPokemon:'Noch kein Pokémon ausgewählt.',
  choosePokemon:'Erst Pokémon auswählen …',chooseAttacker:'Wähle einen Angreifer und danach eine Attacke.',
  chooseFirst:'Wähle zuerst einen Angreifer.',ev:'Statuswertpunkte-Verteilung',
  total:'Statuswertpunkte gesamt',status:'Status',attackStat:'Angriff',defStat:'Verteidigung',
  spAttack:'Sp. Angriff',spDefense:'Sp. Verteidigung',speed:'Initiative',hp:'KP',
  switch:'Switch',calculate:'Attacke',language:'Sprache / Language',
  preliminary:'Die Schadensberechnung bleibt bis zum verifizierten Champions-Regelsatz vorläufig.',
  damage:'Schaden',remaining:'KP verbleibend',percent:'% Schaden',
  neutral:'neutral',plus:'+',minus:'−',none:'Keine',
  weather:'Wetter',terrain:'Feldstatus',noWeather:'Kein Wetter',noTerrain:'Kein Feld',
  sun:'Sonnenschein',rain:'Regen',sand:'Sandsturm',snow:'Schnee',
  electricTerrain:'Elektrofeld',grassTerrain:'Grasfeld',psychicTerrain:'Psychofeld',mistyTerrain:'Nebelfeld'
 },
 en:{
  navDex:'Pokédex',navCalc:'Battle Calculator',searchLabel:'Search Pokémon',search:'Name or Pokédex number',
  attacker:'Attacker',defender:'Defender',form:'Form',nature:'Nature',item:'Item',
  attack:'Move',attackSearch:'Search move …',noPokemon:'No Pokémon selected yet.',
  choosePokemon:'Select a Pokémon first …',chooseAttacker:'Choose an attacker and then a move.',
  chooseFirst:'Choose an attacker first.',ev:'Stat Point Distribution',
  total:'Stat Points total',status:'Status',attackStat:'Attack',defStat:'Defense',
  spAttack:'Sp. Atk',spDefense:'Sp. Def',speed:'Speed',hp:'HP',
  switch:'Switch',calculate:'Move',language:'Language / Sprache',
  preliminary:'The damage calculation remains preliminary until the verified Champions ruleset is available.',
  damage:'Damage',remaining:'HP remaining',percent:'% damage',
  neutral:'neutral',plus:'+',minus:'−',none:'None',
  weather:'Weather',terrain:'Terrain',noWeather:'No weather',noTerrain:'No terrain',
  sun:'Sun',rain:'Rain',sand:'Sandstorm',snow:'Snow',
  electricTerrain:'Electric Terrain',grassTerrain:'Grassy Terrain',psychicTerrain:'Psychic Terrain',mistyTerrain:'Misty Terrain'
 }
};
function T(k){return (UI_TEXT[uiLang]||UI_TEXT.de)[k]||k}
function fillNatureLabel(n){
 const stat={atk:T('attackStat'),def:T('defStat'),spa:T('spAttack'),spd:T('spDefense'),spe:T('speed')};
 return n[1]==='neutral'?`${n[0]} (${T('neutral')})`:`${n[0]} (${T('plus')}${stat[n[1]]}, ${T('minus')}${stat[n[2]]})`;
}
function applyLanguage(){
 document.documentElement.lang=uiLang;
 const s=$('languageSelect');if(s)s.value=uiLang;
 // Static navigation/headings.
 document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=T(el.dataset.i18n));
 const q=(id,k)=>{const e=$(id);if(e)e.textContent=T(k)};
 const ph=(id,k)=>{const e=$(id);if(e)e.placeholder=T(k)};
 ph('search','search');ph('atkSearch','search');ph('defSearch','search');ph('moveSearch','attackSearch');
 ph('atkItemSearch','item');ph('defItemSearch','item');
 q('switchCombatants','switch');q('calcButton','calculate');
 document.querySelectorAll('#attackerCard h2').forEach(e=>e.textContent=T('attacker'));
 document.querySelectorAll('#defenderCard h2').forEach(e=>e.textContent=T('defender'));
 // Translate common labels by their visible text.
 const labelMap={
  'Pokémon suchen':'search','Pokémon search':'search','Form':'form','Wesen':'nature','Nature':'nature',
  'Item':'item','Attacke suchen':'attackSearch','Attacke':'attack','Status':'status',
  'EV-Verteilung':'ev','EV Distribution':'ev'
 };
 document.querySelectorAll('label,h3').forEach(el=>{
   const raw=el.childNodes[0]?.textContent?.trim();
   if(raw&&labelMap[raw]) el.childNodes[0].textContent=T(labelMap[raw])+' ';
 });
 if(typeof fillOptions==='function') fillOptions();
 if(typeof updateCalcSide==='function'){updateCalcSide('atk');updateCalcSide('def')}
}
function setLanguage(lang){
 uiLang=lang==='en'?'en':'de';localStorage.setItem(UI_LANG_KEY,uiLang);applyLanguage();
}
document.addEventListener('DOMContentLoaded',()=>{
 const s=$('languageSelect');if(s)s.addEventListener('change',()=>setLanguage(s.value));
 setTimeout(applyLanguage,0);
});

async function init(){
 nav();
 $('search').oninput=search;
 $('clear').onclick=()=>{$('search').value='';$('suggestions').innerHTML='';render(mons.slice(0,24));$('search').focus()};
 $('close').onclick=()=>{$('modal').hidden=true;document.body.style.overflow=''};
 $('backdrop').onclick=()=>{$('modal').hidden=true;document.body.style.overflow=''};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('modal').hidden=true;document.body.style.overflow=''}});
 const languageSelect=$('languageSelect');
 if(languageSelect)languageSelect.onchange=()=>setLanguage(languageSelect.value);
 try{
   const d=await json(`${API}/pokemon?limit=1025`);
   mons=d.results.map((p,i)=>({name:p.name,id:i+1}));
   // The app remains usable even if a localization source is temporarily unavailable.
   try{await loadLanguages()}catch(e){console.warn('Localization data unavailable:',e)}
   try{await loadAllItems()}catch(e){console.warn('Item data unavailable:',e)}
   render(mons.slice(0,24));
   setupCalculator();
   applyLanguage();
   $('status').textContent=`${mons.length} ${T('loaded')}`;
 }catch(e){console.error(e);$('status').textContent=T('loadError')}
}
init();
