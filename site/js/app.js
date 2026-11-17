/* RÉSEAUX — application : routage, progression, cartes (Leitner), quiz, entraînement, recherche */
(function(){
'use strict';
const L=window.LESSONS,CARDS=window.CARDS,QUIZ=window.QUIZ,DRILLS=window.DRILLS,SIMS=window.SIMS;
const $=(s,e=document)=>e.querySelector(s), $$=(s,e=document)=>[...e.querySelectorAll(s)];
const view=$('#view');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=s=>esc(s).replace(/&lt;br&gt;/g,'<br>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
const strip=s=>String(s).replace(/[`*]/g,'');
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const hash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return(h>>>0).toString(36)};
const lesson=id=>L.find(l=>l.id===id);
const pad=n=>String(n).padStart(2,'0');
const plural=(n,a,b)=>n+' '+(n>1?b:a);

/* ───── stockage ───── */
const KEY='rx.v1';let mem=null;
function load(){if(mem)return mem;try{mem=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}return mem=mem||{done:{},cards:{},quiz:{},drill:{},days:{}}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(mem))}catch(e){}}
const today=()=>Math.floor((Date.now()-new Date().getTimezoneOffset()*6e4)/864e5);
function tick(n=1){const s=load();s.days[today()]=(s.days[today()]||0)+n;save()}
function streak(){const s=load();let d=today(),c=0;if(!s.days[d])d--;while(s.days[d]){c++;d--}return c}
const cid=c=>hash(c.l+'|'+c.f);
const cardsOf=l=>CARDS.filter(c=>!l||c.l===l);
const secKey=(l,i)=>l.id+':'+i;
function lessonPct(l){const s=load();const n=l.sections.filter((_,i)=>s.done[secKey(l,i)]).length;return n/l.sections.length}
function mastery(lid){const cs=cardsOf(lid);if(!cs.length)return 0;const s=load();return cs.filter(c=>(s.cards[cid(c)]?.b||0)>=3).length/cs.length}
function dueCards(lid){const s=load(),t=today();return cardsOf(lid).filter(c=>{const r=s.cards[cid(c)];return !r||r.d<=t})}
const pct=x=>Math.round(x*100);

/* ───── toast / copie ───── */
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),1600)}
function copy(t){try{navigator.clipboard.writeText(t).then(()=>toast('copié'),()=>toast('échec de la copie'))}catch(e){toast('échec de la copie')}}
const vib=()=>{try{navigator.vibrate&&navigator.vibrate(8)}catch(e){}};

/* ───── blocs de code ───── */
const PROMPT=/^((?:[A-Za-z0-9_.-]+@[\w.-]+:[~\/\w]*\$)|(?:[A-Za-z]:\\>)|(?:\$)|(?:[A-Za-z0-9_-]+(?:\([\w-]+\))?[#>]))(\s|$)/;
function codeHtml(txt){
  return txt.split('\n').map(line=>{
    let pre='',rest=line;const m=rest.match(PROMPT);
    if(m){pre=`<span class="p">${esc(m[1])}</span>`;rest=rest.slice(m[1].length)}
    let cm='';const c=rest.match(/(^|\s)([!#])(\s|$)/);
    if(c){const idx=c.index+c[1].length;cm=`<span class="c">${esc(rest.slice(idx))}</span>`;rest=rest.slice(0,idx)}
    return pre+esc(rest)+cm;
  }).join('\n');
}
function plainCmds(txt){return txt.split('\n').map(l=>l.replace(PROMPT,'').replace(/\s+[!#]\s.*$/,'').replace(/^\s*[!#]\s.*$/,'')).filter(l=>l.trim()).join('\n')}
function codeBlock(txt,title){return `<div class="codeblock"><div class="bar2"><span>${esc(title||'CLI')}</span><button data-copy>COPIER</button></div><pre data-raw="${esc(txt)}">${codeHtml(txt)}</pre></div>`}

/* ───── blocs de cours ───── */
function block(b){
  switch(b.t){
    case 'p':return `<p>${fmt(b.x)}</p>`;
    case 'ul':return `<ul>${b.items.map(i=>`<li>${fmt(i)}</li>`).join('')}</ul>`;
    case 'ol':return `<ol>${b.items.map(i=>`<li>${fmt(i)}</li>`).join('')}</ol>`;
    case 'code':return codeBlock(b.x);
    case 'key':return `<div class="callout"><span class="lbl">À retenir</span><p>${fmt(b.x)}</p></div>`;
    case 'warn':return `<div class="callout warn"><span class="lbl">Piège</span><p>${fmt(b.x)}</p></div>`;
    case 'extra':return `<div class="callout extra"><span class="lbl">Complément · hors diapos</span><p>${fmt(b.x)}</p></div>`;
    case 'table':return `<div class="tw"><table><thead><tr>${b.head.map(h=>`<th>${fmt(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r=>`<tr>${r.map(c=>`<td>${fmt(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    case 'steps':return `<div class="steps">${b.items.map(i=>`<div><div><b>${fmt(i[0])}</b><span>${fmt(i[1])}</span></div></div>`).join('')}</div>`;
    case 'sim':return `<div class="sim" data-sim="${b.id}"></div>`;
  }return '';
}
function mountSims(root){$$('[data-sim]',root).forEach(el=>{const s=SIMS[el.dataset.sim];if(s)s.mount(el)})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(b){const pre=b.closest('.codeblock').querySelector('pre');copy(plainCmds(pre.dataset.raw))}});

/* ───── navigation ───── */
function renderNav(){
  const r=route().path;
  $('#nav').innerHTML=`<a href="#/" class="${r==='/'?'on':''}"><span class="n">00</span>Accueil</a><div class="lbl">Cours</div>`+
  L.map(l=>{const p=lessonPct(l);return `<a href="#/lesson/${l.id}" class="${r==='/lesson/'+l.id?'on':''} ${p>=1?'done':''}"><span class="n">${l.n}</span>${esc(l.title)}<span class="pc">${p>=1?'✓':p>0?pct(p)+'%':''}</span></a>`}).join('')+
  `<div class="lbl">Entraînement</div>
   <a href="#/cards" class="${r.startsWith('/cards')?'on':''}"><span class="n">↻</span>Cartes<span class="pc">${dueCards().length}</span></a>
   <a href="#/quiz" class="${r.startsWith('/quiz')?'on':''}"><span class="n">?</span>Quiz</a>
   <a href="#/drill" class="${r.startsWith('/drill')?'on':''}"><span class="n">&gt;_</span>Commandes</a>
   <a href="#/exam" class="${r==='/exam'?'on':''}"><span class="n">★</span>Examen</a>
   <div class="lbl">Outils</div>
   <a href="#/labs" class="${r==='/labs'?'on':''}"><span class="n">◇</span>Laboratoire</a>
   <a href="#/cheat" class="${r==='/cheat'?'on':''}"><span class="n">≡</span>Aide-mémoire</a>`;
  const t=$$('#tabbar [data-tab]');const k=r==='/'?'home':r.startsWith('/lesson')?'menu':r.startsWith('/cards')?'cards':r.startsWith('/quiz')||r==='/exam'?'quiz':r.startsWith('/drill')?'drill':'';
  t.forEach(a=>a.classList.toggle('on',a.dataset.tab===k));
  const due=dueCards().length,bd=$('#tab-due');if(bd){bd.textContent=due>99?'99+':due;bd.hidden=!due}
}
function route(){const h=location.hash.replace(/^#/,'')||'/';const [path,qs]=h.split('?');return {path,qs:new URLSearchParams(qs||''),parts:path.split('/').filter(Boolean)}}
let keyHandler=null;
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();return}
  if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!$('#modal').classList.contains('on')){e.preventDefault();openSearch();return}
  if(e.key==='Escape'){closeSearch();document.body.classList.remove('nav-open')}
  if(keyHandler&&!$('#modal').classList.contains('on'))keyHandler(e);
});
const TITLES={'':'outil d\'étude',cards:'cartes',quiz:'quiz',drill:'commandes',exam:'examen',labs:'laboratoire',cheat:'aide-mémoire'};
function go(){
  keyHandler=null;view.onclick=null;view.ontouchstart=null;view.ontouchend=null;const r=route();renderNav();document.body.classList.remove('nav-open');
  const [a,b]=r.parts;
  if(!a)home();else if(a==='lesson'&&lesson(b))lessonView(lesson(b),r.qs.get('s'));else if(a==='cards')cardsView(b);
  else if(a==='quiz')quizView(b);else if(a==='drill')drillView(b);else if(a==='exam')examView();
  else if(a==='labs')labsView();else if(a==='cheat')cheatView();else home();
  if(!(a==='lesson'&&r.qs.get('s')))window.scrollTo({top:0,behavior:'instant'});
  document.title='Réseaux — '+(a==='lesson'&&lesson(b)?lesson(b).title:(TITLES[a||'']||TITLES['']));
  updateRP();
}
window.addEventListener('hashchange',go);

/* barre de lecture */
function updateRP(){const r=$('#rp');if(!r)return;const on=route().parts[0]==='lesson';const h=document.documentElement.scrollHeight-innerHeight;r.style.width=on&&h>0?Math.min(100,scrollY/h*100)+'%':'0';}
addEventListener('scroll',updateRP,{passive:true});

/* ───── accueil ───── */
function home(){
  const s=load(),t=today();
  const totalSec=L.reduce((n,l)=>n+l.sections.length,0),doneSec=L.reduce((n,l)=>n+l.sections.filter((_,i)=>s.done[secKey(l,i)]).length,0);
  const mastered=CARDS.filter(c=>(s.cards[cid(c)]?.b||0)>=3).length;
  const due=dueCards().length;
  let nextL=L.find(l=>lessonPct(l)<1),nextI=nextL?nextL.sections.findIndex((_,i)=>!s.done[secKey(nextL,i)]):-1;
  const days=[];for(let i=27;i>=0;i--){const v=s.days[t-i]||0;days.push(`<i class="${v>=20?'l3':v>=8?'l2':v>0?'l1':''}" title="${v} actions"></i>`)}
  const qs=Object.values(s.quiz),qok=qs.length?Math.round(qs.filter(x=>x.ok).length/qs.length*100):null;
  view.innerHTML=`
  <div class="hero"><div>
    <span class="lbl">Cours « Réseaux » · NAT · DHCP · OSPF · Cisco IOS</span>
    <h1 class="big">Tout<br>savoir sur <em>les réseaux.</em></h1>
    <p class="lead">Sept cours tirés de toutes tes présentations : explications, simulateurs, cartes à répétition espacée, quiz et entraînement aux commandes Cisco.</p>
  </div>
  <div><div class="stats">
    <div class="stat"><span class="lbl">Série</span><b>${streak()}<small> j</small></b></div>
    <div class="stat"><span class="lbl">Cours</span><b>${doneSec}<small>/${totalSec}</small></b></div>
    <div class="stat"><span class="lbl">Acquis</span><b>${mastered}<small>/${CARDS.length}</small></b></div>
  </div><div class="strip" title="Activité sur 28 jours">${days.join('')}</div></div></div>

  <div class="next"><div>
    <span class="lbl">${nextL?'Continuer':'Tout est lu'}</span>
    <h3>${nextL?`Cours ${nextL.n} · ${esc(nextL.title)}`:'Maintenant : place à la révision'}</h3>
    <p>${nextL?(nextI>0?`Suite : §${nextI+1} « ${esc(nextL.sections[nextI].h)} »`:`${esc(nextL.blurb)}`):`Cartes à réviser aujourd'hui : ${due}.${qok!=null?' Bonnes réponses aux quiz : '+qok+' %.':''}`}</p>
  </div><div class="next-btns">
    ${nextL?`<a class="btn acc" href="#/lesson/${nextL.id}${nextI>0?'?s='+nextI:''}">Lire →</a>`:''}
    <a class="btn ${nextL?'ghost':'acc'}" href="#/cards">Réviser · ${due}</a></div></div>

  <div class="sec-head"><h2 class="sec">Plan du cours</h2><span class="lbl">cours lu · cartes acquises</span></div>
  <div class="course">${L.map(l=>{const p=lessonPct(l),m=mastery(l.id);return `<a class="row" href="#/lesson/${l.id}">
    <span class="num">${l.n}</span>
    <div><h3>${esc(l.title)}</h3><p>${esc(l.blurb)}</p></div>
    <div class="meter"><div><div class="lbl"><span>cours</span><span>${pct(p)} %</span></div><div class="bar"><i style="width:${pct(p)}%"></i></div></div>
    <div><div class="lbl"><span>cartes</span><span>${pct(m)} %</span></div><div class="bar acc"><i style="width:${pct(m)}%"></i></div></div></div>
    <span class="go">→</span></a>`}).join('')}</div>

  <div class="sec-head"><h2 class="sec">Entraînement</h2><span class="lbl">le meilleur moyen de retenir : se rappeler</span></div>
  <div class="modes">
    <a class="mode" href="#/cards"><span class="lbl">01 · répétition espacée</span><h4>Cartes</h4><p>${CARDS.length} cartes selon la méthode de Leitner : les difficiles reviennent souvent, les faciles plus rarement.</p><span class="tag">à réviser : ${due}</span></a>
    <a class="mode" href="#/quiz"><span class="lbl">02 · choix multiple</span><h4>Quiz</h4><p>${QUIZ.length} questions corrigées. Les pièges des diapos y sont.</p><span class="tag">${qok!=null?'réussite : '+qok+' %':'pas encore fait'}</span></a>
    <a class="mode" href="#/drill"><span class="lbl">03 · les mains sur le clavier</span><h4>Commandes</h4><p>${DRILLS.length} exercices : tape la commande Cisco IOS d'après l'énoncé, comme en TP.</p><span class="tag">terminal →</span></a>
    <a class="mode" href="#/exam"><span class="lbl">04 · évaluation</span><h4>Examen</h4><p>20 questions aléatoires, sans indice, avec chrono. Correction à la fin.</p><span class="tag">démarrer →</span></a>
    <a class="mode" href="#/labs"><span class="lbl">05 · manipuler</span><h4>Laboratoire</h4><p>Graphe SPF, DORA, table NAT, élection DR, wildcard et cost.</p><span class="tag">9 simulateurs</span></a>
    <a class="mode" href="#/cheat"><span class="lbl">06 · avant le TP</span><h4>Aide-mémoire</h4><p>Toutes les commandes du cours, avec recherche et copie sans invite.</p><span class="tag">Ctrl+K : recherche partout</span></a>
  </div>`;
}

/* ───── cours ───── */
function lessonView(l,jump){
  const s=load(),idx=L.indexOf(l),prev=L[idx-1],next=L[idx+1];
  const nC=cardsOf(l.id).length,nQ=QUIZ.filter(q=>q.l===l.id).length,nD=DRILLS.filter(d=>d.l===l.id).length;
  view.innerHTML=`<div class="lesson"><article>
    <div class="l-hero"><div class="crumb lbl"><a href="#/">cours</a><span>/</span><span>n° ${l.n}</span></div>
    <span class="lbl" style="color:var(--accent)">${esc(l.kicker)}</span>
    <h1 class="big l-title">${esc(l.title)}</h1>
    <p class="lead">${esc(l.blurb)}</p>
    <div class="meta lbl"><span>≈ ${l.minutes} min</span><span>${l.sections.length} sections</span><span>${nC} cartes</span><span>${nQ} questions</span><span>${nD} commandes</span></div>
    <div class="src">Source : ${esc(l.source)}</div></div>
    <label class="toc-m"><span class="lbl">Sommaire</span><select id="tocm"><option value="">Aller à une section…</option>${l.sections.map((sec,i)=>`<option value="${i}">${l.n}.${i+1} — ${esc(sec.h)}</option>`).join('')}</select></label>
    ${l.sections.map((sec,i)=>`<section class="s" id="sec-${i}"><header><span class="no">${l.n}.${i+1}</span><h2 class="sec">${esc(sec.h)}</h2></header><div class="body">${sec.blocks.map(block).join('')}</div>
      <div class="done-bar"><button class="mark ${s.done[secKey(l,i)]?'on':''}" data-sec="${i}"><i>✓</i><span>${s.done[secKey(l,i)]?'section terminée':'marquer comme comprise'}</span></button><span class="lbl">${l.n}.${i+1} / ${l.n}.${l.sections.length}</span></div></section>`).join('')}
    <div class="after"><a href="#/cards/${l.id}"><span class="lbl">mémoriser</span><b>Cartes du cours →</b><span class="note">${nC} cartes</span></a><a href="#/quiz/${l.id}"><span class="lbl">vérifier</span><b>Quiz du cours →</b><span class="note">${nQ} questions</span></a><a href="#/drill/${l.id}"><span class="lbl">taper</span><b>Commandes du cours →</b><span class="note">${nD} exercices</span></a></div>
    <div class="pn">${prev?`<a class="btn ghost" href="#/lesson/${prev.id}">← ${prev.n} ${esc(prev.title)}</a>`:'<span></span>'}${next?`<a class="btn" href="#/lesson/${next.id}">${next.n} ${esc(next.title)} →</a>`:''}</div>
  </article><nav class="toc"><span class="lbl" style="margin-bottom:8px">Dans ce cours</span>${l.sections.map((sec,i)=>`<a href="#sec-${i}" data-t="${i}" class="${s.done[secKey(l,i)]?'seen':''}"><b>${i+1}</b><span>${esc(sec.h)}</span></a>`).join('')}</nav></div>`;
  mountSims(view);
  $('#tocm').onchange=e=>{const v=e.target.value;if(v!==''){$('#sec-'+v).scrollIntoView({behavior:'smooth'});e.target.value=''}};
  view.onclick=e=>{
    const m=e.target.closest('[data-sec]');
    if(m){const i=+m.dataset.sec,k=secKey(l,i),st=load();if(st.done[k])delete st.done[k];else{st.done[k]=1;tick(3);vib()}save();
      m.classList.toggle('on',!!st.done[k]);m.querySelector('span').textContent=st.done[k]?'section terminée':'marquer comme comprise';
      $(`.toc [data-t="${i}"]`).classList.toggle('seen',!!st.done[k]);renderNav();
      if(st.done[k]&&i<l.sections.length-1)toast('section '+(i+1)+' ✓ — on continue');}
    const t=e.target.closest('.toc a');if(t){e.preventDefault();$('#sec-'+t.dataset.t).scrollIntoView({behavior:'smooth'})}
  };
  const links=$$('.toc a'),io=new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting){const i=en.target.id.replace('sec-','');links.forEach(a=>a.classList.toggle('cur',a.dataset.t===i))}})},{rootMargin:'-10% 0px -75% 0px'});
  $$('section.s',view).forEach(x=>io.observe(x));
  if(jump!=null)setTimeout(()=>{const x=$('#sec-'+jump);x&&x.scrollIntoView()},60);
}

/* ───── sélecteur ───── */
function picker(base,cur,counts){
  return `<div class="pickers"><a href="#/${base}" class="${!cur?'on':''}">TOUT · ${counts()}</a>${L.map(l=>`<a href="#/${base}/${l.id}" class="${cur===l.id?'on':''}">${l.n} ${esc(l.title)} · ${counts(l.id)}</a>`).join('')}</div>`;
}

/* ───── cartes ───── */
function cardsView(lid){
  if(lid&&!lesson(lid))lid=null;
  let cram=false,queue,done=0,total,cur,flipped=false;
  const build=()=>{queue=shuffle(cram?cardsOf(lid):dueCards(lid));total=queue.length;done=0};
  build();
  function draw(){
    const head=`<div class="stage"><span class="lbl">Répétition espacée · Leitner</span><h1 class="big h-sm">Cartes</h1>${picker('cards',lid,l=>(l?dueCards(l).length:dueCards().length))}`;
    if(!queue.length){
      view.innerHTML=head+`<div class="empty"><b>${total?'Session terminée':'Rien à réviser aujourd\'hui !'}</b>${total?`Cartes révisées : ${total}.`:'Aucune carte à revoir pour le moment.'}<br><br><button class="btn" id="cram">Réviser quand même</button></div></div>`;
      $('#cram').onclick=()=>{cram=true;build();draw()};keyHandler=null;view.ontouchstart=view.ontouchend=null;return}
    cur=queue[0];flipped=false;
    const r=load().cards[cid(cur)],lv=r?.b||0;
    view.innerHTML=head+`<div class="prog"><span class="lbl">${done} / ${total}</span><div class="bar"><i style="width:${total?done/total*100:0}%"></i></div><span class="lbl">reste ${queue.length}</span></div>
     <div class="card3" id="c"><div class="in"><div class="face"><div class="fh"><span class="lbl">Question · ${esc(lesson(cur.l).title)}</span><span class="lbl">niveau ${lv}/5</span></div><div class="t">${fmt(cur.f)}</div><span class="hint">TOUCHE LA CARTE POUR LA RETOURNER</span></div>
     <div class="face back"><div class="fh"><span class="lbl">Réponse</span><span class="lbl">niveau ${lv}/5</span></div><div class="t">${fmt(cur.b)}</div><span class="hint" style="color:#ffffff80">ÉVALUE-TOI HONNÊTEMENT · GLISSE ← OU →</span></div></div></div>
     <div class="rate" id="rt" hidden><button data-r="0">À revoir<small>1 · maintenant</small></button><button data-r="1">Je sais<small>2 · niveau +1</small></button><button data-r="2">Facile<small>3 · niveau +2</small></button></div>
     <button class="btn ghost bigbtn" id="fl">Montrer la réponse</button>`;
    const flip=()=>{if(flipped)return;flipped=true;vib();$('#c').classList.add('flip');$('#rt').hidden=false;$('#fl').hidden=true};
    $('#c').onclick=flip;$('#fl').onclick=flip;
    $('#rt').onclick=e=>{const b=e.target.closest('[data-r]');if(b)rate(+b.dataset.r)};
    let x0=null;
    view.ontouchstart=e=>{x0=e.touches[0].clientX};
    view.ontouchend=e=>{if(x0==null||!flipped)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(dx>70)rate(1);else if(dx<-70)rate(0)};
    keyHandler=e=>{if(/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;
      if(e.code==='Space'||e.key==='Enter'){e.preventDefault();flip()}
      else if(flipped&&'123'.includes(e.key))rate(+e.key-1)};
  }
  const INT=[0,1,3,7,16,35];
  function rate(r){
    const s=load(),id=cid(cur),o=s.cards[id]||{b:0,d:0};queue.shift();vib();
    if(r===0){o.b=1;o.d=today();queue.splice(Math.min(queue.length,3),0,cur)}
    else{o.b=Math.min(5,Math.max(1,o.b)+(r===2?2:1));o.d=today()+INT[o.b];done++}
    s.cards[id]=o;save();tick();renderNav();draw();
  }
  draw();
}

/* ───── quiz ───── */
function runQuiz(qs,{exam,back,title}){
  let i=0,ans=[],start=Date.now(),tm=null,sel=null,locked=false;
  const total=qs.length;
  const q0=qs.map(q=>{const idx=shuffle(q.o.map((_,k)=>k));return {...q,opts:idx.map(k=>q.o[k]),correct:idx.indexOf(q.a)}});
  function draw(){
    if(i>=total)return finish();
    const q=q0[i];sel=null;locked=false;
    view.innerHTML=`<div class="stage"><div class="qh"><span class="lbl">${esc(title)} · ${esc(lesson(q.l).title)}</span>${exam?`<span class="timer" id="tm">00:00</span>`:''}</div>
    <div class="prog" style="margin-top:14px"><span class="lbl">${i+1} / ${total}</span><div class="bar"><i style="width:${i/total*100}%"></i></div></div>
    <div class="q">${fmt(q.q)}</div>
    <div class="opts" id="op">${q.opts.map((o,k)=>`<button class="opt" data-k="${k}"><b>${'ABCD'[k]}</b><span>${fmt(o)}</span></button>`).join('')}</div>
    <div id="fb"></div><div class="sticky-act"><button class="btn bigbtn" id="nx" ${exam?'':'hidden'} disabled>${i===total-1?'Terminer':'Suivant →'}</button></div></div>`;
    $('#op').onclick=e=>{const b=e.target.closest('.opt');if(b)pick(+b.dataset.k)};
    $('#nx').onclick=next;
    keyHandler=e=>{if('1234'.includes(e.key)&&+e.key<=q.opts.length)pick(+e.key-1);else if(e.key==='Enter'&&sel!=null&&(exam||locked))next()};
    tickT();
  }
  function tickT(){const t=$('#tm');if(!t)return;const f=()=>{const s=Math.floor((Date.now()-start)/1000);const e=$('#tm');if(!e)return clearInterval(tm);e.textContent=pad(Math.floor(s/60))+':'+pad(s%60)};clearInterval(tm);f();tm=setInterval(f,1000)}
  function pick(k){
    const q=q0[i];if(locked)return;vib();
    if(exam){sel=k;$$('.opt').forEach((b,n)=>b.classList.toggle('sel',n===k));$('#nx').disabled=false;return}
    locked=true;sel=k;
    $$('.opt').forEach((b,n)=>{b.disabled=true;if(n===q.correct)b.classList.add('ok');else if(n===k)b.classList.add('bad')});
    $('#fb').innerHTML=`<div class="expl"><b>${k===q.correct?'Exact.':'Faux.'}</b> ${fmt(q.e)}</div>`;
    $('#nx').hidden=false;$('#nx').disabled=false;$('#nx').scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function next(){const q=q0[i];if(sel==null)return;ans.push({q,k:sel,ok:sel===q.correct});const st=load(),id=hash(q.q),o=st.quiz[id]||{n:0};o.n++;o.ok=sel===q.correct?1:0;st.quiz[id]=o;save();tick();i++;draw();window.scrollTo({top:0,behavior:'instant'})}
  function finish(){
    clearInterval(tm);keyHandler=null;renderNav();
    const ok=ans.filter(a=>a.ok).length,p=Math.round(ok/total*100),bad=ans.filter(a=>!a.ok);
    const t=Math.floor((Date.now()-start)/1000);
    view.innerHTML=`<div class="stage"><div class="result"><span class="lbl">${esc(title)} · résultat</span><div class="score">${ok}<em>/</em>${total}</div>
     <p class="lead" style="margin:0 auto">${p>=90?'Excellent. Tu es prêt(e).':p>=70?'Bien — il reste quelques détails à revoir.':p>=50?'Mi-parcours. Passe en revue les erreurs ci-dessous.':'Il faut revoir les cours et les cartes.'} ${exam?`Temps : ${pad(Math.floor(t/60))}:${pad(t%60)}.`:''}</p>
     <div class="res-btns">${bad.length?`<button class="btn acc" id="rw">Refaire les erreurs · ${bad.length}</button>`:''}<a class="btn ghost" href="${back}">Retour au choix</a></div></div>
     ${bad.length?`<div class="wrong"><span class="lbl">Correction des erreurs</span>${bad.map(a=>`<div><b>${fmt(a.q.q)}</b><br><span style="color:var(--bad)">Ta réponse : ${fmt(a.q.opts[a.k])}</span><br><span style="color:var(--ok)">Bonne réponse : ${fmt(a.q.opts[a.q.correct])}</span><br><span class="note">${fmt(a.q.e)}</span></div>`).join('')}</div>`:''}</div>`;
    window.scrollTo({top:0,behavior:'instant'});
    const rw=$('#rw');if(rw)rw.onclick=()=>runQuiz(bad.map(a=>QUIZ.find(x=>x.q===a.q.q)),{exam:false,back,title:'Révision des erreurs'});
  }
  draw();
}
function quizView(lid){
  if(lid&&!lesson(lid))lid=null;
  const qs=QUIZ.filter(q=>!lid||q.l===lid);
  view.innerHTML=`<div class="stage"><span class="lbl">Choix multiple · corrigé</span><h1 class="big h-sm">Quiz</h1>
   ${picker('quiz',lid,l=>QUIZ.filter(q=>!l||q.l===l).length)}
   <div class="empty"><b>${plural(qs.length,'question','questions')}</b>${lid?esc(lesson(lid).title):'sur tout le cours'}<br><br><button class="btn acc" id="go">Commencer →</button></div></div>`;
  $('#go').onclick=()=>runQuiz(shuffle(qs),{exam:false,back:'#/quiz'+(lid?'/'+lid:''),title:'Quiz'});
}
function examView(){
  view.innerHTML=`<div class="stage"><span class="lbl">Évaluation</span><h1 class="big h-sm">Examen</h1>
   <div class="empty"><b>20 questions · sans indice</b>Questions aléatoires sur tous les cours. Les bonnes réponses et la correction n'apparaissent qu'à la fin.<br><br><button class="btn acc" id="go">Lancer l'examen →</button></div></div>`;
  $('#go').onclick=()=>runQuiz(shuffle(QUIZ).slice(0,20),{exam:true,back:'#/exam',title:'Examen'});
}

/* ───── entraînement aux commandes ───── */
const norm=s=>s.toLowerCase().replace(/\s+/g,' ').replace(/\s*\|\s*/g,' | ').trim();
function drillView(lid){
  if(lid&&!lesson(lid))lid=null;
  const all=DRILLS.filter(d=>!lid||d.l===lid);
  view.innerHTML=`<div class="stage"><span class="lbl">Cisco IOS · comme en TP</span><h1 class="big h-sm">Commandes</h1>
   ${picker('drill',lid,l=>DRILLS.filter(d=>!l||d.l===l).length)}
   <div class="empty"><b>${plural(all.length,'exercice','exercices')}</b>Tu lis l'énoncé, tu tapes la commande. Les abréviations comme <code>sh ip int br</code> sont acceptées quand c'est évident.<br><br><button class="btn acc" id="go">Commencer →</button></div></div>`;
  $('#go').onclick=()=>runDrill(shuffle(all),'#/drill'+(lid?'/'+lid:''));
}
function runDrill(ds,back){
  let i=0,ok=0,checked=false,miss=[];
  function draw(){
    if(i>=ds.length){keyHandler=null;view.innerHTML=`<div class="stage"><div class="result"><span class="lbl">Commandes · bilan</span><div class="score">${ok}<em>/</em>${ds.length}</div><div class="res-btns">${miss.length?`<button class="btn acc" id="rw">Refaire les erreurs · ${miss.length}</button>`:''}<a class="btn ghost" href="${back}">Retour au choix</a></div></div></div>`;const rw=$('#rw');if(rw)rw.onclick=()=>runDrill(shuffle(miss),back);renderNav();return}
    const d=ds[i];checked=false;
    view.innerHTML=`<div class="stage"><span class="lbl">${esc(lesson(d.l).title)}</span><div class="prog" style="margin-top:12px"><span class="lbl">${i+1} / ${ds.length}</span><div class="bar"><i style="width:${i/ds.length*100}%"></i></div></div>
     <div class="term"><span class="task">${fmt(d.t)}</span><form id="f" autocomplete="off"><span class="pr">${esc(d.p)}</span><input id="in" spellcheck="false" autocapitalize="off" autocorrect="off" autocomplete="off" enterkeyhint="done" aria-label="commande"></form><div class="res" id="rs"></div></div>
     <div class="drill-btns"><button class="btn ghost sm" id="ht">Indice</button><button class="btn ghost sm" id="sh">Voir la réponse</button><button class="btn" id="nx" hidden>Suivant →</button></div></div>`;
    const inp=$('#in');if(matchMedia('(hover:hover)').matches)inp.focus();
    const show=(good)=>{checked=true;vib();const st=load(),id=hash(d.t+d.p),o=st.drill[id]||{n:0};o.n++;o.ok=good?1:0;st.drill[id]=o;save();tick();
      if(good)ok++;else miss.push(d);
      inp.disabled=true;$('#rs').innerHTML=good?`<div class="res ok">✓ Exact.${d.x?' '+fmt(d.x):''}</div>`:`<div class="res no">✗ Réponse attendue : <code>${esc(d.a[0])}</code>${d.x?'<br>'+fmt(d.x):''}</div>`;
      $('#nx').hidden=false;$('#nx').focus();$('#ht').hidden=$('#sh').hidden=true};
    $('#f').onsubmit=e=>{e.preventDefault();if(checked)return;if(!inp.value.trim())return;show(d.a.some(a=>norm(a)===norm(inp.value)))};
    $('#sh').onclick=()=>show(false);
    $('#ht').onclick=()=>{const a=d.a[0].split(' ');$('#rs').innerHTML=`<div class="res" style="color:#ffd27a">Indice : ${esc(a.slice(0,Math.max(1,Math.ceil(a.length/3))).join(' '))} … (${a.length} mots)</div>`;inp.focus()};
    $('#nx').onclick=()=>{i++;draw();window.scrollTo({top:0,behavior:'instant'})};
    keyHandler=e=>{if(checked&&e.key==='Enter'){e.preventDefault();i++;draw()}};
  }
  draw();
}

/* ───── laboratoire ───── */
function labsView(){
  const order=['spf','dora','nat','dr','wildcard','cost','ripvsospf','states','ladder'];
  const where={spf:'ospf',dora:'dhcp',nat:'nat',dr:'ospf',wildcard:'ospf-cisco',cost:'ospf-cisco',ripvsospf:'ospf',states:'ospf',ladder:'ospf-cisco'};
  view.innerHTML=`<div class="stage wide"><span class="lbl">Modèles interactifs</span><h1 class="big h-sm">Laboratoire</h1><p class="lead">Neuf simulateurs tirés du cours. Coupe un lien, change une priorité, touche un hôte — et observe ce qui change.</p>
  ${order.map(id=>`<div class="chead"><h3>${esc(SIMS[id].title)}</h3><a class="lbl" href="#/lesson/${where[id]}">cours ${lesson(where[id]).n} →</a></div><div class="sim" data-sim="${id}"></div>`).join('')}</div>`;
  mountSims(view);
}

/* ───── aide-mémoire ───── */
function cheatView(){
  const items=[];L.forEach(l=>l.sections.forEach(s=>s.blocks.forEach(b=>{if(b.t==='code')items.push({l,s:s.h,x:b.x})})));
  view.innerHTML=`<div class="stage wide"><span class="lbl">Toutes les commandes du cours</span><h1 class="big h-sm">Aide-mémoire</h1>
   <div class="fbar"><input id="f" type="search" placeholder="ospf, nat pool, vlan, passive…" autocomplete="off" autocapitalize="off"></div><div id="ls"></div></div>`;
  const draw=()=>{const q=$('#f').value.toLowerCase().trim();const list=items.filter(i=>!q||(i.x+' '+i.s+' '+i.l.title).toLowerCase().includes(q));
    let last=null,h='';list.forEach(i=>{if(last!==i.l.id){h+=`<div class="chead"><h3>${i.l.n} · ${esc(i.l.title)}</h3></div>`;last=i.l.id}h+=`<div style="margin-bottom:14px"><span class="lbl">${esc(i.s)}</span>${codeBlock(i.x)}</div>`});
    $('#ls').innerHTML=h||'<div class="empty"><b>Aucun résultat</b>Essaie un autre mot.</div>'};
  $('#f').oninput=draw;draw();
}

/* ───── recherche ───── */
let IDX=null,sel=0,hits=[];
function index(){
  if(IDX)return IDX;IDX=[];
  L.forEach(l=>l.sections.forEach((s,i)=>{const txt=s.blocks.map(b=>b.x||(b.items?b.items.map(x=>Array.isArray(x)?x.join(' '):x).join(' '):'')||(b.rows?b.rows.flat().join(' '):'')).join(' ');
    IDX.push({k:'COURS '+l.n,t:s.h,s:strip(txt).slice(0,120),h:`#/lesson/${l.id}?s=${i}`,x:(s.h+' '+strip(txt)).toLowerCase(),w:3})}));
  CARDS.forEach(c=>IDX.push({k:'CARTE',t:strip(c.f),s:strip(c.b),h:'#/cards/'+c.l,x:(c.f+' '+c.b).toLowerCase(),w:2}));
  DRILLS.forEach(d=>IDX.push({k:'COMMANDE',t:d.a[0],s:strip(d.t),h:'#/cheat',x:(d.a.join(' ')+' '+d.t).toLowerCase(),w:1}));
  return IDX;
}
function openSearch(){const m=$('#modal');m.classList.add('on');document.body.classList.remove('nav-open');const q=$('#q');q.value='';q.focus();search('')}
function closeSearch(){$('#modal').classList.remove('on')}
function search(v){
  const toks=v.toLowerCase().split(/\s+/).filter(Boolean);
  hits=toks.length?index().map(e=>{if(!toks.every(t=>e.x.includes(t)))return null;let sc=e.w;toks.forEach(t=>{if(e.t.toLowerCase().includes(t))sc+=4});return {e,sc}}).filter(Boolean).sort((a,b)=>b.sc-a.sc).slice(0,30).map(x=>x.e):[];
  sel=0;
  $('#res').innerHTML=hits.length?hits.map((h,i)=>`<li><a href="${h.h}" data-i="${i}" class="${i===0?'sel':''}"><span class="lbl">${h.k}</span><span>${esc(h.t)}<em>${esc(h.s)}</em></span></a></li>`).join(''):`<li style="padding:18px 20px;color:var(--ink3)">${toks.length?'Aucun résultat':'Commence à taper : ospf, dhcp, wildcard, vlan…'}</li>`;
}
$('#q').addEventListener('input',e=>search(e.target.value));
$('#q').addEventListener('keydown',e=>{const a=$$('#res a');if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();sel=Math.max(0,Math.min(a.length-1,sel+(e.key==='ArrowDown'?1:-1)));a.forEach((x,i)=>x.classList.toggle('sel',i===sel));a[sel]?.scrollIntoView({block:'nearest'})}else if(e.key==='Enter'&&a[sel]){e.preventDefault();closeSearch();location.hash=a[sel].getAttribute('href')}});
$('#res').addEventListener('click',()=>closeSearch());
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeSearch()});
$('#sclose').onclick=closeSearch;
$('#s-open').onclick=openSearch;$('#s-open2').onclick=openSearch;

/* ───── thème / reset / menu ───── */
const setTheme=n=>{document.documentElement.dataset.theme=n;try{localStorage.setItem('rx.theme',n)}catch(e){};const m=document.querySelector('meta[name=theme-color]');if(m)m.content=n==='dark'?'#0B0C0B':'#ECEDE7'};
$('#theme').onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
setTheme(document.documentElement.dataset.theme);
$('#reset').onclick=()=>{if(confirm('Effacer toute la progression (cours, cartes, quiz) ?')){mem={done:{},cards:{},quiz:{},drill:{},days:{}};save();go()}};
const burger=()=>document.body.classList.toggle('nav-open');
$('#burger').onclick=burger;$('#tab-menu').onclick=burger;$('#scrim').onclick=()=>document.body.classList.remove('nav-open');
$('#nav').addEventListener('click',e=>{if(e.target.closest('a'))document.body.classList.remove('nav-open')});

/* ───── PWA ───── */
if('serviceWorker' in navigator&&location.protocol.startsWith('http')){addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}

go();
})();
