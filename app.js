const API='https://pokeapi.co/api/v2';
const LOCAL='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/';
const CHAMPIONS_DATA='https://raw.githubusercontent.com/otterlyclueless/pokemon-champions-data/main/';
let championsMovesData=null,championsLearnsetsData=null;
const CHAMPIONS_TYPE_META={
  Normal:['Normal','◯'],Fire:['Feuer','🔥'],Water:['Wasser','💧'],Electric:['Elektro','⚡'],Grass:['Pflanze','🌿'],Ice:['Eis','❄'],Fighting:['Kampf','✊'],Poison:['Gift','☠'],Ground:['Boden','◆'],Flying:['Flug','🪽'],Psychic:['Psycho','◉'],Bug:['Käfer','🐞'],Rock:['Gestein','◇'],Ghost:['Geist','👻'],Dragon:['Drache','🐉'],Dark:['Unlicht','☾'],Steel:['Stahl','⚙'],Fairy:['Fee','✨']
};
const championsDataCache={};
async function loadChampionsData(){
  if(championsMovesData&&championsLearnsetsData)return;
  if(championsDataCache.promise)return championsDataCache.promise;
  championsDataCache.promise=(async()=>{
    const [moves,learnsets]=await Promise.all([
      fetch(CHAMPIONS_DATA+'moves/moves.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('Champions moves '+r.status);return r.json()}),
      fetch(CHAMPIONS_DATA+'learnsets/learnsets.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('Champions learnsets '+r.status);return r.json()})
    ]);
    championsMovesData=moves;championsLearnsetsData=learnsets;
  })().catch(e=>{console.warn('Champions move data:',e);championsMovesData=[];championsLearnsetsData={};});
  return championsDataCache.promise;
}
function normMoveName(v){return String(v||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,'');}
function normFormName(v){return String(v||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,'');}
function championsFormCandidates(p,s){
  const raw=String(p?._mcLabel||p?.name||'').toLowerCase();
  const species=String(s?.name||p?.species?.name||'').toLowerCase();
  const candidates=[];
  if(p?._mcLabel)candidates.push(p._mcLabel);
  if(raw)candidates.push(raw);
  if(species)candidates.push(species);
  if(raw.includes('mega')){
    const mega=raw.replace(/^.*?mega[- ]?/,'mega ');
    candidates.push(mega,`Mega ${species}`);
    if(raw.includes('-x')||raw.includes(' x'))candidates.push(`Mega ${species} X`);
    if(raw.includes('-y')||raw.includes(' y'))candidates.push(`Mega ${species} Y`);
    if(raw.includes('-z')||raw.includes(' z'))candidates.push(`Mega ${species} Z`);
  }
  if(raw.includes('alola'))candidates.push(`Alolan ${species}`);
  if(raw.includes('galar'))candidates.push(`Galarian ${species}`);
  if(raw.includes('hisui'))candidates.push(`Hisuian ${species}`);
  if(raw.includes('paldea'))candidates.push(`Paldean ${species}`);
  return [...new Set(candidates.map(normFormName).filter(Boolean))];
}
async function getChampionsMovesForPokemon(p,s){
  await loadChampionsData();
  const dex=Number(p?.speciesId||s?.id||p?.id||0);
  if(!dex||!championsLearnsetsData)return [];
  const entries=Object.entries(championsLearnsetsData).filter(([key,v])=>Number(v?.dexNumber)===dex&&Array.isArray(v?.moves));
  if(!entries.length)return [];
  const candidates=championsFormCandidates(p,s);
  let chosen=entries.find(([key])=>candidates.includes(normFormName(key)));
  if(!chosen){
    const isMega=String(p?._mcLabel||p?.name||'').toLowerCase().includes('mega');
    chosen=entries.find(([key,v])=>isMega?v.form==='Mega':v.form==='Base')||entries[0];
  }
  const overrideKey=championsFormOverrideKey(p,s);
  const overrideNames=CHAMPIONS_FORM_MOVE_OVERRIDES[overrideKey];
  let names=(overrideNames||chosen?.[1]?.moves||[]).map(x=>typeof x==='string'?x:x?.name).filter(Boolean);

  // IMPORTANT: the Champions community dataset currently exposes a few
  // regional-form learnsets as a union of the base + regional form. Ninetales
  // already has an explicit hand-checked override above. For every other
  // species with a permanent regional form, use the actual PokéAPI form's
  // move list as a form-specific filter. This keeps the Champions move pool
  // while removing moves that this exact form cannot learn.
  // We intentionally use the already-loaded `p.moves` object here, so there
  // is no extra network request and no additional loading delay.
  const regionalSpeciesIds=new Set([26,38,53,59,80,128,157,199,503,571,618,706,713,724]);
  const isRealApiForm=!p?._mcForm && regionalSpeciesIds.has(dex);
  if(isRealApiForm && !overrideNames){
    const apiMoveNames=new Set((p.moves||[]).map(x=>normMoveName(x?.move?.name||x?.name)).filter(Boolean));
    if(apiMoveNames.size) names=names.filter(name=>apiMoveNames.has(normMoveName(name)));
  }

  const moveMap=new Map((championsMovesData||[]).map(x=>[normMoveName(x.name),x]));
  return names.map(name=>moveMap.get(normMoveName(name))||{name}).filter(m=>m.inChampions!==false);
}
// v5.2 – form-specific Champions learnset corrections.
// The current community dataset exposes Ninetales and Alolan Ninetales with the
// same unioned move list, while the Champions Pokédex distinguishes their form
// learnsets. Keep the correction local so the generic data source remains usable.
const CHAMPIONS_FORM_MOVE_OVERRIDES={
  'ninetales':[
    'Agility','Attract','Baby-Doll Eyes','Baton Pass','Body Slam','Burning Jealousy','Calm Mind','Charm',
    'Confuse Ray','Dark Pulse','Dig','Disable','Double-Edge','Encore','Endure','Energy Ball','Extrasensory',
    'Facade','Fake Tears','Fire Blast','Fire Spin','Flail','Flame Charge','Flamethrower','Flare Blitz',
    'Foul Play','Giga Impact','Healing Wish','Heat Wave','Helping Hand','Hex','Howl','Hyper Beam','Hypnosis',
    'Imprison','Inferno','Iron Tail','Memento','Mystical Fire','Nasty Plot','Night Shade','Overheat',
    'Pain Split','Payback','Power Swap','Protect','Psych Up','Psyshock','Quick Attack','Rest','Roar','Round',
    'Safeguard','Scorching Sands','Shadow Ball','Sleep Talk','Snarl','Snore','Solar Beam','Spite','Stored Power',
    'Substitute','Sunny Day','Tail Slap','Weather Ball','Will-O-Wisp','Zen Headbutt'
  ],
  'alolanninetales':[

    'Agility','Attract','Aurora Veil','Avalanche','Baby-Doll Eyes','Baton Pass','Blizzard','Body Slam',
    'Calm Mind','Charm','Chilling Water','Confuse Ray','Dark Pulse','Dazzling Gleam','Dig','Disable',
    'Double-Edge','Draining Kiss','Encore','Endure','Extrasensory','Facade','Fake Tears','Flail',
    'Foul Play','Freeze-Dry','Giga Impact','Helping Hand','Hex','Howl','Hyper Beam','Hypnosis',
    'Ice Beam','Ice Shard','Icicle Spear','Icy Wind','Imprison','Iron Tail','Misty Terrain','Moonblast',
    'Nasty Plot','Pain Split','Payback','Play Rough','Power Swap','Protect','Psych Up','Psyshock',
    'Rain Dance','Rest','Roar','Round','Safeguard','Sleep Talk','Snore','Snowscape','Spite',
    'Stored Power','Substitute','Tail Slap','Triple Axel','Weather Ball','Wonder Room','Zen Headbutt'
  ]
};
function championsFormOverrideKey(p,s){
  const raw=String(p?._mcLabel||p?.name||'').toLowerCase();
  const species=String(s?.name||p?.species?.name||'').toLowerCase();
  // Ninetales has two distinct Champions learnsets. The base form must use
  // the Kantonian list explicitly; otherwise the generic Champions source can
  // fall back to its combined/unioned entry and leak Alolan moves into it.
  if(species==='ninetales' || raw.includes('ninetales')){
    if(raw.includes('alola')||raw.includes('alolan')||raw.includes('-alola')) return 'alolanninetales';
    return 'ninetales';
  }
  if(raw.includes('alola')||raw.includes('alolan')||raw.includes('-alola')) return normFormName(raw);
  return '';
}
function championsTypeLabel(type){const meta=CHAMPIONS_TYPE_META[type]||[type,'•'];return uiLang==='en'?type:meta[0]}
function championsTypeBadge(type){const meta=CHAMPIONS_TYPE_META[type]||[type,'•'];return `<span class="champ-type champ-type-${String(type).toLowerCase()}"><span class="champ-type-symbol">${meta[1]}</span><span>${championsTypeLabel(type)}</span></span>`}
const championsMoveLabelCache={de:new Map(),en:new Map()};
const championsMoveInfoRegistry=new Map();
function championsMoveLabel(m){
  const english=String(m?.name||'').trim();
  if(!english)return '';
  const lang=uiLang==='en'?'en':'de';
  const key=normMoveName(english);
  if(championsMoveLabelCache[lang].has(key))return championsMoveLabelCache[lang].get(key);
  if(m?.id){const direct=lang==='de'?deM(m.id):localized.en.move[String(m.id)];if(direct){championsMoveLabelCache[lang].set(key,direct);return direct}}
  const source=localized.en.move||{};
  const foundId=Object.keys(source).find(id=>normMoveName(source[id])===key);
  const label=foundId?(lang==='de'?deM(foundId):source[foundId]):english;
  championsMoveLabelCache[lang].set(key,label||english);
  return label||english;
}
function championsMoveId(m){
  if(m?.id)return Number(m.id);
  const key=normMoveName(m?.name);
  const src=localized.en.move||{};
  const id=Object.keys(src).find(x=>normMoveName(src[x])===key);
  return id?Number(id):null;
}
function championsMoveHtml(moves){
  const groups={};
  for(const m of moves){const type=m.type||'Normal';(groups[type] ||= []).push(m)}
  const order=['Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'];
  return order.filter(t=>groups[t]?.length).concat(Object.keys(groups).filter(t=>!order.includes(t)).sort()).map(type=>{
    const entries=groups[type].slice().sort((a,b)=>{const an=championsMoveLabel(a),bn=championsMoveLabel(b);return an.localeCompare(bn,uiLang==='de'?'de':'en')});
    return `<div class="champ-move-type"><div class="champ-type-header">${championsTypeBadge(type)} <span class="move-meta">(${entries.length})</span></div><div class="champ-move-list">${entries.map(m=>{const mid=championsMoveId(m);const key=normMoveName(m.name);championsMoveInfoRegistry.set(key,{id:mid,name:m.name,type:m.type,category:m.category,power:m.power,accuracy:m.accuracy,target:m.target,description:m.description,pp:m.pp,priority:m.priority});return `<div class="champ-move-item"><span class="champ-move-type-mini">${championsTypeBadge(type)}</span><button type="button" class="move-info-link" data-champ-move-key="${escapeHtml(key)}">${escapeHtml(championsMoveLabel(m))}</button><span class="move-meta">${m.category||'—'}${m.power?` · ${m.power}`:''}</span></div>`}).join('')}</div></div>`;
  }).join('');
}
const sprite=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const shiny=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
const $=id=>document.getElementById(id);
let mons=[],current=null,isShiny=false,showAllPokemon=false,showMCOnly=false,dexFilter='all';
const localized={de:{pokemon:{},move:{},ability:{},type:{},item:{},form:{}},en:{pokemon:{},move:{},ability:{},type:{},item:{},form:{}}};
let uiLang=localStorage.getItem('ccc-language')==='en'?'en':'de';
// Regulation Set M-C: newly battle-eligible species and new Mega forms.
// The Pokédex treats these as normal Pokémon forms; the M-C button only highlights the new additions.
// Keep existing Mega forms and replace only duplicate M-C forms supplied by the live data.
const MC_NEW_POKEMON_IDS=[40,53,83,122,317,373,673,768,812,815,818,828,849,853,863,865,871,876,923,930,931,943,998];
const MC_FORMS={
  359:[{key:'mega-z',label:'Mega-Absol Z',types:['dark','ghost'],stats:[65,154,60,75,60,151],ability:'Sharpness',height:1.2,weight:49}],
  373:[{key:'mega',label:'Mega-Brutalanda',types:['dragon','flying'],stats:[95,145,130,120,90,120],ability:'Aerilate'}],
  445:[{key:'mega-z',label:'Mega-Knakrack Z',types:['dragon'],stats:[108,130,85,141,85,151],ability:'Levitate',height:1.9,weight:99}],
  448:[{key:'mega-z',label:'Mega-Lucario Z',types:['fighting','steel'],stats:[70,100,70,164,70,151],ability:'Aura Guard',height:1.3,weight:49.4}],
  768:[{key:'mega',label:'Mega-Tectass',types:['bug','steel'],stats:[75,150,175,70,120,40],ability:'Tough Claws',weight:148}],
  998:[{key:'mega',label:'Mega-Espinodon',types:['dragon','ice'],stats:[115,175,117,105,101,87],ability:'Thermal Exchange',weight:315}]
};
const MC_ABILITY_NAMES={
  'Aura Guard':{de:'Aura-Wache',en:'Aura Guard'},
  'Sharpness':{de:'Scharfsinn',en:'Sharpness'},
  'Levitate':{de:'Schwebe',en:'Levitate'},
  'Aerilate':{de:'Zenithaut',en:'Aerilate'},
  'Tough Claws':{de:'Krallenwucht',en:'Tough Claws'},
  'Thermal Exchange':{de:'Thermowandel',en:'Thermal Exchange'}
};
const MC_ABILITY_DESCRIPTIONS={
  'Aura Guard':{
    de:'Halbiert den Schaden durch Attacken, die direkten Kontakt herstellen.',
    en:'Halves damage taken from moves that make contact.'
  },
  'Sharpness':{de:'Erhöht die Stärke von Schnitt-Attacken.',en:'Powers up slicing moves.'},
  'Levitate':{de:'Das Pokémon ist immun gegen Boden-Attacken.',en:'Gives immunity to Ground-type moves.'},
  'Aerilate':{de:'Verwandelt Normal-Attacken in Flug-Attacken und verstärkt sie.',en:'Turns Normal-type moves into Flying-type moves and powers them up.'},
  'Tough Claws':{de:'Verstärkt Attacken, die direkten Kontakt herstellen.',en:'Powers up moves that make contact.'},
  'Thermal Exchange':{de:'Erhöht den Angriff bei Treffern durch Feuer-Attacken und verhindert Verbrennungen.',en:'Raises Attack when hit by a Fire-type move and prevents burns.'}
};
function mcFormsForSpecies(speciesId){return MC_FORMS[String(speciesId)]||MC_FORMS[Number(speciesId)]||[]}
// Pokémon Champions roster currently available in the game. The Randomizer uses one entry per species,
// while Mega forms are selected separately so a species with multiple Mega Evolutions can show the concrete form.
const CHAMPIONS_AVAILABLE_IDS=[3,6,9,15,18,24,25,26,36,38,40,45,53,59,65,68,71,80,83,94,115,121,122,127,128,130,132,134,135,136,142,143,149,154,157,160,168,181,184,186,196,197,199,205,208,211,212,214,227,229,248,254,257,260,279,282,302,303,306,308,310,317,319,323,324,334,350,351,354,358,359,362,373,376,389,392,395,398,405,407,409,411,428,442,445,448,450,454,460,461,464,470,471,472,473,475,478,479,497,500,503,505,510,512,514,516,518,530,531,534,545,547,553,560,563,569,571,579,584,587,604,609,614,618,623,635,637,652,655,658,660,663,666,668,670,671,673,675,676,678,681,683,685,687,689,691,693,695,697,699,700,701,702,706,707,709,711,713,715,724,727,730,733,740,745,748,750,752,758,763,765,766,768,778,780,784,812,815,818,823,828,841,842,844,849,853,855,858,861,863,865,866,867,869,870,871,876,877,887,899,900,902,903,904,908,911,914,923,925,930,931,934,936,937,939,943,952,956,959,964,968,970,972,979,981,983,998,1000,1013,1018,1019];
const CHAMPIONS_MEGA_IDS=[3,6,9,15,18,26,36,65,71,80,94,115,121,127,130,142,149,154,160,181,208,212,214,227,229,248,254,257,260,282,302,303,306,308,310,319,323,334,354,358,359,362,373,376,398,428,445,448,460,475,478,500,530,531,545,560,604,609,623,652,655,658,668,670,678,687,689,691,701,740,768,780,870,952,970,998];
const randomizerMegaCache=new Map();
function randomPick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function randomizerBaseName(id){const m=mons.find(x=>Number(x.id)===Number(id));return deP(id)||title(m?.name||'')||`#${String(id).padStart(4,'0')}`}
async function getRandomizerMegaForms(speciesId){
  const key=Number(speciesId);
  if(randomizerMegaCache.has(key))return randomizerMegaCache.get(key);
  const promise=(async()=>{
    const forms=[];
    try{
      const species=await json(`${API}/pokemon-species/${key}`);
      for(const v of species.varieties||[]){
        try{
          const fp=await json(v.pokemon.url);
          const raw=String(fp.name||'').toLowerCase();
          if(!raw.includes('mega'))continue;
          fp.speciesId=key;
          fp._randomizerLabel=formDisplayName(fp,key,species.name);
          forms.push(fp);
        }catch(e){}
      }
    }catch(e){}
    for(const f of mcFormsForSpecies(key)){
      if(forms.some(x=>String(x._randomizerLabel||'').toLowerCase()===String(f.label).toLowerCase()))continue;
      try{
        const base=await json(`${API}/pokemon/${key}`);
        const fp=syntheticMCForm(base,f);fp.speciesId=key;fp._randomizerLabel=f.label;fp._calcFormId=`mc-${key}-${f.key}`;forms.push(fp);
      }catch(e){}
    }
    // De-duplicate by display label in case a live API form and the M-C fallback represent the same form.
    const seen=new Set();
    return forms.filter(x=>{const k=String(x._randomizerLabel||x.name).toLowerCase();if(seen.has(k))return false;seen.add(k);return true});
  })();
  randomizerMegaCache.set(key,promise);return promise;
}
async function randomizeTeam(){
  const out=$('randomizerTeam'),megaCount=Number($('randomizerMega')?.value||0),button=$('randomizeButton');
  if(!out)return;
  button.disabled=true;out.innerHTML=`<div class="randomizer-empty randomizer-loading">${uiLang==='en'?'Creating team …':'Team wird erstellt …'}</div>`;
  try{
    const all=[...CHAMPIONS_AVAILABLE_IDS];
    const megaPool=all.filter(id=>CHAMPIONS_MEGA_IDS.includes(id));
    const megaSpecies=[];
    while(megaSpecies.length<megaCount){const id=randomPick(megaPool);if(!megaSpecies.includes(id))megaSpecies.push(id)}
    const remaining=all.filter(id=>!megaSpecies.includes(id));
    const normalSpecies=[];
    while(normalSpecies.length<6-megaCount){const id=randomPick(remaining);if(!normalSpecies.includes(id))normalSpecies.push(id)}
    const megaTeams=await Promise.all(megaSpecies.map(async id=>{const forms=await getRandomizerMegaForms(id);return {id,mega:true,form:randomPick(forms)}}));
    const team=[...megaTeams,...normalSpecies.map(id=>({id,mega:false,form:null}))];
    // Shuffle the final team so Mega Pokémon are not always shown first.
    for(let i=team.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[team[i],team[j]]=[team[j],team[i]]}
    out.innerHTML=team.map((x,i)=>{
      const name=x.mega?(x.form?._randomizerLabel||x.form?._mcLabel||`${randomizerBaseName(x.id)} – Mega`):randomizerBaseName(x.id);
      const imageId=x.mega&&x.form?.id?x.form.id:x.id;
      return `<article class="randomizer-card ${x.mega?'mega':''}"><div class="randomizer-number">#${i+1}</div><div class="randomizer-pic"><img src="${sprite(imageId)}" alt="${name}"></div><div class="randomizer-name">${name}</div>${x.mega?`<span class="randomizer-mega">Mega-Entwicklung</span>`:''}</article>`;
    }).join('');
  }catch(e){console.error('Randomizer:',e);out.innerHTML=`<div class="randomizer-empty">${uiLang==='en'?'The team could not be created. Please try again.':'Das Team konnte nicht erstellt werden. Bitte versuche es erneut.'}</div>`}
  finally{button.disabled=false}
}

function mcAbilityName(name){return MC_ABILITY_NAMES[name]?.[uiLang]||name||''}


// v1.9 calculator state — intentionally kept separate from localization.
const calcState={attacker:null,defender:null,forms:{attacker:[],defender:[]},moves:[],selectedMove:null,selectedHits:1,moveHitMeta:null,abilities:{attacker:[],defender:[]},selectedAbility:{attacker:null,defender:null}};
function csvFields(line){const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q}else if(c===','&&!q){out.push(cur);cur=''}else cur+=c}out.push(cur);return out}
async function loadCSV(lang,kind,file,languageId){const c=new AbortController(),tm=setTimeout(()=>c.abort(),12000);let r;try{r=await fetch(LOCAL+file,{cache:'force-cache',signal:c.signal})}finally{clearTimeout(tm)}if(!r.ok)throw Error(r.status);const t=await r.text(),lines=t.split(/\r?\n/);for(let i=1;i<lines.length;i++){if(!lines[i])continue;const row=csvFields(lines[i]);if(row.length>=3&&row[1]===String(languageId))localized[lang][kind][row[0]]=row[2]}}
async function loadPokemonNames(){const jobs=[];for(const [lang,id] of [['de',6],['en',9]])jobs.push(loadCSV(lang,'pokemon','pokemon_species_names.csv',id));return Promise.allSettled(jobs)}
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
 const rawName=String(fp?.name||'').toLowerCase();
 if(Number(speciesId)===998 && rawName.includes('mega')) return 'Mega-Espinodon';
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

const UI={de:{menu:'Menü',pokedex:'Pokédex',calculator:'Battle Calculator',meta:'Meta & Teams',metaHero:'Aktuelle Turnierdaten, Team-Rankings und Meta-Analysen für Pokémon Champions.',metaSourceLabel:'Datenquelle',metaViewLabel:'Ansicht',metaViewTeams:'Teams',metaViewPokemon:'Pokémon-Meta',metaOpenSource:'Live-API öffnen',metaMostUsed:'🔥 Häufigste Team-Kombinationen',metaBest:'🏆 Stärkste Team-Kombinationen',metaTeamsExplain:'Live aus den Champions-Battle-Daten: häufig gemeinsam verwendete Pokémon-Paare, abgeleitet aus den Teampartner-Daten.',metaBestExplain:'Nach gegenseitiger Teampartner-Nutzung sortiert. Die API liefert hierfür keinen Team-Winrate-Feed, daher werden keine erfundenen Winrates angezeigt.',metaShowMore:'Mehr Datensätze anzeigen',metaShowLess:'Weniger Datensätze anzeigen',metaConcrete:'🧩 Konkrete Top-Teams',metaConcreteExplain:'Veröffentlichte konkrete Turnier-Teams. Diese bleiben getrennt von den live abgeleiteten Team-Kombinationen.',metaShowAllTeams:'Weitere Teams anzeigen',metaShowLessTeams:'Weniger Teams anzeigen',metaIntegration:'Datenanbindung',metaIntegrationText:'Die Team-Ansicht nutzt jetzt live die Pokémon Champions Battle Data API. Team-Kombinationen werden aus aktuellen Teampartner-Daten abgeleitet; veröffentlichte 6er-Turnierlisten bleiben separat und werden nicht mit diesen Ableitungen vermischt.',metaTopPokemon:'📈 Aktuelle Pokémon-Meta',metaPokemonExplain:'Live-Rangliste aus den aktuellen Champions-Battle-Daten.',dexHero:'Deutsche Pokémon-Daten und Kampfvorbereitung.',calcHero:'Level 50 · Statuswertpunkte · Wesen · Status · Statuswertänderungen.',searchPokemon:'Pokémon suchen',searchPlaceholder:'Name oder Pokédex-Nummer',dexFilterLabel:'Pokédex-Auswahl',dexFilterAll:'Alle Pokémon',dexFilterChampions:'In Pokémon Champions verfügbar',attacker:'Angreifer',defender:'Verteidiger',pokemonSearch:'Pokémon suchen',form:'Form',moveSearch:'Attacke suchen',nature:'Wesen',itemSearch:'Item suchen',spTitle:'Statuswertpunkte-Verteilung',spHelp:'Max. 32 pro Statuswert · 66 insgesamt',field:'Feldstatus',weather:'Wetter',fieldHelp:'Feld und Wetter werden bei der Schadensberechnung berücksichtigt.',attackButton:'Attacke',preliminary:'Die Schadensberechnung bleibt bis zum verifizierten Champions-Regelsatz vorläufig.',loading:'Pokémon werden geladen …',loadError:'Pokémon konnten nicht geladen werden.',showAll:'Alle Pokémon anzeigen',showLess:'Weniger anzeigen',showMC:'M-C-Neuzugänge anzeigen',showAllDex:'Gesamten Pokédex anzeigen',randomizer:'Randomizer',randomizerHero:'Erstelle ein zufälliges Team aus den in Pokémon Champions verfügbaren Pokémon.',randomizerMegaLabel:'Enthält Mega-Entwicklungen',randomizerNoMega:'Nein',randomizerOneMega:'Eine Mega-Entwicklung',randomizerTwoMega:'Zwei Mega-Entwicklungen',randomize:'Randomize',randomizerHelp:'Jedes Team enthält sechs verschiedene Pokémon. Wenn Mega-Entwicklungen gewählt werden, wird die konkrete Mega-Form direkt angezeigt.',hitCount:'Trefferanzahl',hits:'Treffer',hitRangeHelp:'Wähle, wie viele Treffer landen.'},en:{menu:'Menu',pokedex:'Pokédex',calculator:'Battle Calculator',meta:'Meta & Teams',metaHero:'Current tournament data, team rankings and Pokémon Champions meta analysis.',metaSourceLabel:'Data source',metaViewLabel:'View',metaViewTeams:'Teams',metaViewPokemon:'Pokémon meta',metaOpenSource:'Open live source',metaMostUsed:'🔥 Most common team combinations',metaBest:'🏆 Strongest team combinations',metaTeamsExplain:'Live from Champions battle data: commonly paired Pokémon derived from teammate usage.',metaBestExplain:'Sorted by mutual teammate usage. The API does not expose a team win-rate feed, so no win rates are fabricated.',metaShowMore:'Show more datasets',metaShowLess:'Show fewer datasets',metaConcrete:'🧩 Concrete top teams',metaConcreteExplain:'Published concrete tournament teams. These stay separate from the live-derived team combinations.',metaShowAllTeams:'Show more teams',metaShowLessTeams:'Show fewer teams',metaIntegration:'Data connection',metaIntegrationText:'The Teams view now uses the Pokémon Champions Battle Data API live. Team combinations are derived from current teammate data; published six-Pokémon tournament lists remain separate and are never mixed with derived combinations.',metaTopPokemon:'📈 Current Pokémon meta',metaPokemonExplain:'Live ranking from current Champions battle data.',dexHero:'Official Pokémon data and battle preparation.',calcHero:'Level 50 · Stat Points · Nature · Status · Stat changes.',searchPokemon:'Search Pokémon',searchPlaceholder:'Name or Pokédex number',dexFilterLabel:'Pokédex filter',dexFilterAll:'All Pokémon',dexFilterChampions:'Available in Pokémon Champions',attacker:'Attacker',defender:'Defender',pokemonSearch:'Search Pokémon',form:'Form',moveSearch:'Search Move',nature:'Nature',itemSearch:'Search Item',spTitle:'Stat Point Distribution',spHelp:'Max. 32 per stat · 66 total',field:'Field',weather:'Weather',fieldHelp:'Field and weather are included in the damage calculation.',attackButton:'Move',preliminary:'Damage calculation remains preliminary until the verified Champions ruleset.',loading:'Loading Pokémon …',loadError:'Pokémon could not be loaded.',showAll:'Show all Pokémon',showLess:'Show fewer Pokémon',showMC:'Show M-C additions',showAllDex:'Show full Pokédex',randomizer:'Randomizer',randomizerHero:'Create a random team from the Pokémon currently available in Pokémon Champions.',randomizerMegaLabel:'Contains Mega Evolutions',randomizerNoMega:'No',randomizerOneMega:'One Mega Evolution',randomizerTwoMega:'Two Mega Evolutions',randomize:'Randomize',randomizerHelp:'Each team contains six different Pokémon. When Mega Evolutions are selected, the concrete Mega form is shown directly.',hitCount:'Number of hits',hits:'hits',hitRangeHelp:'Choose how many hits connect.'}};
function t(k){return UI[uiLang]?.[k]??UI.en[k]??k}
function applyLanguage(){document.documentElement.lang=uiLang;const sel=$('languageSelect');if(sel)sel.value=uiLang;document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=t(e.dataset.i18n));const ph=$('search');if(ph)ph.placeholder=t('searchPlaceholder');const navs=document.querySelectorAll('.nav');if(navs[0])navs[0].textContent=t('pokedex');if(navs[1])navs[1].textContent=t('calculator');if(navs[2])navs[2].textContent=t('randomizer');if(navs[3])navs[3].textContent=t('meta');document.querySelectorAll('[data-i18n]').forEach(e=>{if(e.tagName==='OPTION')e.textContent=t(e.dataset.i18n)});const heads=document.querySelectorAll('.calc-title h2');if(heads[0])heads[0].textContent=t('attacker');if(heads[1])heads[1].textContent=t('defender');document.querySelectorAll('#attackerCard>label:first-of-type,#defenderCard>label:first-of-type').forEach(e=>e.childNodes[0].textContent=t('pokemonSearch')+'\n      ');const ml=document.querySelector('#moveSearch')?.parentElement;if(ml)ml.childNodes[0].textContent=t('moveSearch')+'\n      ';document.querySelectorAll('.combatant-card-v14 h3').forEach(e=>e.textContent=t('spTitle'));document.querySelectorAll('.sp-help').forEach(e=>e.textContent=t('spHelp'));const fl=document.querySelectorAll('.field-controls-v16 .twocol label');if(fl[0])fl[0].childNodes[0].textContent=t('field');if(fl[1])fl[1].childNodes[0].textContent=t('weather');const fh=document.querySelector('.field-help');if(fh)fh.textContent=t('fieldHelp');if($('calcButton'))$('calcButton').textContent=t('attackButton');const no=document.querySelector('.notice');if(no)no.textContent=t('preliminary');const sts=statusOptions();['atkStatus','defStatus'].forEach(id=>{const e=$(id);if(e)e.innerHTML=sts.map(x=>`<option>${x}</option>`).join('')});const fieldNames=uiLang==='en'?['No Terrain','Electric Terrain','Grassy Terrain','Psychic Terrain','Misty Terrain']:['Kein Feld','Elektrofeld','Grasfeld','Psychofeld','Nebelfeld'];const weatherNames=uiLang==='en'?['No Weather','Sun','Rain','Sandstorm','Snow']:['Kein Wetter','Sonnenschein','Regen','Sandsturm','Schnee'];const fs=$('fieldStatus'),ws=$('weatherStatus');if(fs)[...fs.options].forEach((o,i)=>o.textContent=fieldNames[i]);if(ws)[...ws.options].forEach((o,i)=>o.textContent=weatherNames[i]);const fp=$('atkSearch');if(fp)fp.placeholder=t('searchPlaceholder');const dp=$('defSearch');if(dp)dp.placeholder=t('searchPlaceholder');const ip=$('atkItemSearch');if(ip)ip.placeholder=t('itemSearch');const ip2=$('defItemSearch');if(ip2)ip2.placeholder=t('itemSearch');const mi=$('moveSearch');if(mi)mi.placeholder=t('moveSearch');}
function dexPool(){const base=dexFilter==='champions'?mons.filter(p=>CHAMPIONS_AVAILABLE_IDS.includes(Number(p.id))):mons;return showMCOnly?base.filter(p=>MC_NEW_POKEMON_IDS.includes(Number(p.id))):base}
function dexInitialList(){const pool=dexPool();return showAllPokemon?pool:pool.slice(0,24)}
function setLanguage(lang){uiLang=lang==='en'?'en':'de';localStorage.setItem('ccc-language',uiLang);applyLanguage();fillOptions();if(mons.length)render(dexInitialList());if(calcState.attacker)updateCalcSide('atk');if(calcState.defender)updateCalcSide('def');if(calcState.attacker)loadCalcMoves();if(calcState.selectedMove)showMoveInfoById(calcState.selectedMove)}

function nav(){const menu=$('mainNav'),toggle=$('menuToggle');document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));b.classList.add('active');$(b.dataset.page).classList.add('active');if(b.dataset.page==='meta')renderMeta();if(menu){menu.classList.remove('open');toggle?.setAttribute('aria-expanded','false')}scrollTo(0,0)});toggle?.addEventListener('click',()=>{const open=!menu.classList.contains('open');menu.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open))});document.addEventListener('click',e=>{if(menu&&!menu.contains(e.target)&&toggle&&!toggle.contains(e.target)){menu.classList.remove('open');toggle.setAttribute('aria-expanded','false')}})}

const META_POKEMON=[['Kingambit',33.4,52.0,28645],['Sneasler',33.3,50.2,28527],['Garchomp',33.1,50.5,28368],['Incineroar',32.2,49.9,27627],['Basculegion',28.4,51.6,24304],['Charizard',23.0,51.2,19699],['Sinistcha',21.5,49.3,18425],['Whimsicott',16.8,49.3,14418],['Farigiraf',16.6,48.8,14257],['Eternal Flower Floette',16.2,53.2,13911],['Aerodactyl',13.8,50.6,11820],['Archaludon',13.2,50.1,11332]];
const META_TEAM_STATS=[['#1',315,53.50,834,725],['#2',158,48.33,361,386],['#3',143,48.77,356,374],['#4',118,61.26,408,258],['#5',100,54.90,308,253],['#6',99,49.20,215,222],['#7',96,50.58,218,213],['#8',90,57.11,265,199],['#9',89,56.88,273,207],['#10',79,51.59,195,183],['#11',75,39.36,135,208],['#12',73,54.30,202,169],['#13',70,51.40,183,173],['#14',64,55.27,173,140],['#15',61,55.64,148,118],['#16',61,38.91,100,157],['#17',56,47.19,143,159],['#18',56,42.00,105,145],['#19',55,50.85,120,116],['#20',55,47.93,116,126],['#21',51,54.55,114,95],['#22',50,51.39,111,105]];
const META_CONCRETE_TEAMS=[
 {player:'Lloyd Villar',record:'13-1',event:'Make It Rain - VGC Tournament Rank #1',pokemon:[
  {name:'Sneasler',ability:'Unburden',item:'Psychic Seed',moves:['Close Combat','Dire Claw','Protect','Acrobatics']},
  {name:'Salamence-Mega',ability:'Intimidate',item:'Salamencite',moves:['Hyper Voice','Protect','Tailwind','Draco Meteor']},
  {name:'Tyranitar-Mega',ability:'Sand Stream',item:'Tyranitarite',moves:['Protect','Rock Slide','Knock Off','Dragon Dance']},
  {name:'Excadrill',ability:'Sand Rush',item:'Focus Sash',moves:['High Horsepower','Protect','Rock Slide','Iron Head']},
  {name:'Indeedee',ability:'Psychic Surge',item:'Choice Scarf',moves:['Expanding Force','Trick','Trick Room','Dazzling Gleam']},
  {name:'Milotic',ability:'Competitive',item:'Leftovers',moves:['Protect','Muddy Water','Hypnosis','Coil']}
 ]},
 {player:'Luca',record:'13-2',event:"Maddo's Cup #12 | Reg M-C Rank #1",pokemon:[
  {name:'Salamence-Mega',ability:'Intimidate',item:'Salamencite',moves:['Hyper Voice','Draco Meteor','Tailwind','Protect']},
  {name:'Raichu-Mega-Y',ability:'Lightning Rod',item:'Raichunite Y',moves:['Zap Cannon','Focus Blast','Fake Out','Protect']},
  {name:'Arcanine-Hisui',ability:'Rock Head',item:'Focus Sash',moves:['Flare Blitz','Head Smash','Extreme Speed','Protect']},
  {name:'Sylveon',ability:'Pixilate',item:'Fairy Feather',moves:['Hyper Voice','Hyper Beam','Quick Attack','Detect']},
  {name:'Gholdengo',ability:'Good as Gold',item:'Life Orb',moves:['Make It Rain','Shadow Ball','Nasty Plot','Protect']},
  {name:'Rillaboom',ability:'Grassy Surge',item:'Miracle Seed',moves:['Fake Out','Grassy Glide','Wood Hammer','High Horsepower']}
 ]},
 {player:'DDee',record:'12-0',event:"Talon's FIGHT CLUB #101 - Champions Reg M-C Rank #1",pokemon:[
  {name:'Floette-Eternal-Mega',ability:'Flower Veil',item:'Floettite',moves:['Moonblast','Dazzling Gleam','Calm Mind','Protect']},
  {name:'Sneasler',ability:'Unburden',item:'Grassy Seed',moves:['Close Combat','Dire Claw','Rock Slide','Protect']},
  {name:'Incineroar',ability:'Intimidate',item:'Sitrus Berry',moves:['Flare Blitz','Throat Chop','Fake Out','Parting Shot']},
  {name:'Rillaboom',ability:'Grassy Surge',item:'Miracle Seed',moves:['Wood Hammer','Grassy Glide','High Horsepower','Fake Out']},
  {name:'Gholdengo',ability:'Good as Gold',item:'Life Orb',moves:['Make It Rain','Shadow Ball','Nasty Plot','Protect']},
  {name:'Raichu-Mega-Y',ability:'Lightning Rod',item:'Raichunite Y',moves:['Zap Cannon','Focus Blast','Encore','Protect']}
 ]},
 {player:'Mahir X',record:'10-1',event:'Coupe Critique Champions #4 - Rank #1',pokemon:[
  {name:'Swampert-Mega',ability:'Torrent',item:'Swampertite',moves:['Wave Crash','Earthquake','Ice Punch','Protect']},
  {name:'Pelipper',ability:'Drizzle',item:'Sitrus Berry',moves:['Weather Ball','Hurricane','Tailwind','Wide Guard']},
  {name:'Archaludon',ability:'Stamina',item:'Leftovers',moves:['Electro Shot','Dragon Pulse','Flash Cannon','Protect']},
  {name:'Grimmsnarl',ability:'Prankster',item:'Light Clay',moves:['Light Screen','Reflect','Parting Shot','Spirit Break']},
  {name:'Charizard-Mega-Y',ability:'Blaze',item:'Charizardite Y',moves:['Weather Ball','Heat Wave','Hurricane','Protect']},
  {name:'Venusaur',ability:'Chlorophyll',item:'Focus Sash',moves:['Leaf Storm','Sleep Powder','Sludge Bomb','Protect']}
 ]},
 {player:'ZayGM',record:'10-0',event:'Final Weekly Qualifier - Rank #1',pokemon:[
  {name:'Salamence-Mega',ability:'Intimidate',item:'Salamencite',moves:['Draco Meteor','Hyper Voice','Tailwind','Protect']},
  {name:'Sneasler',ability:'Unburden',item:'White Herb',moves:['Fake Out','Dire Claw','Close Combat','Protect']},
  {name:'Rillaboom',ability:'Grassy Surge',item:'Miracle Seed',moves:['Fake Out','Grassy Glide','Wood Hammer','High Horsepower']},
  {name:'Tyranitar-Mega',ability:'Sand Stream',item:'Tyranitarite',moves:['Rock Slide','Knock Off','Fire Punch','Protect']},
  {name:'Gholdengo',ability:'Good as Gold',item:'Life Orb',moves:['Make It Rain','Shadow Ball','Protect','Nasty Plot']},
  {name:'Excadrill',ability:'Sand Rush',item:'Focus Sash',moves:['High Horsepower','Rock Slide','Iron Head','Protect']}
 ]},
 {player:'Lightoz',record:'12-0',event:'ValkrixVGC Pokémon Champions League #03 - Rank #1',pokemon:[
  {name:'Sneasler',ability:'Unburden',item:'Psychic Seed',moves:['Close Combat','Dire Claw','Throat Chop','Protect']},
  {name:'Indeedee',ability:'Psychic Surge',item:'Focus Sash',moves:['Expanding Force','Helping Hand','Trick Room','Protect']},
  {name:'Sylveon',ability:'Pixilate',item:'Fairy Feather',moves:['Hyper Voice','Hyper Beam','Quick Attack','Detect']},
  {name:'Basculegion',ability:'Adaptability',item:'Life Orb',moves:['Wave Crash','Last Respects','Aqua Jet','Protect']},
  {name:'Dragonite-Mega',ability:'Multiscale',item:'Dragoninite',moves:['Dragon Pulse','Heat Wave','Tailwind','Protect']},
  {name:'Incineroar',ability:'Intimidate',item:'Sitrus Berry',moves:['Flare Blitz','Throat Chop','Fake Out','Parting Shot']}
 ]},
 {player:'Corro',record:'9-0',event:"HeroicTitan’s VGC Battle Arena Rank #1",pokemon:[
  {name:'Froslass-Mega',ability:'Cursed Body',item:'Froslassite',moves:['Blizzard','Shadow Ball','Aurora Veil','Protect']},
  {name:'Raichu-Mega-Y',ability:'Lightning Rod',item:'Raichunite Y',moves:['Zap Cannon','Focus Blast','Encore','Protect']},
  {name:'Rillaboom',ability:'Grassy Surge',item:'Miracle Seed',moves:['Fake Out','Grassy Glide','Wood Hammer','High Horsepower']},
  {name:'Kingambit',ability:'Defiant',item:'Life Orb',moves:['Kowtow Cleave','Sucker Punch','Swords Dance','Protect']},
  {name:'Sneasler',ability:'Unburden',item:'Grassy Seed',moves:['Close Combat','Dire Claw','Fake Out','Protect']},
  {name:'Arcanine-Hisui',ability:'Rock Head',item:'Focus Sash',moves:['Flare Blitz','Head Smash','Extreme Speed','Protect']}
 ]}
];
const META_TEAM_PROFILE_NOTE='EV-Splits und Wesen werden im veröffentlichten Top-Team-Feed nicht mit ausgeliefert. Sobald der Team-Builder/API diese Werte bereitstellt, werden sie hier ergänzt.';
const META_RANKING_PREVIEWS=[
 ['Rillaboom','Sneasler','Incineroar','Salamence-Mega'],
 ['Incineroar','Rillaboom','Sneasler','Kingambit'],
 ['Rillaboom','Salamence-Mega','Sneasler','Gholdengo'],
 ['Gholdengo','Raichu-Mega-Y','Rillaboom','Arcanine-Hisui'],
 ['Kingambit','Rillaboom','Sneasler','Salamence-Mega'],
 ['Rillaboom','Sneasler','Gholdengo','Salamence-Mega']
];
let metaStatsExpanded=false,metaBestExpanded=false,metaConcreteExpanded=false;
const CHAMPIONS_BATTLE_API='https://championsbattledata.com/api';
let liveTeamMetaCache=null,liveTeamMetaPromise=null;
function liveApiPokemonId(x){return String(x?.showdownId||x?.id||x?.name||x?.title||x?.saved_name||'').trim().toLowerCase().replace(/[^a-z0-9-]/g,'')}
function liveApiDisplayName(x){return String(x?.showdownName||x?.name||x?.saved_name||x?.title||x?.base_name||x?.showdownId||x?.id||'').trim()}
function liveApiNumber(v){if(typeof v==='number'&&Number.isFinite(v))return v;if(typeof v==='string'){const m=v.replace(',','.').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):0}return 0}
function liveApiPick(obj,keys){
  if(!obj||typeof obj!=='object')return 0;
  for(const k of keys){if(obj[k]!==undefined&&obj[k]!==null){const n=liveApiNumber(obj[k]);if(n>0)return n}}
  return 0;
}
function liveApiSummary(entry){
  const s=entry?.summary||{};
  const byFormat=s?.Doubles||s?.doubles||s?.formats?.Doubles||s?.formats?.doubles||entry?.Doubles||entry?.doubles||{};
  const rank=liveApiPick(byFormat,['rank','usage_rank','usageRank','doublesRank','doubles_rank'])||liveApiPick(s,['doublesRank','doubles_rank','usageRank','usage_rank','rank'])||liveApiPick(entry,['doublesRank','doubles_rank','usageRank','usage_rank','rank']);
  const usage=liveApiPick(byFormat,['usage_percentage','usagePercentage','usage','percentage','share'])||liveApiPick(s,['doublesUsage','doubles_usage','usage_percentage','usagePercentage','usage','percentage','share'])||liveApiPick(entry,['doublesUsage','doubles_usage','usage_percentage','usagePercentage','usage','percentage','share']);
  return {rank,usage};
}
function liveApiBaseName(name){
  const raw=String(name||'').toLowerCase().trim().replace(/[’']/g,"'");
  return raw.split('-')[0];
}
function liveApiChampionsAvailable(name){
  if(!Array.isArray(CHAMPIONS_AVAILABLE_IDS)||!mons.length)return true;
  const base=liveApiBaseName(name);
  const m=mons.find(x=>String(x.name||'').toLowerCase()===base);
  return !!m && CHAMPIONS_AVAILABLE_IDS.includes(Number(m.id));
}
function metaPokemonDexId(name){
  const aliases={'Rillaboom':274,'Sneasler':903,'Incineroar':727,'Gholdengo':1000,'Sylveon':700,'Arcanine-Hisui':10288,'Excadrill':530,'Indeedee':876,'Milotic':350,'Politoed':186,'Archaludon':1018,'Kingambit':983,'Garchomp-Mega-Z':10258,'Raichu-Mega-Y':10281,'Floette-Eternal':648};
  const direct=aliases[name];
  if(direct)return direct;
  const base=liveApiBaseName(name);
  const m=mons.find(x=>String(x.name||'').toLowerCase()===base);
  return m?.id||0;
}
async function loadLiveTeamMeta(){
  if(liveTeamMetaCache)return liveTeamMetaCache;
  if(liveTeamMetaPromise)return liveTeamMetaPromise;
  liveTeamMetaPromise=(async()=>{
    const index=await json(`${CHAMPIONS_BATTLE_API}/index`,12000);
    const raw=Array.isArray(index?.pokemon)?index.pokemon:[];
    if(!raw.length)throw new Error('Champions Battle Data API: /api/index enthält keine Pokémon-Liste.');
    const ranked=raw.map(x=>{const stats=liveApiSummary(x);return {raw:x,id:liveApiPokemonId(x),name:liveApiDisplayName(x),rank:stats.rank,usage:stats.usage}})
      .filter(x=>x.id&&x.name&&liveApiChampionsAvailable(x.name)&&(x.rank>0||x.usage>0))
      .sort((a,b)=>a.rank&&b.rank?a.rank-b.rank:(b.usage-a.usage)||a.name.localeCompare(b.name))
      .slice(0,20);
    if(!ranked.length)throw new Error('Champions Battle Data API: keine aktuellen Rangdaten für Champions-Pokémon gefunden.');
    const detailed=await Promise.all(ranked.map(async p=>{
      if(p.usage>0)return p;
      try{
        const rec=await json(`${CHAMPIONS_BATTLE_API}/pokemon/${encodeURIComponent(p.id)}?format=Doubles`,12000);
        const stats=liveApiSummary(rec);
        return {...p,rank:stats.rank||p.rank,usage:stats.usage||p.usage};
      }catch(e){return p}
    }));
    detailed.sort((a,b)=>a.rank&&b.rank?a.rank-b.rank:(b.usage-a.usage)||a.name.localeCompare(b.name));
    const finalRanked=detailed.map((x,i)=>({...x,rank:x.rank||i+1}));
    const records=await Promise.all(finalRanked.map(async p=>{
      try{return {p,data:await json(`${CHAMPIONS_BATTLE_API}/battle/Doubles/${encodeURIComponent(p.id)}`,12000)}}catch(e){console.warn('Live team data unavailable for',p.id,e);return {p,data:null}}
    }));
    const pairMap=new Map(),usageMap=new Map(finalRanked.map(x=>[x.id,x])),seasons=new Set();
    for(const {p,data} of records){
      if(data?.season)seasons.add(String(data.season));
      const rows=Array.isArray(data?.rows)?data.rows:[];
      for(const row of rows.filter(r=>String(r.category||'').toLowerCase().startsWith('teammate')).slice(0,30)){
        const otherId=liveApiPokemonId({showdownId:row.showdownId||row.id||row.name,name:row.name});
        const otherName=String(row.name||row.showdownName||row.title||'').trim();
        if(!otherId||!otherName||otherId===p.id||!liveApiChampionsAvailable(otherName))continue;
        const pct=liveApiNumber(row.percentage_value??row.percentage);
        if(!(pct>0))continue;
        const a=p.id,b=otherId,key=[a,b].sort().join('|');
        const rec=pairMap.get(key)||{a:{id:a,name:p.name},b:{id:b,name:otherName},values:[]};
        rec.values.push({from:a,to:b,pct});pairMap.set(key,rec);
      }
    }
    const pairs=[...pairMap.values()].map(x=>{const aRec=usageMap.get(x.a.id),bRec=usageMap.get(x.b.id),values=x.values.map(v=>v.pct).filter(Number.isFinite);const mutual=values.length?values.reduce((a,b)=>a+b,0)/values.length:0;return {names:[x.a.name,x.b.name],score:mutual,min:Math.min(...values),max:Math.max(...values),usageA:aRec?.usage||0,usageB:bRec?.usage||0,rankA:aRec?.rank||0,rankB:bRec?.rank||0}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.rankA-b.rankA||a.rankB-b.rankB).slice(0,22);
    const pokemonRows=finalRanked.map(x=>({name:x.name,rank:x.rank,usage:x.usage}));
    liveTeamMetaCache={ranked:finalRanked,pokemonRows,pairs,season:seasons.size===1?[...seasons][0]:(index?.defaultSeason||'Current'),updatedAt:new Date(),hasLivePairs:pairs.length>0};
    return liveTeamMetaCache;
  })().catch(e=>{liveTeamMetaPromise=null;throw e});
  return liveTeamMetaPromise;
}
function metaPokemonLabel(name){const id=metaPokemonDexId(name);return id?(deP(id)||name):name;}
function metaTeamPokemon(name){return `<span class="meta-team-poke">${metaPokemonLabel(name)}</span>`}
function metaProfilePokemon(p){return `<div class="meta-profile-poke"><div class="meta-profile-poke-head"><b>${metaPokemonLabel(p.name)}</b><span>${p.item||'—'}</span></div><div class="meta-profile-meta"><span><strong>${uiLang==='en'?'Ability':'Fähigkeit'}:</strong> ${p.ability||'—'}</span><span><strong>${uiLang==='en'?'Nature / EVs':'Wesen / EVs'}:</strong> ${p.nature||'—'}${p.evs?` · ${p.evs}`:''}</span></div><div class="meta-profile-moves">${(p.moves||[]).map(m=>`<span>${m}</span>`).join('')}</div></div>`}
function openMetaTeamProfile(index){const team=META_CONCRETE_TEAMS[index];if(!team)return;$('infoTitle').textContent=`${team.player} · ${team.record}`;$('infoBody').innerHTML=`<div class="meta-profile"><p class="meta-profile-event">${team.event||''}</p><div class="meta-profile-grid">${team.pokemon.map(metaProfilePokemon).join('')}</div><p class="meta-profile-note">${META_TEAM_PROFILE_NOTE}</p><a class="secondary meta-profile-source" href="https://championsbattledata.com/pokemon-champions-tournament-teams/" target="_blank" rel="noopener">Pokémon Champions Battle Data – Tournament Teams</a></div>`;$('infoModal').hidden=false}
function metaRankingPreview(index){const arr=META_RANKING_PREVIEWS[index%META_RANKING_PREVIEWS.length]||[];return arr.map(metaTeamPokemon).join('')}

async function renderMeta(){
 const source=$('metaSource')?.value||'championsApi',view=$('metaView')?.value||'teams',link=$('metaSourceLink');
 if(link)link.href=source==='championsApi'?'https://championsbattledata.com/api_guide':source==='suckerpunch'?'https://suckerpunch.gg/':'https://pikalytics.com/team-usage';
 $('metaTeamsView').hidden=view!=='teams';$('metaPokemonView').hidden=view!=='pokemon';
 const status=$('metaStatus');
 if(source!=='championsApi'){
   if(status)status.textContent=source==='pikalytics'?'Pikalytics · externe Team-Usage':'Suckerpunch · externe Meta-Quelle';
 }else if(status)status.textContent=uiLang==='en'?'Loading live Champions Battle Data …':'Live Champions-Battle-Daten werden geladen …';
 if(source==='championsApi'){
   try{
     const live=await loadLiveTeamMeta();
     const seasonLabel=live.season&&live.season!=='Current'?` · ${live.season}`:'';
     if(status)status.textContent=view==='pokemon'
       ?(uiLang==='en'?`Live API${seasonLabel} · ${live.pokemonRows.length} ranked Pokémon · updated ${live.updatedAt.toLocaleTimeString()}`:`Live-API${seasonLabel} · ${live.pokemonRows.length} gerankte Pokémon · aktualisiert ${live.updatedAt.toLocaleTimeString()}`)
       :(live.pairs.length
         ?(uiLang==='en'?`Live API${seasonLabel} · ${live.pairs.length} team combinations · updated ${live.updatedAt.toLocaleTimeString()}`:`Live-API${seasonLabel} · ${live.pairs.length} Team-Kombinationen · aktualisiert ${live.updatedAt.toLocaleTimeString()}`)
         :(uiLang==='en'?`Live API${seasonLabel} · no current team combinations · checked ${live.updatedAt.toLocaleTimeString()}`:`Live-API${seasonLabel} · noch keine aktuellen Team-Kombinationen · geprüft ${live.updatedAt.toLocaleTimeString()}`));
     const badges={teams:'LIVE API',pokemon:'LIVE API'};
     ['metaTeamsSourceBadge','metaBestSourceBadge','metaPokemonSourceBadge'].forEach(id=>{const el=$(id);if(el)el.textContent=badges[view]||'LIVE API'});
     const concreteBadge=$('metaConcreteSourceBadge');if(concreteBadge)concreteBadge.textContent='Pikalytics';
     if(view==='teams'){
       const a=$('metaTeamRows'),b=$('metaBestRows');
       const used=metaStatsExpanded?live.pairs:live.pairs.slice(0,6);
       a.innerHTML=used.map((x,i)=>`<div class="meta-team-row"><div class="meta-team-rank">#${i+1}</div><div><b>${x.names.map(metaTeamPokemon).join(' + ')}</b><div class="meta-muted">${x.min.toFixed(1)}–${x.max.toFixed(1)}% Teampartner-Nutzung</div></div><div class="meta-team-stat"><b>${x.score.toFixed(1)}%</b><span>Partner-Score</span></div></div>`).join('');
       const best=live.pairs.slice().sort((a,b)=>b.score-a.score),bestShown=metaBestExpanded?best:best.slice(0,6);
       b.innerHTML=bestShown.map((x,i)=>`<div class="meta-team-row"><div class="meta-team-rank">#${i+1}</div><div><b>${x.names.map(metaTeamPokemon).join(' + ')}</b><div class="meta-muted">Ränge #${x.rankA} + #${x.rankB} · ${x.min.toFixed(1)}–${x.max.toFixed(1)}%</div></div><div class="meta-team-stat"><b>${x.score.toFixed(1)}%</b><span>Partner-Score</span></div></div>`).join('');
       const mb=$('metaMoreStats'),mbe=$('metaMoreBest');if(mb){mb.textContent=t(metaStatsExpanded?'metaShowLess':'metaShowMore');mb.hidden=live.pairs.length<=6}if(mbe){mbe.textContent=t(metaBestExpanded?'metaShowLess':'metaShowMore');mbe.hidden=live.pairs.length<=6}
       const concrete=$('metaConcreteTeams');if(concrete){const list=metaConcreteExpanded?META_CONCRETE_TEAMS:META_CONCRETE_TEAMS.slice(0,4);concrete.innerHTML=list.map((team,i)=>`<article class="meta-concrete-team"><div class="meta-concrete-head"><div><b>${team.player}</b><span>${team.record}</span></div><span class="meta-team-rank">#${i+1}</span></div><div class="meta-concrete-pokemon">${team.pokemon.map(p=>metaTeamPokemon(p.name)).join('')}</div><button class="secondary meta-profile-button" type="button" data-team-profile="${i}">${uiLang==='en'?'Complete team profile':'Komplettes Teamprofil'}</button></article>`).join('');document.querySelectorAll('.meta-profile-button').forEach(btn=>btn.onclick=()=>openMetaTeamProfile(Number(btn.dataset.teamProfile)));const bt=$('metaShowAllTeams');if(bt){bt.textContent=t(metaConcreteExpanded?'metaShowLessTeams':'metaShowAllTeams');bt.hidden=META_CONCRETE_TEAMS.length<=4}}
     }else{
       const rows=live.pokemonRows;
       $('metaPokemonRows').innerHTML=rows.length?rows.map(x=>{
         const hasUsage=Number.isFinite(x.usage)&&x.usage>0;
         const barWidth=hasUsage?Math.min(100,Math.max(0,x.usage)):Math.max(4,Math.min(100,(21-Math.min(x.rank,20))*5));
         const stat=hasUsage?`${x.usage.toFixed(1)}%`:`Rang #${x.rank}`;
         return `<div class="meta-pokemon-row"><div class="meta-pokemon-rank">${x.rank}</div><div class="meta-pokemon-name">${metaPokemonLabel(x.name)}</div><div><div class="meta-pokemon-bar"><span style="width:${barWidth}%"></span></div></div><div class="meta-pokemon-stat">${stat}</div></div>`;
       }).join(''):'<p class="meta-muted">'+(uiLang==='en'?'No current ranked Pokémon data available.':'Keine aktuellen Pokémon-Rangdaten verfügbar.')+'</p>';
     }
   }catch(e){
     console.error('Live Champions Battle Data API:',e);
     if(status)status.textContent=uiLang==='en'?'Live API could not be loaded. Please try again.':'Live-API konnte nicht geladen werden. Bitte erneut versuchen.';
     if(view==='teams'){$('metaTeamRows').innerHTML='<p class="meta-muted">'+(uiLang==='en'?'No live team data available.':'Keine Live-Teamdaten verfügbar.')+'</p>';$('metaBestRows').innerHTML='';}
     else $('metaPokemonRows').innerHTML='<p class="meta-muted">'+(uiLang==='en'?'No live meta data available.':'Keine Live-Meta-Daten verfügbar.')+'</p>';
   }
   return;
 }
 // External legacy sources remain available as links, but are no longer treated as the live API source.
 if(view==='teams'){
   const a=$('metaTeamRows'),b=$('metaBestRows');
   const used=metaStatsExpanded?META_TEAM_STATS:META_TEAM_STATS.slice(0,6);
   a.innerHTML=used.map((x,i)=>`<div class="meta-team-row meta-team-row-clickable" data-ranking="${i}"><div class="meta-team-rank">${x[0]}</div><div><b>${x[1]} Teams</b><div class="meta-muted">${x[3]} Siege · ${x[4]} Niederlagen</div><div class="meta-team-preview">${metaRankingPreview(i)}</div></div><div class="meta-team-stat"><b>${x[2].toFixed(2)}%</b> Winrate</div></div>`).join('');
   const best=[...META_TEAM_STATS].sort((a,b)=>b[2]-a[2]),bestShown=metaBestExpanded?best:best.slice(0,6);
   b.innerHTML=bestShown.map((x,i)=>`<div class="meta-team-row meta-team-row-clickable" data-ranking="${i}"><div class="meta-team-rank">#${i+1}</div><div><b>${x[1]} Teams</b><div class="meta-muted">${x[3]} Siege · ${x[4]} Niederlagen</div><div class="meta-team-preview">${metaRankingPreview(i)}</div></div><div class="meta-team-stat"><b>${x[2].toFixed(2)}%</b> Winrate</div></div>`).join('');
   document.querySelectorAll('.meta-team-row-clickable').forEach(row=>row.onclick=()=>{const i=Number(row.dataset.ranking||0);const x=META_TEAM_STATS[i];if(!x)return;$('infoTitle').textContent=`${uiLang==='en'?'Team ranking':'Team-Ranking'} ${x[0]}`;$('infoBody').innerHTML=`<div class="meta-profile"><p><strong>${x[1]} Teams</strong> · ${x[2].toFixed(2)}% Winrate · ${x[3]} Siege · ${x[4]} Niederlagen</p><p class="meta-profile-note">${uiLang==='en'?'Legacy external source data.':'Alte externe Quelldaten.'}</p></div>`;$('infoModal').hidden=false});
   const mb=$('metaMoreStats'),mbe=$('metaMoreBest');if(mb){mb.textContent=t(metaStatsExpanded?'metaShowLess':'metaShowMore');mb.hidden=META_TEAM_STATS.length<=6}if(mbe){mbe.textContent=t(metaBestExpanded?'metaShowLess':'metaShowMore');mbe.hidden=META_TEAM_STATS.length<=6}
 }else $('metaPokemonRows').innerHTML=META_POKEMON.map((x,i)=>`<div class="meta-pokemon-row"><div class="meta-pokemon-rank">${i+1}</div><div class="meta-pokemon-name">${x[0]}</div><div><div class="meta-pokemon-bar"><span style="width:${x[1]}%"></span></div></div><div class="meta-pokemon-stat">${x[1].toFixed(1)}% · ${x[2].toFixed(1)}%</div></div>`).join('');
}

function render(list){$('grid').innerHTML=list.map((p,i)=>{const first=i<6;return `<article class="poke"><button data-id="${p.id}"><div class="pic"><img src="${sprite(p.id)}" alt="${deP(p.id)||title(p.name)}" loading="${first?'eager':'lazy'}" decoding="async" ${first?'fetchpriority="high"':''}></div><div class="no">#${String(p.id).padStart(4,'0')}</div><div class="name">${deP(p.id)||title(p.name)}</div></button></article>`}).join('');document.querySelectorAll('.poke button').forEach(b=>b.onclick=()=>open(+b.dataset.id))}
function search(){const q=$('search').value.trim().toLowerCase();const pool=dexPool();if(!q){$('suggestions').innerHTML='';render(dexInitialList());return}const m=pool.filter(p=>p.name.includes(q)||(deP(p.id)||'').toLowerCase().includes(q)||String(p.id)===q||String(p.id).padStart(4,'0')===q).slice(0,8);$('suggestions').innerHTML=m.map(p=>`<button class="suggest" data-id="${p.id}"><img src="${sprite(p.id)}"><span>${deP(p.id)||title(p.name)}<br><small>#${String(p.id).padStart(4,'0')}</small></span></button>`).join('');document.querySelectorAll('.suggest').forEach(b=>b.onclick=()=>open(+b.dataset.id));render(m)}
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

function syntheticMCForm(base,form){
  const p=JSON.parse(JSON.stringify(base));
  p.name=form.label.toLowerCase().replace(/[^a-z0-9]+/g,'-');
  p._mcForm=true; p._mcLabel=form.label; p._mcAbility=form.ability; p._mcTypes=form.types;
  p._mcStats=form.stats; if(form.height)p.height=Math.round(form.height*10); if(form.weight)p.weight=Math.round(form.weight*10);
  p.types=form.types.map((t,i)=>({slot:i+1,type:{name:t,url:`https://pokeapi.co/api/v2/type/${t}/`}}));
  p.stats=form.stats.map((v,i)=>({base_stat:v,stat:{name:['hp','attack','defense','special-attack','special-defense','speed'][i]}}));
  p.abilities=[{ability:{name:form.ability,url:''},is_hidden:false,slot:1}];
  return p;
}
async function openMCForm(baseSpecies,form){
  const baseId=Number(baseSpecies.id);
  try{
    const base=await json(`${API}/pokemon/${baseId}`);
    const p=syntheticMCForm(base,form);
    const s=await json(`${API}/pokemon-species/${baseId}`);
    current={p,s}; isShiny=false; await detail(p,s);
  }catch(e){console.error(e);}
}
const abilityInfoCache=new Map();
function abilityCacheKey(id,name){return `${uiLang}|${String(id||name||'').toLowerCase()}`}
// v4.1 – effect links are semantic rather than dependent on one exact wording.
const ABILITY_EFFECT_LINKS={
  drought:{key:'sun',de:'Sonnenschein',en:'Sun'},drizzle:{key:'rain',de:'Regen',en:'Rain'},
  'sand-stream':{key:'sand',de:'Sandsturm',en:'Sandstorm'},'snow-warning':{key:'snow',de:'Schnee',en:'Snow'},
  'primordial-sea':{key:'rain',de:'Starkregen',en:'Heavy Rain'},'desolate-land':{key:'sun',de:'Extremsonne',en:'Harsh Sunlight'},
  'delta-stream':{key:'wind',de:'Delta-Wind',en:'Strong Winds'},
  'psychic-surge':{key:'psychic',de:'Psychofeld',en:'Psychic Terrain'},
  'electric-surge':{key:'electric',de:'Elektrofeld',en:'Electric Terrain'},
  'grassy-surge':{key:'grassy',de:'Grasfeld',en:'Grassy Terrain'},
  'misty-surge':{key:'misty',de:'Nebelfeld',en:'Misty Terrain'}
};
const EFFECT_TERM_LINKS=[
  {key:'sun',terms:['Sonnenschein','Sonnenlicht','starkes Sonnenlicht','gleißendes Sonnenlicht','starke Sonne','Sun','Sunlight','Sunshine','harsh sunlight']},
  {key:'rain',terms:['Regen','Nieselregen','Niesel','Rain','Drizzle']},
  {key:'sand',terms:['Sandsturm','Sandstorm']},
  {key:'snow',terms:['Schnee','Hagelsturm','Schneesturm','Hagel','Snow','Snowstorm','Hail','Hailstorm']},
  {key:'psychic',terms:['Psychofeld','Psychic Terrain']},
  {key:'electric',terms:['Elektrofeld','Electric Terrain']},
  {key:'grassy',terms:['Grasfeld','Grassy Terrain']},
  {key:'misty',terms:['Nebelfeld','Misty Terrain']},
  {key:'burn',terms:['Verbrennung','Verbrennungen','verbrannt','verbrennt','Burn','burns','burned','Burned']}
];
const ABILITY_EFFECTS={
  sun:{de:{title:'Sonnenschein',duration:'5 Runden (Standard)',effect:'Feuer-Attacken werden um 50 % verstärkt und Wasser-Attacken um 50 % abgeschwächt. Solarstrahl und Solar-Klinge benötigen keine Aufladephase.',note:'Sehr starke Sonne kann bestimmte Wasser-Attacken zusätzlich verhindern.'},en:{title:'Sun',duration:'5 turns (standard)',effect:'Fire-type moves are boosted by 50% and Water-type moves are reduced by 50%. Solar Beam and Solar Blade do not need a charging turn.',note:'Extremely harsh sunlight can additionally prevent certain Water-type moves.'}},
  rain:{de:{title:'Regen',duration:'5 Runden (Standard)',effect:'Wasser-Attacken werden um 50 % verstärkt und Feuer-Attacken um 50 % abgeschwächt. Donner und Orkan treffen unter Regen zuverlässiger.',note:'Sehr starker Regen kann bestimmte Feuer-Attacken zusätzlich verhindern.'},en:{title:'Rain',duration:'5 turns (standard)',effect:'Water-type moves are boosted by 50% and Fire-type moves are reduced by 50%. Thunder and Hurricane become more reliable in rain.',note:'Extremely heavy rain can additionally prevent certain Fire-type moves.'}},
  sand:{de:{title:'Sandsturm',duration:'5 Runden (Standard)',effect:'Nicht geschützte Pokémon erleiden am Ende jeder Runde 1/16 ihrer maximalen KP als Schaden. Gestein-, Boden- und Stahl-Pokémon sind gegen diesen passiven Schaden immun; Gestein-Pokémon erhalten zusätzlich einen Bonus auf ihre Spezial-Verteidigung.',note:'Einige Fähigkeiten und Items verhindern oder verändern den passiven Schaden.'},en:{title:'Sandstorm',duration:'5 turns (standard)',effect:'Rock-, Ground- and Steel-type Pokémon do not take direct sandstorm damage. Rock-type Pokémon also gain a Special Defense bonus. Other Pokémon can take damage at the end of a turn.',note:'Some abilities and items modify sandstorm effects.'}},
  snow:{de:{title:'Schnee / früher Hagel',duration:'5 Runden (Standard)',effect:'Eis-Pokémon erhalten einen Bonus auf ihre Verteidigung. Der moderne Schnee verursacht keinen passiven End-of-Turn-Schaden. In älteren Spielen verursachte der entsprechende Hagel-Effekt 1/16 der maximalen KP pro Runde bei nicht geschützten Pokémon.',note:'In älteren Spielen wurde dieser Wettereffekt als Hagel bezeichnet; die moderne Bezeichnung ist Schnee.'},en:{title:'Snow / formerly Hail',duration:'5 turns (standard)',effect:'Ice-type Pokémon gain a Defense bonus. Other Pokémon can take end-of-turn damage depending on the ruleset.',note:'Older games called this weather effect Hail; the modern name is Snow.'}},
  psychic:{de:{title:'Psychofeld',duration:'5 Runden (Standard)',effect:'Psycho-Attacken werden um 30 % verstärkt. Pokémon, die den Boden berühren, sind vor Attacken mit erhöhter Priorität geschützt.',note:'Ein Feldverstärker kann die Dauer auf 8 Runden erhöhen.'},en:{title:'Psychic Terrain',duration:'5 turns (standard)',effect:'Psychic-type moves are boosted by 30%. Grounded Pokémon are protected from moves with increased priority.',note:'A terrain-extending item can increase the duration to 8 turns.'}},
  electric:{de:{title:'Elektrofeld',duration:'5 Runden (Standard)',effect:'Elektro-Attacken werden um 30 % verstärkt. Pokémon, die den Boden berühren, können nicht einschlafen.',note:'Ein Feldverstärker kann die Dauer auf 8 Runden erhöhen.'},en:{title:'Electric Terrain',duration:'5 turns (standard)',effect:'Electric-type moves are boosted by 30%. Grounded Pokémon cannot fall asleep.',note:'A terrain-extending item can increase the duration to 8 turns.'}},
  grassy:{de:{title:'Grasfeld',duration:'5 Runden (Standard)',effect:'Pflanze-Attacken werden um 30 % verstärkt. Bodenberührende Pokémon heilen am Ende jeder Runde 1/16 ihrer maximalen KP; bestimmte Boden-Attacken werden abgeschwächt.',note:'Ein Feldverstärker kann die Dauer auf 8 Runden erhöhen.'},en:{title:'Grassy Terrain',duration:'5 turns (standard)',effect:'Grass-type moves are boosted by 30%. Grounded Pokémon recover some HP at the end of each turn; certain Ground-type moves are weakened.',note:'A terrain-extending item can increase the duration to 8 turns.'}},
  misty:{de:{title:'Nebelfeld',duration:'5 Runden (Standard)',effect:'Bodenberührende Pokémon werden vor bestimmten Statusproblemen geschützt und erleiden weniger Schaden durch Drachen-Attacken.',note:'Ein Feldverstärker kann die Dauer auf 8 Runden erhöhen.'},en:{title:'Misty Terrain',duration:'5 turns (standard)',effect:'Grounded Pokémon are protected from certain status conditions and take reduced damage from Dragon-type moves.',note:'A terrain-extending item can increase the duration to 8 turns.'}},
  burn:{de:{title:'Verbrennung',duration:'Bis die Statusveränderung geheilt oder entfernt wird',effect:'Eine verbrannte Einheit verliert am Ende jeder Runde 1/16 ihrer maximalen KP. Zusätzlich wird ihr physischer Angriff normalerweise um 50 % gesenkt.',note:'Bestimmte Fähigkeiten oder Effekte können Verbrennungen verhindern oder ihre Auswirkungen verändern.'},en:{title:'Burn',duration:'Until the status is cured or removed',effect:'A burned Pokémon takes residual damage and its physical Attack is normally halved.',note:'Certain abilities or effects can prevent burns or modify their effects.'}},
  wind:{de:{title:'Starke Winde',duration:'Solange das Wetter aktiv ist',effect:'Schwächen bestimmte sehr effektive Typenwirkungen ab und verändert damit die Typenberechnung.',note:'Dieser Effekt ist regelfest abhängig von der konkreten Spielmechanik.'},en:{title:'Strong Winds',duration:'While active',effect:'Reduces certain super-effective type interactions and therefore changes type effectiveness calculations.',note:'The exact behavior depends on the ruleset.'}}
};
const ABILITY_LOCAL_DESCRIPTIONS={
  drought:{de:'Erzeugt beim Betreten des Kampfes 5 Runden lang starkes Sonnenlicht.',en:'Creates harsh sunlight for 5 turns when the Pokémon enters battle.'},
  'spicy-spray':{de:'Wenn das Pokémon durch eine Attacke Schaden erleidet, verbrennt es den Angreifer.',en:'When the Pokémon takes damage from a move, it burns the attacker.'},
  'psychic-surge':{de:'Erzeugt bei Kampfantritt auf dem gesamten Kampffeld ein Psychofeld, das 5 Runden lang anhält.',en:'Creates Psychic Terrain across the battlefield for 5 turns when the Pokémon enters battle.'},
};
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function effectKeyForAbility(id,name){const raw=String(id||name||'').toLowerCase();return ABILITY_EFFECT_LINKS[raw]?.key||({dürre:'sun','hagelalarm':'snow','chilispritzer':'burn','spicy-spray':'burn','psycho-erzeuger':'psychic','psychic-surge':'psychic'}[raw]||null)}
function abilityEffectLinks(text){
  let out=escapeHtml(text);
  // Longest terms first so phrases such as "starkes Sonnenlicht" are not split before linking.
  const replacements=[];
  EFFECT_TERM_LINKS.forEach(({key,terms})=>terms.forEach(term=>replacements.push({key,term})));
  replacements.sort((a,b)=>b.term.length-a.term.length);
  const stash=[];
  replacements.forEach(({key,term})=>{
    const re=new RegExp(`(?<![\\w-])${term.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}(?![\\w-])`,'gi');
    out=out.replace(re,match=>{const token=`___EFFECT_${stash.length}___`;stash.push(`<button type="button" class="effect-link" data-effect="${key}">${escapeHtml(match)}</button>`);return token});
  });
  stash.forEach((html,i)=>{out=out.replace(`___EFFECT_${i}___`,html)});
  return out;
}
const ABILITY_LOCAL_ALIASES={
  'chilispritzer':{de:'Wenn das Pokémon durch eine Attacke Schaden erleidet, verbrennt es den Angreifer.',en:'When the Pokémon takes damage from a move, it burns the attacker.'},
  'spicy spray':{de:'Wenn das Pokémon durch eine Attacke Schaden erleidet, verbrennt es den Angreifer.',en:'When the Pokémon takes damage from a move, it burns the attacker.'},
  'psycho-erzeuger':{de:'Erzeugt bei Kampfantritt auf dem gesamten Kampffeld ein Psychofeld, das 5 Runden lang anhält.',en:'Creates Psychic Terrain across the battlefield for 5 turns when the Pokémon enters battle.'}
};
async function getAbilityInfo(id,name,customDescription){
  // Check every available identifier so Champions abilities cannot fall back to
  // an English API description just because the internal id is numeric.
  const candidates=[id,name,String(id||'').replace(/_/g,'-'),String(name||'').replace(/_/g,'-')]
    .filter(Boolean).map(x=>String(x).toLowerCase().trim());
  const local=candidates.map(k=>ABILITY_LOCAL_DESCRIPTIONS[k]||ABILITY_LOCAL_ALIASES[k]).find(Boolean);
  // For known Champions abilities, the local German text always wins over an
  // API/custom fallback when German is selected.
  if(local && uiLang==='de')return {name:dataName('ability',id,name)||name||'',description:local.de,short:local.de};
  if(customDescription)return {name:name||'',description:customDescription,short:customDescription};
  if(local)return {name:dataName('ability',id,name)||name||'',description:local[uiLang]||local.de,short:local[uiLang]||local.de};
  const cacheKey=abilityCacheKey(id,name);
  if(abilityInfoCache.has(cacheKey))return abilityInfoCache.get(cacheKey);
  const promise=(async()=>{
    try{
      const a=await json(id?`${API}/ability/${id}`:`${API}/ability/${encodeURIComponent(String(name).toLowerCase())}`);
      const lang=uiLang==='en'?'en':'de';
      const entries=a.effect_entries||[];
      const entry=entries.find(x=>x.language?.name===lang)||entries.find(x=>x.language?.name==='en');
      const short=(a.flavor_text_entries||[]).find(x=>x.language?.name===lang)?.flavor_text || (a.flavor_text_entries||[]).find(x=>x.language?.name==='en')?.flavor_text || '';
      return {name:dataName('ability',a.id,a.name)||title(a.name),description:(entry?.effect||short||''),short};
    }catch(e){return {name:name||'',description:'',short:''}}
  })();
  abilityInfoCache.set(cacheKey,promise);return promise;
}
function showEffectInfo(key){
  const data=ABILITY_EFFECTS[key]?.[uiLang]||ABILITY_EFFECTS[key]?.de;if(!data)return;
  $('infoTitle').textContent=data.title;$('infoBody').innerHTML=`<div class="effect-info"><p><strong>${uiLang==='en'?'Duration':'Dauer'}:</strong> ${data.duration}</p><p>${data.effect}</p><p class="muted">${data.note}</p></div>`;$('infoModal').hidden=false;
}
const abilityLearnersCache=new Map();
const ABILITY_LEARNERS_CSV='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/';
let abilityLearnersCsvPromise=null;
async function loadAbilityLearnersCsv(){
  if(abilityLearnersCsvPromise)return abilityLearnersCsvPromise;
  abilityLearnersCsvPromise=(async()=>{
    const [abText,pText]=await Promise.all([
      fetch(ABILITY_LEARNERS_CSV+'pokemon_abilities.csv',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error(r.status);return r.text()}),
      fetch(ABILITY_LEARNERS_CSV+'pokemon.csv',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error(r.status);return r.text()})
    ]);
    const pokemonById=new Map();
    const pLines=pText.trim().split(/\r?\n/);
    for(let i=1;i<pLines.length;i++){
      const cols=pLines[i].split(',');
      if(cols.length>=2) pokemonById.set(Number(cols[0]),String(cols[1]||''));
    }
    return {abilityRows:abText.trim().split(/\r?\n/).slice(1),pokemonById};
  })();
  return abilityLearnersCsvPromise;
}
async function getAbilityLearners(id,name){
  const key=String(id||name||'').toLowerCase().trim();
  if(!key)return [];
  if(abilityLearnersCache.has(key))return abilityLearnersCache.get(key);
  const promise=(async()=>{
    const abilityId=Number(id||0);
    try{
      // Fast path: PokéAPI's ability resource contains the complete learner list.
      const a=await json(id?`${API}/ability/${id}`:`${API}/ability/${encodeURIComponent(String(name).toLowerCase())}`,8000);
      const rows=(a?.pokemon||[]).map(x=>{
        const url=String(x?.pokemon?.url||'');
        const m=url.match(/\/(\d+)\/?$/);
        const dex=m?Number(m[1]):0;
        return {dex,name:String(x?.pokemon?.name||''),hidden:Boolean(x?.is_hidden)};
      }).filter(x=>x.dex&&x.name);
      if(rows.length)return rows.sort((a,b)=>a.dex-b.dex||a.name.localeCompare(b.name,'en')||Number(a.hidden)-Number(b.hidden));
    }catch(e){ console.warn('PokéAPI ability learners unavailable, using CSV fallback:',e); }
    // Reliable fallback: the official PokéAPI source data on GitHub.
    try{
      if(!abilityId)throw Error('No numeric ability id');
      const {abilityRows,pokemonById}=await loadAbilityLearnersCsv();
      const rows=[];
      for(const line of abilityRows){
        const cols=line.split(',');
        if(cols.length<4||Number(cols[1])!==abilityId)continue;
        const dex=Number(cols[0]);
        const pokeName=pokemonById.get(dex)||'';
        if(dex&&pokeName)rows.push({dex,name:pokeName,hidden:String(cols[2]).toLowerCase()==='true'});
      }
      const seen=new Set();
      return rows.filter(x=>{const k=`${x.dex}|${x.hidden}`;if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>a.dex-b.dex||a.name.localeCompare(b.name,'en')||Number(a.hidden)-Number(b.hidden));
    }catch(e){
      console.warn('Ability learner CSV fallback unavailable:',e);
      return [];
    }
  })();
  abilityLearnersCache.set(key,promise);return promise;
}
function abilityLearnerLabel(x){
  return dataName('pokemon',x.dex,x.name.replace(/-/g,' '))||title(x.name);
}
function abilityLearnerHtml(learners){
  if(!learners.length)return `<p class=\"muted\">${uiLang==='en'?'No Pokémon found for this ability.':'Keine Pokémon für diese Fähigkeit gefunden.'}</p>`;
  return `<div class=\"ability-learners-list\">${learners.map(x=>`<div class=\"ability-learner\"><img src=\"${sprite(x.dex)}\" alt=\"\"><div><span>${escapeHtml(abilityLearnerLabel(x))}</span>${x.hidden?`<small>${uiLang==='en'?'Hidden Ability':'Versteckte Fähigkeit'}</small>`:''}</div></div>`).join('')}</div>`;
}
async function showAbilityInfo(id,name,customDescription){
  $('infoTitle').textContent=uiLang==='en'?'Ability information':'Fähigkeits-Information';$('infoBody').innerHTML='<p>Daten werden geladen …</p>';$('infoModal').hidden=false;
  const info=await getAbilityInfo(id,name,customDescription);$('infoTitle').textContent=info.name||name||'';
  const description=info.description||info.short|| (uiLang==='en'?'No description available.':'Keine Beschreibung verfügbar.');
  $('infoBody').innerHTML=`<p>${abilityEffectLinks(description)}</p><div class="ability-info-block"><button type="button" id="showAbilityLearners" class="secondary ability-learners-button">${uiLang==='en'?'Pokémon that can have this ability':'Pokémon erlernbar'}</button><div id="abilityLearners" class="ability-learners" hidden></div></div>`;
  $('infoBody').querySelectorAll('.effect-link').forEach(b=>b.onclick=()=>showEffectInfo(b.dataset.effect));
  const learnersButton=$('showAbilityLearners'),learnersBox=$('abilityLearners');
  if(learnersButton&&learnersBox)learnersButton.onclick=async()=>{
    const opening=learnersBox.hidden; learnersBox.hidden=!opening;
    if(opening&&!learnersBox.dataset.loaded){
      learnersBox.innerHTML=`<p class="muted">${uiLang==='en'?'Loading Pokémon …':'Pokémon werden geladen …'}</p>`;
      const learners=await getAbilityLearners(id,name);
      learnersBox.innerHTML=abilityLearnerHtml(learners);
      learnersBox.dataset.loaded='1';
    }
  };
}
const moveInfoCache=new Map();
const SHOWDOWN_MOVES_URL='https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/moves.ts';
let showdownMovesText=null,showdownMovesPromise=null;
async function loadShowdownMoves(){
  if(showdownMovesText)return showdownMovesText;
  if(showdownMovesPromise)return showdownMovesPromise;
  showdownMovesPromise=fetch(SHOWDOWN_MOVES_URL,{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error(r.status);return r.text()}).then(t=>showdownMovesText=t).catch(()=>{showdownMovesText='';return ''});
  return showdownMovesPromise;
}
const CHAMPIONS_CONTACT_MOVES=new Set(["accelerock","acrobatics","aerial ace","anchor shot","aqua jet","aqua step","aqua tail","arm thrust","assurance","astonish","avalanche","axe kick","behemoth bash","behemoth blade","bide","bind","bite","bitter blade","blaze kick","body press","body slam","bolt beak","bolt strike","bounce","branch poke","brave bird","breaking swipe","brick break","brutal swing","bullet punch","catastropika","ceaseless edge","chip away","circle throw","clamp","close combat","collision course","comet punch","comeuppance","constrict","counter","covet","crabhammer","cross chop","cross poison","crunch","crush claw","crush grip","cut","darkest lariat","dig","dire claw","dive","dizzy punch","double hit","double iron bash","double kick","double shock","double slap","double-edge","dragon ascent","dragon claw","dragon hammer","dragon rush","dragon tail","drain punch","draining kiss","drill peck","drill run","dual chop","dual wingbeat","dynamic punch","electro drift","endeavor","extreme speed","facade","fake out","false surrender","false swipe","fell stinger","fire fang","fire lash","fire punch","first impression","fishious rend","flail","flame charge","flame wheel","flare blitz","flip turn","floaty fall","fly","flying press","focus punch","force palm","foul play","frustration","fury attack","fury cutter","fury swipes","gear grind","giga impact","glaive rush","grassy glide","guillotine","gyro ball","hammer arm","hard press","head charge","head smash","headbutt","headlong rush","heart stamp","heat crash","heavy slam","high horsepower","high jump kick","hold back","horn attack","horn drill","horn leech","hyper drill","hyper fang","ice ball","ice fang","ice hammer","ice punch","ice spinner","infestation","iron head","iron tail","jaw lock","jet punch","jump kick","karate chop","knock off","kowtow cleave","lash out","last resort","leaf blade","leech life","let's snuggle forever","lick","liquidation","low kick","low sweep","lunge","mach punch","malicious moonsault","mega kick","mega punch","megahorn","metal claw","meteor mash","mighty cleave","mortal spin","multi-attack","needle arm","night slash","nuzzle","outrage","payback","peck","petal dance","phantom force","plasma fists","play rough","pluck","poison fang","poison jab","poison tail","population bomb","pounce","pound","power trip","power whip","power-up punch","psyblade","psychic fangs","psyshield bash","pulverizing pancake","punishment","pursuit","quick attack","rage","rage fist","raging bull","rapid spin","razor shell","retaliate","return","revenge","reversal","rock climb","rock smash","rolling kick","rollout","sacred sword","scratch","searing sunraze smash","seismic toss","shadow claw","shadow force","shadow punch","shadow sneak","sizzly slide","skitter smack","skull bash","sky drop","sky uppercut","slam","slash","smart strike","smelling salts","snap trap","solar blade","soul-stealing 7-star strike","spark","spectral thief","spin out","spirit break","steamroller","steel roller","steel wing","stomp","stomping tantrum","stone axe","storm throw","strength","struggle","submission","sucker punch","sunsteel strike","super fang","supercell slam","superpower","surging strikes","tackle","tail slap","take down","temper flare","thief","thrash","throat chop","thunder fang","thunder punch","thunderous kick","trailblaze","triple axel","triple dive","triple kick","trop kick","trump card","u-turn","upper hand","v-create","veevee volley","vine whip","vise grip","vital throw","volt tackle","wake-up slap","waterfall","wave crash","wicked blow","wild charge","wing attack","wood hammer","wrap","wring out","x-scissor","zen headbutt","zing zap","zippy zap"]);
const CHAMPIONS_SLICING_MOVES=new Set(['cut','razor leaf','slash','fury cutter','metal claw','crush claw','air cutter','aerial ace','dragon claw','leaf blade','night slash','air slash','x-scissor','shadow claw','psycho cut','cross poison','sacred sword','razor shell','secret sword','solar blade','behemoth blade','dire claw','stone axe','ceaseless edge','population bomb','kowtow cleave','psyblade','bitter blade','aqua cutter','mighty cleave','tachyon cutter']);
const CHAMPIONS_CONTACT_MOVE_KEYS=new Set([...CHAMPIONS_CONTACT_MOVES].map(normMoveName));
const CHAMPIONS_SLICING_MOVE_KEYS=new Set([...CHAMPIONS_SLICING_MOVES].map(normMoveName));
function showdownMoveFlags(id){
  const key=normMoveName(id);
  const out={};
  if(showdownMovesText&&key){
    const re=new RegExp(`${key}:\\s*\\{`,'i');
    const m=re.exec(showdownMovesText);
    if(m){
      let i=m.index+m[0].length,depth=1;
      for(;i<showdownMovesText.length&&depth>0;i++){
        const c=showdownMovesText[i];
        if(c==='{')depth++;else if(c==='}')depth--;
      }
      const block=showdownMovesText.slice(m.index,i);
      const fm=block.match(/flags\s*:\s*\{([\s\S]*?)\}/);
      if(fm)(fm[1].match(/([a-z]+)\s*:/gi)||[]).forEach(x=>{const k=x.split(':')[0].trim();out[k]=1});
    }
  }
  // Offline/failed Showdown loading fallback. These lists are also used by the
  // calculator, so the move-info popup remains correct even when the optional
  // Showdown metadata request is unavailable.
  if(CHAMPIONS_CONTACT_MOVE_KEYS.has(key))out.contact=1;
  if(CHAMPIONS_SLICING_MOVE_KEYS.has(key))out.slicing=1;
  return out;
}
const MOVE_FLAG_LABELS={
  contact:{de:'Kontakt',en:'Contact'},slicing:{de:'Schnitt',en:'Slicing'},punch:{de:'Hieb',en:'Punch'},bite:{de:'Biss',en:'Biting'},
  sound:{de:'Schall',en:'Sound'},powder:{de:'Pulver',en:'Powder'},pulse:{de:'Puls',en:'Pulse'},bullet:{de:'Projektil/Ball',en:'Bullet/Ball'},
  dance:{de:'Tanz',en:'Dance'},wind:{de:'Wind',en:'Wind'}
};
const MOVE_CATEGORY_LABELS={
  physical:{de:'Physisch',en:'Physical'},special:{de:'Speziell',en:'Special'},status:{de:'Status',en:'Status'},
  Physical:{de:'Physisch',en:'Physical'},Special:{de:'Speziell',en:'Special'},Status:{de:'Status',en:'Status'}
};
function moveCategoryLabel(category){return MOVE_CATEGORY_LABELS[String(category||'')]?.[uiLang]||category||'—'}
const MOVE_TARGET_LABELS={
  normal:{de:'ein einzelnes Ziel',en:'one target'},any:{de:'ein einzelnes Ziel',en:'one target'},self:{de:'Anwender selbst',en:'the user'},
  ally:{de:'ein Verbündeter',en:'one ally'},adjacentAlly:{de:'ein angrenzender Verbündeter',en:'one adjacent ally'},adjacentAllyOrSelf:{de:'Anwender oder angrenzender Verbündeter',en:'the user or an adjacent ally'},
  allAdjacentFoes:{de:'alle Gegner',en:'all opposing Pokémon'},allAdjacent:{de:'alle angrenzenden Pokémon',en:'all adjacent Pokémon'},all:{de:'alle Pokémon auf dem Feld',en:'all Pokémon on the field'},
  allyTeam:{de:'eigenes Team',en:'the user’s party'},foeSide:{de:'gegnerische Seite',en:'the opposing side'},allySide:{de:'eigene Seite',en:'the user’s side'},randomNormal:{de:'zufälliger Gegner',en:'a random opposing Pokémon'},scripted:{de:'spezielles Ziel',en:'special target'}
};
const MOVE_EFFECT_TERMS=[
  {key:'burn',terms:['Verbrennung','Verbrennungen','verbrennt','verbrennen','verbrannt','burn','burns','burned']},
  {key:'poison',terms:['Vergiftung','Vergiftungen','vergiftet','poison','poisoned']},
  {key:'paralysis',terms:['Paralyse','paralysiert','paralyzed','paralyze','paralysis']},
  {key:'sleep',terms:['Schlaf','einschläft','eingeschläfert','sleep','asleep']},
  {key:'freeze',terms:['Einfrieren','eingefroren','friert','freeze','frozen']},
  {key:'confusion',terms:['Verwirrung','verwirrt','confusion','confused']}
];
MOVE_EFFECT_TERMS.forEach(x=>{if(!EFFECT_TERM_LINKS.some(y=>y.key===x.key)){EFFECT_TERM_LINKS.push(x)}});
ABILITY_EFFECTS.poison={de:{title:'Vergiftung',duration:'Bis die Statusveränderung geheilt oder entfernt wird',effect:'Das Pokémon erleidet regelmäßig Schaden durch den Status. Bei normaler Vergiftung steigt der Schaden im Verlauf des Kampfes nicht automatisch wie bei schwerer Vergiftung.',note:'Bestimmte Fähigkeiten und Effekte können Vergiftung verhindern oder entfernen.'},en:{title:'Poison',duration:'Until the status is cured or removed',effect:'The Pokémon takes recurring damage from the status. Regular poison does not automatically ramp up like badly poisoned status.',note:'Certain abilities and effects can prevent or remove poison.'}};
ABILITY_EFFECTS.paralysis={de:{title:'Paralyse',duration:'Bis die Statusveränderung geheilt oder entfernt wird',effect:'Das Pokémon kann in seinem Handlungsvermögen eingeschränkt sein und seine Initiative wird beeinflusst.',note:'Bestimmte Fähigkeiten und Effekte können Paralyse verhindern oder entfernen.'},en:{title:'Paralysis',duration:'Until the status is cured or removed',effect:'The Pokémon can be prevented from acting and its Speed is affected.',note:'Certain abilities and effects can prevent or remove paralysis.'}};
ABILITY_EFFECTS.sleep={de:{title:'Schlaf',duration:'Bis der Status endet oder entfernt wird',effect:'Das Pokémon kann während des Schlafs normalerweise keine Attacke ausführen.',note:'Einige Fähigkeiten und Attacken verändern die Schlafmechanik.'},en:{title:'Sleep',duration:'Until the status ends or is removed',effect:'A sleeping Pokémon normally cannot use moves while asleep.',note:'Some abilities and moves modify sleep mechanics.'}};
ABILITY_EFFECTS.freeze={de:{title:'Einfrieren',duration:'Bis der Status endet oder entfernt wird',effect:'Das Pokémon kann normalerweise keine Attacke ausführen, solange es eingefroren ist.',note:'Feuer-Effekte und bestimmte Mechaniken können den Status entfernen.'},en:{title:'Freeze',duration:'Until the status ends or is removed',effect:'A frozen Pokémon normally cannot use moves while frozen.',note:'Fire effects and certain mechanics can remove the status.'}};
ABILITY_EFFECTS.confusion={de:{title:'Verwirrung',duration:'Vorübergehend',effect:'Das Pokémon kann sich selbst statt des Ziels treffen und dadurch seine Aktion verlieren.',note:'Der Effekt endet nach Ablauf seiner Dauer oder durch bestimmte Wechsel-/Heileffekte.'},en:{title:'Confusion',duration:'Temporary',effect:'The Pokémon can hurt itself instead of successfully executing its selected move.',note:'The effect ends after its duration or through certain switching or curing effects.'}};
function moveEffectLinks(text){
  let out=escapeHtml(text);const stash=[];const replacements=[];
  EFFECT_TERM_LINKS.forEach(({key,terms})=>terms.forEach(term=>replacements.push({key,term})));
  replacements.sort((a,b)=>b.term.length-a.term.length);
  replacements.forEach(({key,term})=>{const re=new RegExp(`(?<![\\w-])${term.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}(?![\\w-])`,'gi');out=out.replace(re,match=>{const token=`___MOVE_EFFECT_${stash.length}___`;stash.push(`<button type="button" class="effect-link" data-effect="${key}">${escapeHtml(match)}</button>`);return token})});
  stash.forEach((html,i)=>{out=out.replace(`___MOVE_EFFECT_${i}___`,html)});return out;
}
function moveTargetLabel(target){return (MOVE_TARGET_LABELS[target]?.[uiLang])||target|| (uiLang==='en'?'special target':'spezielles Ziel')}
function extractMoveAmounts(text){
  const out={};const s=String(text||'');
  let m=s.match(/recovers?\s+(\d+\/\d+)\s+(?:the |its |of the user'?s )?HP lost by the target/i);if(m)out.drain=m[1];
  m=s.match(/(?:recovers?|restores?|heals?|recover)\s+(\d+\/\d+)\s+(?:of (?:the )?(?:user'?s|its) maximum HP|its maximum HP|the user's maximum HP)/i);if(m)out.heal=m[1];
  m=s.match(/(?:heals?|restores?|recovers?)\s+(\d+)%\s+(?:of (?:the )?(?:user'?s|its) maximum HP|its maximum HP)/i);if(m)out.heal=`${m[1]}%`;
  if(!out.drain){m=s.match(/(\d+\/\d+)\s+of the damage dealt/i);if(m)out.drain=m[1]}
  return out;
}
function moveInfoFlags(flags){return Object.keys(MOVE_FLAG_LABELS).filter(k=>flags?.[k]).map(k=>MOVE_FLAG_LABELS[k][uiLang])}
// v6.7 – Move effects use the original English Champions wording.
// Serebii is the primary reference for Champions move effects. If the browser
// cannot fetch Serebii (for example because of CORS), we fall back to the
// English effect already shipped with the Champions move dataset. We never
// translate or mix languages here: English is intentionally preferred over
// broken/missing German text.
const SEREBII_CHAMPIONS_MOVES_SOURCE='https://www.serebii.net/pokemonchampions/moves.shtml';
let serebiiChampionsMovesCache=null;
let serebiiChampionsMovesPromise=null;
async function loadSerebiiChampionsMoves(){
  if(serebiiChampionsMovesCache)return serebiiChampionsMovesCache;
  if(serebiiChampionsMovesPromise)return serebiiChampionsMovesPromise;
  serebiiChampionsMovesPromise=(async()=>{
    try{
      const r=await fetch(SEREBII_CHAMPIONS_MOVES_SOURCE,{cache:'force-cache',mode:'cors'});
      if(!r.ok)throw Error(r.status);
      const html=await r.text();
      const doc=new DOMParser().parseFromString(html,'text/html');
      const map=new Map();
      doc.querySelectorAll('tr').forEach(tr=>{
        const cells=[...tr.querySelectorAll('th,td')].map(x=>String(x.textContent||'').replace(/\s+/g,' ').trim()).filter(Boolean);
        if(cells.length<2)return;
        const name=cells[0];
        const effect=cells[cells.length-1];
        if(!name||!effect||/^(Name|Effect)$/i.test(name))return;
        // The Serebii table contains the complete Champions move list.
        map.set(normMoveName(name),effect);
      });
      serebiiChampionsMovesCache=map;
      return map;
    }catch(e){
      console.warn('Serebii Champions move effects unavailable:',e);
      serebiiChampionsMovesCache=new Map();
      return serebiiChampionsMovesCache;
    }finally{serebiiChampionsMovesPromise=null}
  })();
  return serebiiChampionsMovesPromise;
}
async function getSerebiiChampionsMoveEffect(champMove){
  const key=normMoveName(champMove?.name||'');
  if(!key)return '';
  const map=await loadSerebiiChampionsMoves();
  return map.get(key)||'';
}
async function germanMoveDescription(champMove,api){
  // Deliberately keep the effect in its original English Champions wording.
  // This avoids the recurring Denglish caused by automatic translation and is
  // preferable to showing an empty/placeholder effect.
  const serebii=await getSerebiiChampionsMoveEffect(champMove);
  if(serebii)return serebii;
  const localEnglish=String(champMove?.description||'').trim();
  if(localEnglish)return localEnglish;
  const apiEnglish=String(api?.flavor_text_entries?.find?.(x=>x?.language?.name==='en')?.flavor_text||'').replace(/[\n\f]/g,' ').trim();
  if(apiEnglish)return apiEnglish;
  return uiLang==='en'?'No additional effect.':'Effect data unavailable.';
}
async function getMoveInfo(champMove){
  const key=normMoveName(champMove?.name);if(moveInfoCache.has(key))return moveInfoCache.get(key);
  const promise=(async()=>{
    let api=null;const id=champMove?.id||championsMoveId(champMove);if(id){try{api=await json(`${API}/move/${id}`)}catch(e){}}
    const description=champMove?.description||'';const amounts=extractMoveAmounts(description);await loadShowdownMoves();
    // Use the canonical English move name/ID for Showdown flags. The Champions
    // data uses English names here, while the UI/localization can be German.
    // Passing the localized display name caused flags such as slicing/contact
    // to be missed (e.g. Dunkelklaue -> Shadow Claw).
    const showdownKey=api?.name||api?.id||champMove?.name||id;
    const flags=showdownMoveFlags(showdownKey);
    return {champMove,api,description,amounts,flags};
  })();moveInfoCache.set(key,promise);return promise;
}
async function getChampionsLearnersForMove(champMove){
  await loadChampionsData();
  const moveKey=normMoveName(champMove?.name||championsMoveLabel(champMove)||'');
  if(!moveKey||!championsLearnsetsData)return [];
  const learners=[];
  for(const [key,entry] of Object.entries(championsLearnsetsData)){
    const moves=Array.isArray(entry?.moves)?entry.moves:[];
    if(!moves.some(x=>normMoveName(typeof x==='string'?x:x?.name)===moveKey))continue;
    learners.push({
      key:String(key),
      dexNumber:Number(entry?.dexNumber||0),
      form:String(entry?.form||'Base'),
      name:String(entry?.name||key)
    });
  }
  learners.sort((a,b)=>a.dexNumber-b.dexNumber||({Base:0,Regional:1,Mega:2}[a.form]??3)-({Base:0,Regional:1,Mega:2}[b.form]??3)||a.name.localeCompare(b.name,'en'));
  return learners;
}
function championsLearnerLabel(entry){
  const key=entry?.name||entry?.key||'';
  const dex=Number(entry?.dexNumber||0);
  const base=deP(dex)||'';
  if(uiLang==='en'||!base)return key;
  if(entry?.form==='Base')return base;
  const suffix=key.replace(/^(Mega |Alolan |Galarian |Hisuian |Paldean )/i,'');
  if(/^Mega /i.test(key)){
    const megaSuffix=suffix.replace(/^[A-Za-zÀ-ÿ'’ -]+(?= X$| Y$| Z$)/i,'');
    return megaSuffix&&megaSuffix!=='X'&&megaSuffix!=='Y'&&megaSuffix!=='Z'?`Mega ${base} ${megaSuffix}`:`Mega ${base}${/ [XYZ]$/i.test(key)?' '+key.slice(-1):''}`;
  }
  if(/^Alolan /i.test(key))return `Alola-${base}`;
  if(/^Galarian /i.test(key))return `Galar-${base}`;
  if(/^Hisuian /i.test(key))return `Hisui-${base}`;
  if(/^Paldean /i.test(key))return `Paldea-${base}`;
  return key;
}
function championsLearnerHtml(learners){
  if(!learners.length)return `<p class="muted">${uiLang==='en'?'No Pokémon found for this Champions move.':'Keine Pokémon für diese Champions-Attacke gefunden.'}</p>`;
  return `<div class="champions-learners-list">${learners.map(x=>`<div class="champions-learner"><img src="${sprite(x.dexNumber)}" alt=""><span>${escapeHtml(championsLearnerLabel(x))}</span>${x.form!=='Base'?`<small>${escapeHtml(uiLang==='en'?x.form:'Form')}</small>`:''}</div>`).join('')}</div>`;
}
async function showMoveInfo(raw){
  const champMove=typeof raw==='string'?{name:raw}:raw;const name=championsMoveLabel(champMove);$('infoTitle').textContent=name||champMove.name||'';$('infoBody').innerHTML=`<p>${uiLang==='en'?'Move data are loading …':'Attackendaten werden geladen …'}</p>`;$('infoModal').hidden=false;
  const info=await getMoveInfo(champMove);const m=info.champMove||{};const a=info.api||{};const accuracy=m.accuracy??a.accuracy;const power=m.power??a.power;const category=m.category||({physical:'Physical',special:'Special',status:'Status'}[a.damage_class?.name])||'—';const type=m.type||a.type?.name||'—';const target=m.target||a.target?.name||'';const flags=moveInfoFlags(info.flags);const amount=info.amounts;
  const labels=uiLang==='en'?{type:'Type',power:'Power',accuracy:'Accuracy',category:'Category',target:'Target',pp:'PP',priority:'Priority',traits:'Move traits',effect:'Effect',healing:'Healing',drain:'Life steal'}:{type:'Typ',power:'Stärke',accuracy:'Genauigkeit',category:'Kategorie',target:'Ziel',pp:'AP',priority:'Priorität',traits:'Eigenschaften',effect:'Effekt',healing:'Heilung',drain:'Lebensentzug'};
  const acc=accuracy===null||accuracy===true? (uiLang==='en'?'does not check accuracy':'prüft Genauigkeit nicht'):(accuracy==null?'—':`${accuracy}%`);
  const detailRows=[`<div class="move-info-grid"><div><span>${labels.type}</span><b>${escapeHtml(championsTypeLabel(type))}</b></div><div><span>${labels.power}</span><b>${power||'—'}</b></div><div><span>${labels.accuracy}</span><b>${acc}</b></div><div><span>${labels.category}</span><b>${escapeHtml(moveCategoryLabel(category))}</b></div><div><span>${labels.target}</span><b>${escapeHtml(moveTargetLabel(target))}</b></div>${m.pp!=null?`<div><span>${labels.pp}</span><b>${m.pp}</b></div>`:''}${m.priority!=null?`<div><span>${labels.priority}</span><b>${m.priority>0?'+'+m.priority:m.priority}</b></div>`:''}</div>`];
  if(flags.length)detailRows.push(`<div class="move-info-block"><strong>${labels.traits}</strong><div class="move-traits">${flags.map(x=>`<span class="pill">${escapeHtml(x)}</span>`).join('')}</div></div>`);
  if(amount.heal)detailRows.push(`<div class="move-info-block"><strong>${labels.healing}</strong><p>${uiLang==='en'?`Restores ${escapeHtml(amount.heal)} of maximum HP.`:`Heilt ${escapeHtml(amount.heal)} der maximalen KP.`}</p></div>`);
  if(amount.drain)detailRows.push(`<div class="move-info-block"><strong>${labels.drain}</strong><p>${uiLang==='en'?`Recovers ${escapeHtml(amount.drain)} of the damage dealt.`:`Heilt ${escapeHtml(amount.drain)} des verursachten Schadens.`}</p></div>`);
  const germanEffect=await germanMoveDescription(m,a);detailRows.push(`<div class="move-info-block"><strong>${labels.effect}</strong><p>${moveEffectLinks(germanEffect|| (uiLang==='en'?'No additional effect.':'Keine zusätzlichen Effekte.'))}</p></div>`);
  detailRows.push(`<div class="move-info-block move-learners-block"><button type="button" id="showChampionsLearners" class="secondary move-learners-button">${uiLang==='en'?'Pokémon that can learn this move':'Pokémon erlernbar'}</button><div id="championsLearners" class="champions-learners" hidden></div></div>`);
  $('infoBody').innerHTML=detailRows.join('');$('infoBody').querySelectorAll('.effect-link').forEach(b=>b.onclick=()=>showEffectInfo(b.dataset.effect));
  const learnersButton=$('showChampionsLearners'),learnersBox=$('championsLearners');
  if(learnersButton&&learnersBox)learnersButton.onclick=async()=>{const opening=learnersBox.hidden;learnersBox.hidden=!opening;if(opening&&!learnersBox.dataset.loaded){learnersBox.innerHTML=`<p class="muted">${uiLang==='en'?'Loading Champions learnsets …':'Champions-Lernlisten werden geladen …'}</p>`;const learners=await getChampionsLearnersForMove(m);learnersBox.innerHTML=championsLearnerHtml(learners);learnersBox.dataset.loaded='1';}};
}
async function detail(p,s){
  const pname=p._mcLabel||deP(p.id)||deF(p.id)||title(p.name);
   const abilities=p._mcForm?[mcAbilityName(p._mcAbility)]:((Number(s.id)===998&&String(p.name||'').toLowerCase().includes('mega'))?['Thermowandel']:await Promise.all(p.abilities.map(async x=>deA(rid(x.ability.url))||title(x.ability.name))));
  const grouped={};p.moves.forEach(x=>(x.version_group_details||[]).forEach(v=>{let key='Weitere';const m=v.move_learn_method?.name;if(m==='level-up')key='Durch Levelaufstieg';else if(m==='machine')key='TM / VM';else if(m==='tutor')key='Attacken-Lehrer';else if(m==='egg')key='Ei-Attacke';else if(m==='stadium-surfing-pikachu')key='Spezial';if(!grouped[key])grouped[key]=[];const entry={id:rid(x.move.url),name:x.move.name,level:v.level_learned_at||0};if(!grouped[key].some(a=>a.id===entry.id))grouped[key].push(entry)}));
  let moveHtml='';for(const group of ['Durch Levelaufstieg','TM / VM','Attacken-Lehrer','Ei-Attacke','Spezial','Weitere']){if(!grouped[group])continue;const entries=await Promise.all(grouped[group].map(async m=>({...m,de:deM(m.id)||title(m.name)})));entries.sort((a,b)=>group==='Durch Levelaufstieg'?(a.level-b.level||a.de.localeCompare(b.de,'de')):a.de.localeCompare(b.de,'de'));const groupLabel=uiLang==='en'?({'Durch Levelaufstieg':'Level Up','TM / VM':'TM / HM','Attacken-Lehrer':'Move Tutor','Ei-Attacke':'Egg Move','Spezial':'Special','Weitere':'Other'}[group]||group):group;moveHtml+=`<div class="move-group"><h4>${groupLabel} <span class="move-meta">(${entries.length})</span></h4><div class="move-list">${entries.map(m=>`<div class="move-item"><span class="move-name">${m.de}</span>${group==='Durch Levelaufstieg'?`<span class="move-meta">Lv. ${m.level}</span>`:''}</div>`).join('')}</div></div>`}
  const langName=uiLang==='en'?'en':'de';const flavor=(s.flavor_text_entries||[]).find(x=>x.language?.name===langName)|| (s.flavor_text_entries||[]).find(x=>x.language?.name==='en');const genus=(s.genera||[]).find(x=>x.language?.name===langName)|| (s.genera||[]).find(x=>x.language?.name==='en');const mcAbilityText=p._mcForm?(MC_ABILITY_DESCRIPTIONS[p._mcAbility]?.[uiLang]||''):'';
  const stats=p.stats.map(x=>`<div class="stat"><span>${({hp:uiLang==='en'?'HP':'KP',attack:uiLang==='en'?'Attack':'Angriff',defense:uiLang==='en'?'Defense':'Verteidigung','special-attack':uiLang==='en'?'Sp. Atk':'Sp. Angriff','special-defense':uiLang==='en'?'Sp. Def':'Sp. Verteidigung',speed:uiLang==='en'?'Speed':'Initiative'})[x.stat.name]}</span><div class="bar"><i style="width:${Math.min(100,x.base_stat/2)}%"></i></div><b>${x.base_stat}</b></div>`).join('');
  const formMeta=[];
  const formRows=await Promise.all((s.varieties||[]).map(async v=>{const id=rid(v.pokemon.url);if(!id)return '';let fp=null,formId=null;try{fp=await json(v.pokemon.url);formId=rid(fp?.forms?.[0]?.url||'')}catch(e){}const name=formDisplayName(fp||{id,name:v.pokemon.name},s.id,s.name,formId);formMeta.push({id:Number(id),name:String(name||'').trim().toLowerCase(),raw:String(fp?.name||v.pokemon.name||'').toLowerCase()});return `<button type="button" class="form-choice ${!p._mcForm&&Number(id)===Number(p.id)?'active':''}" data-form-url="${v.pokemon.url}" data-form-id="${id}"><img src="${sprite(id)}" alt=""><span>${name}</span></button>`;}));
   // Keep the working PokéAPI form whenever M-C already supplies the same form.
   // Only add our synthetic form if no corresponding API form exists. This prevents
   // duplicate, non-selectable entries while preserving the original working forms.
   const mcRows=mcFormsForSpecies(s.id).map((f,index)=>{
     const label=String(f.label||'').trim();
     const norm=label.toLowerCase();
     const exists=formMeta.some(x=>x.name===norm || (norm.includes('z') && x.raw.includes('mega-z')) || (norm.startsWith('mega-') && x.raw.includes('mega')));
     if(exists)return '';
     return `<button type="button" class="form-choice ${p._mcForm&&p._mcLabel===label?'active':''}" data-mc-index="${index}"><img src="${sprite(s.id)}" alt=""><span>${label}</span></button>`;
   }).join('');
   const allFormRows=formRows.filter(Boolean).join('')+mcRows;
  const forms=allFormRows;
  const types=p.types.map(t=>`<span class="pill">${deT(rid(t.type.url))||title(t.type.name)}</span>`).join('');
  const relations=await getTypeRelations(p);
  const isChampionsPokemon=CHAMPIONS_AVAILABLE_IDS.includes(Number(s.id||p.speciesId||p.id));
  $('modalbody').innerHTML=`<div class="detail"><div class="detailpic"><img id="ds" src="${isShiny?shiny(p.id):sprite(p.id)}" alt="${pname}"></div><div><h2>${pname}</h2><div>#${String(p.id).padStart(4,'0')} · ${p.height/10} m · ${p.weight/10} kg</div><p>${types}</p><button id="sh" class="pill ${isShiny?'active':''}">✨ Shiny</button></div></div><div class="section"><h3>${uiLang==='en'?'Select Form':'Form auswählen'}</h3><div class="form-buttons" id="forms">${forms||'—'}</div></div><div class="section"><h3>${uiLang==='en'?'Strengths & Weaknesses':'Stärken & Schwächen'}</h3><div class="relation-grid"><div><strong>${uiLang==='en'?'Resistances':'Stärken / Resistenzen'}</strong><div>${relationPills(relations.resist,true)}</div></div><div><strong>${uiLang==='en'?'Weaknesses':'Schwächen'}</strong><div>${relationPills(relations.weak,true)}</div></div><div><strong>${uiLang==='en'?'Immunities':'Immunitäten'}</strong><div>${relationPills(relations.immune)}</div></div></div></div><div class="section"><h3>${uiLang==='en'?'Pokédex Description':'Pokédex-Beschreibung'}</h3><p class="description">${p._mcForm?mcAbilityText:(flavor?flavor.flavor_text.replace(/[\n\f]/g,' '):(uiLang==='en'?'No description available.':'Keine deutsche Beschreibung vorhanden.'))}</p>${genus?`<p class="flavor">${genus.genus}</p>`:''}</div><div class="section"><h3>${uiLang==='en'?'Abilities':'Fähigkeiten'}</h3><div class="ability-buttons">${abilities.map((name,i)=>`<button type="button" class="ability-button" data-ability-index="${i}">${escapeHtml(name)}</button>`).join('')||'—'}</div></div><div class="section"><h3>${uiLang==='en'?'Base Stats':'Basiswerte'}</h3>${stats}</div><div class="section"><h3>${uiLang==='en'?'Max Stats at Level 50':'Maximalwerte auf Level 50'}</h3><p class="muted">${uiLang==='en'?'IV 31 · 252 EVs in the selected stat · no item or battle bonuses':'IV 31 · 252 EVs im jeweiligen Statuswert · ohne Item- oder Kampfboni'}</p><label class="nature-inline">${uiLang==='en'?'Nature':'Wesen'}<select id="dexNature">${natureOptionsHtml(0)}</select></label>${maxStatsHtml(p)}</div><div class="section"><h3>${uiLang==='en'?'Moves':'Attacken'}</h3>${isChampionsPokemon?`<label class="move-mode-label">${uiLang==='en'?'Move list':'Attackenliste'}<select id="dexMoveMode"><option value="normal">${uiLang==='en'?'Normally learnable moves':'Normal erlernbare Attacken'}</option><option value="champions">${uiLang==='en'?'Available moves in Champions':'Verfügbare Attacken in Champions'}</option></select></label>`:''}<div class="move-groups" id="dexNormalMoves">${moveHtml||'<p>Keine Attacken gefunden.</p>'}</div>${isChampionsPokemon?`<div id="dexChampionsMoves" class="champions-moves" hidden><p class="muted">${uiLang==='en'?'Loading Champions move pool …':'Champions-Attacken werden geladen …'}</p></div>`:''}</div>`;
  if(isChampionsPokemon){
    $('dexMoveMode').addEventListener('change',async e=>{
      const champions=e.target.value==='champions';
      const normalMoves=$('dexNormalMoves'),championsMoves=$('dexChampionsMoves');
      // Explicit display switching is intentional: some mobile/browser CSS engines
      // can keep grid containers visible despite the HTML hidden attribute.
      normalMoves.hidden=champions;normalMoves.style.display=champions?'none':'';
      championsMoves.hidden=!champions;championsMoves.style.display=champions?'':'none';
      if(champions&&!championsMoves.dataset.loaded){
        $('dexChampionsMoves').innerHTML=`<p class="muted">${uiLang==='en'?'Loading Champions move pool …':'Champions-Attacken werden geladen …'}</p>`;
        const cm=await getChampionsMovesForPokemon(p,s);
        championsMoves.innerHTML=cm.length?championsMoveHtml(cm):`<p>${uiLang==='en'?'No Champions moves found for this Pokémon/form.':'Für dieses Pokémon/diese Form wurden keine Champions-Attacken gefunden.'}</p>`;
        championsMoves.querySelectorAll('.move-info-link').forEach(btn=>{btn.onclick=()=>{try{showMoveInfo(championsMoveInfoRegistry.get(btn.dataset.champMoveKey)||{name:btn.textContent})}catch(e){console.error('Move info',e)}}});
        championsMoves.dataset.loaded='1';
      }
    });
  }
  $('sh').onclick=()=>{isShiny=!isShiny;$('ds').src=isShiny?shiny(p.id):sprite(p.id);$('sh').classList.toggle('active',isShiny)};
  document.querySelectorAll('#forms .form-choice').forEach(btn=>btn.onclick=async()=>{
     try{
       if(btn.dataset.mcIndex!==undefined){
         const f=mcFormsForSpecies(s.id)[Number(btn.dataset.mcIndex)];
         if(!f)throw Error('M-C-Form nicht gefunden');
         await openMCForm(s,f);
       }else{
         const fp=await json(btn.dataset.formUrl);current={p:fp,s};isShiny=false;await detail(fp,s);
       }
     }catch(e){console.error('Formauswahl fehlgeschlagen',e)}
   })
  document.querySelectorAll('.ability-button').forEach((btn)=>btn.onclick=async()=>{
    const idx=Number(btn.dataset.abilityIndex);const raw=p._mcForm?{name:mcAbilityName(p._mcAbility),id:null,custom:MC_ABILITY_DESCRIPTIONS[p._mcAbility]?.[uiLang]}:(p.abilities||[])[idx];
    if(!raw)return;
    const aid=rid(raw?.ability?.url)||raw?.ability?.name;const aname=raw?.ability?.name||abilities[idx];
    await showAbilityInfo(aid,aname,raw?.custom);
  });
  $('dexNature').addEventListener('change',()=>{
    const vals=maxLevel50Stats(p,$('dexNature').value);
    vals.forEach((v,i)=>$(`dexMaxStat${i}`).textContent=v);
  });
}

function calcEV(side){const t=calcStatKeys.reduce((a,k)=>a+(Math.max(0,Math.min(32,+($(`${side}-${k}`).value)||0))),0);$(`${side}Total`).textContent=`Statuswertpunkte: ${t} / 66`;$(`${side}Total`).style.color=t>66?'#ff9a9a':''}
const natureData=[['Hart','atk','spa'],['Solo','atk','def'],['Mutig','atk','spe'],['Frech','atk','spd'],['Kühn','def','atk'],['Pfiffig','def','spa'],['Locker','def','spe'],['Lasch','def','spd'],['Mäßig','spa','atk'],['Mild','spa','def'],['Ruhig','spa','spe'],['Hitzig','spa','spd'],['Scheu','spe','atk'],['Hastig','spe','def'],['Froh','spe','spa'],['Naiv','spe','spd'],['Still','spd','atk'],['Zart','spd','def'],['Sacht','spd','spa'],['Forsch','spd','spe'],['Robust','neutral','neutral'],['Ernst','neutral','neutral'],['Kauzig','neutral','neutral'],['Zaghaft','neutral','neutral'],['Doche','neutral','neutral']];const calcStatKeys=['hp','atk','def','spa','spd','spe'];const calcStatLabels=['KP','Angriff','Verteidigung','Sp. Angriff','Sp. Verteidigung','Initiative'];
const calcStatuses=['Keine','Schlaf','Gift','Schwere Vergiftung','Verbrennung','Paralyse','Eingefroren'];const stages=['0','+1','+2','+3','+4','+5','+6'];
let calcItems=[];
// Pokémon Champions: currently equipable held items in Regulation M-C.
// This deliberately excludes non-held PokéAPI items (medicine, battle items, key items, etc.).
const CHAMPIONS_ITEM_SLUGS = new Set(`
abomasite absolite absolite-z aerodactylite aggronite air-balloon alakazite altarianite ampharosite aspear-berry audinite babiri-berry banettite barbaracite baxcalibrite beedrillite big-root binding-band black-belt black-glasses blastoisinite blazikenite bright-powder cameruptite chandelurite charcoal charizardite-x charizardite-y charti-berry cheri-berry chesnaughtite chesto-berry chilan-berry chimechite choice-scarf chople-berry clefablite coba-berry colbur-berry crabominite damp-rock delphoxite dragalgite dragon-fang dragoninite drampanite eelektrossite eject-button electric-seed emboarite excadrite expert-belt fairy-feather falinksite feraligite floettite focus-band focus-sash froslassite galladite garchompite garchompite-z gardevoirite gengarite glalitite glimmoranite golisopite golurkite grassy-seed greninjite gyaradosite haban-berry hard-stone hawluchanite heat-rock heracronite houndoominite icy-rock iron-ball kangaskhanite kasib-berry kebia-berry kings-rock leek leftovers leppa-berry life-orb light-ball light-clay lopunnite lucarionite lucarionite-z lum-berry magnet malamarite manectite mawilite medichamite meganiumite mental-herb meowsticite metagrossite metal-coat metronome miracle-seed misty-seed muscle-band mystic-water never-melt-ice normal-gem occa-berry oran-berry passho-berry payapa-berry pecha-berry persim-berry pidgeotite pinsirite poison-barb psychic-seed pyroarite quick-claw raichunite-x raichunite-y rawst-berry red-card rindo-berry rocky-helmet roseli-berry sablenite salamencite sceptilite scizorite scolipite scope-lens scovillainite scraftinite sharp-beak sharpedonite shed-shell shell-bell shuca-berry silk-scarf silver-powder sitrus-berry skarmorite slowbronite smooth-rock soft-sand spell-tag staraptite starminite steelixite swampertite tanga-berry terrain-extender twisted-spoon tyranitarite venusaurite victreebelite wacan-berry white-herb wide-lens wise-glasses yache-berry zoom-lens`.trim().split(/\s+/));
function normalizeItemName(name){return String(name||'').toLowerCase().replace(/[ _]+/g,'-').replace(/-+/g,'-').trim()}
function selectedItem(side){const id=Number($(side==='atk'?'atkItem':'defItem')?.value||0);return calcItems.find(x=>Number(x.id)===id)||null}
function makeEVInputs(side){const target=$(side==='atk'?'atkEV':'defEV');target.innerHTML=calcStatKeys.map((k,i)=>`<label>${calcStatLabels[i]}<input id="${side}-${k}" type="number" min="0" max="32" step="1" value="0"></label>`).join('');calcStatKeys.forEach(k=>$(`${side}-${k}`).addEventListener('input',()=>{calcEV(side);updateCalcSide(side)}))}
function fillOptions(){const nat=natureData.map((n,i)=>`<option value="${i}">${natureLabel(n)}</option>`).join('');$('atkNature').innerHTML=nat;$('defNature').innerHTML=nat;const items=`<option value="">${uiLang==='en'?'No item':'Kein Item'}</option>`+calcItems.map(x=>`<option value="${x.id}">${dataName('item',x.id,x.raw)||x.raw}</option>`).join('');$('atkItem').innerHTML=items;$('defItem').innerHTML=items;const sts=statusOptions().map(x=>`<option>${x}</option>`).join('');['atkStatus','defStatus'].forEach(id=>$(id).innerHTML=sts);['atkBoost','atkSpABoost','atkSpeedBoost','defBoost','defSpDBoost','defSpeedBoost'].forEach(id=>$(id).innerHTML=stages.map(x=>`<option>${x}</option>`).join(''));if(calcState.attacker)setAbilityOptions('atk',calcState.attacker);if(calcState.defender)setAbilityOptions('def',calcState.defender)}
function normalizeAbilityName(name){return String(name||'').toLowerCase().replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim()}
function abilityLabel(a){return dataName('ability',a.id,a.name)||title(a.name)}
function setAbilityOptions(side,p){
 const key=side==='atk'?'attacker':'defender',sel=$(side==='atk'?'atkAbility':'defAbility');
 if(!sel)return;
 const rawList=(p?._mcAbility?[{ability:{name:p._mcAbility,url:''},is_hidden:false,slot:1}]:p?.abilities)||[];
 const list=rawList.map(x=>({id:rid(x.ability?.url)||x.ability?.name,name:x.ability?.name||''})).filter(x=>x.id&&x.name);
 calcState.abilities[key]=list;const current=calcState.selectedAbility[key];sel.innerHTML=list.length?list.map((a,i)=>`<option value="${a.id}" ${String(current?.id||list[0].id)===String(a.id)?'selected':''}>${abilityLabel(a)}</option>`).join(''):`<option value="">${uiLang==='en'?'No ability data':'Keine Fähigkeitendaten'}</option>`;const picked=list.find(a=>String(a.id)===String(current?.id))||list[0]||null;calcState.selectedAbility[key]=picked;sel.disabled=!list.length}
function selectedAbility(side){const key=side==='atk'?'attacker':'defender';return calcState.selectedAbility[key]||null}

function natureMultiplier(index,key){const n=natureData[Number(index)||0];return n[1]===key?1.1:n[2]===key?.9:1}
function calcLevel50Stats(p,side){const vals=[];const nature=$(side==='atk'?'atkNature':'defNature').value;calcStatKeys.forEach((key,i)=>{const base=p.stats[i]?.base_stat||0,sp=Math.max(0,Math.min(32,Number($(`${side}-${key}`).value)||0));if(i===0)vals.push(base+sp+75);else vals.push(Math.floor((base+sp+20)*natureMultiplier(nature,key)))});return vals}
function updateCalcSide(side){const p=calcState[side==='atk'?'attacker':'defender'];const box=$(side==='atk'?'attackerPreview':'defenderPreview');if(!p){box.textContent='Noch kein Pokémon ausgewählt.';calcEV(side);return}setAbilityOptions(side,p);const vals=calcLevel50Stats(p,side);const ab=selectedAbility(side);box.innerHTML=`<img src="${sprite(p.id)}" alt=""><div><b>${calcDisplayName(p)}</b><div class="statsline">${vals.map((v,i)=>`${statLabel(i)} ${v}`).join(' · ')}</div><div class="abilityline">${uiLang==='en'?'Ability':'Fähigkeit'}: <strong>${ab?abilityLabel(ab):'—'}</strong></div></div>`;calcEV(side)}
function calcDisplayName(p){return p._formName||deP(p.speciesId||p.id)||title(p.name)}

function setupSearchBox(inputId,listId,side,itemsProvider,onPick){const input=$(inputId),list=$(listId);let lastItems=[];let pickedKey='';function draw(items){lastItems=items.slice(0,12);list.innerHTML=lastItems.map((x,i)=>`<button type="button" class="calc-suggest" data-index="${i}"><img src="${sprite(x.id)}" alt=""><span>${x.label}<small>${x.meta||''}</small></span></button>`).join('');list.hidden=!lastItems.length;list.querySelectorAll('button').forEach(b=>b.onclick=()=>{const x=lastItems[+b.dataset.index];input.value=x.label;list.hidden=true;pickedKey=String(x.id);onPick(x)})}
 function exactPick(){const q=input.value.trim().toLowerCase();if(!q)return false;const items=itemsProvider();const x=items.find(x=>x.label.toLowerCase()===q||x.name.toLowerCase()===q||String(x.id)===q||String(x.id).padStart(4,'0')===q);if(x&&pickedKey!==String(x.id)){pickedKey=String(x.id);list.hidden=true;onPick(x);return true}return !!x}
 input.addEventListener('input',()=>{pickedKey='';const q=input.value.trim().toLowerCase();if(!q){draw(itemsProvider().slice(0,12));return}draw(itemsProvider().filter(x=>x.label.toLowerCase().includes(q)||x.name.toLowerCase().includes(q)||String(x.id)===q||String(x.id).padStart(4,'0')===q).slice(0,12));exactPick()});
 input.addEventListener('focus',()=>{const q=input.value.trim().toLowerCase();draw(q?itemsProvider().filter(x=>x.label.toLowerCase().includes(q)||x.name.toLowerCase().includes(q)||String(x.id)===q||String(x.id).padStart(4,'0')===q):itemsProvider().slice(0,12))});
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();if(!exactPick()&&lastItems[0]){const x=lastItems[0];input.value=x.label;list.hidden=true;pickedKey=String(x.id);onPick(x)}}});
 input.addEventListener('blur',()=>{setTimeout(()=>exactPick(),0)});document.addEventListener('click',e=>{if(e.target!==input&&!list.contains(e.target))list.hidden=true})}
function pokemonSearchItems(){return mons.map(p=>({id:p.id,name:p.name,label:deP(p.id)||title(p.name),meta:`#${String(p.id).padStart(4,'0')}`}))}
function moveSearchItems(){return calcState.moves.map(m=>({id:m.id,name:m.name,label:m.label,meta:`${m.type||''} · ${m.cls||''}`}))}
async function selectCalcPokemon(side,item){
 const key=side==='atk'?'attacker':'defender',search=$(`${side}Search`);
 // IMPORTANT: store the selection BEFORE any API request. The calculator must
 // never depend on the species/form requests completing before a Pokémon is
 // considered selected.
 const selectedId=String(item.id);
 const base=mons.find(x=>String(x.id)===selectedId)||item;
 const placeholder={id:Number(item.id),name:item.name||base.name,stats:[],types:[],speciesId:Number(item.id),_formName:item.label||dataName('pokemon',item.id,item.name||base.name)};
 calcState[key]=placeholder;
 calcState.selectedAbility[key]=null;
 calcState.abilities[key]=[];
 search.value=item.label||dataName('pokemon',item.id,item.name||base.name)||title(item.name);
 search.disabled=false;
 updateCalcSide(side);
 try{
  const p=await json(`${API}/pokemon/${item.id}`);
  const speciesId=rid(p.species?.url)||item.id;
  p.speciesId=speciesId;
  p._formName=dataName('pokemon',speciesId,item.label||p.name)||item.label||title(p.name);
  // Ignore stale responses if the user selected another Pokémon meanwhile.
  if(String(calcState[key]?.id)!==selectedId)return;
  calcState[key]=p;
  calcState.selectedAbility[key]=null;
  setAbilityOptions(side,p);
  search.value=calcDisplayName(p);
  updateCalcSide(side);
  try{
   const species=await json(`${API}/pokemon-species/${speciesId}`);
   if(String(calcState[key]?.id)!==selectedId)return;
   await loadCalcForms(side,species,p.id);
   if(side==='atk' && String(calcState.attacker?.id)===selectedId)await loadCalcMoves();
  }catch(formError){console.warn('Form/species data:',formError);}
 }catch(e){
  console.error(e);
  if(String(calcState[key]?.id)===selectedId){
   search.disabled=false;
   updateCalcSide(side);
  }
 }
}
async function loadCalcForms(side,species,selectedId){
 const key=side==='atk'?'attacker':'defender',forms=[];
 for(const v of species.varieties||[]){
  const id=rid(v.pokemon.url);if(!id)continue;
  try{
   const fp=await json(v.pokemon.url);
   fp.speciesId=species.id;
   fp._formName=formDisplayName(fp,species.id,species.name);
   if(Number(species.id)===998 && String(fp.name||'').toLowerCase().includes('mega')){
    fp.abilities=[{ability:{name:'thermal-exchange',url:''},is_hidden:false,slot:1}];
    fp._mcAbility='Thermal Exchange';
   }
   forms.push(fp);
  }catch(e){}
 }
 const mcForms=mcFormsForSpecies(species.id);
 if(mcForms.length){
  let base=forms.find(fp=>Number(fp.id)===Number(species.id));
  if(!base){
   try{base=await json(`${API}/pokemon/${species.id}`);base.speciesId=species.id;}catch(e){base=null}
  }
  for(const f of mcForms){
   const label=f.label;
   const exists=forms.some(fp=>String(fp._formName||'').trim().toLowerCase()===String(label).trim().toLowerCase());
   if(exists)continue;
   if(base){
    const fp=syntheticMCForm(base,f);
    fp.speciesId=species.id;
    fp._formName=label;
    fp._calcFormId=`mc-${species.id}-${f.key}`;
    forms.push(fp);
   }
  }
 }
 calcState.forms[key]=forms;
 const sel=$(side==='atk'?'atkForm':'defForm');
 sel.innerHTML=forms.map(fp=>`<option value="${fp._calcFormId||fp.id}">${fp._formName}</option>`).join('');
 sel.disabled=forms.length<=1;
 const wanted=String(selectedId??calcState[key]?._calcFormId??calcState[key]?.id??'');
 const wantedForm=forms.find(fp=>String(fp._calcFormId||fp.id)===wanted);
 if(wantedForm)sel.value=String(wantedForm._calcFormId||wantedForm.id);
}
async function changeCalcForm(side,id){
 const key=side==='atk'?'attacker':'defender';
 const p=(calcState.forms[key]||[]).find(x=>String(x._calcFormId||x.id)===String(id));if(!p)return;
 calcState[key]=p;
 calcState.selectedAbility[key]=null;
 setAbilityOptions(side,p);
 $(side==='atk'?'atkSearch':'defSearch').value=calcDisplayName(p);
 updateCalcSide(side);
 if(side==='atk')await loadCalcMoves();
}
async function loadCalcMoves(){
 const p=calcState.attacker;
 const input=$('moveSearch');
 calcState.moves=[];
 $('moveSuggestions').innerHTML='';
 $('moveInfo').textContent=p?`${t('moveSearch')} …`:(uiLang==='en'?'Choose an attacker, then a move.':'Wähle einen Angreifer und danach eine Attacke.');
 if(!p)return;
 try{
  const data=await json(`${API}/pokemon/${p.id}`);
  const moveSources=[...(data.moves||[])];
  if(!moveSources.length || p._mcForm || p._formName?.toLowerCase().includes('mega')){
   const baseId=p.speciesId||p.id;
   if(String(baseId)!==String(p.id) || p._mcForm){
    try{
     const base=await json(`${API}/pokemon/${baseId}`);
     moveSources.push(...(base.moves||[]));
    }catch(e){}
   }
  }
  const seen=new Set();
  for(const x of moveSources){
   const id=rid(x.move.url);if(!id||seen.has(id))continue;
   seen.add(id);
   let info={id,name:x.move.name,label:deM(id)||title(x.move.name),type:'',cls:''};
   calcState.moves.push(info);
  }
  calcState.moves.sort((a,b)=>a.label.localeCompare(b.label,'de'));
  input.disabled=false;
  input.placeholder=t('moveSearch')+' …';
  input.value='';
 }catch(e){
  input.disabled=true;
  input.placeholder=uiLang==='en'?'Moves could not be loaded':'Attacken konnten nicht geladen werden';
 }
}
async function showMoveInfoById(id){
 if(!id)return;const sameMove=String(calcState.selectedMove)===String(id);calcState.selectedMove=id;
 try{
  const m=await json(`${API}/move/${id}`);
  const type=deT(rid(m.type?.url))||title(m.type?.name||'—');
  const cls=m.damage_class?.name==='physical'?(uiLang==='en'?'Physical':'Physisch'):m.damage_class?.name==='special'?(uiLang==='en'?'Special':'Speziell'):(uiLang==='en'?'Status':'Status');
  // PokeAPI does not consistently expose hit metadata for newer moves.
  // Population Bomb (Mäuseplage) can land from 1 to 10 hits, so provide
  // its known range explicitly; otherwise use the API metadata.
  const knownHitRanges={
   'population-bomb':{min:1,max:10}
  };
  const knownHitRange=knownHitRanges[String(m.name||'').toLowerCase()];
  const minHits=Math.max(1,Number(knownHitRange?.min??m.meta?.min_hits)||1);
  const maxHits=Math.max(minHits,Number(knownHitRange?.max??m.meta?.max_hits)||minHits);
  calcState.moveHitMeta={min:minHits,max:maxHits};
  calcState.selectedHits=sameMove&&calcState.selectedHits>=minHits&&calcState.selectedHits<=maxHits?calcState.selectedHits:maxHits;
  // Even moves with a fixed maximum (e.g. Triple Axel) can finish early if a
  // preceding hit misses. Let the user select 1..maxHits for those moves as
  // well; variable-hit moves keep their API-defined minimum.
  const controlMinHits=minHits===maxHits?1:minHits;
  calcState.selectedHits=Math.min(maxHits,Math.max(controlMinHits,Number(calcState.selectedHits)||maxHits));
  const hitControl=maxHits>1
   ?`<label class="hit-count"><span>${t('hitCount')}</span><select id="hitCount">${Array.from({length:maxHits-controlMinHits+1},(_,i)=>controlMinHits+i).map(n=>`<option value="${n}" ${n===calcState.selectedHits?'selected':''}>${n} ${t('hits')}</option>`).join('')}</select><small>${t('hitRangeHelp')}</small></label>`
   :'';
  $('moveInfo').innerHTML=`<div><b>${deM(id)||title(m.name)}</b> · ${type} · ${cls} · ${uiLang==='en'?'Power':'Stärke'}: ${m.power??'—'} · ${uiLang==='en'?'Accuracy':'Genauigkeit'}: ${m.accuracy??'—'}</div>${hitControl}`;
  const hitSel=$('hitCount');if(hitSel)hitSel.addEventListener('change',()=>{
   calcState.selectedHits=Number(hitSel.value)||maxHits;
   if(calcState.attacker&&calcState.defender&&calcState.selectedMove)calculateDamage();
  });
  const entry=calcState.moves.find(x=>x.id===id);if(entry){entry.type=type;entry.cls=cls}
 }catch(e){$('moveInfo').textContent=uiLang==='en'?'Move data could not be loaded.':'Attackendaten konnten nicht geladen werden.'}
}
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
function moveAbilityTypeAndPower(m,a,d){
 const ability=selectedAbility('atk');
 let type=m.type?.name||'', powerMult=1, notes=[];
 const name=String(m.name||'').toLowerCase();
 const ab=normalizeAbilityName(ability?.name);
 const aTypes=(a?.types||[]).map(t=>t.type?.name).filter(Boolean);
 if(ab==='aerilate'&&type==='normal'){type='flying';powerMult*=1.2;notes.push('Aerilate: Normal → Flying, ×1,2')}
 if(ab==='refrigerate'&&type==='normal'){type='ice';powerMult*=1.2;notes.push('Refrigerate: Normal → Ice, ×1,2')}
 if(ab==='pixilate'&&type==='normal'){type='fairy';powerMult*=1.2;notes.push('Pixilate: Normal → Fairy, ×1,2')}
 if(ab==='galvanize'&&type==='normal'){type='electric';powerMult*=1.2;notes.push('Galvanize: Normal → Electric, ×1,2')}
 if(ab==='dragonize'&&type==='normal'){type='dragon';powerMult*=1.2;notes.push('Dragonize: Normal → Dragon, ×1,2')}
 if(ab==='liquid voice'&&['sound-based'].includes(name)){type='water';notes.push('Liquid Voice: Schall-Attacke → Wasser')}
 if(ab==='iron fist'&&['drain punch','dynamic punch','focus punch','hammer arm','ice hammer','mach punch','meteor mash','power-up punch','shadow punch','sky uppercut','surging strikes','thunder punch','fire punch','bullet punch','double iron bash','plasma fists','wicked blow'].includes(name)){powerMult*=1.2;notes.push('Iron Fist: ×1,2')}
 const pulse=['aura sphere','dark pulse','dragon pulse','origin pulse','terrain pulse','water pulse','heal pulse','focus blast'];
 if(ab==='mega launcher'&&pulse.includes(name)){powerMult*=1.5;notes.push('Mega Launcher: ×1,5')}
 const bite=['bite','crunch','fire fang','ice fang','thunder fang','poison fang','psychic fangs','jaw lock','fishious rend','hyper fang','super fang','strong jaw'];
 if(ab==='strong jaw'&&bite.includes(name)){powerMult*=1.5;notes.push('Strong Jaw: ×1,5')}
 const slicing=['aerial ace','air slash','behemoth blade','ceaseless edge','cut','cross poison','leaf blade','night slash','psycho cut','razor leaf','sacred sword','secret sword','slash','solar blade','stone axe','x-scissor','kowtow cleave','mighty cleave'];
 if(ab==='sharpness'&&slicing.includes(name)){powerMult*=1.5;notes.push('Sharpness: ×1,5')}
 if(ab==='technician'&&Number(m.power||0)<=60&&Number(m.power||0)>0){powerMult*=1.5;notes.push('Technician: ×1,5')}
 if(ab==='tough claws'&&['physical'].includes(m.damage_class?.name)&&name!=='struggle'){powerMult*=1.3;notes.push('Tough Claws: Kontakt-Attacke ×1,3 (vorläufig)')}
 if(ab==='reckless'&&/(recoil|crash)/i.test(String(m.effect_entries?.[0]?.short_effect||''))){powerMult*=1.2;notes.push('Reckless: ×1,2')}
 if(ab==='sand force'&&$('weatherStatus')?.value==='sand'&&['ground','rock','steel'].includes(type)){powerMult*=1.3;notes.push('Sand Force: ×1,3')}
 if(ab==='solar power'&&$('weatherStatus')?.value==='sun'&&m.damage_class?.name==='special'){powerMult*=1.5;notes.push('Solar Power: ×1,5')}
 if(ab==='water bubble'&&type==='water'){powerMult*=2;notes.push('Water Bubble: Wasser ×2')}
 if(ab==='transistor'&&type==='electric'){powerMult*=1.3;notes.push('Transistor: Elektro ×1,3')}
 if(ab==='punk rock'&&['sound'].some(k=>name.includes(k))){powerMult*=1.3;notes.push('Punk Rock: Schall-Attacke ×1,3')}
 return {type,powerMult,notes};
}
function normalizeMoveName(name){return String(name||'').toLowerCase().replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim()}
function abilityDefenseMultiplier(m,d){
 const ability=selectedAbility('def');const ab=normalizeAbilityName(ability?.name);const type=m.type?.name||'';let mult=1,notes=[];
 if(ab==='thick fat'&&['fire','ice'].includes(type)){mult*=.5;notes.push('Speckschicht: ×0,5')}
 if(ab==='water bubble'&&type==='fire'){mult*=.5;notes.push('Water Bubble: Feuer ×0,5')}
  // Champions contact flag: Aura Guard only halves damage from moves that actually make contact.
  // PokeAPI does not expose the contact flag, so keep a local Champions-compatible contact list.
  const contactMoves=new Set([
  'accelerock',
  'acrobatics',
  'aerial ace',
  'anchor shot',
  'aqua jet',
  'aqua step',
  'aqua tail',
  'arm thrust',
  'assurance',
  'astonish',
  'avalanche',
  'axe kick',
  'behemoth bash',
  'behemoth blade',
  'bide',
  'bind',
  'bite',
  'bitter blade',
  'blaze kick',
  'body press',
  'body slam',
  'bolt beak',
  'bolt strike',
  'bounce',
  'branch poke',
  'brave bird',
  'breaking swipe',
  'brick break',
  'brutal swing',
  'bullet punch',
  'catastropika',
  'ceaseless edge',
  'chip away',
  'circle throw',
  'clamp',
  'close combat',
  'collision course',
  'comet punch',
  'comeuppance',
  'constrict',
  'counter',
  'covet',
  'crabhammer',
  'cross chop',
  'cross poison',
  'crunch',
  'crush claw',
  'crush grip',
  'cut',
  'darkest lariat',
  'dig',
  'dire claw',
  'dive',
  'dizzy punch',
  'double hit',
  'double iron bash',
  'double kick',
  'double shock',
  'double slap',
  'double-edge',
  'dragon ascent',
  'dragon claw',
  'dragon hammer',
  'dragon rush',
  'dragon tail',
  'drain punch',
  'draining kiss',
  'drill peck',
  'drill run',
  'dual chop',
  'dual wingbeat',
  'dynamic punch',
  'electro drift',
  'endeavor',
  'extreme speed',
  'facade',
  'fake out',
  'false surrender',
  'false swipe',
  'fell stinger',
  'fire fang',
  'fire lash',
  'fire punch',
  'first impression',
  'fishious rend',
  'flail',
  'flame charge',
  'flame wheel',
  'flare blitz',
  'flip turn',
  'floaty fall',
  'fly',
  'flying press',
  'focus punch',
  'force palm',
  'foul play',
  'frustration',
  'fury attack',
  'fury cutter',
  'fury swipes',
  'gear grind',
  'giga impact',
  'glaive rush',
  'grassy glide',
  'guillotine',
  'gyro ball',
  'hammer arm',
  'hard press',
  'head charge',
  'head smash',
  'headbutt',
  'headlong rush',
  'heart stamp',
  'heat crash',
  'heavy slam',
  'high horsepower',
  'high jump kick',
  'hold back',
  'horn attack',
  'horn drill',
  'horn leech',
  'hyper drill',
  'hyper fang',
  'ice ball',
  'ice fang',
  'ice hammer',
  'ice punch',
  'ice spinner',
  'infestation',
  'iron head',
  'iron tail',
  'jaw lock',
  'jet punch',
  'jump kick',
  'karate chop',
  'knock off',
  'kowtow cleave',
  'lash out',
  'last resort',
  'leaf blade',
  'leech life',
  "let's snuggle forever",
  'lick',
  'liquidation',
  'low kick',
  'low sweep',
  'lunge',
  'mach punch',
  'malicious moonsault',
  'mega kick',
  'mega punch',
  'megahorn',
  'metal claw',
  'meteor mash',
  'mighty cleave',
  'mortal spin',
  'multi-attack',
  'needle arm',
  'night slash',
  'nuzzle',
  'outrage',
  'payback',
  'peck',
  'petal dance',
  'phantom force',
  'plasma fists',
  'play rough',
  'pluck',
  'poison fang',
  'poison jab',
  'poison tail',
  'population bomb',
  'pounce',
  'pound',
  'power trip',
  'power whip',
  'power-up punch',
  'psyblade',
  'psychic fangs',
  'psyshield bash',
  'pulverizing pancake',
  'punishment',
  'pursuit',
  'quick attack',
  'rage',
  'rage fist',
  'raging bull',
  'rapid spin',
  'razor shell',
  'retaliate',
  'return',
  'revenge',
  'reversal',
  'rock climb',
  'rock smash',
  'rolling kick',
  'rollout',
  'sacred sword',
  'scratch',
  'searing sunraze smash',
  'seismic toss',
  'shadow claw',
  'shadow force',
  'shadow punch',
  'shadow sneak',
  'sizzly slide',
  'skitter smack',
  'skull bash',
  'sky drop',
  'sky uppercut',
  'slam',
  'slash',
  'smart strike',
  'smelling salts',
  'snap trap',
  'solar blade',
  'soul-stealing 7-star strike',
  'spark',
  'spectral thief',
  'spin out',
  'spirit break',
  'steamroller',
  'steel roller',
  'steel wing',
  'stomp',
  'stomping tantrum',
  'stone axe',
  'storm throw',
  'strength',
  'struggle',
  'submission',
  'sucker punch',
  'sunsteel strike',
  'super fang',
  'supercell slam',
  'superpower',
  'surging strikes',
  'tackle',
  'tail slap',
  'take down',
  'temper flare',
  'thief',
  'thrash',
  'throat chop',
  'thunder fang',
  'thunder punch',
  'thunderous kick',
  'trailblaze',
  'triple axel',
  'triple dive',
  'triple kick',
  'trop kick',
  'trump card',
  'u-turn',
  'upper hand',
  'v-create',
  'veevee volley',
  'vine whip',
  'vise grip',
  'vital throw',
  'volt tackle',
  'wake-up slap',
  'waterfall',
  'wave crash',
  'wicked blow',
  'wild charge',
  'wing attack',
  'wood hammer',
  'wrap',
  'wring out',
  'x-scissor',
  'zen headbutt',
  'zing zap',
  'zippy zap'
  ]);
  if(ab==='aura guard'&&contactMoves.has(normalizeMoveName(m.name))){
   mult*=.5;
   notes.push('Aura Guard: Kontaktschaden ×0,5');
  }
 if(ab==='heatproof'&&type==='fire'){mult*=.5;notes.push('Heatproof: Feuer ×0,5')}
 if(['filter','solid rock','prism armor'].includes(ab)){notes.push(`${abilityLabel(ability)}: Effekt bei Effektiv-Treffern wird in der vorläufigen Formel erst angewendet, wenn Typenwirkung vollständig modelliert ist`)}
 return {mult,notes};
}
function stageMultiplier(value){
 const n=Math.max(-6,Math.min(6,Number(value)||0));
 return n>=0?(2+n)/2:2/(2-n);
}
function getStage(side,kind){
 const id=side==='atk'?(kind==='atk'?'atkBoost':'atkSpABoost'):(kind==='def'?(kind==='def'?'defBoost':'defSpDBoost'):'');
 return Number($(id)?.value||0);
}
async function getTypeMultiplier(moveType,defender){
 const types=defender?.types||[];
 let mult=1;
 for(const t of types){
  const typeId=rid(t.type?.url);
  if(!typeId)continue;
  let rel=typeRelationsCache.get(String(typeId));
  if(!rel){rel=await json(`${API}/type/${typeId}`);typeRelationsCache.set(String(typeId),rel)}
  if((rel.damage_relations.double_damage_from||[]).some(x=>rid(x.url)===String(typeId))){/* noop: defensive type id is not the attacking type */}
  const src=rel.damage_relations;
  if((src.no_damage_from||[]).some(x=>x.name===moveType))mult*=0;
  else if((src.double_damage_from||[]).some(x=>x.name===moveType))mult*=2;
  else if((src.half_damage_from||[]).some(x=>x.name===moveType))mult*=.5;
 }
 return mult;
}
function exactBaseDamage(level,power,attack,defense){
 let x=Math.floor((2*level)/5)+2;
 x=Math.floor(x*power*attack/Math.max(1,defense));
 x=Math.floor(x/50)+2;
 return Math.max(1,x);
}
function itemAttackMultiplier(item,moveType,physical,isSuperEffective){
 const slug=normalizeItemName(item?.raw);
 let mult=1,notes=[];
 if(slug==='life-orb'){mult*=1.3;notes.push('Leben-Orb: ×1,3')}
 if(slug==='expert-belt'&&isSuperEffective){mult*=1.2;notes.push('Expertengurt: ×1,2 (sehr effektiv)')}
 if(slug==='muscle-band'&&physical){mult*=1.1;notes.push('Muskelband: physisch ×1,1')}
 if(slug==='wise-glasses'&&!physical){mult*=1.1;notes.push('Zauberbrille: speziell ×1,1')}
 const typeBoosts={'black-belt':'fighting','black-glasses':'dark','charcoal':'fire','dragon-fang':'dragon','fairy-feather':'fairy','hard-stone':'rock','magnet':'electric','metal-coat':'steel','miracle-seed':'grass','mystic-water':'water','never-melt-ice':'ice','poison-barb':'poison','sharp-beak':'flying','silk-scarf':'normal','silver-powder':'bug','soft-sand':'ground','spell-tag':'ghost','twisted-spoon':'psychic'};
 if(typeBoosts[slug]===moveType){mult*=1.2;notes.push(`${itemLabel(item)}: ×1,2`)}
 if(slug==='normal-gem'&&moveType==='normal'){mult*=1.3;notes.push('Normaljuwel: ×1,3')}
 return {mult,notes};
}
function itemDefenseMultiplier(item,moveType,defender,isSuperEffective){
 const slug=normalizeItemName(item?.raw);let mult=1,notes=[];
 const berries={'chilan-berry':'normal','kebia-berry':'poison','shuca-berry':'ground','coba-berry':'flying','chople-berry':'fighting','kasib-berry':'ghost','colbur-berry':'dark','roseli-berry':'fairy','passho-berry':'water','occa-berry':'fire','rindo-berry':'grass','wacan-berry':'electric','yache-berry':'ice','haban-berry':'dragon','charti-berry':'rock','babiri-berry':'steel','tanga-berry':'bug','payapa-berry':'psychic'};
 const berryType=berries[slug];
 if(berryType===moveType&&isSuperEffective){mult*=.5;notes.push(`${itemLabel(item)}: ×0,5 (sehr effektiv)`)}
 return {mult,notes};
}
function itemLabel(item){return item?(dataName('item',item.id,item.raw)||title(item.raw)):''}
async function calculateDamage(){
 const a=calcState.attacker,d=calcState.defender,mid=calcState.selectedMove;
 if(!a||!d||!mid){$('damageResult').innerHTML='<div class="damage-box">Bitte Angreifer, Verteidiger und Attacke auswählen.</div>';return}
 try{
  const m=await json(`${API}/move/${mid}`);
  if(!m.power){$('damageResult').innerHTML='<div class="damage-box">Diese Attacke hat keinen festen Basiswert. Eine direkte Schadenszahl wird dafür nicht angezeigt.</div>';return}
  const av=calcLevel50Stats(a,'atk'),dv=calcLevel50Stats(d,'def');
  const physical=m.damage_class?.name==='physical';
  const attackStat=physical?'atk':'spa', defenseStat=physical?'def':'spd';
  const attackIndex=physical?1:3, defenseIndex=physical?2:4;
  const atkItem=selectedItem('atk'),defItem=selectedItem('def');
  let attack=av[attackIndex]*stageMultiplier(getStage('atk',attackStat));
  let defense=dv[defenseIndex]*stageMultiplier(getStage('def',defenseStat));
  if(normalizeItemName(atkItem?.raw)==='light-ball'&&String(a.name||'').toLowerCase()==='pikachu') attack*=2;
  const attackerStatus=$('atkStatus')?.value||'Keine';
  if(attackerStatus==='Verbrennung'&&physical&&!['guts','marvel scale'].includes(String(selectedAbility('atk')?.name||'').toLowerCase())){
    attack=Math.floor(attack*.5);
  }
  defense=applyWeatherDefense(m,d,Math.floor(defense),physical);
  const abilityMove=moveAbilityTypeAndPower(m,a,d);
  const abilityDef=abilityDefenseMultiplier({...m,type:{name:abilityMove.type}},d);
  const fw=fieldWeatherPowerMultiplier({...m,type:{name:abilityMove.type}},a,d);
  let power=Math.floor(Number(m.power)*abilityMove.powerMult*fw.mult);
  const notes=[...abilityMove.notes,...abilityDef.notes,...fw.notes];
  if(attackerStatus==='Verbrennung'&&physical&&!['guts','marvel scale'].includes(String(selectedAbility('atk')?.name||'').toLowerCase()))notes.push('Verbrennung: Angriff ×0,5');
  if(getStage('atk',attackStat)!==0)notes.push(`Angriffs-Stufe: ${getStage('atk',attackStat)>0?'+':''}${getStage('atk',attackStat)}`);
  if(getStage('def',defenseStat)!==0)notes.push(`Verteidigungs-Stufe: ${getStage('def',defenseStat)>0?'+':''}${getStage('def',defenseStat)}`);
  const typeMult=await getTypeMultiplier(abilityMove.type,d);
  const isSuperEffective=typeMult>1;
  const itemAtk=itemAttackMultiplier(atkItem,abilityMove.type,physical,isSuperEffective);
  const itemDef=itemDefenseMultiplier(defItem,abilityMove.type,d,isSuperEffective);
  const itemNotes=[];
  if(normalizeItemName(atkItem?.raw)==='light-ball'&&String(a.name||'').toLowerCase()==='pikachu')itemNotes.push('Kugelblitz: Angriff/Sp. Angriff ×2');
  notes.push(...itemAtk.notes,...itemDef.notes,...itemNotes);
  if(typeMult===0){
    $('damageResult').innerHTML=`<div class="damage-box"><div class="damage-number">0 KP</div><div class="damage-percent">Keine Wirkung</div><div class="damage-muted">${deM(mid)||title(m.name)} · ${physical?'physisch':'speziell'} · ${uiLang==='de'?'Typimmunität':'Type immunity'}</div></div>`;return;
  }
  const aTypes=(a.types||[]).map(x=>x.type?.name).filter(Boolean);
  const stab=aTypes.includes(abilityMove.type)?1.5:1;
  const post=abilityDef.mult*stab*typeMult*itemAtk.mult*itemDef.mult;
  const hitCount=Math.max(1,Number($('hitCount')?.value)||calcState.selectedHits||1);
  // These moves increase their power on successive hits rather than dealing identical hits.
  const progressiveHitPowers=m.name==='triple-axel'?[20,40,60]:m.name==='triple-kick'?[10,20,30]:null;
  const hitPowers=progressiveHitPowers?progressiveHitPowers.slice(0,hitCount).map(v=>Math.floor(v*abilityMove.powerMult*fw.mult)):Array(hitCount).fill(power);
  const hitRolls=hitPowers.map(hitPower=>{
    const hitBase=exactBaseDamage(50,hitPower,Math.floor(attack),Math.floor(defense));
    return Array.from({length:16},(_,i)=>Math.max(1,Math.floor(hitBase*post*(85+i)/100)));
  });
  // Each hit has its own damage roll; the displayed range sums the per-hit minimum/maximum.
  const min=hitRolls.reduce((sum,r)=>sum+Math.min(...r),0);
  const max=hitRolls.reduce((sum,r)=>sum+Math.max(...r),0);
  const avg=hitRolls.reduce((sum,r)=>sum+r.reduce((x,y)=>x+y,0)/r.length,0);
  const hp=Math.max(1,dv[0]);
  const minPct=min/hp*100,maxPct=max/hp*100;
  const avgPct=avg/hp*100;
  const label=deM(mid)||title(m.name);
  const env=[getSelectedField().label,getSelectedWeather().label].filter(x=>x!=='Kein Feld'&&x!=='Kein Wetter').join(' · ');
  if(stab!==1)notes.push('STAB: ×1,5');
  if(typeMult!==1)notes.push(`Typenwirkung: ×${typeMult}`);
  if(getSelectedWeather()===weatherEffects.sand&&!physical&&(d.types||[]).some(t=>t.type?.name==='rock'))notes.push('Sandsturm: +50% Sp. Verteidigung des Gestein-Pokémon');
  if(getSelectedWeather()===weatherEffects.snow&&physical&&(d.types||[]).some(t=>t.type?.name==='ice'))notes.push('Schnee: +50% Verteidigung des Eis-Pokémon');
  $('damageResult').innerHTML=`<div class="damage-box">
   <div class="damage-number">${min}–${max} KP</div>
   <div class="damage-percent">${minPct.toFixed(1).replace('.',',')}–${maxPct.toFixed(1).replace('.',',')} % Schaden · Ø ${avg.toFixed(1).replace('.',',')} KP</div>
   <div class="hpbar-wrap"><div class="hpbar"><div class="hpbar-fill" style="width:${Math.max(0,100-maxPct)}%"></div></div><div class="hpbar-label">${Math.max(0,hp-max)}–${Math.max(0,hp-min)} KP verbleibend</div></div>
   <div class="damage-muted">${label}${hitCount>1?` · ${hitCount} ${t('hits')}`:''} · 16 ${uiLang==='en'?'damage rolls per hit':'Schadenswürfe pro Treffer'} (85–100 %) · ${physical?(uiLang==='en'?'physical':'physisch'):(uiLang==='en'?'special':'speziell')}${env?' · '+env:''}</div>
   ${notes.length?`<div class="damage-muted">${notes.join(' · ')}</div>`:''}
  </div>`;
 }catch(e){console.error(e);$('damageResult').innerHTML='<div class="damage-box">Berechnung konnte nicht durchgeführt werden.</div>'}
}
async function loadAllItems(){
 const d=await json(`${API}/item?limit=10000`);
 calcItems=d.results.map((x,i)=>{const id=i+1;return{id,name:deI(id)||title(x.name),raw:x.name}})
   .filter(x=>CHAMPIONS_ITEM_SLUGS.has(normalizeItemName(x.raw)))
   .sort((a,b)=>a.name.localeCompare(b.name,'de'));
}

function setupItemSearchV14(side){
  const input=$(side==='atk'?'atkItemSearch':'defItemSearch');
  const select=$(side==='atk'?'atkItem':'defItem');
  if(!input||!select)return;
  const all=Array.from(select.options).map(o=>({value:o.value,label:o.textContent}));
  function draw(){
    const q=input.value.trim().toLocaleLowerCase('de-DE');
    Array.from(select.options).forEach(o=>{
      o.hidden=!!q&&!o.textContent.toLocaleLowerCase('de-DE').includes(q);
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

 const pairs=[['atkNature','defNature'],['atkItem','defItem'],['atkItemSearch','defItemSearch'],['atkStatus','defStatus'],['atkBoost','defBoost'],['atkSpABoost','defSpDBoost'],['atkSpeedBoost','defSpeedBoost'],['atkAbility','defAbility']];
 for(const [a,b] of pairs){const A=$(a),B=$(b);if(A&&B){const v=A.value;A.value=B.value;B.value=v}}
 for(const k of calcStatKeys){const A=$(`atk-${k}`),B=$(`def-${k}`);if(A&&B){const v=A.value;A.value=B.value;B.value=v}}

 calcState.attacker=oldD;calcState.defender=oldA;
 calcState.forms.attacker=oldDForms;calcState.forms.defender=oldAForms;
 const oldAAbility=calcState.selectedAbility.attacker, oldDAbility=calcState.selectedAbility.defender;
 calcState.selectedAbility.attacker=oldDAbility;calcState.selectedAbility.defender=oldAAbility;
 const oldAAbilities=calcState.abilities.attacker, oldDAbilities=calcState.abilities.defender;
 calcState.abilities.attacker=oldDAbilities;calcState.abilities.defender=oldAAbilities;
 calcState.selectedMove=null;calcState.moves=[];

 async function refresh(side,p){
  const key=side==='atk'?'attacker':'defender';
  const search=$(side==='atk'?'atkSearch':'defSearch');
  const form=$(side==='atk'?'atkForm':'defForm');
  if(!p){
   search.value='';form.innerHTML=`<option>${uiLang==='en'?'Select Pokémon first …':'Erst Pokémon auswählen …'}</option>`;form.disabled=true;
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
 setupSearchBox('moveSearch','moveSuggestions','move',moveSearchItems,x=>{$('moveSearch').value=x.label;$('moveSuggestions').hidden=true;showMoveInfoById(x.id)});
 ['atkNature','atkItem','atkStatus','atkBoost','atkSpABoost','atkSpeedBoost'].forEach(id=>$(id).addEventListener('change',()=>updateCalcSide('atk')));
 $('atkAbility').addEventListener('change',()=>{const x=calcState.abilities.attacker.find(a=>String(a.id)===String($('atkAbility').value));calcState.selectedAbility.attacker=x||null;updateCalcSide('atk')});
 $('defAbility').addEventListener('change',()=>{const x=calcState.abilities.defender.find(a=>String(a.id)===String($('defAbility').value));calcState.selectedAbility.defender=x||null;updateCalcSide('def')});
 ['defNature','defItem','defStatus','defBoost','defSpDBoost','defSpeedBoost'].forEach(id=>$(id).addEventListener('change',()=>updateCalcSide('def')));
 $('atkForm').addEventListener('change',()=>changeCalcForm('atk',$('atkForm').value));$('defForm').addEventListener('change',()=>changeCalcForm('def',$('defForm').value));$('calcButton').addEventListener('click',calculateDamage);
 setupItemSearchV14('atk');setupItemSearchV14('def');$('switchCombatants').addEventListener('click',switchCombatantsV14);$('fieldStatus').addEventListener('change',()=>{if(calcState.selectedMove)showMoveInfoById(calcState.selectedMove)});$('weatherStatus').addEventListener('change',()=>{if(calcState.selectedMove)showMoveInfoById(calcState.selectedMove)});
}
async function init(){nav();$('metaSource')?.addEventListener('change',renderMeta);$('metaView')?.addEventListener('change',renderMeta);$('metaMoreStats')?.addEventListener('click',()=>{metaStatsExpanded=!metaStatsExpanded;renderMeta()});$('metaMoreBest')?.addEventListener('click',()=>{metaBestExpanded=!metaBestExpanded;renderMeta()});$('metaShowAllTeams')?.addEventListener('click',()=>{metaConcreteExpanded=!metaConcreteExpanded;renderMeta()});$('randomizeButton')?.addEventListener('click',randomizeTeam);$('search').oninput=search;$('clear').onclick=()=>{$('search').value='';$('suggestions').innerHTML='';render(dexInitialList());$('search').focus()};$('dexFilter')?.addEventListener('change',e=>{dexFilter=e.target.value==='champions'?'champions':'all';showMCOnly=false;showAllPokemon=false;$('showMCPokemon').textContent=t('showMC');$('showAllPokemon').textContent=t('showAll');$('suggestions').innerHTML='';$('search').value='';render(dexInitialList())});$('showAllPokemon').onclick=()=>{showAllPokemon=!showAllPokemon;showMCOnly=false;$('showAllPokemon').textContent=t(showAllPokemon?'showLess':'showAll');if($('showMCPokemon'))$('showMCPokemon').textContent=t('showMC');$('suggestions').innerHTML='';if($('search').value.trim())$('search').value='';render(dexInitialList());};
  $('showMCPokemon')?.addEventListener('click',()=>{showMCOnly=!showMCOnly;showAllPokemon=false;$('showMCPokemon').textContent=t(showMCOnly?'showAllDex':'showMC');$('showAllPokemon').textContent=t('showAll');$('suggestions').innerHTML='';$('search').value='';render(dexInitialList());});$('close').onclick=()=>{$('modal').hidden=true;document.body.style.overflow=''};$('backdrop').onclick=()=>{$('modal').hidden=true;document.body.style.overflow=''};$('infoClose').onclick=()=>{$('infoModal').hidden=true};$('infoBackdrop').onclick=()=>{$('infoModal').hidden=true};document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('infoModal').hidden){$('infoModal').hidden=true}else{$('modal').hidden=true;document.body.style.overflow=''}}});
 const pokemonListPromise=json(`${API}/pokemon?limit=1025`);const languagePromise=loadLanguages();try{const d=await pokemonListPromise;mons=d.results.map((p,i)=>({name:p.name,id:i+1}));$('status').textContent=uiLang==='en'?`${mons.length} Pokémon loaded`:`${mons.length} Pokémon geladen`;render(dexInitialList());setupCalculator();applyLanguage();$('showAllPokemon').textContent=t(showAllPokemon?'showLess':'showAll');$('languageSelect')?.addEventListener('change',e=>setLanguage(e.target.value));languagePromise.then(()=>{if(mons.length)render(dexInitialList());applyLanguage();$('showAllPokemon').textContent=t(showAllPokemon?'showLess':'showAll');}).catch(e=>console.warn('Languages:',e));}catch(e){console.error(e);$('status').textContent=t('loadError');setupCalculator();applyLanguage();$('languageSelect')?.addEventListener('change',e=>setLanguage(e.target.value))}
 loadAllItems().then(()=>{fillOptions();setupItemSearchV14('atk');setupItemSearchV14('def')}).catch(e=>console.warn('Items:',e));
}
init();
