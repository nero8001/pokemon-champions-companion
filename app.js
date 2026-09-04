const API='https://pokeapi.co/api/v2';
const LOCAL='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/';
const german={pokemon:{},move:{},ability:{}};

function csvFields(line){
  const fields=[]; let field=''; let quoted=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(c==='"'){
      if(quoted && line[i+1]==='"'){field+='"';i++;}
      else quoted=!quoted;
    }else if(c===',' && !quoted){
      fields.push(field); field='';
    }else field+=c;
  }
  fields.push(field);
  return fields;
}

async function loadGermanNames(){
  const sources=[
    ['pokemon','pokemon_species_names.csv'],
    ['move','move_names.csv'],
    ['ability','ability_names.csv']
  ];
  await Promise.all(sources.map(async ([kind,file])=>{
    const text=await (await fetch(LOCAL+file)).text();
    const lines=text.split(/\r?\n/);
    for(let i=1;i<lines.length;i++){
      if(!lines[i]) continue;
      const row=csvFields(lines[i]);
      if(row.length<3 || row[1] !== '6') continue;
      german[kind][row[0]]=row[2];
    }
  }));
}

const dePokemon=id=>german.pokemon[String(id)]||null;
const deMove=id=>german.move[String(id)]||null;
const deAbility=id=>german.ability[String(id)]||null;
const resourceId=url=>{
  const m=String(url).match(/\/(\d+)\/?$/);
  return m ? m[1] : null;
};
const sprite=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;const shiny=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;const $=id=>document.getElementById(id);let mons=[];let current=null;let isShiny=false;
const natures=['Hart','Solo','Robust','Mutig','Brav','Kühn','Sanft','Locker','Pfiffig','Mäßig','Mild','Hastig','Still','Zart','Forsch','Scheu','Naiv','Ernst','Kauzig','Froh','Frech','Sacht','Lasch','Hitzig','Ruhig'];
const title=s=>s.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' ');
async function json(u){let r=await fetch(u);if(!r.ok)throw Error(r.status);return r.json()}
function nav(){document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));b.classList.add('active');$(b.dataset.page).classList.add('active');scrollTo(0,0)})}
function render(list){$('grid').innerHTML=list.map(p=>`<article class="poke"><button data-id="${p.id}"><div class="pic"><img src="${sprite(p.id)}" alt="${dePokemon(p.id)||title(p.name)}"></div><div class="no">#${String(p.id).padStart(4,'0')}</div><div class="name">${dePokemon(p.id)||title(p.name)}</div></button></article>`).join('');document.querySelectorAll('.poke button').forEach(b=>b.onclick=()=>open(+b.dataset.id))}
function search(){let q=$('search').value.trim().toLowerCase();if(!q){$('suggestions').innerHTML='';render(mons.slice(0,24));return}let m=mons.filter(p=>p.name.includes(q)||(dePokemon(p.id)||'').toLowerCase().includes(q)||String(p.id)===q||String(p.id).padStart(4,'0')===q).slice(0,8);$('suggestions').innerHTML=m.map(p=>`<button class="suggest" data-id="${p.id}"><img src="${sprite(p.id)}"><span>${dePokemon(p.id)||title(p.name)}<br><small>#${String(p.id).padStart(4,'0')}</small></span></button>`).join('');document.querySelectorAll('.suggest').forEach(b=>b.onclick=()=>open(+b.dataset.id));render(m)}
async function open(id){$('modal').hidden=false;document.body.style.overflow='hidden';$('modalbody').innerHTML='<p>Laden …</p>';try{let p=await json(`${API}/pokemon/${id}`),s=await json(`${API}/pokemon-species/${id}`);current={p,s};isShiny=false;detail(p,s)}catch(e){$('modalbody').innerHTML='<h2>Fehler</h2><p>Daten konnten nicht geladen werden.</p>'}}
async function detail(p,s){
  const pname=dePokemon(p.id)||title(p.name);
  const abilities=await Promise.all(
    p.abilities.map(async x=>deAbility(resourceId(x.ability.url))||title(x.ability.name))
  );
  const moves=await Promise.all(
    p.moves.slice(0,80).map(async x=>deMove(resourceId(x.move.url))||title(x.move.name))
  );
  const stats=p.stats.map(x=>`<div class="stat"><span>${({
    hp:'KP',attack:'Angriff',defense:'Verteidigung',
    'special-attack':'Sp. Angriff','special-defense':'Sp. Verteidigung',
    speed:'Initiative'
  })[x.stat.name]}</span><div class="bar"><i style="width:${Math.min(100,x.base_stat/2)}%"></i></div><b>${x.base_stat}</b></div>`).join('');
  const forms=s.varieties.slice(0,30).map(v=>
    `<span class="pill">${dePokemon(resourceId(v.pokemon.url))||title(v.pokemon.name)}</span>`
  ).join('');

  $('modalbody').innerHTML=`
    <div class="detail">
      <div class="detailpic"><img id="ds" src="${sprite(p.id)}" alt="${pname}"></div>
      <div>
        <h2>${pname}</h2>
        <div>#${String(p.id).padStart(4,'0')} · ${p.height/10} m · ${p.weight/10} kg</div>
        <p>${p.types.map(t=>`<span class="pill">${title(t.type.name)}</span>`).join('')}</p>
        <button id="sh" class="pill">✨ Shiny</button>
      </div>
    </div>
    <div class="section"><h3>Formen</h3>${forms||'—'}</div>
    <div class="section"><h3>Fähigkeiten</h3><p>${abilities.join(', ')||'—'}</p></div>
    <div class="section"><h3>Basiswerte</h3>${stats}</div>
    <div class="section"><h3>Attacken (Auswahl)</h3><p>${moves.join(' · ')||'—'}</p></div>
  `;

  $('sh').onclick=()=>{
    isShiny=!isShiny;
    $('ds').src=isShiny?shiny(p.id):sprite(p.id);
  };
}
function calcEV(){let t=['hp','atk','def','spa','spd','spe'].reduce((a,k)=>a+(+($('ev-'+k).value)||0),0);$('evtotal').textContent=`EVs gesamt: ${t} / 510`;$('evtotal').style.color=t>510?'#ff9a9a':''}
async function init(){nav();$('search').oninput=search;$('clear').onclick=()=>{$('search').value='';$('suggestions').innerHTML='';render(mons.slice(0,24));$('search').focus()};$('close').onclick=()=>{$('modal').hidden=true;document.body.style.overflow=''};$('backdrop').onclick=()=>{$('modal').hidden=true;document.body.style.overflow=''};document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('modal').hidden=true;document.body.style.overflow=''}});$('nature').innerHTML=natures.map(x=>`<option>${x}</option>`).join('');['hp','atk','def','spa','spd','spe'].forEach(k=>$('ev-'+k).oninput=calcEV);try{await loadGermanNames();let d=await json(`${API}/pokemon?limit=1025`);mons=d.results.map((p,i)=>({name:p.name,id:i+1}));$('status').textContent=`${mons.length} Pokémon geladen`;render(mons.slice(0,24));let opts=mons.map(p=>`<option value="${p.id}">#${String(p.id).padStart(4,'0')} ${dePokemon(p.id)||title(p.name)}</option>`).join('');$('attacker').insertAdjacentHTML('beforeend',opts);$('defender').insertAdjacentHTML('beforeend',opts)}catch(e){$('status').textContent='Fehler beim Laden. Bitte Seite neu laden.'}}
init();