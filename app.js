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
async function init(){
 nav();$('search').oninput=search;
 $('clear').onclick=()=>{$('search').value='';$('suggestions').innerHTML='';render(mons.slice(0,24));$('search').focus()};
 $('close').onclick=()=>{$('modal').hidden=true;document.body.style.overflow=''};
 $('backdrop').onclick=()=>{$('modal').hidden=true;document.body.style.overflow=''};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('modal').hidden=true;document.body.style.overflow=''}});
 $('nature').innerHTML=['Hart','Solo','Robust','Mutig','Brav','Kühn','Sanft','Locker','Pfiffig','Mäßig','Mild','Hastig','Still','Zart','Forsch','Scheu','Naiv','Ernst','Kauzig','Froh','Frech','Sacht','Lasch','Hitzig','Ruhig'].map(x=>`<option>${x}</option>`).join('');
 ['hp','atk','def','spa','spd','spe'].forEach(k=>$('ev-'+k).oninput=calcEV);
 try{
  await loadGerman();
  const d=await json(`${API}/pokemon?limit=1025`);
  mons=d.results.map((p,i)=>({name:p.name,id:i+1}));
  $('status').textContent=`${mons.length} Pokémon geladen`;render(mons.slice(0,24));
  const opts=mons.map(p=>`<option value="${p.id}">#${String(p.id).padStart(4,'0')} ${deP(p.id)||title(p.name)}</option>`).join('');
  $('attacker').insertAdjacentHTML('beforeend',opts);$('defender').insertAdjacentHTML('beforeend',opts);
 }catch(e){console.error(e);$('status').textContent='Fehler beim Laden. Bitte Seite neu laden.'}
}
init();