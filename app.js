const days=["9/24","9/25","9/26","9/27","9/28","9/29","9/30"];
const STORAGE_KEY="pingyao2026_h5_selected_by_day_v1";
const LAST_DAY_KEY="pingyao2026_h5_last_open_day_v1";
const UNIT_FILTER_KEY="pingyao2026_h5_unit_filter_v1";
const $=s=>document.querySelector(s);
const daysEl=$("#days"), timelineEl=$("#timeline"), toastEl=$("#toast");
let selected=localStorage.getItem(LAST_DAY_KEY)||"9/24";
let selectedUnit=localStorage.getItem(UNIT_FILTER_KEY)||"全部";
if(!["全部","藏龙","卧虎","首映","活动","短片","平遥十年","特别展映"].includes(selectedUnit)) selectedUnit="全部";
if(![...days,"全部"].includes(selected)) selected="9/24";
let detailKey="", calendarMode="day", shareBlob=null, shareDataUrl="";

function keyOf(item){return item[0]+"|"+item[2]+"|"+item[4]}
function activityKey(a){return a.date+"|"+a.start+"|"+a.title}
function minutes(t){const p=t.split(":").map(Number);return p[0]*60+p[1]}
function rangeOf(item){const p=item[2].split("-");return [minutes(p[0]),minutes(p[1])]}
function activityRange(a){return [minutes(a.start),minutes(a.end)]}
function overlaps(a,b){return a[0]<b[1]&&b[0]<a[1]}
function dayIndex(day){return days.indexOf(day)}
function cleanDetail(info){const out={};Object.keys(info||{}).forEach(k=>{const v=info[k];if(v==null||v===""||v==="—")return;if(typeof v==="string"&&/(暂未列出|未找到可核实|非2026竞赛提名)/.test(v))return;out[k]=v});return out}
function detailLines(v){return String(v||"").split(/[；;]\s*/).filter(Boolean).map(x=>`<div class="detailLine">${escapeHtml(x)}</div>`).join("")}
function loadAll(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")||{}}catch(e){return {}}}
function saveAll(all){localStorage.setItem(STORAGE_KEY,JSON.stringify(all))}
function saveDay(day,films,activities,specials){const all=loadAll();const old=all[day]||{};all[day]={films,activities,specials:specials||old.specials||[]};saveAll(all)}
function loadDay(day){const d=loadAll()[day]||{};const validSpecialKeys=new Set((window.SPECIAL_SESSIONS||[]).map(x=>x.key));return{films:d.films||[],activities:d.activities||[],specials:(d.specials||[]).filter(x=>validSpecialKeys.has(x.key))}}
function allSaved(){const all=loadAll(),films=[],activities=[],specials=[],validSpecialKeys=new Set((window.SPECIAL_SESSIONS||[]).map(x=>x.key));days.forEach(d=>{const x=all[d]||{};(x.films||[]).forEach(v=>films.push(v));(x.activities||[]).forEach(v=>activities.push(v));(x.specials||[]).filter(v=>validSpecialKeys.has(v.key)).forEach(v=>specials.push(v))});return{films,activities,specials}}
function showToast(msg){toastEl.textContent=msg;toastEl.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>toastEl.classList.remove("show"),1800)}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}

let filterScroll={date:0,unit:0};
function rememberFilterScroll(){
  const dr=daysEl.querySelector(".dateFilterRow");
  const ur=daysEl.querySelector(".unitFilterRow");
  if(dr) filterScroll.date=dr.scrollLeft;
  if(ur) filterScroll.unit=ur.scrollLeft;
}
function restoreFilterScroll(){
  requestAnimationFrame(()=>{
    const dr=daysEl.querySelector(".dateFilterRow");
    const ur=daysEl.querySelector(".unitFilterRow");
    if(dr) dr.scrollLeft=filterScroll.date;
    if(ur) ur.scrollLeft=filterScroll.unit;
    [dr,ur].forEach(row=>{
      if(!row) return;
      const active=row.querySelector(".active");
      if(!active) return;
      const r=row.getBoundingClientRect();
      const a=active.getBoundingClientRect();
      if(a.left<r.left || a.right>r.right){
        const target=row.scrollLeft+(a.left+a.width/2)-(r.left+r.width/2);
        row.scrollLeft=Math.max(0,Math.min(target,row.scrollWidth-row.clientWidth));
      }
    });
  });
}
function renderDays(){
  daysEl.innerHTML=`<div class="filterRow dateFilterRow">${["全部",...days].map(d=>`<button class="day ${selected===d?"active":""}" data-day="${d}">${d}</button>`).join("")}</div><div class="filterRow unitFilterRow">${["全部","藏龙","卧虎","首映","活动","短片","平遥十年","特别展映"].map(u=>`<button class="unitFilter ${selectedUnit===u?"active":""}" data-unit="${u}">${u}</button>`).join("")}</div>`;
  daysEl.querySelectorAll(".day").forEach(b=>b.onclick=()=>chooseDay(b.dataset.day));
  daysEl.querySelectorAll(".unitFilter").forEach(b=>b.onclick=()=>chooseUnit(b.dataset.unit));
  restoreFilterScroll();
}
function chooseDay(day){
  rememberFilterScroll();
  saveCurrentDay();
  selected=day;
  if(day!=="全部")localStorage.setItem(LAST_DAY_KEY,day);
  detailKey="";
  render();
  requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:"auto"}));
}
function chooseUnit(unit){
  rememberFilterScroll();
  selectedUnit=unit;
  localStorage.setItem(UNIT_FILTER_KEY,unit);
  detailKey="";
  render();
}
function saveCurrentDay(){if(selected==="全部")return;const d=currentSelection();saveDay(selected,d.films,d.activities,d.specials)}
function currentSelection(){return loadDay(selected)}
function selectedMaps(){const d=selected==="全部"?allSaved():currentSelection();return{films:new Set((d.films||[]).map(x=>x.key)),activities:new Set((d.activities||[]).map(x=>x.key)),specials:new Set((d.specials||[]).map(x=>x.key))}}
function refreshTop(){const one=selected!=="全部";$("#smartBox").hidden=!one;$("#tip").hidden=!one;$("#allTip").hidden=one;$("#tip").textContent="金色为电影排片；绿色为大师·对话；橙色为其他活动；蓝色与紫色为短片特别单元。当前可用单元筛选进一步缩小排片范围。"}
function matchesUnit(type,item){
  if(selectedUnit==="全部") return true;
  if(type==="film"){
    const u=String(item[9]||"");
    if(selectedUnit==="藏龙") return u.includes("藏龙");
    if(selectedUnit==="卧虎") return u.includes("卧虎");
    if(selectedUnit==="首映") return u.includes("首映");
    if(selectedUnit==="平遥十年") return u.includes("平遥十年");
    if(selectedUnit==="特别展映") return u.includes("特别展映");
    return false;
  }
  if(type==="activity") return selectedUnit==="活动";
  if(type==="special") return selectedUnit==="短片";
  return false;
}

function render(){
  renderDays();refreshTop();const maps=selectedMaps();
  const raw=(selected==="全部"?SCHEDULE:SCHEDULE.filter(x=>x[0]===selected)).filter(x=>matchesUnit("film",x)).slice().sort((a,b)=>dayIndex(a[0])-dayIndex(b[0])||a[2].localeCompare(b[2]));
  const acts=(selected==="全部"?(window.ALL_ACTIVITIES||MASTER_ACTIVITIES):(window.ALL_ACTIVITIES||MASTER_ACTIVITIES).filter(x=>x.date===selected)).filter(x=>selectedUnit==="全部"||selectedUnit==="活动").slice().sort((a,b)=>dayIndex(a.date)-dayIndex(b.date)||a.start.localeCompare(b.start));
  const specials=(selected==="全部"?SPECIAL_SESSIONS:SPECIAL_SESSIONS.filter(x=>x.date===selected)).filter(x=>matchesUnit("special",x)).slice().sort((a,b)=>dayIndex(a.date)-dayIndex(b.date)||a.start.localeCompare(b.start));
  const timeline=[];raw.forEach(x=>timeline.push({type:"film",start:x[2].split("-")[0],date:x[0],item:x}));acts.forEach(x=>timeline.push({type:"activity",start:x.start,date:x.date,item:x}));specials.forEach(x=>timeline.push({type:"special",start:x.start,date:x.date,item:x}));
  timeline.sort((a,b)=>dayIndex(a.date)-dayIndex(b.date)||a.start.localeCompare(b.start)||(a.type==="activity"?-1:(b.type==="activity"?1:a.type==="special"?-1:(b.type==="special"?1:0))));
  timelineEl.innerHTML=timeline.map(x=>x.type==="film"?filmHtml(x.item,maps.films):x.type==="activity"?activityHtml(x.item,maps.activities):specialHtml(x.item,maps.specials)).join("");bindTimeline();const d=selected==="全部"?allSaved():currentSelection();$("#selectedCount").textContent=d.films.length;$("#activityCountText").textContent=(d.activities.length?` + ${d.activities.length} 场活动`:"")+(d.specials.length?` + ${d.specials.length} 场特别单元`:"");
}
function filmHtml(item,map){const k=keyOf(item),sel=map.has(k),info=cleanDetail(FILM_DETAILS[item[4]]||{});let detail="";if(detailKey===k){detail=`<div class="inlineDetail"><div class="detailBlock"><span class="label">单元</span>${escapeHtml(info.unit||item[9]||"")}</div>${info.director?`<div class="detailBlock"><span class="label">导演</span>${escapeHtml(info.director)}</div>`:""}${info.cast?`<div class="detailBlock"><span class="label">主创 / 主演</span>${escapeHtml(info.cast)}</div>`:""}${info.festival?`<div class="detailBlock"><span class="label">电影节履历</span>${detailLines(info.festival)}</div>`:""}${info.awards?`<div class="award"><span class="label">获奖 / 提名信息</span>${detailLines(info.awards)}</div>`:""}<div class="inlineActions"><button data-action="toggleFilm" data-key="${escapeHtml(k)}">${sel?"取消选择":"加入今日观影日历"}</button><button data-action="closeDetail">收起</button></div></div>`}
return `<div class="movie ${sel?"selected":""}"><img class="movieIcon" src="assets/${["ticket.png","reel.png","camera.png","filmstrip.png","ticket.png","clapper.png"][SCHEDULE.indexOf(item)%6]}" alt=""><div class="time">${escapeHtml(item[2])}</div><div class="main" data-action="openFilm" data-key="${escapeHtml(k)}"><div class="film">${escapeHtml(item[4])}</div>${item[5]?`<div class="en">${escapeHtml(item[5])}</div>`:""}<div class="place">${escapeHtml(item[3])}${item[9]?` · ${escapeHtml(item[9])}`:""}</div><div class="tags">${item[6]?`<span class="tag">${escapeHtml(item[6])}</span>`:""}${item[7]?`<span class="tag creator">映前</span>`:""}${item[8]?`<span class="tag creator">映后</span>`:""}</div></div><div class="movieActions"><div class="movieActionRow" data-action="toggleFilm" data-key="${escapeHtml(k)}"><span class="plus ${sel?"minus":""}">${sel?"−":"＋"}</span><span class="actionLabel">加入日程</span></div><div class="ticketRow movieActionRow" data-action="ticket" data-key="${escapeHtml(k)}"><span class="ticketEmoji">🎫</span><span class="actionLabel">前往购票</span></div></div></div>${detail}`}
function activityHtml(a,map){const k=activityKey(a),sel=map.has(k),isMaster=a.kind==="大师·对话";let detail="";if(detailKey===k){detail=`<div class="inlineDetail ${isMaster?"activityDetail":"eventDetail"}">${isMaster?`<div class="detailBlock"><span class="label">嘉宾 / Guests</span>${escapeHtml(a.guests||"")}</div><div class="detailBlock"><span class="label">主持 / Moderator</span>${escapeHtml(a.moderator||"")}</div>`:""}<div class="detailBlock"><span class="label">地点 / Venue</span>${escapeHtml(a.venue||"")}</div>${a.unit?`<div class="detailBlock"><span class="label">活动 / ACTIVITY</span>${escapeHtml(a.unit)}</div>`:""}${a.price?`<div class="detailBlock"><span class="label">票价 / PRICE</span>${escapeHtml(a.price)}</div>`:""}<div class="inlineActions"><button data-action="toggleActivity" data-key="${escapeHtml(k)}">${sel?"取消选择":"加入今日观影日历"}</button><button data-action="closeDetail">收起</button></div></div>`}return `<div class="activity ${isMaster?"masterActivity":"eventActivity"} ${sel?"selected":""}"><img class="activityIcon" src="assets/${isMaster?"clapper.png":"ticket.png"}" alt=""><div class="activityTime">${escapeHtml(a.start)}<small>—${escapeHtml(a.end)}</small></div><div class="activityMain" data-action="openActivity" data-key="${escapeHtml(k)}"><span class="activityTag">${isMaster?"大师·对话":"活动"}</span><div class="activityTitle">${escapeHtml(a.title)}</div>${a.en?`<div class="activityEn">${escapeHtml(a.en)}</div>`:""}<div class="activityVenue">${escapeHtml(a.venue)}${a.unit?` · ${escapeHtml(a.unit)}`:""}</div>${a.price?`<div class="activityPrice">${escapeHtml(a.price)}</div>`:""}</div><div class="activityActionRow" data-action="toggleActivity" data-key="${escapeHtml(k)}"><span class="plus activityPlus ${isMaster?"": "eventPlus"} ${sel?"activityMinus":""}">${sel?"−":"＋"}</span><span class="actionLabel">加入日程</span></div></div>${detail}`}
function specialHtml(a,map){const k=a.key,sel=map.has(k),detail=detailKey===k?`<div class="inlineDetail specialDetail"><div class="detailBlock"><span class="label">单元 / UNIT</span>${escapeHtml(a.unit)}</div><div class="detailBlock"><span class="label">内容 / CONTENT</span>${escapeHtml(a.title)}</div><div class="detailBlock"><span class="label">状态 / STATUS</span>${escapeHtml(a.status||"")}</div>${a.meta?`<div class="detailBlock"><span class="label">备注 / NOTE</span>${escapeHtml(a.meta)}</div>`:""}<div class="inlineActions"><button data-action="toggleSpecial" data-key="${escapeHtml(k)}">${sel?"取消选择":"加入今日观影日历"}</button><button data-action="closeDetail">收起</button></div></div>`:"";const short=a.kind==="short";return `<div class="specialSession ${short?"specialShort":"specialCorner"} ${sel?"selected":""}"><img class="specialIcon" src="assets/${short?"filmstrip.png":"camera.png"}" alt=""><div class="specialTime">${escapeHtml(a.start)}<small>—${escapeHtml(a.end)}</small></div><div class="specialMain" data-action="openSpecial" data-key="${escapeHtml(k)}"><span class="specialTag">${escapeHtml(a.unit)}</span><div class="specialTitle">${escapeHtml(a.title)}</div>${a.en?`<div class="specialEn">${escapeHtml(a.en)}</div>`:""}<div class="specialVenue">${escapeHtml(a.venue)} · ${escapeHtml(a.status||"")}</div></div><div class="specialActionRow" data-action="toggleSpecial" data-key="${escapeHtml(k)}"><span class="plus specialPlus">${sel?"−":"＋"}</span><span class="actionLabel">加入日程</span></div></div>${detail}`}
function bindTimeline(){timelineEl.querySelectorAll("[data-action]").forEach(el=>el.onclick=()=>{const action=el.dataset.action,key=el.dataset.key;if(action==="toggleFilm")toggleFilmByKey(key);else if(action==="toggleActivity")toggleActivityByKey(key);else if(action==="toggleSpecial")toggleSpecialByKey(key);else if(action==="openFilm")openFilmByKey(key);else if(action==="openActivity")openActivityByKey(key);else if(action==="openSpecial"){detailKey=key;render()}else if(action==="ticket")goTicketByKey(key);else if(action==="closeDetail"){detailKey="";render()}})}
function findFilm(key){return SCHEDULE.find(x=>keyOf(x)===key)}function findAct(key){return (window.ALL_ACTIVITIES||MASTER_ACTIVITIES).find(x=>activityKey(x)===key)}function findSpecial(key){return SPECIAL_SESSIONS.find(x=>x.key===key)}
function toggleFilmByKey(key){const item=findFilm(key);if(!item)return;if(selected==="全部"){const d=loadDay(item[0]),arr=(d.films||[]).slice(),i=arr.findIndex(x=>x.key===key);if(i>=0)arr.splice(i,1);else arr.push({key,item});saveDay(item[0],arr,d.activities||[],d.specials||[])}else{const d=currentSelection(),arr=d.films.slice(),i=arr.findIndex(x=>x.key===key);if(i>=0)arr.splice(i,1);else arr.push({key,item});arr.sort((a,b)=>a.item[2].localeCompare(b.item[2]));saveDay(selected,arr,d.activities,d.specials)}detailKey="";render()}
function toggleActivityByKey(key){const item=findAct(key);if(!item)return;if(selected==="全部"){const d=loadDay(item.date),arr=(d.activities||[]).slice(),i=arr.findIndex(x=>x.key===key);if(i>=0)arr.splice(i,1);else arr.push({key,item});saveDay(item.date,d.films||[],arr,d.specials||[])}else{const d=currentSelection(),arr=d.activities.slice(),i=arr.findIndex(x=>x.key===key);if(i>=0)arr.splice(i,1);else arr.push({key,item});arr.sort((a,b)=>a.item.start.localeCompare(b.item.start));saveDay(selected,d.films,arr,d.specials)}detailKey="";render()}
function openFilmByKey(key){detailKey=detailKey===key?"":key;render()}function openActivityByKey(key){detailKey=detailKey===key?"":key;render()}
function goTicketByKey(key){const item=findFilm(key),url=TICKET_LINKS[item?.[4]]||FILM_LIST_URL;if(!item)return;window.location.href=url}

function festivalScore(item){const info=FILM_DETAILS[item[4]]||{};let score=45;const f=(info.festival||"")+(info.awards||"");if(/金棕榈|最佳男演员|金摄影机|最佳影片|最佳创新影片/.test(f))score=100;else if(/主竞赛/.test(info.festival||""))score=94;else if(/竞赛单元/.test(info.festival||""))score=88;else if(/影评人周|Perspectives|Discovery|论坛单元|一种关注|ACID|地平线|世界剧情片/.test(info.festival||""))score=82;else if(info.festival)score=70;if(item[6]==="首映场")score=Math.min(100,score+4);if(item[6]==="首场放映")score=Math.min(100,score+2);return score}
function creatorScore(item){return SMART_PROFILE.creator&&SMART_PROFILE.creator[item[4]]!==undefined?SMART_PROFILE.creator[item[4]]:68}
function activityScore(item){const b=!!item[7],a=!!item[8];return b&&a?100:b||a?60:0}
function filmScore(item){const festival=festivalScore(item),creator=creatorScore(item),event=activityScore(item),w=SMART_PROFILE.weights||{festival:.6,creator:.3,event:.1};return{festival,creator,event,total:Math.round((festival*w.festival+creator*w.creator+event*w.event)*10)/10}}
function selectSmartFilms(rawFilms,activities){const blocked=activities.map(activityRange),candidates=rawFilms.filter(x=>!blocked.some(b=>overlaps(rangeOf(x),b))).map(item=>({item,score:filmScore(item)}));let best=null;function consider(c){if(c.length<3||c.length>4)return;for(let i=0;i<c.length;i++)for(let j=i+1;j<c.length;j++)if(overlaps(rangeOf(c[i].item),rangeOf(c[j].item)))return;const total=c.reduce((s,x)=>s+x.score.total,0);if(!best||total>best.total)best={items:c,total}}function dfs(start,c){if(c.length>=3)consider(c);if(c.length===4)return;for(let i=start;i<candidates.length;i++)dfs(i+1,c.concat(candidates[i]))}dfs(0,[]);if(best)return best.items.sort((a,b)=>rangeOf(a.item)[0]-rangeOf(b.item)[0]);const chosen=[];candidates.sort((a,b)=>b.score.total-a.score.total).forEach(c=>{if(chosen.length<4&&chosen.every(x=>!overlaps(rangeOf(x.item),rangeOf(c.item))))chosen.push(c)});return chosen.sort((a,b)=>rangeOf(a.item)[0]-rangeOf(b.item)[0])}
let smartPlan=[],smartActivities=[];
function toggleSpecialByKey(key){const item=findSpecial(key);if(!item)return;if(selected==="全部"){const d=loadDay(item.date),arr=(d.specials||[]).slice(),i=arr.findIndex(x=>x.key===key);if(i>=0)arr.splice(i,1);else arr.push({key,item});arr.sort((a,b)=>a.item.start.localeCompare(b.item.start));saveDay(item.date,d.films||[],d.activities||[],arr)}else{const d=currentSelection(),arr=(d.specials||[]).slice(),i=arr.findIndex(x=>x.key===key);if(i>=0)arr.splice(i,1);else arr.push({key,item});arr.sort((a,b)=>a.item.start.localeCompare(b.item.start));saveDay(selected,d.films,d.activities,arr)}detailKey="";render()}
function makeSmart(){if(selected==="全部")return;const raw=SCHEDULE.filter(x=>x[0]===selected),acts=MASTER_ACTIVITIES.filter(x=>x.date===selected),plan=selectSmartFilms(raw,acts);smartPlan=plan.map(x=>({key:keyOf(x.item),item:x.item,score:x.score,selected:true}));smartActivities=acts.map(a=>({key:activityKey(a),item:a,selected:true}));$("#smartTitle").textContent=`${selected} · 智能安排`;$("#smartNote").textContent=SMART_PROFILE.note;renderSmart();openModal("smartModal")}
function renderSmart(){const sa=$("#smartActivities"),sf=$("#smartFilms");sa.innerHTML=smartActivities.map(x=>`<div class="smartItem smartActivityItem ${x.selected?"smartSelected":""}"><div class="smartTime">${x.item.start}—${x.item.end}</div><div class="smartFilm"><div class="smartFilmTitle">${escapeHtml(x.item.title)}</div><div class="smartMeta">${escapeHtml(x.item.venue)}</div></div><button class="smartPlus ${x.selected?"smartMinus":""}" data-smart-act="${escapeHtml(x.key)}">${x.selected?"−":"＋"}</button></div>`).join("");sf.innerHTML=smartPlan.map(x=>`<div class="smartItem ${x.selected?"smartSelected":""}"><div class="smartTime">${x.item[2]}</div><div class="smartFilm"><div class="smartFilmTitle">${escapeHtml(x.item[4])}</div><div class="smartMeta">${escapeHtml(x.item[3])} · ${escapeHtml(x.item[9])}</div><div class="scoreLine">履历 ${x.score.festival} · 主创 ${x.score.creator} · 映前/映后 ${x.score.event}</div></div><button class="smartPlus ${x.selected?"smartMinus":""}" data-smart-film="${escapeHtml(x.key)}">${x.selected?"−":"＋"}</button></div>`).join("");sa.querySelectorAll("[data-smart-act]").forEach(b=>b.onclick=()=>{const x=smartActivities.find(x=>x.key===b.dataset.smartAct);x.selected=!x.selected;renderSmart()});sf.querySelectorAll("[data-smart-film]").forEach(b=>b.onclick=()=>{const x=smartPlan.find(x=>x.key===b.dataset.smartFilm);x.selected=!x.selected;renderSmart()})}
function applySmart(){saveDay(selected,smartPlan.filter(x=>x.selected).map(x=>({key:x.key,item:x.item})),smartActivities.filter(x=>x.selected).map(x=>({key:x.key,item:x.item})));closeModal("smartModal");render();showToast("已加入今日安排")}

function entriesForMode(mode){const entries=[];if(mode==="full"||mode==="all"){const all=loadAll();days.forEach(day=>{const d=all[day]||{};(d.activities||[]).forEach(x=>{const fresh=findAct(x.key)||x.item;entries.push({date:day,weekday:fresh.weekday,type:"activity",start:fresh.start,end:fresh.end,title:fresh.title,en:fresh.en,venue:fresh.venue,item:fresh})});(d.specials||[]).forEach(x=>{const fresh=findSpecial(x.key)||x.item;entries.push({date:day,weekday:fresh.weekday,type:"special",kind:fresh.kind,start:fresh.start,end:fresh.end,title:fresh.title,en:fresh.en,venue:fresh.venue,unit:fresh.unit,status:fresh.status,meta:fresh.meta,item:fresh})});(d.films||[]).forEach(x=>entries.push({date:day,weekday:x.item[1],type:"film",start:x.item[2].split("-")[0],end:x.item[2].split("-")[1],title:x.item[4],en:x.item[5],venue:x.item[3],unit:x.item[9],status:x.item[6],item:x.item}))})}else{const d=currentSelection();d.activities.forEach(x=>{const fresh=findAct(x.key)||x.item;entries.push({date:selected,weekday:fresh.weekday,type:"activity",start:fresh.start,end:fresh.end,title:fresh.title,en:fresh.en,venue:fresh.venue,item:fresh})});(d.specials||[]).forEach(x=>{const fresh=findSpecial(x.key)||x.item;entries.push({date:selected,weekday:fresh.weekday,type:"special",kind:fresh.kind,start:fresh.start,end:fresh.end,title:fresh.title,en:fresh.en,venue:fresh.venue,unit:fresh.unit,status:fresh.status,meta:fresh.meta,item:fresh})});d.films.forEach(x=>entries.push({date:selected,weekday:x.item[1],type:"film",start:x.item[2].split("-")[0],end:x.item[2].split("-")[1],title:x.item[4],en:x.item[5],venue:x.item[3],unit:x.item[9],status:x.item[6],item:x.item}))}entries.sort((a,b)=>dayIndex(a.date)-dayIndex(b.date)||a.start.localeCompare(b.start));return entries}
function openCalendar(mode){calendarMode=mode;const entries=entriesForMode(mode);if(!entries.length){showToast(mode==="full"?"还没有选择任何观影安排":"先选择今天的电影或活动");return}const filmCount=entries.filter(x=>x.type==="film").length;const activityCount=entries.filter(x=>x.type==="activity").length;const specialCount=entries.filter(x=>x.type==="special").length;$("#calendarTitle").textContent=mode==="full"?"全程观影日历":selected+" · 我的观影日历";$("#calendarSub").textContent="确认后保存一张你的观影日程图片";$("#calendarConfirmText").textContent=mode==="full"?`9/24—9/30 · ${filmCount} 场电影 + ${activityCount} 场活动 + ${specialCount} 场短片`:`${filmCount} 场电影 + ${activityCount} 场活动 + ${specialCount} 场短片`;$("#ready").textContent="正在生成图片……";$("#saveImage").disabled=true;openModal("calendarModal");setTimeout(async()=>{try{await drawShareImage(entries,mode);$("#saveImage").disabled=false;$("#ready").textContent="图片已生成，点击“保存图片”即可保存"}catch(e){$("#ready").textContent="图片生成失败，请返回后重试"}},80)}
function previewHtml(entries,mode){let last="";return entries.map(x=>{let h="";if(mode==="full"&&x.date!==last){last=x.date;h+=`<div class="smartSectionTitle">${x.date} <small>${escapeHtml(x.weekday||"")}</small></div>`}h+=`<div class="calItem ${x.type==="activity"?"calActivity":x.type==="special"?"calSpecial":""}"><span class="calTime">${x.start}—${x.end}</span><span>${escapeHtml(x.title)}</span><span class="calHall">${escapeHtml(x.type==="activity"?(x.item?.kind==="大师·对话"?"大师·对话":"活动"):x.type==="special"?x.unit:x.venue)}</span></div>`;return h}).join("")}
function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src})}
function drawImageCover(ctx,img,x,y,w,h){const scale=Math.max(w/img.width,h/img.height),sw=w/scale,sh=h/scale,sx=(img.width-sw)/2,sy=(img.height-sh)/2;ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h)}
function roundRect(ctx,x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,r):(ctx.rect(x,y,w,h));ctx.fillStyle=fill;ctx.fill()}
function wrapText(text,maxChars){const s=String(text||""),out=[];let line="";for(const ch of s){if([...line,ch].length>maxChars){out.push(line);line=ch}else line+=ch}if(line)out.push(line);return out}
async function drawShareImage(entries,mode){const canvas=$("#shareCanvas"),ctx=canvas.getContext("2d");const grouped={};entries.forEach(x=>(grouped[x.date]||(grouped[x.date]=[])).push(x));const dates=Object.keys(grouped).sort((a,b)=>dayIndex(a)-dayIndex(b));const full=mode==="full"||mode==="all";const cardH=244,dateH=72,headerH=387,footerH=240,topGap=24,bottomGap=20;let contentH=0;dates.forEach(d=>contentH+=(full?dateH:0)+grouped[d].length*cardH+18);const height=Math.max(1200,headerH+topGap+contentH+footerH+bottomGap);canvas.width=750;canvas.height=height;ctx.fillStyle="#17363A";ctx.fillRect(0,0,750,height);try{const hi=await loadImg("assets/header.jpg");drawImageCover(ctx,hi,0,0,750,headerH)}catch(e){}let y=headerH+topGap;roundRect(ctx,28,y,694,contentH+30,18,"#F3EBD9");ctx.fillStyle="#17363A";ctx.font="bold 27px sans-serif";ctx.fillText(full?"平遥 2026 · 我的全程观影日程":selected+" · 我的观影日程",50,y+42);ctx.fillStyle="#8B7355";ctx.font="17px sans-serif";ctx.fillText(full?"9/24—9/30 · 已选影片与活动":"电影 · 活动 · 短片",50,y+68);y+=88;const weekdays={"9/24":"周四","9/25":"周五","9/26":"周六","9/27":"周日","9/28":"周一","9/29":"周二","9/30":"周三"};const cache={};for(const date of dates){if(full){roundRect(ctx,48,y,654,54,8,"#E7D9C1");ctx.fillStyle="#B83F38";ctx.font="bold 27px sans-serif";ctx.fillText(date,64,y+36);ctx.fillStyle="#5C625F";ctx.font="17px sans-serif";ctx.fillText(weekdays[date]||"",145,y+34);y+=68}for(const x of grouped[date]){const cy=y;roundRect(ctx,48,cy,654,cardH-10,10,"#FBF6E9");ctx.fillStyle=x.type==="activity"?(x.item?.kind==="大师·对话"?"#4F715B":"#A36A3C"):x.type==="special"?(x.kind==="short"?"#7B5A78":"#58748C"):"#D5A93A";ctx.fillRect(48,cy,7,cardH-10);const px=66,py=cy+15,pw=154,ph=202;if(x.type==="film"){const src=POSTER_MAP[x.title];let img=null;if(src&&!cache[src])try{cache[src]=await loadImg(src)}catch(e){cache[src]=null}img=cache[src];if(img)drawImageCover(ctx,img,px,py,pw,ph);else{roundRect(ctx,px,py,pw,ph,7,"#D9D2C3");ctx.fillStyle="#6B6B63";ctx.font="15px sans-serif";ctx.fillText("海报未载入",px+38,py+155)}}else if(x.type==="special"){
  const fill=x.kind==="short"?"#E9E0E9":"#E2E8EB",accent=x.kind==="short"?"#7B5A78":"#58748C";
  roundRect(ctx,px,py,pw,ph,7,fill);
  ctx.fillStyle=accent;ctx.font="bold 17px sans-serif";ctx.textAlign="center";
  ctx.fillText(x.unit,px+pw/2,py+36);
  ctx.font="bold 43px sans-serif";ctx.fillText(x.kind==="short"?"▤":"▣",px+pw/2,py+94);
  ctx.font="bold 14px sans-serif";ctx.fillText(x.kind==="short"?"SHORTS":"PINGYAO CORNER",px+pw/2,py+127);
  ctx.font="12px sans-serif";wrapText(x.title,11).slice(0,3).forEach((line,i)=>ctx.fillText(line,px+pw/2,py+153+i*17));
  ctx.textAlign="left";
}else if(x.type==="activity" && x.item?.kind!=="大师·对话"){
  roundRect(ctx,px,py,pw,ph,7,"#EFE0CC");
  const cx=px+pw/2;
  ctx.fillStyle="#A36A3C";ctx.font="bold 19px sans-serif";ctx.textAlign="center";ctx.fillText("ACTIVITY",cx,py+45);
  ctx.font="bold 34px sans-serif";ctx.fillText("✦",cx,py+100);
  ctx.font="bold 15px sans-serif";wrapText(x.item?.unit||x.title,10).slice(0,4).forEach((line,i)=>ctx.fillText(line,cx,py+135+i*18));
  ctx.textAlign="left";
}else{
  // 大师·对话：分享图使用导演椅作为统一海报占位视觉，不再使用场记板图标
  roundRect(ctx,px,py,pw,ph,7,"#E7ECDF");
  const cx=px+pw/2, top=py+28, seatY=py+103;
  ctx.save();
  ctx.lineCap="round";
  ctx.lineJoin="round";
  // 导演椅靠背
  ctx.fillStyle="#B8895B";
  ctx.fillRect(cx-49,top,98,18);
  ctx.strokeStyle="#17363A";
  ctx.lineWidth=6;
  ctx.strokeRect(cx-49,top,98,18);
  // 椅背支架
  ctx.beginPath();
  ctx.moveTo(cx-43,top+18); ctx.lineTo(cx-35,seatY-8);
  ctx.moveTo(cx+43,top+18); ctx.lineTo(cx+35,seatY-8);
  ctx.stroke();
  // 坐垫
  ctx.fillStyle="#B8895B";
  ctx.beginPath(); ctx.roundRect(cx-46,seatY-10,92,28,4); ctx.fill();
  ctx.strokeStyle="#17363A"; ctx.lineWidth=5; ctx.stroke();
  // 四条椅腿
  ctx.lineWidth=5;
  ctx.beginPath();
  ctx.moveTo(cx-38,seatY+18); ctx.lineTo(cx-55,py+174);
  ctx.moveTo(cx+38,seatY+18); ctx.lineTo(cx+55,py+174);
  ctx.moveTo(cx-25,seatY+18); ctx.lineTo(cx-15,py+174);
  ctx.moveTo(cx+25,seatY+18); ctx.lineTo(cx+15,py+174);
  ctx.stroke();
  // 横撑
  ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(cx-45,py+143); ctx.lineTo(cx+45,py+143); ctx.stroke();
  ctx.fillStyle="#4F715B"; ctx.font="bold 17px sans-serif"; ctx.textAlign="center";
  ctx.fillText("DIRECTOR'S CHAIR",cx,py+193);
  ctx.textAlign="left";
  ctx.restore();
}const tx=238;ctx.fillStyle="#17363A";ctx.font="bold 22px sans-serif";ctx.fillText(x.start+"—"+x.end,tx,cy+33);ctx.fillStyle=x.type==="activity"?(x.item?.kind==="大师·对话"?"#4F715B":"#A36A3C"):x.type==="special"?(x.kind==="short"?"#7B5A78":"#58748C"):"#B83F38";ctx.font="bold 15px sans-serif";ctx.fillText(x.type==="activity"?(x.item?.kind==="大师·对话"?"大师·对话":"活动"):x.type==="special"?x.unit:x.venue||"",tx+350,cy+32);ctx.fillStyle="#17363A";ctx.font="bold 25px sans-serif";wrapText(x.title,18).slice(0,2).forEach((line,i)=>ctx.fillText(line,tx,cy+70+i*32));let my=cy+137;ctx.fillStyle="#5C625F";ctx.font="16px sans-serif";if(x.type==="film"){ctx.fillText((x.unit||"")+"单元",tx,my);ctx.fillStyle="#8B7355";ctx.font="15px sans-serif";if(x.status)ctx.fillText(x.status,tx,my+27)}else if(x.type==="special"){ctx.fillText("地点  "+(x.venue||"—"),tx,my);ctx.fillStyle="#5C625F";ctx.font="14px sans-serif";if(x.status)ctx.fillText(x.status,tx,my+27);if(x.meta)ctx.fillText(x.meta,tx,my+50)}else{ctx.fillText("地点  "+(x.venue||"—"),tx,my);ctx.fillStyle="#5C625F";ctx.font="14px sans-serif";if(x.item?.guests)wrapText("嘉宾  "+x.item.guests,26).slice(0,2).forEach((line,i)=>ctx.fillText(line,tx,my+27+i*21));if(x.item?.moderator)ctx.fillText("主持  "+x.item.moderator,tx,my+70)}y+=cardH}y+=18}const footerY=y+6;ctx.fillStyle="#17363A";ctx.fillRect(0,footerY,750,footerH);ctx.fillStyle="#F3EBD9";ctx.font="22px sans-serif";ctx.fillText("开发者  段文文文",50,footerY+58);ctx.font="bold 29px sans-serif";ctx.fillText("祝你在平遥电影展",50,footerY+112);ctx.fillText("获得N倍人生",50,footerY+153);ctx.fillStyle="#D5A93A";ctx.fillRect(50,footerY+171,250,3);ctx.fillStyle="#D9D4C9";ctx.font="16px sans-serif";ctx.fillText("一张日程表，装下我们想看的世界。",50,footerY+202);try{const qr=await loadImg("assets/qrcode.png");roundRect(ctx,545,footerY+28,165,165,8,"#F8F1E2");ctx.drawImage(qr,555,footerY+38,145,145);ctx.fillStyle="#F3EBD9";ctx.font="bold 13px sans-serif";ctx.textAlign="center";ctx.fillText("扫码打开平遥 2026 观影日历",627,footerY+213);ctx.textAlign="left"}catch(e){}shareDataUrl=canvas.toDataURL("image/png");shareBlob=await (await fetch(shareDataUrl)).blob();$("#ready").textContent="图片已生成，可以保存或转发"}
function isWeChat(){return /MicroMessenger/i.test(navigator.userAgent)}
function isIOS(){return /iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)}
function closeSaveGuide(){const m=$("#saveGuideMask");if(m)m.hidden=true;document.body.style.overflow=""}
function openWeChatSaveGuide(){const m=$("#saveGuideMask"),img=$("#saveGuideImg");if(!m||!img)return;img.src=shareDataUrl;closeModal("calendarModal");m.hidden=false;document.body.style.overflow="hidden"}
async function saveImage(){
  if(!shareDataUrl){showToast("图片还在生成，请稍候");return}
  /* 微信内置浏览器：避免 <a download> 导致跳转到图片页面，改为当前页内展示图片并提示长按保存。 */
  if(isWeChat()){openWeChatSaveGuide();return}
  /* 支持 Web Share 文件时，优先唤起系统分享面板；iPhone 可在面板中选择“存储图像”。 */
  if(shareBlob && navigator.share && navigator.canShare){
    try{
      const file=new File([shareBlob],`平遥2026-${calendarMode==="full"?"全程":selected}-观影日历.png`,{type:"image/png"});
      if(navigator.canShare({files:[file]})){await navigator.share({files:[file],title:"平遥2026观影日历"});return}
    }catch(e){if(e&&e.name==="AbortError")return}
  }
  const a=document.createElement("a");a.href=shareDataUrl;a.download=`平遥2026-${calendarMode==="full"?"全程":selected}-观影日历.png`;document.body.appendChild(a);a.click();a.remove();
  showToast(isIOS()?"如未自动保存，请长按图片保存到相册":"图片已保存");
}
function openModal(id){$("#"+id).hidden=false;document.body.style.overflow="hidden"}
function closeModal(id){$("#"+id).hidden=true;document.body.style.overflow=""}
document.addEventListener("click",e=>{const c=e.target.closest("[data-close]");if(c)closeModal(c.dataset.close)});
$("#makeSmart").onclick=makeSmart;$("#applySmart").onclick=applySmart;$("#makeCalendar").onclick=()=>openCalendar(selected==="全部"?"all":"day");$("#makeFullCalendar").onclick=()=>openCalendar("full");$("#saveImage").onclick=saveImage;
$("#closeSaveGuide").onclick=closeSaveGuide;$("#backFromSaveGuide").onclick=closeSaveGuide;
render();
