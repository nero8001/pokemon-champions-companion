const API='https://pokeapi.co/api/v2';
const LOCAL='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/';
const sprite=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const shiny=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
const $=id=>document.getElementById(id);
let mons=[],current=null,isShiny=false;
const german={pokemon:{},move:{},ability:{},type:{},item:{}};

function csvFields(line){
  const out=[];let cur='',q=false;
  for(let i=0;i<line.length;i++){const c=line[i];
    if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q}
    else if(c===','&&!q){out.push(cur);cur=''}else cur+=c;
  } out.push(cur);return out;
}
async function loadCSV(kind,file){
  const t=await (await fetch(LOCAL+file)).text(), lines=t.split(/\r?\n/);
  for(let i=1;i<lines.length;i++){if(!lines[i])continue;const r=csvFields(lines[i]);
    if(r.length>=3&&r[1]==='6')german[kind][r[0]]=r[2];
  }
}
async function loadGerman(){
  await Promise.all([
    loadCSV('pokemon','pokemon_species_names.csv'),
    loadCSV('move','move_names.csv'),
    loadCSV('ability','ability_names.csv'),
    loadCSV('type','type_names.csv')
  ]);
}
const deP=id=>german.pokemon[String(id)]||null;
const deM=id=>german.move[String(id)]||null;
const deA=id=>german.ability[String(id)]||null;
const deT=id=>german.type[String(id)]||null;
const rid=u=>{const m=String(u).match(/\/(\d+)\/?$/);return m?m[1]:null};
const resourceId=rid;
async function json(u){const r=await fetch(u);if(!r.ok)throw Error(r.status);return r.json()}
const title=s=>s.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' ');

function nav(){
 document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');$(b.dataset.page).classList.add('active');scrollTo(0,0);
 });
}
function render(list){
 $('grid').innerHTML=list.map(p=>`<article class="poke"><button data-id="${p.id}">
 <div class="pic"><img src="${sprite(p.id)}" alt="${deP(p.id)||title(p.name)}"></div>
 <div class="no">#${String(p.id).padStart(4,'0')}</div><div class="name">${deP(p.id)||title(p.name)}</div>
 </button></article>`).join('');
 document.querySelectorAll('.poke button').forEach(b=>b.onclick=()=>open(+b.dataset.id));
}
function search(){
 const q=$('search').value.trim().toLowerCase();
 if(!q){$('suggestions').innerHTML='';render(mons.slice(0,24));return}
 const m=mons.filter(p=>p.name.includes(q)||(deP(p.id)||'').toLowerCase().includes(q)||String(p.id)===q||String(p.id).padStart(4,'0')===q).slice(0,8);
 $('suggestions').innerHTML=m.map(p=>`<button class="suggest" data-id="${p.id}"><img src="${sprite(p.id)}"><span>${deP(p.id)||title(p.name)}<br><small>#${String(p.id).padStart(4,'0')}</small></span></button>`).join('');
 document.querySelectorAll('.suggest').forEach(b=>b.onclick=()=>open(+b.dataset.id));render(m);
}
async function open(id){
 $('modal').hidden=false;document.body.style.overflow='hidden';$('modalbody').innerHTML='<p>Daten werden geladen …</p>';
 try{const [p,s]=await Promise.all([json(`${API}/pokemon/${id}`),json(`${API}/pokemon-species/${id}`)]);current={p,s};isShiny=false;await detail(p,s)}
 catch(e){$('modalbody').innerHTML='<h2>Fehler</h2><p>Die Pokémon-Daten konnten nicht geladen werden.</p>'}
}
async function detail(p,s){
  const pname=deP(p.id)||title(p.name);
  const abilities=await Promise.all(p.abilities.map(async x=>deA(resourceId(x.ability.url))||title(x.ability.name)));

  const grouped={};
  p.moves.forEach(x=>{
    const methods=x.version_group_details||[];
    methods.forEach(v=>{
      let key='Weitere';
      const m=v.move_learn_method?.name;
      if(m==='level-up') key='Durch Levelaufstieg';
      else if(m==='machine') key='TM / VM';
      else if(m==='tutor') key='Attacken-Lehrer';
      else if(m==='egg') key='Ei-Attacke';
      else if(m==='stadium-surfing-pikachu') key='Spezial';
      if(!grouped[key]) grouped[key]=[];
      const level=v.level_learned_at||0;
      const entry={id:resourceId(x.move.url),name:x.move.name,level};
      if(!grouped[key].some(a=>a.id===entry.id)) grouped[key].push(entry);
    });
  });

  const moveOrder=['Durch Levelaufstieg','TM / VM','Attacken-Lehrer','Ei-Attacke','Spezial','Weitere'];
  let moveHtml='';
  for(const group of moveOrder){
    if(!grouped[group]) continue;
    const entries=await Promise.all(grouped[group].map(async m=>({
      ...m, de:deM(m.id)||title(m.name)
    })));
    entries.sort((a,b)=>group==='Durch Levelaufstieg'?(a.level-b.level||a.de.localeCompare(b.de,'de')):a.de.localeCompare(b.de,'de'));
    moveHtml+=`<div class="move-group"><h4>${group} <span class="move-meta">(${entries.length})</span></h4><div class="move-list">`;
    moveHtml+=entries.map(m=>`<div class="move-item"><span class="move-name">${m.de}</span>${group==='Durch Levelaufstieg'?`<span class="move-meta">Lv. ${m.level}</span>`:''}</div>`).join('');
    moveHtml+='</div></div>';
  }

  const flavor=(s.flavor_text_entries||[]).find(x=>x.language?.name==='de');
  const genus=(s.genera||[]).find(x=>x.language?.name==='de');
  const stats=p.stats.map(x=>`<div class="stat"><span>${({
    hp:'KP',attack:'Angriff',defense:'Verteidigung',
    'special-attack':'Sp. Angriff','special-defense':'Sp. Verteidigung',
    speed:'Initiative'
  })[x.stat.name]}</span><div class="bar"><i style="width:${Math.min(100,x.base_stat/2)}%"></i></div><b>${x.base_stat}</b></div>`).join('');

  const forms=s.varieties.map(v=>{
    const id=resourceId(v.pokemon.url);
    const name=deP(id)||title(v.pokemon.name);
    const active=Number(id)===Number(p.id);
    return `<button type="button" class="form-choice ${active?'active':''}" data-form-url="${v.pokemon.url}" data-form-id="${id}">
      <img src="${sprite(id)}" alt=""><span>${name}</span></button>`;
  }).join('');

  const types=p.types.map(t=>`<span class="pill">${deT(resourceId(t.type.url))||title(t.type.name)}</span>`).join('');

  $('modalbody').innerHTML=`
    <div class="detail">
      <div class="detailpic"><img id="ds" src="${isShiny?shiny(p.id):sprite(p.id)}" alt="${pname}"></div>
      <div>
        <h2>${pname}</h2>
        <div>#${String(p.id).padStart(4,'0')} · ${p.height/10} m · ${p.weight/10} kg</div>
        <p>${types}</p>
        <button id="sh" class="pill ${isShiny?'active':''}">✨ Shiny</button>
      </div>
    </div>

    <div class="section"><h3>Form auswählen</h3><div class="form-buttons" id="forms">${forms||'—'}</div></div>

    <div class="section"><h3>Pokédex-Beschreibung</h3>
      <p class="description">${flavor?flavor.flavor_text.replace(/[\n\f]/g,' '):'Keine deutsche Beschreibung vorhanden.'}</p>
      ${genus?`<p class="flavor">${genus.genus}</p>`:''}
    </div>

    <div class="section"><h3>Fähigkeiten</h3><p>${abilities.join(', ')||'—'}</p></div>
    <div class="section"><h3>Basiswerte</h3>${stats}</div>
    <div class="section"><h3>Attacken</h3><div class="move-groups">${moveHtml||'<p>Keine Attacken gefunden.</p>'}</div></div>
  `;

  $('sh').onclick=()=>{
    isShiny=!isShiny;
    $('ds').src=isShiny?shiny(p.id):sprite(p.id);
    $('sh').classList.toggle('active',isShiny);
  };

  document.querySelectorAll('#forms .form-choice').forEach(btn=>{
    btn.onclick=async()=>{
      const url=btn.dataset.formUrl;
      try{
        const fp=await json(url);
        current={p:fp,s};
        isShiny=false;
        await detail(fp,s);
      }catch(e){console.error(e)}
    };
  });
}
function calcEV(){let t=['hp','atk','def','spa','spd','spe'].reduce((a,k)=>a+(+($('ev-'+k).value)||0),0);$('evtotal').textContent=`EVs gesamt: ${t} / 510`;$('evtotal').style.color=t>510?'#ff9a9a':''}

const natureData=[
 ['Hart','neutral','neutral'],['Solo','atk','def'],['Robust','atk','spa'],['Mutig','atk','spe'],['Brav','atk','spd'],
 ['Kühn','def','atk'],['Sanft','def','spd'],['Locker','def','spe'],['Pfiffig','def','spa'],
 ['Mäßig','spa','atk'],['Mild','spa','def'],['Hastig','spe','def'],['Still','spd','spe'],
 ['Zart','spd','def'],['Forsch','spd','spe'],['Scheu','spe','atk'],['Naiv','spe','spd'],
 ['Ernst','neutral','neutral'],['Kauzig','neutral','neutral'],['Froh','spe','spa'],['Frech','atk','spd'],
 ['Sacht','spd','spa'],['Lasch','def','spa'],['Hitzig','spa','spd'],['Ruhig','spa','spe']
];
const calcStatKeys=['hp','atk','def','spa','spd','spe'];
const calcStatLabels=['KP','Angriff','Verteidigung','Sp. Angriff','Sp. Verteidigung','Initiative'];
const calcItems=['Kein Item','Leben-Orb','Wahlband','Wahlglas','Überreste','Fokusgurt','Expertengurt'];
const calcStatuses=['Keine','Schlaf','Gift','Schwere Vergiftung','Verbrennung','Paralyse','Eingefroren'];
const stages=['-6','-5','-4','-3','-2','-1','0','+1','+2','+3','+4','+5','+6'];

function makeEVInputs(side){
  const target=$(side==='atk'?'atkEV':'defEV');
  target.innerHTML=calcStatKeys.map((k,i)=>`<label>${calcStatLabels[i]}<input id="${side}-${k}" type="number" min="0" max="252" step="4" value="0"></label>`).join('');
  calcStatKeys.forEach(k=>$(side+'-'+k).addEventListener('input',()=>updateCalcSide(side)));
}
function fillOptions(){
  const nat=natureData.map((n,i)=>`<option value="${i}">${n[0]}</option>`).join('');
  $('atkNature').innerHTML=nat;$('defNature').innerHTML=nat;
  ['atkItem','defItem'].forEach(id=>$(id).innerHTML=calcItems.map(x=>`<option>${x}</option>`).join(''));
  ['atkStatus','defStatus'].forEach(id=>$(id).innerHTML=calcStatuses.map(x=>`<option>${x}</option>`).join(''));
  ['atkBoost','atkSpABoost','atkSpeedBoost','defBoost','defSpDBoost','defSpeedBoost']
    .forEach(id=>$(id).innerHTML=stages.map(x=>`<option>${x}</option>`).join(''));
}
function getCalcPokemon(selectId){
  const id=Number($(selectId).value); return mons.find(p=>p.id===id)||null;
}
function evTotal(side){
  return calcStatKeys.reduce((sum,k)=>sum+Math.max(0,Math.min(252,Number($(side+'-'+k).value)||0)),0);
}
function natureMultiplier(index,key){
  const n=natureData[Number(index)||0];
  return n[1]===key?1.1:n[2]===key?.9:1;
}
function calcLevel50Stats(p,side){
  const vals=[];
  const nature=$(side==='atk'?'atkNature':'defNature').value;
  calcStatKeys.forEach((key,i)=>{
    const base=p.stats[i]?.base_stat||0;
    const ev=Math.max(0,Math.min(252,Number($(side+'-'+key).value)||0));
    const iv=31;
    if(i===0) vals.push(Math.floor(((2*base+iv+Math.floor(ev/4))*50)/100)+60);
    else vals.push(Math.floor((Math.floor(((2*base+iv+Math.floor(ev/4))*50)/100)+5)*natureMultiplier(nature,key)));
  });
  return vals;
}
function updateCalcSide(side){
  const p=getCalcPokemon(side==='atk'?'attacker':'defender');
  const total=evTotal(side);
  const totalEl=$(side==='atk'?'atkTotal':'defTotal');
  totalEl.textContent=`EVs: ${total} / 510`; totalEl.style.color=total>510?'#ff9a9a':'';
  if(!p)return;
  const vals=calcLevel50Stats(p,side);
  const statsline=vals.map((v,i)=>`${calcStatLabels[i]} ${v}`).join(' · ');
  const box=$(side==='atk'?'attackerPreview':'defenderPreview');
  box.innerHTML=`<img src="${sprite(p.id)}" alt=""><div><b>${deP(p.id)||title(p.name)}</b><div class="statsline">${statsline}</div></div>`;
}
async function loadCalcMoves(){
  const p=getCalcPokemon('attacker');
  const sel=$('moveSelect');
  if(!p){sel.innerHTML='<option value="">Zuerst einen Angreifer wählen …</option>';return}
  try{
    const data=await json(`${API}/pokemon/${p.id}`);
    const list=[],seen=new Set();
    for(const x of data.moves){
      const id=resourceId(x.move.url);
      if(!id||seen.has(id))continue;
      seen.add(id);list.push({id,name:deM(id)||title(x.move.name)});
    }
    list.sort((a,b)=>a.name.localeCompare(b.name,'de'));
    sel.innerHTML='<option value="">Attacke wählen …</option>'+list.map(x=>`<option value="${x.id}">${x.name}</option>`).join('');
  }catch(e){sel.innerHTML='<option value="">Attacken konnten nicht geladen werden</option>'}
}
async function showMoveInfo(){
  const id=Number($('moveSelect').value);
  if(!id){$('moveInfo').textContent='Wähle einen Angreifer und eine Attacke.';return}
  try{
    const m=await json(`${API}/move/${id}`);
    const type=deT(resourceId(m.type?.url))||title(m.type?.name||'—');
    const cls=m.damage_class?.name==='physical'?'physisch':m.damage_class?.name==='special'?'speziell':'Status';
    $('moveInfo').innerHTML=`<b>${deM(id)||title(m.name)}</b> · ${type} · ${cls} · Stärke: ${m.power??'—'} · Genauigkeit: ${m.accuracy??'—'}`;
  }catch(e){$('moveInfo').textContent='Attackendaten konnten nicht geladen werden.'}
}
async function calculateDamage(){
  const a=getCalcPokemon('attacker'),d=getCalcPokemon('defender'),mid=Number($('moveSelect').value);
  if(!a||!d||!mid){$('damageResult').innerHTML='<div class="damage-box">Bitte Angreifer, Verteidiger und Attacke auswählen.</div>';return}
  try{
    const [ap,dp,m]=await Promise.all([json(`${API}/pokemon/${a.id}`),json(`${API}/pokemon/${d.id}`),json(`${API}/move/${mid}`)]);
    if(!m.power){$('damageResult').innerHTML='<div class="damage-box">Diese Attacke hat keinen festen Basiswert. Eine direkte Schadenszahl wird dafür nicht angezeigt.</div>';return}
    const av=calcLevel50Stats(ap,'atk'),dv=calcLevel50Stats(dp,'def');
    const physical=m.damage_class?.name==='physical';
    const attack=av[physical?1:3],defense=dv[physical?2:4];
    const base=Math.floor(Math.floor(Math.floor((2*50/5+2)*m.power*attack/Math.max(1,defense))/50)+2);
    $('damageResult').innerHTML=`<div class="damage-box"><div class="damage-number">${base}</div><div class="damage-muted">${deM(mid)||title(m.name)} · vorläufige Basisberechnung · ${physical?'physisch':'speziell'}</div></div>`;
  }catch(e){$('damageResult').innerHTML='<div class="damage-box">Berechnung konnte nicht durchgeführt werden.</div>'}
}
function setupCalculator(){
  makeEVInputs('atk');makeEVInputs('def');fillOptions();
  $('attacker').addEventListener('change',async()=>{updateCalcSide('atk');await loadCalcMoves()});
  $('defender').addEventListener('change',()=>updateCalcSide('def'));
  ['atkNature','atkItem','atkStatus','atkBoost','atkSpABoost','atkSpeedBoost'].forEach(id=>$(id).addEventListener('change',()=>updateCalcSide('atk')));
  ['defNature','defItem','defStatus','defBoost','defSpDBoost','defSpeedBoost'].forEach(id=>$(id).addEventListener('change',()=>updateCalcSide('def')));
  $('moveSelect').addEventListener('change',showMoveInfo);
  $('calcButton').addEventListener('click',calculateDamage);
}

async function init(){
 nav();$('search').oninput=search;
 $('clear').onclick=()=>{$('search').value='';$('suggestions').innerHTML='';render(mons.slice(0,24));$('search').focus()};
 $('close').onclick=()=>{$('modal').hidden=true;document.body.style.overflow=''};
 $('backdrop').onclick=()=>{$('modal').hidden=true;document.body.style.overflow=''};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('modal').hidden=true;document.body.style.overflow=''}});
 try{
  await loadGerman();
  const d=await json(`${API}/pokemon?limit=1025`);
  mons=d.results.map((p,i)=>({name:p.name,id:i+1}));
  $('status').textContent=`${mons.length} Pokémon geladen`;render(mons.slice(0,24));
  const opts=mons.map(p=>`<option value="${p.id}">#${String(p.id).padStart(4,'0')} ${deP(p.id)||title(p.name)}</option>`).join('');
  $('attacker').insertAdjacentHTML('beforeend',opts);$('defender').insertAdjacentHTML('beforeend',opts);setupCalculator();
 }catch(e){console.error(e);$('status').textContent='Fehler beim Laden. Bitte Seite neu laden.'}
}
init();