const API='https://pokeapi.co/api/v2';
const LOCAL='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/';
const sprite=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const shiny=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
const $=id=>document.getElementById(id);
let mons=[],current=null,isShiny=false;
const german={pokemon:{},move:{},ability:{},type:{},item:{},form:{}};
const calcState={attacker:null,defender:null,forms:{attacker:[],defender:[]},moves:[],selectedMove:null};

function csvFields(line){const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q}else if(c===','&&!q){out.push(cur);cur=''}else cur+=c}out.push(cur);return out}
async function loadCSV(kind,file){const r=await fetch(LOCAL+file);if(!r.ok)throw Error(r.status);const t=await r.text(),lines=t.split(/\r?\n/);for(let i=1;i<lines.length;i++){if(!lines[i])continue;const row=csvFields(lines[i]);if(row.length>=3&&row[1]==='6')german[kind][row[0]]=row[2]}}
async function loadGerman(){await Promise.all([
  loadCSV('pokemon','pokemon_species_names.csv'),loadCSV('move','move_names.csv'),loadCSV('ability','ability_names.csv'),
  loadCSV('type','type_names.csv'),loadCSV('item','item_names.csv'),loadCSV('form','pokemon_form_names.csv')
])}
const deP=id=>german.pokemon[String(id)]||null;
const deM=id=>german.move[String(id)]||null;
const deA=id=>german.ability[String(id)]||null;
const deT=id=>german.type[String(id)]||null;
const deI=id=>german.item[String(id)]||null;
const deF=id=>german.form[String(id)]||null;
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
  const base=deP(speciesId)||speciesName||title(fp.name);
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
function natureOptionsHtml(selected=0){return natureData.map((n,i)=>`<option value="${i}" ${i===Number(selected)?'selected':''}>${n[0]}</option>`).join('')}
function maxStatsHtml(p){
  const vals=maxLevel50Stats(p,0);
  return `<div class="maxstats" id="maxStatsBox">${vals.map((v,i)=>`<div class="maxstat"><span>${calcStatLabels[i]}</span><b id="dexMaxStat${i}">${v}</b></div>`).join('')}</div>`;
}
async function detail(p,s){
  const pname=deP(p.id)||deF(p.id)||title(p.name);const abilities=await Promise.all(p.abilities.map(async x=>deA(rid(x.ability.url))||title(x.ability.name)));
  const grouped={};p.moves.forEach(x=>(x.version_group_details||[]).forEach(v=>{let key='Weitere';const m=v.move_learn_method?.name;if(m==='level-up')key='Durch Levelaufstieg';else if(m==='machine')key='TM / VM';else if(m==='tutor')key='Attacken-Lehrer';else if(m==='egg')key='Ei-Attacke';else if(m==='stadium-surfing-pikachu')key='Spezial';if(!grouped[key])grouped[key]=[];const entry={id:rid(x.move.url),name:x.move.name,level:v.level_learned_at||0};if(!grouped[key].some(a=>a.id===entry.id))grouped[key].push(entry)}));
  let moveHtml='';for(const group of ['Durch Levelaufstieg','TM / VM','Attacken-Lehrer','Ei-Attacke','Spezial','Weitere']){if(!grouped[group])continue;const entries=await Promise.all(grouped[group].map(async m=>({...m,de:deM(m.id)||title(m.name)})));entries.sort((a,b)=>group==='Durch Levelaufstieg'?(a.level-b.level||a.de.localeCompare(b.de,'de')):a.de.localeCompare(b.de,'de'));moveHtml+=`<div class="move-group"><h4>${group} <span class="move-meta">(${entries.length})</span></h4><div class="move-list">${entries.map(m=>`<div class="move-item"><span class="move-name">${m.de}</span>${group==='Durch Levelaufstieg'?`<span class="move-meta">Lv. ${m.level}</span>`:''}</div>`).join('')}</div></div>`}
  const flavor=(s.flavor_text_entries||[]).find(x=>x.language?.name==='de'),genus=(s.genera||[]).find(x=>x.language?.name==='de');
  const stats=p.stats.map(x=>`<div class="stat"><span>${({hp:'KP',attack:'Angriff',defense:'Verteidigung','special-attack':'Sp. Angriff','special-defense':'Sp. Verteidigung',speed:'Initiative'})[x.stat.name]}</span><div class="bar"><i style="width:${Math.min(100,x.base_stat/2)}%"></i></div><b>${x.base_stat}</b></div>`).join('');
  const forms=s.varieties.map(v=>{const id=rid(v.pokemon.url);const name=formDisplayName({name:v.pokemon.name},s.id,s.name);return `<button type="button" class="form-choice ${Number(id)===Number(p.id)?'active':''}" data-form-url="${v.pokemon.url}" data-form-id="${id}"><img src="${sprite(id)}" alt=""><span>${name}</span></button>`}).join('');
  const types=p.types.map(t=>`<span class="pill">${deT(rid(t.type.url))||title(t.type.name)}</span>`).join('');
  const relations=await getTypeRelations(p);
  $('modalbody').innerHTML=`<div class="detail"><div class="detailpic"><img id="ds" src="${isShiny?shiny(p.id):sprite(p.id)}" alt="${pname}"></div><div><h2>${pname}</h2><div>#${String(p.id).padStart(4,'0')} · ${p.height/10} m · ${p.weight/10} kg</div><p>${types}</p><button id="sh" class="pill ${isShiny?'active':''}">✨ Shiny</button></div></div><div class="section"><h3>Form auswählen</h3><div class="form-buttons" id="forms">${forms||'—'}</div></div><div class="section"><h3>Stärken & Schwächen</h3><div class="relation-grid"><div><strong>Stärken / Resistenzen</strong><div>${relationPills(relations.resist,true)}</div></div><div><strong>Schwächen</strong><div>${relationPills(relations.weak,true)}</div></div><div><strong>Immunitäten</strong><div>${relationPills(relations.immune)}</div></div></div></div><div class="section"><h3>Pokédex-Beschreibung</h3><p class="description">${flavor?flavor.flavor_text.replace(/[\n\f]/g,' '):'Keine deutsche Beschreibung vorhanden.'}</p>${genus?`<p class="flavor">${genus.genus}</p>`:''}</div><div class="section"><h3>Fähigkeiten</h3><p>${abilities.join(', ')||'—'}</p></div><div class="section"><h3>Basiswerte</h3>${stats}</div><div class="section"><h3>Maximalwerte auf Level 50</h3><p class="muted">IV 31 · 252 EVs im jeweiligen Statuswert · ohne Item- oder Kampfboni</p><label class="nature-inline">Wesen<select id="dexNature">${natureOptionsHtml(0)}</select></label>${maxStatsHtml(p)}</div><div class="section"><h3>Attacken</h3><div class="move-groups">${moveHtml||'<p>Keine Attacken gefunden.</p>'}</div></div>`;
  $('sh').onclick=()=>{isShiny=!isShiny;$('ds').src=isShiny?shiny(p.id):sprite(p.id);$('sh').classList.toggle('active',isShiny)};
  document.querySelectorAll('#forms .form-choice').forEach(btn=>btn.onclick=async()=>{try{const fp=await json(btn.dataset.formUrl);current={p:fp,s};isShiny=false;await detail(fp,s)}catch(e){console.error(e)}})
  $('dexNature').addEventListener('change',()=>{
    const vals=maxLevel50Stats(p,$('dexNature').value);
    vals.forEach((v,i)=>$(`dexMaxStat${i}`).textContent=v);
  });
}

function calcEV(side){const t=calcStatKeys.reduce((a,k)=>a+(+($(`${side}-${k}`).value)||0),0);$(`${side}Total`).textContent=`EVs gesamt: ${t} / 510`;$(`${side}Total`).style.color=t>510?'#ff9a9a':''}
const natureData=[['Hart','neutral','neutral'],['Solo','atk','def'],['Robust','atk','spa'],['Mutig','atk','spe'],['Brav','atk','spd'],['Kühn','def','atk'],['Sanft','def','spd'],['Locker','def','spe'],['Pfiffig','def','spa'],['Mäßig','spa','atk'],['Mild','spa','def'],['Hastig','spe','def'],['Still','spd','spe'],['Zart','spd','def'],['Forsch','spd','spe'],['Scheu','spe','atk'],['Naiv','spe','spd'],['Ernst','neutral','neutral'],['Kauzig','neutral','neutral'],['Froh','spe','spa'],['Frech','atk','spd'],['Sacht','spd','spa'],['Lasch','def','spa'],['Hitzig','spa','spd'],['Ruhig','spa','spe']];
const calcStatKeys=['hp','atk','def','spa','spd','spe'];const calcStatLabels=['KP','Angriff','Verteidigung','Sp. Angriff','Sp. Verteidigung','Initiative'];
const calcStatuses=['Keine','Schlaf','Gift','Schwere Vergiftung','Verbrennung','Paralyse','Eingefroren'];const stages=['-6','-5','-4','-3','-2','-1','0','+1','+2','+3','+4','+5','+6'];
let calcItems=[];
function makeEVInputs(side){const target=$(side==='atk'?'atkEV':'defEV');target.innerHTML=calcStatKeys.map((k,i)=>`<label>${calcStatLabels[i]}<input id="${side}-${k}" type="number" min="0" max="252" step="4" value="0"></label>`).join('');calcStatKeys.forEach(k=>$(`${side}-${k}`).addEventListener('input',()=>{calcEV(side);updateCalcSide(side)}))}
function fillOptions(){const nat=natureData.map((n,i)=>`<option value="${i}">${n[0]}</option>`).join('');$('atkNature').innerHTML=nat;$('defNature').innerHTML=nat;const items=calcItems.map(x=>`<option value="${x.id}">${x.name}</option>`).join('');$('atkItem').innerHTML=items;$('defItem').innerHTML=items;['atkStatus','defStatus'].forEach(id=>$(id).innerHTML=calcStatuses.map(x=>`<option>${x}</option>`).join(''));['atkBoost','atkSpABoost','atkSpeedBoost','defBoost','defSpDBoost','defSpeedBoost'].forEach(id=>$(id).innerHTML=stages.map(x=>`<option>${x}</option>`).join(''))}
function natureMultiplier(index,key){const n=natureData[Number(index)||0];return n[1]===key?1.1:n[2]===key?.9:1}
function calcLevel50Stats(p,side){const vals=[];const nature=$(side==='atk'?'atkNature':'defNature').value;calcStatKeys.forEach((key,i)=>{const base=p.stats[i]?.base_stat||0,ev=Math.max(0,Math.min(252,Number($(`${side}-${key}`).value)||0)),iv=31;if(i===0)vals.push(Math.floor(((2*base+iv+Math.floor(ev/4))*50)/100)+60);else vals.push(Math.floor((Math.floor(((2*base+iv+Math.floor(ev/4))*50)/100)+5)*natureMultiplier(nature,key)))});return vals}
function updateCalcSide(side){const p=calcState[side==='atk'?'attacker':'defender'];if(!p)return;const vals=calcLevel50Stats(p,side);const box=$(side==='atk'?'attackerPreview':'defenderPreview');box.innerHTML=`<img src="${sprite(p.id)}" alt=""><div><b>${calcDisplayName(p)}</b><div class="statsline">${vals.map((v,i)=>`${calcStatLabels[i]} ${v}`).join(' · ')}</div></div>`;calcEV(side)}
function calcDisplayName(p){return p._formName||deP(p.speciesId||p.id)||title(p.name)}

function setupSearchBox(inputId,listId,side,itemsProvider,onPick){const input=$(inputId),list=$(listId);let lastItems=[];function draw(items){lastItems=items.slice(0,12);list.innerHTML=lastItems.map((x,i)=>`<button type="button" class="calc-suggest" data-index="${i}"><img src="${sprite(x.id)}" alt=""><span>${x.label}<small>${x.meta||''}</small></span></button>`).join('');list.hidden=!lastItems.length;list.querySelectorAll('button').forEach(b=>b.onclick=()=>{const x=lastItems[+b.dataset.index];input.value=x.label;list.hidden=true;onPick(x)})}
 input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();if(!q){draw(itemsProvider().slice(0,12));return}draw(itemsProvider().filter(x=>x.label.toLowerCase().includes(q)||x.name.toLowerCase().includes(q)||String(x.id)===q).slice(0,12))});input.addEventListener('focus',()=>{const q=input.value.trim().toLowerCase();draw(q?itemsProvider().filter(x=>x.label.toLowerCase().includes(q)||x.name.toLowerCase().includes(q)||String(x.id)===q):itemsProvider().slice(0,12))});document.addEventListener('click',e=>{if(e.target!==input&&!list.contains(e.target))list.hidden=true})}
function pokemonSearchItems(){return mons.map(p=>({id:p.id,name:p.name,label:deP(p.id)||title(p.name),meta:`#${String(p.id).padStart(4,'0')}`}))}
function moveSearchItems(){return calcState.moves.map(m=>({id:m.id,name:m.name,label:m.label,meta:`${m.type||''} · ${m.cls||''}`}))}
async function selectCalcPokemon(side,item){try{$(`${side}Search`).disabled=true;const p=await json(`${API}/pokemon/${item.id}`);const speciesId=rid(p.species?.url)||item.id;const species=await json(`${API}/pokemon-species/${speciesId}`);p.speciesId=speciesId;p._formName=deP(speciesId)||item.label;calcState[side]=p;await loadCalcForms(side,species);updateCalcSide(side);if(side==='attacker')await loadCalcMoves()}catch(e){console.error(e)}finally{$(`${side}Search`).disabled=false}}
async function loadCalcForms(side,species){const forms=[];for(const v of species.varieties||[]){const id=rid(v.pokemon.url);if(!id)continue;try{const fp=await json(v.pokemon.url);fp.speciesId=species.id;fp._formName=formDisplayName(fp,species.id,species.name);forms.push(fp)}catch(e){}}
 calcState.forms[side]=forms;const sel=$(side==='atk'?'atkForm':'defForm');sel.innerHTML=forms.map(fp=>`<option value="${fp.id}">${fp._formName}</option>`).join('');sel.disabled=forms.length<=1;if(calcState[side])sel.value=String(calcState[side].id)}
async function changeCalcForm(side,id){const p=calcState.forms[side].find(x=>String(x.id)===String(id));if(!p)return;calcState[side]=p;updateCalcSide(side);if(side==='atk')await loadCalcMoves()}
async function loadCalcMoves(){const p=calcState.attacker;const input=$('moveSearch');calcState.moves=[];$('moveSuggestions').innerHTML='';$('moveInfo').textContent=p?'Attacke suchen …':'Wähle zuerst einen Angreifer.';if(!p)return;try{const data=await json(`${API}/pokemon/${p.id}`),seen=new Set();for(const x of data.moves||[]){const id=rid(x.move.url);if(!id||seen.has(id))continue;seen.add(id);let info={id,name:x.move.name,label:deM(id)||title(x.move.name),type:'',cls:''};calcState.moves.push(info)}calcState.moves.sort((a,b)=>a.label.localeCompare(b.label,'de'));input.disabled=false;input.placeholder='Attacke suchen …';input.value='';}catch(e){input.disabled=true;input.placeholder='Attacken konnten nicht geladen werden'}}
async function showMoveInfoById(id){if(!id)return;calcState.selectedMove=id;try{const m=await json(`${API}/move/${id}`);const type=deT(rid(m.type?.url))||title(m.type?.name||'—');const cls=m.damage_class?.name==='physical'?'Physisch':m.damage_class?.name==='special'?'Speziell':'Status';$('moveInfo').innerHTML=`<b>${deM(id)||title(m.name)}</b> · ${type} · ${cls} · Stärke: ${m.power??'—'} · Genauigkeit: ${m.accuracy??'—'}`;const entry=calcState.moves.find(x=>x.id===id);if(entry){entry.type=type;entry.cls=cls}}catch(e){$('moveInfo').textContent='Attackendaten konnten nicht geladen werden.'}}
async function calculateDamage(){const a=calcState.attacker,d=calcState.defender,mid=calcState.selectedMove;if(!a||!d||!mid){$('damageResult').innerHTML='<div class="damage-box">Bitte Angreifer, Verteidiger und Attacke auswählen.</div>';return}try{const m=await json(`${API}/move/${mid}`);if(!m.power){$('damageResult').innerHTML='<div class="damage-box">Diese Attacke hat keinen festen Basiswert. Eine direkte Schadenszahl wird dafür nicht angezeigt.</div>';return}const av=calcLevel50Stats(a,'atk'),dv=calcLevel50Stats(d,'def'),physical=m.damage_class?.name==='physical',attack=av[physical?1:3],defense=dv[physical?2:4],base=Math.floor(Math.floor(Math.floor((2*50/5+2)*m.power*attack/Math.max(1,defense))/50)+2);$('damageResult').innerHTML=`<div class="damage-box"><div class="damage-number">${base}</div><div class="damage-muted">${deM(mid)||title(m.name)} · vorläufige Basisberechnung · ${physical?'physisch':'speziell'}</div></div>`}catch(e){$('damageResult').innerHTML='<div class="damage-box">Berechnung konnte nicht durchgeführt werden.</div>'}}

async function loadAllItems(){const d=await json(`${API}/item?limit=10000`);calcItems=d.results.map((x,i)=>{const id=i+1;return{id,name:deI(id)||title(x.name),raw:x.name}}).sort((a,b)=>a.name.localeCompare(b.name,'de'));}
function setupCalculator(){makeEVInputs('atk');makeEVInputs('def');fillOptions();
 setupSearchBox('atkSearch','atkSuggestions','atk',pokemonSearchItems,x=>selectCalcPokemon('atk',x));
 setupSearchBox('defSearch','defSuggestions','def',pokemonSearchItems,x=>selectCalcPokemon('def',x));
 setupSearchBox('moveSearch','moveSuggestions','move',moveSearchItems,x=>{calcState.selectedMove=x.id;$('moveSearch').value=x.label;$('moveSuggestions').hidden=true;showMoveInfoById(x.id)});
 ['atkNature','atkItem','atkStatus','atkBoost','atkSpABoost','atkSpeedBoost'].forEach(id=>$(id).addEventListener('change',()=>updateCalcSide('atk')));
 ['defNature','defItem','defStatus','defBoost','defSpDBoost','defSpeedBoost'].forEach(id=>$(id).addEventListener('change',()=>updateCalcSide('def')));
 $('atkForm').addEventListener('change',()=>changeCalcForm('atk',$('atkForm').value));$('defForm').addEventListener('change',()=>changeCalcForm('def',$('defForm').value));$('calcButton').addEventListener('click',calculateDamage);
}
async function init(){nav();$('search').oninput=search;$('clear').onclick=()=>{$('search').value='';$('suggestions').innerHTML='';render(mons.slice(0,24));$('search').focus()};$('close').onclick=()=>{$('modal').hidden=true;document.body.style.overflow=''};$('backdrop').onclick=()=>{$('modal').hidden=true;document.body.style.overflow=''};document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('modal').hidden=true;document.body.style.overflow=''}});
 try{await loadGerman();const [d]=await Promise.all([json(`${API}/pokemon?limit=1025`),loadAllItems()]);mons=d.results.map((p,i)=>({name:p.name,id:i+1}));$('status').textContent=`${mons.length} Pokémon geladen`;render(mons.slice(0,24));setupCalculator()}catch(e){console.error(e);$('status').textContent='Fehler beim Laden. Bitte Seite neu laden.'}}
init();
