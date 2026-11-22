const API="https://mlbbdex.com/api/v1";
const tg=window.Telegram?.WebApp;if(tg){tg.ready();tg.expand();try{tg.setHeaderColor("#0d1018");tg.setBackgroundColor("#0d1018")}catch(e){}}
const $=id=>document.getElementById(id), state={heroes:[],items:[],spells:[],emblems:[],rankings:[],patches:[],role:"all",itemCategory:"all"};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const arr=v=>Array.isArray(v)?v:(v==null?[]:[v]);
const pick=(o,keys)=>{for(const k of keys){if(o?.[k]!=null&&o[k]!=="")return o[k]}return null};
const nameOf=o=>pick(o,["name","localizedName","title","label","slug","id"])||"Без названия";
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
 $("heroGrid").innerHTML=list.length?list.map(h=>{const n=nameOf(h),role=roles(h).join(" / ")||"Роль не указана",lane=lanes(h).join(" · ");return `<button class="hero-card" data-hero="${esc(h.slug||h.id||n)}"><div class="avatar">${esc(n.slice(0,1).toUpperCase())}</div><div><h3>${esc(n)}</h3><p>${esc(role)}${lane?" · "+esc(lane):""}</p></div></button>`}).join(""):'<div class="empty">Ничего не найдено.</div>';
}
async function openHero(key){
 let h=state.heroes.find(x=>String(x.slug||x.id||nameOf(x))===String(key));
 if(!h)return;
 try{if(h.slug||h.id){const d=await api("/heroes/"+encodeURIComponent(h.slug||h.id));h=dataOf(d)||h}}catch(e){console.warn("Hero detail unavailable",e)}
 const skills=arr(pick(h,["skills","abilities"])),stats=pick(h,["baseStats","stats","attributes"]),special=arr(pick(h,["specialties","specialty"])),rolesText=roles(h).join(" / "),lanesText=lanes(h).join(", ");
 const skillHtml=skills.length?skills.map((s,i)=>`<li><b>${esc(pick(s,["name","title"])||"Навык "+(i+1))}</b>${pick(s,["description","desc","effect"])?": "+esc(asText(pick(s,["description","desc","effect"]))):""}</li>`).join(""):"<li>Подробное описание навыков не предоставлено источником.</li>";
 let statsHtml="";if(stats&&typeof stats==="object")statsHtml=Object.entries(stats).map(([k,v])=>`<div><small>${esc(k)}</small><b>${esc(asText(v))}</b></div>`).join("");
 $("modalBody").innerHTML=`<label class="eyebrow">ГЕРОЙ MLBB</label><h2>${esc(nameOf(h))}</h2><div class="modal-tags">${[rolesText,lanesText,...special.map(asText)].filter(Boolean).map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</div><p>${esc(asText(pick(h,["description","lore","story","bio"])||"Карточка героя из открытой базы MLBB."))}</p><div class="kv">${statsHtml||`<div><small>Роли</small><b>${esc(rolesText||"—")}</b></div><div><small>Линии</small><b>${esc(lanesText||"—")}</b></div>`}</div><h3>Навыки</h3><ul>${skillHtml}</ul>${h.skins?`<h3>Облики</h3><p>${esc(arr(h.skins).map(asText).join(", "))}</p>`:""}<p class="muted">Сведения показываются в объёме, который опубликован источником. Баланс и описания могут меняться после патчей.</p>`;
 $("modal").classList.remove("hidden");document.body.style.overflow="hidden";
}
function renderItems(){
 const q=$("itemSearch").value.toLowerCase(),list=state.items.filter(x=>(state.itemCategory==="all"||String(pick(x,["category","type"])||"").toLowerCase()===state.itemCategory.toLowerCase())&&nameOf(x).toLowerCase().includes(q));
 $("itemCount").textContent=list.length;
 $("itemList").innerHTML=list.length?list.map(x=>`<div class="list-row"><div><b>${esc(nameOf(x))}</b><small>${esc(asText(pick(x,["description","passive","effect"])||pick(x,["category","type"])||"Предмет"))}</small></div><div class="right">${pick(x,["price","cost"])?esc(pick(x,["price","cost"]))+" зол.":""}</div></div>`).join(""):'<div class="empty">Предметы не найдены.</div>';
}
function renderSimple(id,data,type){
 $(id).innerHTML=data.length?data.map(x=>`<article class="data-card"><div class="avatar">${esc(nameOf(x).slice(0,1).toUpperCase())}</div><div><h3>${esc(nameOf(x))}</h3><p>${esc(asText(pick(x,["description","effect","bonus","role","cooldown"])||"Описание в источнике"))}</p></div></article>`).join(""):'<div class="empty">Данные временно недоступны.</div>';
}
function renderRankings(){
 const list=[...state.rankings].sort((a,b)=>(Number(pick(b,["score","winRate","win_rate"])||0)-Number(pick(a,["score","winRate","win_rate"])||0)));
 $("rankingDate").textContent=state.rankingMeasured?new Date(state.rankingMeasured).toLocaleDateString("ru-RU"):"Дата не указана";
 $("rankingList").innerHTML=list.length?list.map((x,i)=>`<div class="list-row"><div><b>${i+1}. ${esc(nameOf(x))}</b><small>${esc(asText(pick(x,["tier","rank","role"])||"Тир не указан"))}</small></div><div class="right">${pick(x,["winRate","win_rate","win"])?esc(pick(x,["winRate","win_rate","win"]))+"%":""}</div></div>`).join(""):'<div class="empty">Тир-лист не предоставлен API.</div>';
}
function renderPatches(){
 $("patchList").innerHTML=state.patches.length?state.patches.map(x=>`<div class="list-row"><div><b>${esc(nameOf(x))}</b><small>${esc(asText(pick(x,["date","releaseDate","publishedAt"])||"Дата не указана"))}</small></div><div class="right">${x.url?`<a href="${esc(x.url)}" target="_blank" rel="noopener">Открыть ↗</a>`:"Патч"}</div></div>`).join(""):'<div class="empty">Список патчей недоступен.</div>';
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
