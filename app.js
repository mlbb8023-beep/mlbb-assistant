const API="https://mlbbdex.com/api/v1";
const tg=window.Telegram?.WebApp;if(tg){tg.ready();tg.expand();try{tg.setHeaderColor("#0d1018");tg.setBackgroundColor("#0d1018")}catch(e){}}
const $=id=>document.getElementById(id), state={heroes:[],items:[],spells:[],emblems:[],rankings:[],patches:[],role:"all",itemCategory:"all"};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const arr=v=>Array.isArray(v)?v:(v==null?[]:[v]);
const pick=(o,keys)=>{for(const k of keys){if(o?.[k]!=null&&o[k]!=="")return o[k]}return null};
const nameOf=o=>pick(o,["name","localizedName","title","label","slug","id"])||"Без названия";
const roleRu={Tank:"Танк",Fighter:"Боец",Assassin:"Убийца",Mage:"Маг",Marksman:"Стрелок",Support:"Поддержка"};
const laneRu={Gold:"Золотая линия",GoldLane:"Золотая линия",Jungle:"Лес",Mid:"Центральная линия",Exp:"Линия опыта",Roam:"Роум"};
const categoryRu={Attack:"Атака",Magic:"Магия",Defense:"Защита",Movement:"Передвижение",Jungling:"Лес",Roaming:"Роум"};
const spellRu={"Flicker":"Вспышка","Retribution":"Кара","Execute":"Казнь","Purify":"Очищение","Sprint":"Спринт","Inspire":"Вдохновение","Aegis":"Эгида","Arrival":"Прибытие","Petrify":"Окаменение","Revitalize":"Исцеление","Vengeance":"Возмездие"};
const heroRu={Miya:"Мия",Layla:"Лейла",Tigreal:"Тигрил",Eudora:"Эудора",Zilong:"Зилонг",Saber:"Сабер",Estes:"Эстес",Franco:"Франко",Nana:"Нана",Balmond:"Балмонд",Alucard:"Алукард",Alice:"Алиса",Akai:"Акай",Fanny:"Фанни",Gusion:"Гусион",Hayabusa:"Хаябуса",Lancelot:"Ланселот",Kagura:"Кагура",Chou:"Чу",Grock:"Грок",Angela:"Ангела",Claude:"Клод",Granger:"Грейнджер",Esmeralda:"Эсмеральда",Khufra:"Хуфра",YuZhong:"Юй Чжун",Yve:"Ив",Beatrix:"Беатрис",Melissa:"Мелисса",Joy:"Джой",Arlott:"Арлотт",Nolan:"Нолан",Cici:"Сиси",Zhuxin:"Чжусинь",Suyou:"Сую",Lukas:"Лукас",Obsidia:"Обсидия"};
function ruName(v){const s=String(v??"");if(heroRu[s])return heroRu[s];return s.replace(/[A-ZА-ЯЁ][a-zа-яё]*/g,w=>heroRu[w]||translit(w));}
function translit(s){const map={a:"а",b:"б",c:"к",d:"д",e:"е",f:"ф",g:"г",h:"х",i:"и",j:"дж",k:"к",l:"л",m:"м",n:"н",o:"о",p:"п",q:"к",r:"р",s:"с",t:"т",u:"у",v:"в",w:"в",x:"кс",y:"й",z:"з"};return String(s).replace(/[A-Za-z]+/g,w=>w.split("").map((c,i)=>{let x=map[c.toLowerCase()]||c;return i===0?x.toUpperCase():x}).join(""));}
function ruRole(v){return roleRu[v]||ruName(v)}
function ruLane(v){return laneRu[String(v).replace(/\s/g,"")]||ruName(v)}
function ruCategory(v){return categoryRu[v]||ruName(v)}
function ruSpell(v){return spellRu[v]||ruName(v)}
function ruDescription(v){if(!v)return "Описание пока не опубликовано на русском языке.";const s=asText(v);return /[А-Яа-яЁё]/.test(s)?s:"Подробное описание пока недоступно на русском языке.";}
function imageFrom(o){
 const preferred=["portrait","portraitUrl","portrait_url","head","headUrl","head_url","icon","iconUrl","icon_url","image","imageUrl","image_url","artwork","artworkUrl","artwork_url","cover"];
 for(const k of preferred){const v=o?.[k];if(typeof v==="string"&&/^https?:\/\//i.test(v))return v;}
 const images=o?.images;if(images&&typeof images==="object"){for(const k of ["portrait","head","icon","avatar","artwork","cover"]){const v=images[k];if(typeof v==="string"&&/^https?:\/\//i.test(v))return v;}}
 return null;
}
function heroLabel(h){return heroRu[nameOf(h)]||ruName(nameOf(h));}
function extractCounterGroups(raw){
 const root=raw?.data??raw;const groups=[];
 const labels={counters:"Герои, которые сильны против выбранного",counteredBy:"Герои, которые сильны против выбранного",beatenBy:"Герои, которые сильны против выбранного",weakAgainst:"Герои, которые сильны против выбранного",strongAgainst:"Герои, против которых выбранный герой силён",beats:"Герои, против которых выбранный герой силён",favorable:"Благоприятные противники",unfavorable:"Неблагоприятные противники"};
 function walk(obj,depth=0){
  if(depth>4||!obj||typeof obj!=="object")return;
  if(Array.isArray(obj)){obj.forEach(x=>walk(x,depth+1));return;}
  for(const [k,v] of Object.entries(obj)){
   if(Array.isArray(v)&&(labels[k]||/counter|weak|strong|beat|opponent/i.test(k))){const label=labels[k]||(/strong|beat|favorable/i.test(k)?"Герои, против которых выбранный герой силён":"Герои, которые сильны против выбранного");const rows=v.map(x=>{if(typeof x==="string")return {name:x};const d=x?.hero??x?.target??x?.opponent??x?.subHero??x;return {name:pick(d,["name","heroName","hero_name","hero_name_en","slug","id","label"])||"Герой",gap:pick(x,["winRateGap","win_rate_gap","gap","delta","rate","value","increase_win_rate"]),rank:pick(x,["rank","tier"])};});groups.push({label,rows});}
   else if(v&&typeof v==="object")walk(v,depth+1);
  }
 }
 walk(root);
 const seen=new Set();return groups.filter(g=>{const key=g.label+g.rows.map(x=>x.name).join("|");if(seen.has(key))return false;seen.add(key);return g.rows.length>0;});
}
const asText=v=>typeof v==="string"?v:typeof v==="number"?String(v):Array.isArray(v)?v.map(asText).join(", "):v&&typeof v==="object"?pick(v,["name","description","value","text"])||JSON.stringify(v):"";
async function api(path){const r=await fetch(API+path,{headers:{Accept:"application/json"}});if(!r.ok)throw Error("API "+r.status);return r.json()}
function dataOf(r){return r?.data??r?.heroes??r?.items??r?.results??r}
async function load(){
 try{
  const [h,i,s,e,r,p]=await Promise.all(["/heroes","/items","/spells?locale=en","/emblems?locale=en","/rankings","/patches"].map(api));
  state.heroes=arr(dataOf(h));state.items=arr(dataOf(i));state.spells=arr(dataOf(s));state.emblems=arr(dataOf(e));
  const rankData=dataOf(r);state.rankings=arr(rankData?.heroes??rankData);state.rankingMeasured=rankData?.measuredAt||r?.measuredAt;
  state.patches=arr(dataOf(p));
  $("apiStatus").className="status ok";$("apiStatus").innerHTML="<span></span> База подключена";
 }catch(err){
  console.warn(err);$("apiStatus").className="status bad";$("apiStatus").innerHTML="<span></span> Нет связи с базой";
  try{const r=await fetch("data/heroes-fallback.json");state.heroes=await r.json();}catch(e){}
  toast("Не удалось подключить полную базу. Проверь интернет.");
 }
 $("heroTotal").textContent=state.heroes.length||"—";$("itemTotal").textContent=state.items.length||"—";
 $("heroCount").textContent=state.heroes.length;$("itemCount").textContent=state.items.length;
 renderHeroes();renderItems();renderSimple("spellGrid",state.spells,"spell");renderSimple("emblemGrid",state.emblems,"emblem");renderRankings();renderPatches();
}
function roles(h){return arr(pick(h,["roles","role","primaryRole"])).map(x=>typeof x==="object"?nameOf(x):x)}
function lanes(h){return arr(pick(h,["lanes","lane","positions"])).map(x=>typeof x==="object"?nameOf(x):x)}
function renderHeroes(){
 const q=$("heroSearch").value.trim().toLowerCase();
 const list=state.heroes.filter(h=>(state.role==="all"||roles(h).some(x=>x.toLowerCase()===state.role.toLowerCase()))&&[nameOf(h),h.slug,...roles(h),...lanes(h)].join(" ").toLowerCase().includes(q));
 $("heroCount").textContent=list.length;
 $("heroGrid").innerHTML=list.length?list.map(h=>{const n=heroLabel(h),role=roles(h).map(ruRole).join(" / ")||"Роль не указана",lane=lanes(h).map(ruLane).join(" · "),portrait=imageFrom(h);return `<button class="hero-card" data-hero="${esc(h.slug||h.id||nameOf(h))}"><div class="avatar ${portrait?"has-image":""}">${portrait?`<img src="${esc(portrait)}" alt="${esc(n)}" loading="lazy" onerror="this.remove()">`:esc(n.slice(0,1))}</div><div><h3>${esc(n)}</h3><p>${esc(role)}${lane?" · "+esc(lane):""}</p></div></button>`}).join(""):'<div class="empty">Ничего не найдено.</div>';
}
async function openHero(key){
 let h=state.heroes.find(x=>String(x.slug||x.id||nameOf(x))===String(key));
 if(!h)return;
 let detail=h,counterData=null;
 try{if(h.slug||h.id){const d=await api("/heroes/"+encodeURIComponent(h.slug||h.id));detail=dataOf(d)||h}}catch(e){console.warn("Hero detail unavailable",e)}
 try{if(h.slug||h.id){counterData=await api("/heroes/"+encodeURIComponent(h.slug||h.id)+"/counters")}}catch(e){console.warn("Counter data unavailable",e)}
 const skills=arr(pick(detail,["skills","abilities"])),stats=pick(detail,["baseStats","stats","attributes"]),special=arr(pick(detail,["specialties","specialty"])),rolesText=roles(h).map(ruRole).join(" / "),lanesText=lanes(h).map(ruLane).join(", "),portrait=imageFrom(detail)||imageFrom(h);
 const skillHtml=skills.length?skills.map((s,i)=>`<li><b>${esc(ruName(pick(s,["name","title"])||"Навык "+(i+1)))}</b>${pick(s,["description","desc","effect"])?": "+esc(ruDescription(pick(s,["description","desc","effect"]))):""}</li>`).join(""):"<li>Подробное описание навыков пока недоступно на русском языке.</li>";
 let statsHtml="";if(stats&&typeof stats==="object")statsHtml=Object.entries(stats).map(([k,v])=>`<div><small>${esc(ruName(k))}</small><b>${esc(asText(v))}</b></div>`).join("");
 const counterGroups=counterData?extractCounterGroups(counterData):[];
 const counterHtml=counterGroups.length?counterGroups.map(g=>`<section class="counter-group"><h3>${esc(g.label)}</h3><div class="counter-list">${g.rows.slice(0,8).map(c=>`<div class="counter-row"><b>${esc(heroRu[c.name]||ruName(c.name))}</b>${c.gap!=null?`<small>${esc(String(c.gap))} п.п.</small>`:""}</div>`).join("")}</div></section>`).join(""):'<p class="muted">Статистика контрпиков для этого героя сейчас недоступна.</p>';
 $("modalBody").innerHTML=`<div class="profile-head">${portrait?`<img class="profile-portrait" src="${esc(portrait)}" alt="${esc(heroLabel(h))}" onerror="this.style.display='none'">`:`<div class="profile-placeholder">${esc(heroLabel(h).slice(0,1))}</div>`}<div><label class="eyebrow">ГЕРОЙ MOBILE LEGENDS</label><h2>${esc(heroLabel(h))}</h2><div class="modal-tags">${[rolesText,lanesText,...special.map(x=>ruName(asText(x)))].filter(Boolean).map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</div></div></div><p>${esc(ruDescription(pick(detail,["description","lore","story","bio"])))}</p><div class="kv">${statsHtml||`<div><small>Роли</small><b>${esc(rolesText||"Не указано")}</b></div><div><small>Линии</small><b>${esc(lanesText||"Не указано")}</b></div>`}</div><h3>Навыки героя</h3><ul>${skillHtml}</ul><h3>Контрпики и сложные противники</h3>${counterHtml}<p class="muted">Контрпики основаны на статистике сообщества. Результат зависит от ранга, состава команд и выбранного периода.</p>`;
 $("modal").classList.remove("hidden");document.body.style.overflow="hidden";
}
function renderItems(){
 const q=$("itemSearch").value.toLowerCase(),list=state.items.filter(x=>(state.itemCategory==="all"||String(pick(x,["category","type"])||"").toLowerCase()===state.itemCategory.toLowerCase())&&heroLabel(x).toLowerCase().includes(q));
 $("itemCount").textContent=list.length;
 $("itemList").innerHTML=list.length?list.map(x=>`<div class="list-row"><div><b>${esc(ruName(nameOf(x)))}</b><small>${esc(ruDescription(pick(x,["description","passive","effect"])||ruCategory(pick(x,["category","type"])||"Предмет")))}</small></div><div class="right">${pick(x,["price","cost"])?esc(pick(x,["price","cost"]))+" зол.":""}</div></div>`).join(""):'<div class="empty">Предметы не найдены.</div>';
}
function renderSimple(id,data,type){
 $(id).innerHTML=data.length?data.map(x=>`<article class="data-card"><div class="avatar">${esc(ruName(nameOf(x)).slice(0,1))}</div><div><h3>${esc(ruName(nameOf(x)))}</h3><p>${esc(ruDescription(pick(x,["description","effect","bonus","role","cooldown"])))}</p></div></article>`).join(""):'<div class="empty">Данные временно недоступны.</div>';
}
function renderRankings(){
 const list=[...state.rankings].sort((a,b)=>(Number(pick(b,["score","winRate","win_rate"])||0)-Number(pick(a,["score","winRate","win_rate"])||0)));
 $("rankingDate").textContent=state.rankingMeasured?new Date(state.rankingMeasured).toLocaleDateString("ru-RU"):"Дата не указана";
 $("rankingList").innerHTML=list.length?list.map((x,i)=>`<div class="list-row"><div><b>${i+1}. ${esc(ruName(nameOf(x)))}</b><small>${esc(ruName(asText(pick(x,["tier","rank","role"])||"Тир не указан")))}</small></div><div class="right">${pick(x,["winRate","win_rate","win"])?esc(pick(x,["winRate","win_rate","win"]))+"%":""}</div></div>`).join(""):'<div class="empty">Тир-лист не предоставлен API.</div>';
}
function renderPatches(){
 $("patchList").innerHTML=state.patches.length?state.patches.map(x=>`<div class="list-row"><div><b>${esc(ruName(nameOf(x)))}</b><small>${esc(asText(pick(x,["date","releaseDate","publishedAt"])||"Дата не указана"))}</small></div><div class="right">${x.url?`<a href="${esc(x.url)}" target="_blank" rel="noopener">Открыть ↗</a>`:"Патч"}</div></div>`).join(""):'<div class="empty">Список патчей недоступен.</div>';
}
function closeModal(){$("modal").classList.add("hidden");document.body.style.overflow=""}
function toast(t){const x=$("toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2400)}
document.addEventListener("click",e=>{
 const tab=e.target.closest("[data-view]");if(tab){document.querySelectorAll(".navbtn").forEach(x=>x.classList.toggle("active",x===tab));document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id==="view-"+tab.dataset.view))}
 const role=e.target.closest("[data-role]");if(role){state.role=role.dataset.role;document.querySelectorAll("#roleFilters .chip").forEach(x=>x.classList.toggle("active",x===role));renderHeroes()}
 const cat=e.target.closest("[data-category]");if(cat){state.itemCategory=cat.dataset.category;document.querySelectorAll("#itemFilters .chip").forEach(x=>x.classList.toggle("active",x===cat));renderItems()}
 const hero=e.target.closest("[data-hero]");if(hero)openHero(hero.dataset.hero);
 if(e.target.closest("[data-close]"))closeModal();
});
$("heroSearch").addEventListener("input",renderHeroes);$("itemSearch").addEventListener("input",renderItems);document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
load();
