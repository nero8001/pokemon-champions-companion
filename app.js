const API='https://pokeapi.co/api/v2';
const LOCAL='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/';
const sprite=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const shiny=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
const $=id=>document.getElementById(id);
let mons=[],current=null,isShiny=false;
const german={pokemon:{},move:{},ability:{},type:{},item:{},form:{}};

const calcState={attacker:null,defender:null,forms:{attacker:[],defender:[]},moves:[],selectedMove:null};

const natureData=[['Hart','neutral','neutral'],['Solo','atk','def'],['Robust','atk','spa'],['Mutig','atk','spe'],['Brav','atk','spd'],['Kühn','def','atk'],['Sanft','def','spd'],['Locker','def','spe'],['Pfiffig','def','spa'],['Mäßig','spa','atk'],['Mild','spa','def'],['Hastig','spe','def'],['Still','spd','spe'],['Zart','spd','def'],['Forsch','spd','spe'],['Scheu','spe','atk'],['Naiv','spe','spd'],['Ernst','neutral','neutral'],['Kauzig','neutral','neutral'],['Froh','spe','spa'],['Frech','atk','spd'],['Sacht','spd','spa'],['Lasch','def','spa'],['Hitzig','spa','spd'],['Ruhig','spa','spe']];
const calcStatKeys=['hp','atk','def','spa','spd','spe'];
const calcStatLabels=['KP','Angriff','Verteidigung','Sp. Angriff','Sp. Verteidigung','Initiative'];
const calcStatuses=['Keine','Schlaf','Gift','Schwere Vergiftung','Verbrennung','Paralyse','Eingefroren'];
const stages=['0','+1','+2','+3','+4','+5','+6'];

/* Aktueller Champions-Itempool: 148 Items (M-B-Datenbasis), nur ausrüstbare Kampfitems.
   Der Pool bleibt bewusst getrennt vom Schadensregelsatz und kann bei M-C ersetzt werden. */
const championsItemNames = new Set(`Black Belt|Black Glasses|Charcoal|Dragon Fang|Expert Belt|Fairy Feather|Hard Stone|Life Orb|Magnet|Metal Coat|Metronome|Miracle Seed|Muscle Band|Mystic Water|Never-Melt Ice|Poison Barb|Sharp Beak|Silk Scarf|Silver Powder|Soft Sand|Spell Tag|Twisted Spoon|Wise Glasses|Choice Scarf|Light Ball|White Herb|Focus Band|Focus Sash|Big Root|Leftovers|Mental Herb|Shell Bell|Aspear Berry|Babiri Berry|Charti Berry|Cheri Berry|Chesto Berry|Chilan Berry|Chople Berry|Coba Berry|Colbur Berry|Haban Berry|Kasib Berry|Kebia Berry|Leppa Berry|Lum Berry|Occa Berry|Oran Berry|Passho Berry|Payapa Berry|Pecha Berry|Persim Berry|Rawst Berry|Rindo Berry|Roseli Berry|Shuca Berry|Sitrus Berry|Tanga Berry|Wacan Berry|Yache Berry|Damp Rock|Heat Rock|Icy Rock|Light Clay|Smooth Rock|Bright Powder|Iron Ball|King's Rock|Quick Claw|Scope Lens|Shed Shell|Wide Lens|Zoom Lens|Abomasite|Absolite|Aerodactylite|Aggronite|Alakazite|Altarianite|Ampharosite|Audinite|Banettite|Barbaracite|Beedrillite|Blastoisinite|Blazikenite|Cameruptite|Chandelurite|Charizardite X|Charizardite Y|Chesnaughtite|Chimechite|Clefablite|Crabominite|Delphoxite|Dragalgite|Dragoninite|Drampanite|Eelektrossite|Emboarite|Excadrite|Falinksite|Feraligite|Floettite|Froslassite|Galladite|Garchompite|Gardevoirite|Gengarite|Glalitite|Glimmoranite|Golurkite|Greninjite|Gyaradosite|Hawluchanite|Heracronite|Houndoominite|Kangaskhanite|Lopunnite|Lucarionite|Malamarite|Manectite|Mawilite|Medichamite|Meganiumite|Meowsticite|Metagrossite|Pidgeotite|Pinsirite|Pyroarite|Raichunite X|Raichunite Y|Sablenite|Sceptilite|Scizorite|Scolipite|Scovillainite|Scraftinite|Sharpedonite|Skarmorite|Slowbronite|Staraptite|Starminite|Steelixite|Swampertite|Tyranitarite|Venusaurite|Victreebelite`.split('|'));

let calcItems=[];

function makeEVInputs(side){
  const target=$(side==='atk'?'atkEV':'defEV');
  target.innerHTML=calcStatKeys.map((k,i)=>`<label>${calcStatLabels[i]}<input id="${side}-${k}" type="number" min="0" max="252" step="4" value="0"></label>`).join('');
  calcStatKeys.forEach(k=>$(`${side}-${k}`).addEventListener('input',()=>{calcEV(side);updateCalcSide(side)}));
}

function fillOptions(){
  const nat=natureData.map((n,i)=>`<option value="${i}">${n[0]}</option>`).join('');
  $('atkNature').innerHTML=nat;$('defNature').innerHTML=nat;
  const items=calcItems.map(x=>`<option value="${x.id}">${x.name}</option>`).join('');
  $('atkItem').innerHTML=items;$('defItem').innerHTML=items;
  ['atkStatus','defStatus'].forEach(id=>$(id).innerHTML=calcStatuses.map(x=>`<option>${x}</option>`).join(''));
  ['atkBoost','atkSpABoost','atkSpeedBoost','defBoost','defSpDBoost','defSpeedBoost'].forEach(id=>$(id).innerHTML=stages.map(x=>`<option>${x}</option>`).join(''));
}

function natureMultiplier(index,key){
  const n=natureData[Number(index)||0];
  return n[1]===key?1.1:n[2]===key?.9:1;
}

function calcLevel50Stats(p,side){
  const vals=[];
  const nature=$(side==='atk'?'atkNature':'defNature').value;
  calcStatKeys.forEach((key,i)=>{
    const base=p.stats[i]?.base_stat||0,ev=Math.max(0,Math.min(252,Number($(`${side}-${key}`).value)||0)),iv=31;
    if(i===0) vals.push(Math.floor(((2*base+iv+Math.floor(ev/4))*50)/100)+60);
    else vals.push(Math.floor((Math.floor(((2*base+iv+Math.floor(ev/4))*50)/100)+5)*natureMultiplier(nature,key)));
  });
  return vals;
}

function updateCalcSide(side){
  const p=calcState[side==='atk'?'attacker':'defender'];
  const box=$(side==='atk'?'attackerPreview':'defenderPreview');
  if(!p){box.textContent='Noch kein Pokémon ausgewählt.';return}
  const vals=calcLevel50Stats(p,side);
  box.innerHTML=`<img src="${sprite(p.id)}" alt="${calcDisplayName(p)}"><div><b>${calcDisplayName(p)}</b><div class="statsline">${vals.map((v,i)=>`${calcStatLabels[i]} ${v}`).join(' · ')}</div></div>`;
  calcEV(side);
}

function calcDisplayName(p){return p._formName||deP(p.speciesId||p.id)||title(p.name)}

function setupSearchBox(inputId,listId,side,itemsProvider,onPick){
  const input=$(inputId),list=$(listId);let lastItems=[];
  function norm(s){return String(s||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  function draw(items){
    lastItems=items.slice(0,12);
    list.innerHTML=lastItems.map((x,i)=>`<button type="button" class="calc-suggest" data-index="${i}"><img src="${sprite(x.id)}" alt=""><span>${x.label}<small>${x.meta||''}</small></span></button>`).join('');
    list.hidden=!lastItems.length;
    list.querySelectorAll('button').forEach(b=>b.addEventListener('click',ev=>{
      ev.preventDefault();ev.stopPropagation();
      const x=lastItems[+b.dataset.index];input.value=x.label;list.hidden=true;onPick(x);
    }));
  }
  input.addEventListener('input',()=>{const q=norm(input.value);draw(q?itemsProvider().filter(x=>norm(x.label).includes(q)||norm(x.name).includes(q)||String(x.id)===q):itemsProvider().slice(0,12))});
  input.addEventListener('focus',()=>{const q=norm(input.value);draw(q?itemsProvider().filter(x=>norm(x.label).includes(q)||norm(x.name).includes(q)||String(x.id)===q):itemsProvider().slice(0,12))});
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter' && lastItems[0]){e.preventDefault();input.value=lastItems[0].label;list.hidden=true;onPick(lastItems[0]);}
  });
  document.addEventListener('click',e=>{if(e.target!==input&&!list.contains(e.target))list.hidden=true});
}

function pokemonSearchItems(){return mons.map(p=>({id:p.id,name:p.name,label:deP(p.id)||title(p.name),meta:`#${String(p.id).padStart(4,'0')}`}))}
function moveSearchItems(){return calcState.moves.map(m=>({id:m.id,name:m.name,label:m.label,meta:`${m.type||''} · ${m.cls||''}`}))}
function itemSearchItems(){return calcItems.map(x=>({id:x.id,name:x.raw,label:x.name,meta:'Ausrüstbares Champions-Item'}))}

async function selectCalcPokemon(side,item){
  const search=$(side==='atk'?'atkSearch':'defSearch');
  search.disabled=true;
  try{
    const p=await json(`${API}/pokemon/${item.id}`);
    const speciesId=rid(p.species?.url)||item.id;
    const species=await json(`${API}/pokemon-species/${speciesId}`);
    p.speciesId=speciesId;
    p._formName=formDisplayName(p,speciesId,species.name);
    calcState[side==='atk'?'attacker':'defender']=p;
    updateCalcSide(side); // sofort sichtbar, nicht erst nach dem Formularladen
    await loadCalcForms(side,species);
    const selected=calcState[side==='atk'?'attacker':'defender'];
    $(side==='atk'?'atkSearch':'defSearch').value=calcDisplayName(selected);
    if(side==='atk') await loadCalcMoves();
  }catch(e){
    console.error(e);
    $(side==='atk'?'attackerPreview':'defenderPreview').textContent='Pokémon konnte nicht geladen werden.';
  }finally{search.disabled=false}
}

async function loadCalcForms(side,species){
  const forms=[];
  for(const v of species.varieties||[]){
    const id=rid(v.pokemon.url);if(!id)continue;
    try{
      const fp=await json(v.pokemon.url);
      fp.speciesId=species.id;
      fp._formName=formDisplayName(fp,species.id,species.name);
      forms.push(fp);
    }catch(e){console.warn('Form konnte nicht geladen werden',e)}
  }
  calcState.forms[side]=forms;
  const sel=$(side==='atk'?'atkForm':'defForm');
  sel.innerHTML=forms.map(fp=>`<option value="${fp.id}">${fp._formName}</option>`).join('');
  sel.disabled=forms.length<=1;
  if(calcState[side]) sel.value=String(calcState[side].id);
}

async function changeCalcForm(side,id){
  const p=calcState.forms[side].find(x=>String(x.id)===String(id));if(!p)return;
  calcState[side]=p;updateCalcSide(side);
  if(side==='atk') await loadCalcMoves();
}

async function loadCalcMoves(){
  const p=calcState.attacker,input=$('atkMoveSearch'),list=$('atkMoveSuggestions');
  calcState.moves=[];calcState.selectedMove=null;list.innerHTML='';list.hidden=true;
  $('atkMoveInfo').textContent=p?'Attacke suchen …':'Wähle zuerst einen Angreifer.';
  $('moveInfo').textContent=p?'Die Attacke des Angreifers wird verwendet.':'Wähle einen Angreifer.';
  input.value='';
  if(!p){input.disabled=true;return}
  try{
    const data=await json(`${API}/pokemon/${p.id}`),seen=new Set();
    for(const x of data.moves||[]){
      const id=rid(x.move.url);if(!id||seen.has(id))continue;
      seen.add(id);calcState.moves.push({id,name:x.move.name,label:deM(id)||title(x.move.name),type:'',cls:''});
    }
    calcState.moves.sort((a,b)=>a.label.localeCompare(b.label,'de'));
    input.disabled=false;input.placeholder='Attacke suchen …';
  }catch(e){
    input.disabled=true;input.placeholder='Attacken konnten nicht geladen werden';
    $('atkMoveInfo').textContent='Attacken konnten nicht geladen werden.';
  }
}

async function showMoveInfoById(id){
  if(!id)return;
  calcState.selectedMove=id;
  try{
    const m=await json(`${API}/move/${id}`);
    const type=deT(rid(m.type?.url))||title(m.type?.name||'—');
    const cls=m.damage_class?.name==='physical'?'Physisch':m.damage_class?.name==='special'?'Speziell':'Status';
    const label=deM(id)||title(m.name);
    const info=`<b>${label}</b> · ${type} · ${cls} · Stärke: ${m.power??'—'} · Genauigkeit: ${m.accuracy??'—'}`;
    $('atkMoveInfo').innerHTML=info;$('moveInfo').innerHTML=info;
    const entry=calcState.moves.find(x=>x.id===id);if(entry){entry.type=type;entry.cls=cls}
  }catch(e){$('atkMoveInfo').textContent='Attackendaten konnten nicht geladen werden.'}
}

async function calculateDamage(){
  const a=calcState.attacker,d=calcState.defender,mid=calcState.selectedMove;
  if(!a||!d||!mid){$('damageResult').innerHTML='<div class="damage-box">Bitte Angreifer, Verteidiger und die Attacke des Angreifers auswählen.</div>';return}
  try{
    const m=await json(`${API}/move/${mid}`);
    if(!m.power){$('damageResult').innerHTML='<div class="damage-box">Diese Attacke hat keinen festen Basiswert. Eine direkte Schadenszahl wird dafür nicht angezeigt.</div>';return}
    const av=calcLevel50Stats(a,'atk'),dv=calcLevel50Stats(d,'def');
    const physical=m.damage_class?.name==='physical',attack=av[physical?1:3],defense=dv[physical?2:4];
    const base=Math.floor(Math.floor(Math.floor((2*50/5+2)*m.power*attack/Math.max(1,defense))/50)+2);
    $('damageResult').innerHTML=`<div class="damage-box"><div class="damage-number">${base}</div><div class="damage-muted">${deM(mid)||title(m.name)} · vorläufige Basisberechnung · ${physical?'physisch':'speziell'}</div></div>`;
  }catch(e){$('damageResult').innerHTML='<div class="damage-box">Berechnung konnte nicht durchgeführt werden.</div>'}
}

async function loadAllItems(){
  const d=await json(`${API}/item?limit=10000`);
  calcItems=d.results.map((x,i)=>({id:i+1,name:deI(i+1)||title(x.name),raw:x.name}))
    .filter(x=>championsItemNames.has(x.raw))
    .sort((a,b)=>a.name.localeCompare(b.name,'de'));
}

function setupItemSearch(side){
  const input=$(side==='atk'?'atkItemSearch':'defItemSearch');
  const list=$(side==='atk'?'atkItemSuggestions':'defItemSuggestions');
  const select=$(side==='atk'?'atkItem':'defItem');
  setupSearchBox(input,list,'item',itemSearchItems,x=>{
    select.value=String(x.id);
    input.value=x.label;
    list.hidden=true;
    select.dispatchEvent(new Event('change',{bubbles:true}));
  });
  select.addEventListener('change',()=>{const x=calcItems.find(i=>String(i.id)===String(select.value));if(x)input.value=x.name;updateCalcSide(side)});
}

function swapCombatants(){
  const oldAtk=calcState.attacker,oldDef=calcState.defender;
  calcState.attacker=oldDef;calcState.defender=oldAtk;
  const oldAtkForms=calcState.forms.attacker,oldDefForms=calcState.forms.defender;
  calcState.forms.attacker=oldDefForms;calcState.forms.defender=oldAtkForms;

  const pairs=[
    ['atkSearch','defSearch'],['atkForm','defForm'],['atkNature','defNature'],
    ['atkItem','defItem'],['atkItemSearch','defItemSearch'],['atkStatus','defStatus'],
    ['atkBoost','defBoost'],['atkSpABoost','defSpDBoost'],['atkSpeedBoost','defSpeedBoost']
  ];
  for(const [a,b] of pairs){const A=$(a),B=$(b);if(!A||!B)continue;const v=A.value;A.value=B.value;B.value=v}
  for(const side of ['atk','def']){calcStatKeys.forEach(k=>{const A=$(`${side}-${k}`),B=$(`${side==='atk'?'def':'atk'}-${k}`);if(A&&B){}})}
  // EVs müssen ebenfalls die Seiten wechseln.
  for(const k of calcStatKeys){
    const A=$(`atk-${k}`),B=$(`def-${k}`);const v=A.value;A.value=B.value;B.value=v;
  }
  calcState.selectedMove=null;
  $('atkMoveSearch').value='';
  $('atkMoveSuggestions').innerHTML='';
  $('atkMoveSuggestions').hidden=true;
  $('atkMoveInfo').textContent=calcState.attacker?'Attacke suchen …':'Wähle einen Angreifer.';
  updateCalcSide('atk');updateCalcSide('def');
  if(calcState.attacker) loadCalcMoves();
}

function setupCalculator(){
  makeEVInputs('atk');makeEVInputs('def');fillOptions();
  setupSearchBox('atkSearch','atkSuggestions','atk',pokemonSearchItems,x=>selectCalcPokemon('atk',x));
  setupSearchBox('defSearch','defSuggestions','def',pokemonSearchItems,x=>selectCalcPokemon('def',x));
  setupSearchBox('atkMoveSearch','atkMoveSuggestions','move',moveSearchItems,x=>{
    calcState.selectedMove=x.id;$('atkMoveSearch').value=x.label;$('atkMoveSuggestions').hidden=true;showMoveInfoById(x.id)
  });
  setupItemSearch('atk');setupItemSearch('def');

  ['atkNature','atkItem','atkStatus','atkBoost','atkSpABoost','atkSpeedBoost'].forEach(id=>$(id).addEventListener('change',()=>updateCalcSide('atk')));
  ['defNature','defItem','defStatus','defBoost','defSpDBoost','defSpeedBoost'].forEach(id=>$(id).addEventListener('change',()=>updateCalcSide('def')));
  $('atkForm').addEventListener('change',()=>changeCalcForm('atk',$('atkForm').value));
  $('defForm').addEventListener('change',()=>changeCalcForm('def',$('defForm').value));
  $('switchCombatants').addEventListener('click',swapCombatants);
  $('calcButton').addEventListener('click',calculateDamage);
}
async function init(){nav();$('search').oninput=search;$('clear').onclick=()=>{$('search').value='';$('suggestions').innerHTML='';render(mons.slice(0,24));$('search').focus()};$('close').onclick=()=>{$('modal').hidden=true;document.body.style.overflow=''};$('backdrop').onclick=()=>{$('modal').hidden=true;document.body.style.overflow=''};document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('modal').hidden=true;document.body.style.overflow=''}});
 try{await loadGerman();const [d]=await Promise.all([json(`${API}/pokemon?limit=1025`),loadAllItems()]);mons=d.results.map((p,i)=>({name:p.name,id:i+1}));$('status').textContent=`${mons.length} Pokémon geladen`;render(mons.slice(0,24));setupCalculator()}catch(e){console.error(e);$('status').textContent='Fehler beim Laden. Bitte Seite neu laden.'}}
init();
