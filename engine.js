/* מנוע המחברת השבועית. כל שבוע נטען מקובץ weeks/wNN.json */
const FORM = "https://docs.google.com/forms/d/e/1FAIpQLSeHzGuX5KKALP8TSuDv68D3RU8mwJl8CvadiPJQDDWRUYVVCw/formResponse";
const ENT = {name:1762493054, week:295164568, score:1002739381, total:1414797414, detail:1094078141, open:426369228, fun:1970000761};
const COLORS = ["var(--c1)","var(--c2)","var(--c3)","var(--c4)","var(--c5)","var(--c6)"];
const Z = ["עבר","הווה","עתיד"];
const PRAISE = ["מעולה!","כל הכבוד!","יופי!","מדהים!","בדיוק!","אלופה!","וואו!"];
const HEB = "אבגדהוזחטיכלמנסעפצקרשת";

const $ = (s,r=document)=>r.querySelector(s), $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const h = (tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
const norm = s=>(s||"").replace(/[\s.\-'"׳״,]/g,"").replace(/ך/g,"כ").replace(/ם/g,"מ").replace(/ן/g,"נ").replace(/ף/g,"פ").replace(/ץ/g,"צ");
const esc = s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296}}
function shuffle(a,r=Math.random){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const store = {get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
               set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

let W, WN, cur=-1, sentOnce=false;
const KEY = ()=>"agami-week-"+WN;

/* ---------- item types ---------- */
const T = {};

T.cw = {
  render(card,it){
    card.innerHTML=`<div class="qt">${card._num}${esc(it.q)}<span class="cwhint">(${[...it.a].length} אותיות)</span></div>`;
    const b=h("div","boxes");[...it.a].forEach((_,k)=>{const x=h("input",k===it.h?"h":"");x.maxLength=2;x.autocomplete="off";b.appendChild(x)});
    card.appendChild(b); wireBoxes(b);
  },
  val(card){return $$("input",card).map(x=>x.value).join("")},
  judge(card,it){return norm(this.val(card))===norm(it.a)},
  restore(card,v){[...(v||"")].forEach((c,k)=>{const x=$$("input",card)[k];if(x)x.value=c})},
  reveal:it=>it.a
};
T.hw = Object.assign({},T.cw,{render(card,it){
  card.classList.add("hw");
  card.innerHTML=`<div class="qt">🔎 ${esc(it.q||"המילה הנסתרת")}</div>`;
  const b=h("div","boxes");[...it.a].forEach(()=>{const x=h("input");x.maxLength=2;x.autocomplete="off";b.appendChild(x)});
  card.appendChild(b); wireBoxes(b);
}});
function wireBoxes(b){const arr=$$("input",b);arr.forEach((x,k)=>{
  x.addEventListener("input",()=>{if(x.value.length>1)x.value=x.value.slice(-1);if(x.value&&arr[k+1])arr[k+1].focus();changed(x)});
  x.addEventListener("keydown",ev=>{if(ev.key==="Backspace"&&!x.value&&arr[k-1])arr[k-1].focus()});
})}

T.mc = {
  render(card,it){
    card.innerHTML=(it.pic?`<div class="pic">${it.pic}</div>`:"")+`<div class="qt">${card._num}${esc(it.q||"איזו מילה יוצאת דופן?")}</div>`;
    const o=h("div","opts");it.o.forEach((t,k)=>{const b=h("button","opt",esc(t));b.type="button";b.dataset.k=k;
      b.onclick=()=>{$$(".opt",o).forEach(x=>x.classList.remove("sel"));b.classList.add("sel");changed(b)};o.appendChild(b)});
    card.appendChild(o);
  },
  val(card,it){const s=$(".opt.sel",card);return s?it.o[+s.dataset.k]:""},
  judge(card,it){const s=$(".opt.sel",card);return !!s&&+s.dataset.k===it.a},
  restore(card,v,it){const k=it.o.indexOf(v);if(k>=0)$$(".opt",card)[k].classList.add("sel")},
  reveal:it=>it.o[it.a]
};

T.verb = {
  render(card,it){
    card.innerHTML=`<div class="verb"><div class="vw">${esc(it.w)}</div>
      <label>שורש<input class="txt r" placeholder="_._._" autocomplete="off"></label>
      <label>זמן<select class="z"><option value="">בחרי</option>${Z.map(z=>`<option>${z}</option>`).join("")}</select></label>
      <label>גוף<select class="g"><option value="">בחרי</option>${it.go.map(g=>`<option>${esc(g)}</option>`).join("")}</select></label></div>`;
  },
  val(card){return [$(".r",card).value,$(".z",card).value,$(".g",card).value].join(" | ")},
  judge(card,it){return norm($(".r",card).value)===norm(it.r)&&$(".z",card).value===it.z&&$(".g",card).value===it.g},
  restore(card,v){const p=(v||"").split(" | ");$(".r",card).value=p[0]||"";$(".z",card).value=p[1]||"";$(".g",card).value=p[2]||""},
  reveal:it=>[...it.r].join(".")+", "+it.z+", "+it.g
};

T.open = {
  render(card,it){card.innerHTML=`<div class="qt">${card._num}${esc(it.q)}</div><textarea class="open" placeholder="התשובה שלי..."></textarea>`},
  val(card){return $("textarea",card).value.trim()},
  judge(){return null},
  restore(card,v){$("textarea",card).value=v||""}
};

T.scramble = {
  render(card,it){
    const letters=[...it.a]; let order=shuffle(letters.map((_,i)=>i)); if(order.every((v,i)=>v===i)) order.reverse();
    card._order=order;
    card.innerHTML=`<div class="pic">${it.pic||""}</div><div class="qt" style="text-align:center">${card._num}${esc(it.q||"סדרי את האותיות למילה הנכונה")}</div>`;
    const sl=h("div","slots"), tl=h("div","tiles");
    letters.forEach(()=>{const s=h("div","slot");s.onclick=()=>{if(s.dataset.t!=null){$$(".tile",tl)[s.dataset.t].classList.remove("used");s.textContent="";delete s.dataset.t;s.classList.remove("full");changed(s)}};sl.appendChild(s)});
    order.forEach((li,ti)=>{const t=h("button","tile",letters[li]);t.type="button";t.onclick=()=>{const s=$$(".slot",sl).find(x=>x.dataset.t==null);if(!s)return;
      s.textContent=letters[li];s.dataset.t=ti;s.classList.add("full");t.classList.add("used");changed(t)};tl.appendChild(t)});
    card.appendChild(sl);card.appendChild(tl);
  },
  val(card){return $$(".slot",card).map(s=>s.textContent).join("")},
  judge(card,it){return norm(this.val(card))===norm(it.a)},
  restore(card,v){[...(v||"")].forEach(c=>{const t=$$(".tile",card).find(x=>!x.classList.contains("used")&&x.textContent===c);if(t)t.click()})},
  reveal:it=>it.a
};

T.sort = {
  render(card,it){
    card.innerHTML=`<div class="qt">${card._num}${esc(it.q||"מייני את המילים לסלים. לוחצים על מילה ואז על הסל.")}</div>`;
    const pool=h("div","pool"), bins=h("div","bins"); let pick=null;
    const place=(chip,target)=>{chip.classList.remove("pick","okc","badc");target.appendChild(chip);pick=null;changed(card)};
    shuffle(it.items.map((x,i)=>i)).forEach(i=>{const c=h("button","chipw",esc(it.items[i][0]));c.type="button";c.dataset.i=i;
      c.onclick=ev=>{ev.stopPropagation();
        if(c.parentElement!==pool){place(c,pool);return}
        $$(".chipw",card).forEach(x=>x.classList.remove("pick")); if(pick===c){pick=null;return} pick=c;c.classList.add("pick")};
      pool.appendChild(c)});
    it.bins.forEach((b,bi)=>{const d=h("div","bin",`<h4>${esc(b)}</h4>`);d.dataset.b=bi;const inn=h("div","in");d.appendChild(inn);
      d.onclick=()=>{if(pick)place(pick,inn)};bins.appendChild(d)});
    card._pool=pool; card.appendChild(pool);card.appendChild(bins);
  },
  val(card,it){return $$(".bin",card).map(b=>$("h4",b).textContent+": "+$$(".chipw",b).map(c=>c.textContent).join(", ")).join(" / ")},
  judge(card,it){let ok=$$(".chipw",card._pool).length===0;
    $$(".bin",card).forEach(b=>$$(".chipw",b).forEach(c=>{const r=it.items[+c.dataset.i][1]===+b.dataset.b;c.classList.toggle("okc",r);c.classList.toggle("badc",!r);if(!r)ok=false}));
    return ok},
  restore(card,v,it){(v||"").split(" / ").forEach(part=>{const [bn,ws]=part.split(": ");const b=$$(".bin",card).find(x=>$("h4",x).textContent===bn);if(!b||!ws)return;
    ws.split(", ").forEach(w=>{const c=$$(".chipw",card._pool).find(x=>x.textContent===w);if(c)$(".in",b).appendChild(c)})})},
  reveal:it=>it.bins.map((b,bi)=>b+": "+it.items.filter(x=>x[1]===bi).map(x=>x[0]).join(", ")).join(" / ")
};

T.memory = {
  render(card,it){
    card.innerHTML=`<div class="qt">${card._num}${esc(it.q||"משחק זיכרון: מצאי את הזוגות")}</div>`;
    const g=h("div","mem"); let open=[], moves=0, got=0, lock=false;
    const cards=shuffle(it.pairs.flatMap((p,pi)=>[[p[0],pi],[p[1],pi]]));
    if(cards.length>12) g.style.gridTemplateColumns="repeat(4,1fr)";
    cards.forEach(([t,pi])=>{const c=h("button","mcard",`<div class="in"><div class="f">❓</div><div class="b">${esc(t)}</div></div>`);c.type="button";c.dataset.p=pi;
      c.onclick=()=>{if(lock||c.classList.contains("flip")||c.classList.contains("got"))return;c.classList.add("flip");open.push(c);
        if(open.length===2){moves++;const [a,b]=open;
          if(a.dataset.p===b.dataset.p){a.classList.add("got");b.classList.add("got");got++;open=[];
            if(got===it.pairs.length){card._done=true;card._moves=moves;check(card._ci,true,card)}}
          else{lock=true;setTimeout(()=>{a.classList.remove("flip");b.classList.remove("flip");open=[];lock=false},900)}}
        stat.textContent=`ניסיונות: ${moves} · זוגות: ${got} מתוך ${it.pairs.length}`};
      g.appendChild(c)});
    const stat=h("div","memstat","ניסיונות: 0");card.appendChild(g);card.appendChild(stat);
  },
  val(card){return card._done?`הושלם ב-${card._moves} ניסיונות`:"לא הושלם"},
  judge(card){return !!card._done},
  restore(){}, auto:true
};

T.wordsearch = {
  render(card,it,seed){
    const n=it.size||8, r=rng(seed), grid=Array.from({length:n},()=>Array(n).fill(""));
    const words=it.words.map(w=>[...w]); const placed=[];
    words.forEach(w=>{for(let tries=0;tries<300;tries++){const dir=r()<.5?[0,1]:[1,0];const L=w.length;
      const rr=Math.floor(r()*(n-(dir[0]?L-1:0))), cc=Math.floor(r()*(n-(dir[1]?L-1:0)));
      let ok=true;for(let k=0;k<L;k++){const v=grid[rr+dir[0]*k][cc+dir[1]*k];if(v&&v!==w[k]){ok=false;break}}
      if(!ok)continue;for(let k=0;k<L;k++)grid[rr+dir[0]*k][cc+dir[1]*k]=w[k];placed.push(w.join(""));break}});
    for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(!grid[i][j])grid[i][j]=HEB[Math.floor(r()*HEB.length)];
    card.innerHTML=`<div class="qt">${card._num}${esc(it.q||"תפזורת: מצאי את המילים. לוחצים על האות הראשונה ואז על האחרונה.")}</div>`;
    const g=h("div","ws");g.style.gridTemplateColumns=`repeat(${n},1fr)`;let first=null;card._found=new Set();
    const wl=h("div","wlist",it.words.map(w=>`<span data-w="${esc(w)}">${esc(w)}</span>`).join(""));
    for(let i=0;i<n;i++)for(let j=0;j<n;j++){const b=h("button","",grid[i][j]);b.type="button";b.dataset.i=i;b.dataset.j=j;
      b.onclick=()=>{if(!first){first=b;b.classList.add("a");return}
        const i1=+first.dataset.i,j1=+first.dataset.j,i2=i,j2=j;first.classList.remove("a");first=null;
        if(i1!==i2&&j1!==j2)return;const cells=[];const di=Math.sign(i2-i1),dj=Math.sign(j2-j1);const L=Math.max(Math.abs(i2-i1),Math.abs(j2-j1))+1;
        for(let k=0;k<L;k++)cells.push($(`button[data-i="${i1+di*k}"][data-j="${j1+dj*k}"]`,g));
        const s=cells.map(c=>c.textContent).join(""), rs=[...s].reverse().join("");
        const w=it.words.find(w=>!card._found.has(w)&&(w===s||w===rs));
        if(w){card._found.add(w);cells.forEach(c=>c.classList.add("f"));$(`span[data-w="${w}"]`,wl).classList.add("f");changed(card);
          if(card._found.size===it.words.length)check(card._ci,true,card)}};
      g.appendChild(b)}
    card.appendChild(g);card.appendChild(wl);
  },
  val(card,it){return `מצאה ${card._found.size} מתוך ${it.words.length}`},
  judge(card,it){return card._found.size===it.words.length},
  restore(){}, auto:true
};

T.order = {
  render(card,it){
    card.innerHTML=`<div class="qt">${card._num}${esc(it.q||"סדרי את הסיפור: לוחצים על התמונות לפי הסדר הנכון")}</div>`;
    const g=h("div","panels");card._seq=[];
    let ord=shuffle(it.panels.map((_,i)=>i));if(ord.every((v,i)=>v===i))ord.reverse();
    ord.forEach(pi=>{const p=h("button","panel",`<span class="badge"></span><span class="e">${it.panels[pi][0]}</span><span class="t">${esc(it.panels[pi][1])}</span>`);p.type="button";p.dataset.p=pi;
      p.onclick=()=>{const k=card._seq.indexOf(pi);
        if(k>=0){card._seq.slice(k).forEach(x=>{const e=$(`.panel[data-p="${x}"]`,g);e.classList.remove("n")});card._seq=card._seq.slice(0,k)}
        else{card._seq.push(pi);p.classList.add("n");$(".badge",p).textContent=card._seq.length}
        changed(card)};g.appendChild(p)});
    card.appendChild(g);
  },
  val(card,it){return card._seq.map(i=>it.panels[i][1]).join(" ← ")},
  judge(card,it){return card._seq.length===it.panels.length&&card._seq.every((v,i)=>v===i)},
  restore(card,v,it){(v||"").split(" ← ").forEach(t=>{const i=it.panels.findIndex(p=>p[1]===t);if(i>=0)$(`.panel[data-p="${i}"]`,card).click()})},
  reveal:it=>it.panels.map(p=>p[1]).join(" ← ")
};

T.typo = {
  render(card,it){
    card.innerHTML=`<div class="qt">${card._num}${esc(it.q||"יש במשפט מילה אחת עם טעות כתיב. לחצי עליה!")}</div>`;
    const s=h("div","sent");it.s.forEach((w,k)=>{const b=h("button","w",esc(w));b.type="button";b.dataset.k=k;
      b.onclick=()=>{$$(".w",s).forEach(x=>x.classList.remove("sel"));b.classList.add("sel");changed(b)};s.appendChild(b)});
    card.appendChild(s);
  },
  val(card,it){const s=$(".w.sel",card);return s?s.textContent:""},
  judge(card,it){const s=$(".w.sel",card);return !!s&&+s.dataset.k===it.bad},
  restore(card,v,it){const k=it.s.indexOf(v);if(k>=0)$$(".w",card)[k].classList.add("sel")},
  reveal:it=>`${it.s[it.bad]} ← ${it.fix}`
};

/* ---------- flow ---------- */
function changed(el){const c=el.closest?el.closest(".card"):el;if(c&&!T[c._it.t].auto){c.classList.remove("ok","bad");$(".fb",c).textContent=""}save()}

function build(){
  const S=$("#screens");S.innerHTML="";
  const name=store.get("agami-name","");
  const w=h("section","screen welcome");w.id="sc-w";
  w.innerHTML=`<div class="emoji">${W.sticker||"📚"}</div><h1>${esc(W.title)}</h1><p>${esc(W.subtitle||"סט חדש של שאלות בעברית. בהצלחה!")}</p>
    <input class="txt" id="who" placeholder="איך קוראים לך?" autocomplete="off" value="${esc(name)}">
    <div class="chips">${W.chapters.map((c,i)=>`<div class="chip" style="background:${c.color||COLORS[i%6]}"><b>${c.emoji}</b>${esc(c.title)}</div>`).join("")}</div>
    <button class="btn" id="start">יוצאים לדרך ✨</button>`;
  S.appendChild(w);
  W.chapters.forEach((c,ci)=>{
    const col=c.color||COLORS[ci%6];
    const s=h("section","screen");s.id="sc-"+ci;s.style.setProperty("--accent",col);
    const hero=h("div","hero",`<h2>פרק ${ci+1}: ${esc(c.title)}</h2><p>${esc(c.hint||"")}</p><div class="big">${c.emoji}</div>`);
    hero.style.background=`linear-gradient(135deg,${col},#ff5c8a)`;s.appendChild(hero);
    if(c.passage){const p=h("div","passage");const tts=h("button","tts","🔊 הקראה בקול");tts.type="button";
      p.appendChild(tts);p.insertAdjacentHTML("beforeend",c.passage);tts.onclick=()=>speak(p,tts);s.appendChild(p)}
    let num=0;
    c.items.forEach((it,i)=>{
      const card=h("div","card");card._it=it;card._ci=ci;
      card._num=it.t==="hw"?"":`<span class="qn">${++num}</span>`;
      T[it.t].render(card,it,(WN*1000+ci*50+i));
      card.appendChild(h("div","fb"));s.appendChild(card);
    });
    const nav=h("div","nav");
    nav.innerHTML=`<button class="btn ghost back">→ חזרה</button><span class="score"></span>
      <span><button class="btn check">בדקי ✔</button> <button class="btn go next" style="display:none">${ci<W.chapters.length-1?"לפרק הבא ←":"לסיכום 🏆"}</button></span>`;
    s.appendChild(nav);
    $(".check",nav).onclick=()=>check(ci,true);
    $(".next",nav).onclick=()=>go(ci+1);
    $(".back",nav).onclick=()=>go(ci-1);
    S.appendChild(s);
  });
  const f=h("section","screen");f.id="sc-end";
  f.innerHTML=`<div class="hero" style="background:linear-gradient(135deg,#7c5cff,#ff5c8a);text-align:center"><h2 id="endTitle" style="max-width:none">סיימת!</h2><p id="endMsg" style="max-width:none"></p></div>
   <div class="card"><div class="sticker" id="stk"></div><div style="text-align:center;font-weight:700" id="stkmsg"></div>
   <div class="ring"><svg width="190" height="190"><circle cx="95" cy="95" r="80" stroke="var(--line)" stroke-width="16" fill="none"/>
   <circle id="arc" cx="95" cy="95" r="80" stroke="url(#gr)" stroke-width="16" fill="none" stroke-linecap="round" stroke-dasharray="503" stroke-dashoffset="503" style="transition:stroke-dashoffset 1.2s"/>
   <defs><linearGradient id="gr"><stop offset="0" stop-color="#ffb400"/><stop offset="1" stop-color="#ff5c8a"/></linearGradient></defs></svg><div class="num" id="pct">0%</div></div>
   <div class="stars" id="stars"></div><table class="sum" id="sumt"></table>
   <div class="qt" style="margin-top:16px">💬 מה היה הכי כיף השבוע, ומה היה קשה? (לא חובה)</div>
   <textarea id="fun" placeholder="אפשר לכתוב כאן..."></textarea>
   <div class="nav" style="justify-content:center"><button class="btn" id="sendBtn">📬 שלחי לאבא</button><button class="btn ghost" id="again">לחזור ולתקן</button></div>
   <div class="sentmsg" id="sent"></div></div>`;
  S.appendChild(f);
  const D=$("#dots");D.innerHTML="";W.chapters.forEach((c,i)=>{const d=h("div","dot",c.emoji);d.onclick=()=>go(i);D.appendChild(d)});
  const e=h("div","dot","🏆");e.onclick=()=>go(W.chapters.length);D.appendChild(e);
  $("#start").onclick=()=>{const v=$("#who").value.trim();if(!v){$("#who").focus();$("#who").placeholder="קודם כותבים שם 😊";return}store.set("agami-name",v);go(0)};
  $("#again").onclick=()=>go(0);
  $("#sendBtn").onclick=()=>send();
  $$("input.txt,select,textarea").forEach(x=>{x.addEventListener("input",()=>changed(x));x.addEventListener("change",()=>changed(x))});
}

function check(ci,show,only){
  const s=$("#sc-"+ci);let c=0,n=0;
  $$(".card",s).forEach(card=>{
    const it=card._it, r=T[it.t].judge(card,it), fb=$(".fb",card);
    if(r===null){ if(show&&it.model&&(!only||only===card)) fb.innerHTML=`<span style="color:var(--muted);font-weight:500">💡 תשובה לדוגמה: ${esc(it.model)}</span>`; return; }
    n++; if(r)c++;
    if(show&&(!only||only===card)){
      if(only&&!r) return;
      card.classList.toggle("ok",r);card.classList.toggle("bad",!r);
      fb.textContent = r ? "✓ "+PRAISE[Math.floor(Math.random()*PRAISE.length)]+(it.why?" "+it.why:"") : (T[it.t].auto?"✗ עוד לא סיימת, המשיכי!":"✗ עוד לא, נסי שוב");
    }
  });
  if(show&&!only){
    $(".score",s).textContent=`${c} / ${n}`+(c===n?" 🌟":"");
    $(".next",s).style.display="inline-block";
    if(c===n) burst(70);
    $$(".dot")[ci].classList.add("done");
    save();
  }
  if(only&&T[only._it.t].judge(only,only._it)) burst(40);
  return [c,n];
}
function go(i){
  if(i<0){show("sc-w");cur=-1;$("#topbar").style.display="none";save();return}
  cur=i;$("#topbar").style.display="block";
  $$(".dot").forEach((d,k)=>d.classList.toggle("cur",k===i));
  $("#barfill").style.width=(100*i/W.chapters.length)+"%";
  if(i>=W.chapters.length){finish();show("sc-end")}else show("sc-"+i);
  window.scrollTo({top:0,behavior:"smooth"});save();
}
function show(id){$$(".screen").forEach(s=>s.classList.toggle("on",s.id===id))}

function totals(){let C=0,N=0,rows="";W.chapters.forEach((c,i)=>{const [a,b]=check(i,false);C+=a;N+=b;rows+=`<tr><td>${c.emoji} ${esc(c.title)}</td><td>${a} / ${b}</td></tr>`});return {C,N,rows}}
function finish(){
  const {C,N,rows}=totals(), p=N?Math.round(100*C/N):0, who=$("#who").value.trim();
  $("#sumt").innerHTML=rows;$("#pct").textContent=p+"%";
  setTimeout(()=>$("#arc").style.strokeDashoffset=503*(1-p/100),100);
  const st=p>=90?3:p>=70?2:1;$("#stars").textContent="⭐".repeat(st)+"☆".repeat(3-st);
  $("#endTitle").textContent=`כל הכבוד, ${who}! 🎉`;
  $("#endMsg").textContent=`${C} תשובות נכונות מתוך ${N}. `+(p>=90?"מושלם כמעט!":p>=70?"עבודה טובה מאוד!":"יפה! אפשר לחזור ולתקן את מה שאדום.");
  $("#barfill").style.width="100%";
  $("#stk").textContent=W.sticker||"🏅";
  $("#stkmsg").textContent=sentOnce?"המדבקה של השבוע כבר באלבום שלך!":"שלחי לאבא וקבלי את המדבקה של השבוע!";
  burst(p>=70?220:90);
}
async function send(){
  const {C,N}=totals();
  const lines=[];let open="";
  W.chapters.forEach(c=>{let k=0;$$(`#sc-${W.chapters.indexOf(c)} .card`).forEach(card=>{const it=card._it,t=T[it.t];const v=t.val(card,it);const r=t.judge(card,it);
    if(it.t==="open"){open=v;return}
    const q=(it.q||it.w||it.pic||"").toString().slice(0,50);
    lines.push(`${c.title} ${++k}. ${q} → ${v||"(ריק)"} ${r?"✓":"✗"}`+(r||!t.reveal?"":` (נכון: ${t.reveal(it)})`))})});
  const p=new URLSearchParams();
  p.append("entry."+ENT.name,$("#who").value.trim()||"אגמי");
  p.append("entry."+ENT.week,String(WN));
  p.append("entry."+ENT.score,String(C));
  p.append("entry."+ENT.total,String(N));
  p.append("entry."+ENT.detail,lines.join("\n"));
  p.append("entry."+ENT.open,open||"-");
  p.append("entry."+ENT.fun,$("#fun").value.trim()||"-");
  $("#sent").textContent="שולחת לאבא...";
  try{
    await fetch(FORM,{method:"POST",mode:"no-cors",body:p});
    sentOnce=true;const stk=store.get("agami-stickers",{});stk[WN]=W.sticker||"🏅";store.set("agami-stickers",stk);
    $("#sent").textContent="📬 נשלח לאבא! המדבקה נוספה לאלבום 🎉";$("#stkmsg").textContent="המדבקה של השבוע באלבום שלך!";
    $("#sendBtn").textContent="📬 שלחי שוב (אחרי תיקון)";burst(160);
  }catch(e){$("#sent").textContent="לא הצלחתי לשלוח. בדקי שיש אינטרנט ונסי שוב."}
  save();
}

function speak(p,btn){
  try{
    if(speechSynthesis.speaking){speechSynthesis.cancel();btn.textContent="🔊 הקראה בקול";return}
    const text=$$("h3,p",p).map(x=>x.textContent).join(". ");
    const u=new SpeechSynthesisUtterance(text);u.lang="he-IL";u.rate=.9;
    const v=speechSynthesis.getVoices().find(v=>v.lang&&v.lang.startsWith("he"));if(v)u.voice=v;
    u.onend=()=>btn.textContent="🔊 הקראה בקול";btn.textContent="⏹️ עצירה";speechSynthesis.speak(u);
  }catch(e){btn.textContent="ההקראה לא זמינה במכשיר הזה"}
}

/* confetti */
const cv=$("#confetti"),cx=cv.getContext("2d");let parts=[];
function size(){cv.width=innerWidth*devicePixelRatio;cv.height=innerHeight*devicePixelRatio}addEventListener("resize",size);size();
function burst(n){const cols=["#ff7a59","#7c5cff","#18b6a4","#ffb400","#ff5c8a","#3a9bff"];const was=parts.length;
  for(let i=0;i<n;i++)parts.push({x:Math.random()*cv.width,y:-20-Math.random()*cv.height*.3,vx:(Math.random()-.5)*4,vy:2+Math.random()*4,
    s:(6+Math.random()*8)*devicePixelRatio,r:Math.random()*6,vr:(Math.random()-.5)*.3,c:cols[i%cols.length]});
  if(!was)tick()}
function tick(){cx.clearRect(0,0,cv.width,cv.height);parts=parts.filter(p=>p.y<cv.height+40);
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy*devicePixelRatio;p.vy+=.05;p.r+=p.vr;cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);cx.fillStyle=p.c;cx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);cx.restore()});
  if(parts.length)requestAnimationFrame(tick);else cx.clearRect(0,0,cv.width,cv.height)}

/* save & restore progress in this browser */
function save(){if(!W)return;const st={cur,sentOnce,v:$$(".card").filter(c=>c._it).map(c=>T[c._it.t].val(c,c._it)),fun:($("#fun")||{}).value};store.set(KEY(),st)}
function load(){const st=store.get(KEY(),null);if(!st)return;sentOnce=!!st.sentOnce;
  $$(".card").filter(c=>c._it).forEach((c,i)=>{const t=T[c._it.t];if(st.v&&st.v[i]!=null&&t.restore)t.restore(c,st.v[i],c._it)});
  if(st.fun&&$("#fun"))$("#fun").value=st.fun;
  if(st.cur>=0&&st.cur<W.chapters.length)go(st.cur)}

(async function init(){
  const q=new URLSearchParams(location.search);
  try{
    const idx=await (await fetch("weeks/index.json",{cache:"no-store"})).json();
    WN=+(q.get("w")||idx.weeks[idx.weeks.length-1].n);
    W=await (await fetch(`weeks/w${String(WN).padStart(2,"0")}.json`,{cache:"no-store"})).json();
    document.title=W.title;build();show("sc-w");load();
  }catch(e){$("#screens").innerHTML=`<div class="loading">אופס, לא הצלחתי לטעון את הסט 😕<br><small>${esc(e.message)}</small></div>`}
})();
