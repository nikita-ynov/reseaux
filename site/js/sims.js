/* Simulateurs interactifs */
(function(){
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ip2n=s=>{const p=String(s).trim().split('.').map(Number);if(p.length!==4||p.some(x=>!(x>=0&&x<=255)))return null;return(((p[0]*256+p[1])*256+p[2])*256+p[3])>>>0};
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const SIMS={};

/* ───── NAT / PAT ───── */
SIMS.nat={title:"Table NAT : PAT contre pool",mount(el){
  const PUB='206.245.160.1', POOL=['206.245.160.5','206.245.160.6'];
  const hosts=[{n:'PC1',ip:'192.168.0.2'},{n:'PC2',ip:'192.168.0.3'},{n:'PC3',ip:'192.168.0.5'}];
  const dests=['93.184.216.34:443','151.101.1.69:443','8.8.8.8:53'];
  let mode='pat',table=[],log=[],port=62001,fwd=false;
  const say=(t,c='')=>{log.unshift(`<div class="${c}">${t}</div>`);log=log.slice(0,8)};
  el.innerHTML=`<div class="hd"><span class="lbl">Simulateur · NAT</span><span class="lbl">touche un PC</span></div><div class="in">
   <div class="ctl"><span class="lbl">mode</span><div class="seg" id="m"><button data-m="pat" class="on">PAT · 1 IP publique</button><button data-m="pool">NAT dynamique · pool de 2 IP</button></div></div>
   <div class="ctl"><button class="mark" id="fw"><i>✓</i><span>port forwarding : tcp 192.168.0.4:80 ⇄ ${PUB}:80</span></button></div>
   <div class="ctl" id="hs"></div>
   <div class="ctl"><button class="btn sm ghost" id="inb">⇦ Requête entrante depuis Internet vers ${PUB}:80</button><button class="btn sm ghost" id="rs">effacer</button></div>
   <div class="tw" style="margin-bottom:12px"><table class="ptbl"><thead><tr><th>Pro</th><th>Inside global</th><th>Inside local</th><th>Outside global</th></tr></thead><tbody id="tb"></tbody></table></div>
   <div class="log" id="lg"></div>
   <p class="note" style="margin-top:12px" id="nt"></p></div>`;
  const q=s=>el.querySelector(s);
  q('#hs').innerHTML=hosts.map((h,i)=>`<button class="btn sm" data-h="${i}">${h.n} · ${h.ip} → Internet</button>`).join('');
  function draw(){
    q('#tb').innerHTML=table.length?table.map(r=>`<tr class="${r.n?'hl':''}"><td>${r.pro}</td><td>${r.ig}</td><td>${r.il}</td><td>${r.og}</td></tr>`).join(''):'<tr><td colspan="4" style="color:var(--ink3)">vide — envoie une requête</td></tr>';
    table.forEach(r=>r.n=0);
    q('#lg').innerHTML=log.join('')||'<div class="d">journal des événements…</div>';
    q('#fw').classList.toggle('on',fwd);
    q('#nt').innerHTML=mode==='pat'?'<b>PAT :</b> tous les hôtes partagent une seule IP publique — ils se distinguent par le <b>port</b>. Il y en a pour tout le monde.':'<b>Pool :</b> chaque hôte actif a besoin de sa propre IP publique. Le pool en compte 2 → <b>le troisième hôte reste sans sortie</b>. Pour corriger : ajouter <code>overload</code>.';
    el.querySelectorAll('#m button').forEach(b=>b.classList.toggle('on',b.dataset.m===mode));
  }
  q('#m').onclick=e=>{const b=e.target.closest('button');if(!b)return;mode=b.dataset.m;table=table.filter(r=>r.pro==='tcp'&&r.fixed);log=[];say('mode : '+(mode==='pat'?'PAT':'pool'),'d');draw()};
  q('#fw').onclick=()=>{fwd=!fwd;table=table.filter(r=>!r.fixed);if(fwd)table.push({pro:'tcp',ig:PUB+':80',il:'192.168.0.4:80',og:'---',fixed:1,n:1});say(fwd?'ajouté : <span class="ok">ip nat inside source static tcp 192.168.0.4 80 '+PUB+' 80</span>':'règle de port forwarding supprimée','d');draw()};
  q('#hs').onclick=e=>{const b=e.target.closest('button');if(!b)return;const h=hosts[+b.dataset.h],sp=rnd(49200,60000),d=dests[rnd(0,2)];
    if(mode==='pat'){const gp=port++;table.push({pro:'tcp',ig:PUB+':'+gp,il:h.ip+':'+sp,og:d,n:1});
      say(`${h.n} : <span class="d">${h.ip}:${sp} → ${d}</span> ⇒ <span class="ok">${PUB}:${gp} → ${d}</span>`)}
    else{let ex=table.find(r=>r.il===h.ip&&!r.fixed);
      if(!ex){const used=table.filter(r=>!r.fixed).map(r=>r.ig),free=POOL.find(p=>!used.includes(p));
        if(!free){say(`${h.n} : pool épuisé → paquet <span class="no">rejeté</span> (plus d'IP publique libre)`,'no');draw();return}
        ex={pro:'---',ig:free,il:h.ip,og:'---',n:1};table.push(ex)}
      say(`${h.n} : <span class="d">${h.ip} → ${d}</span> ⇒ <span class="ok">${ex.ig} → ${d}</span>`)}
    draw()};
  q('#inb').onclick=()=>{fwd?say('entrée : <span class="d">'+PUB+':80</span> ⇒ DNAT <span class="ok">192.168.0.4:80</span> (le serveur du LAN reçoit la requête)'):say('entrée : '+PUB+':80 — aucune traduction correspondante → <span class="no">rejeté</span>','no');draw()};
  q('#rs').onclick=()=>{table=fwd?[{pro:'tcp',ig:PUB+':80',il:'192.168.0.4:80',og:'---',fixed:1}]:[];log=[];port=62001;draw()};
  draw();
}};

/* ───── DHCP DORA ───── */
SIMS.dora={title:"DORA : échange DHCP",mount(el){
  const S=[
   {n:'DHCP Discover',dir:1,mode:'BROADCAST',src:'0.0.0.0 : 68',dst:'255.255.255.255 : 67',t:"Le client ne connaît ni son IP ni le serveur. Il crie à tout le segment : « y a-t-il un serveur DHCP ? »."},
   {n:'DHCP Offer',dir:-1,mode:'OFFRE',src:'172.18.1.1 : 67',dst:'client : 68',t:"Le serveur choisit une adresse libre dans le pool (hors excluded-address) et la propose : 172.18.1.41."},
   {n:'DHCP Request',dir:1,mode:'BROADCAST',src:'0.0.0.0 : 68',dst:'255.255.255.255 : 67',t:"Le client vérifie par ARP que l'adresse est libre, puis accepte l'offre en broadcast et demande le reste des paramètres.",arp:1},
   {n:'DHCP Acknowledge',dir:-1,mode:'UNICAST',src:'172.18.1.1 : 67',dst:'172.18.1.41 : 68',t:"Le serveur termine la transaction par un acquittement unicast. Le client applique la configuration.",fin:1}
  ];
  let i=-1,timer=null;
  el.innerHTML=`<div class="hd"><span class="lbl">Simulateur · DHCP</span><span class="lbl" id="ct">étape 0 / 4</span></div><div class="in">
   <div class="ctl"><button class="btn sm" id="pv">← retour</button><button class="btn sm" id="nx">suivant →</button><button class="btn sm ghost" id="pl">▶ auto</button><button class="btn sm ghost" id="rs">reset</button></div>
   <svg class="svgw" viewBox="0 0 600 290" id="sv"></svg>
   <div class="grid2" style="margin-top:14px"><div id="info"></div><div id="cfg"></div></div></div>`;
  const q=s=>el.querySelector(s);
  function draw(){
    const ys=[70,120,170,220];let g=`<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>
     <rect x="20" y="14" width="140" height="32" fill="var(--ink)"/><text x="90" y="35" fill="var(--bg)" font-size="13" text-anchor="middle" font-weight="600">CLIENT</text>
     <rect x="440" y="14" width="140" height="32" fill="var(--ink)"/><text x="510" y="35" fill="var(--bg)" font-size="13" text-anchor="middle" font-weight="600">SERVEUR DHCP</text>
     <line x1="90" y1="46" x2="90" y2="276" stroke="var(--line2)" stroke-dasharray="4 4"/><line x1="510" y1="46" x2="510" y2="276" stroke="var(--line2)" stroke-dasharray="4 4"/>`;
    S.forEach((s,k)=>{if(k>i)return;const cur=k===i,y=ys[k],c=cur?'var(--accent)':'var(--ink3)',x1=s.dir>0?92:508,x2=s.dir>0?508:92;
      g+=`<g style="color:${c}"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${c}" stroke-width="${cur?3:1.5}" marker-end="url(#ah)"/>
      <text x="300" y="${y-9}" text-anchor="middle" font-size="12.5" fill="${cur?'var(--ink)':'var(--ink3)'}" font-weight="${cur?700:400}">${k+1}. ${s.n}</text>
      ${s.mode==='BROADCAST'?`<text x="300" y="${y+17}" text-anchor="middle" font-size="10" fill="${c}">★ broadcast</text>`:s.mode==='UNICAST'?`<text x="300" y="${y+17}" text-anchor="middle" font-size="10" fill="${c}">unicast</text>`:''}</g>`;
      if(s.arp&&cur)g+=`<text x="26" y="${y+28}" font-size="10.5" fill="var(--accent)">ARP : adresse prise ?</text><text x="26" y="${y+42}" font-size="10.5" fill="var(--accent)">pas de réponse → libre</text>`});
    q('#sv').innerHTML=g;
    const s=S[i];q('#ct').textContent='étape '+(i+1)+' / 4';
    q('#info').innerHTML=s?`<span class="lbl">En cours</span><h4 style="font:700 20px var(--f-ui);margin:4px 0 8px;letter-spacing:-.02em">${s.n} <span class="pill acc">${s.mode}</span></h4><p class="note">${s.t}</p><p class="mono" style="font-size:12.5px;margin-top:8px;color:var(--ink2)">src ${s.src}<br>dst ${s.dst}</p>`:'<span class="lbl">Prêt</span><p class="note" style="margin-top:6px">Appuie sur « suivant » — un client sans adresse cherche d\'abord un serveur.</p>';
    q('#cfg').innerHTML=s&&s.fin?`<span class="lbl">Le client reçoit</span><table class="ptbl" style="margin-top:6px"><tr><td>IP</td><td>172.18.1.41</td></tr><tr><td>Masque</td><td>255.255.255.0</td></tr><tr><td>Passerelle</td><td>172.18.1.1</td></tr><tr><td>DNS</td><td>172.17.16.34</td></tr><tr><td>Bail</td><td>1 jour</td></tr><tr><td>Domaine</td><td>toto.fr</td></tr></table>`:`<span class="lbl">Ports</span><p class="note" style="margin-top:6px">Client <b>UDP 68</b> ⇄ serveur <b>UDP 67</b>.<br>Base : BOOTP (RFC 951).</p>`;
    q('#pv').disabled=i<0;q('#nx').disabled=i>=3;
  }
  const stop=()=>{clearInterval(timer);timer=null;q('#pl').textContent='▶ auto'};
  q('#nx').onclick=()=>{stop();if(i<3){i++;draw()}};q('#pv').onclick=()=>{stop();if(i>-1){i--;draw()}};
  q('#rs').onclick=()=>{stop();i=-1;draw()};
  q('#pl').onclick=()=>{if(timer)return stop();if(i>=3)i=-1;q('#pl').textContent='■ stop';const tick=()=>{if(i>=3)return stop();i++;draw()};tick();timer=setInterval(tick,1600)};
  draw();
}};

/* ───── RIP vs OSPF ───── */
SIMS.ripvsospf={title:"RIP contre OSPF",mount(el){
  let m='rip';
  el.innerHTML=`<div class="hd"><span class="lbl">Simulateur · choix du chemin</span><span class="lbl">B → sous-réseau 10.1.1.0 chez A</span></div><div class="in">
  <div class="ctl"><div class="seg" id="sg"><button data-m="rip" class="on">RIP (sauts)</button><button data-m="ospf">OSPF (cost)</button></div></div>
  <svg class="svgw" viewBox="0 0 600 270" id="sv"></svg><p class="note" id="tx" style="margin-top:12px"></p></div>`;
  const q=s=>el.querySelector(s);
  function draw(){
    const A=[110,70],B=[490,70],C=[300,205],col=(on)=>on?'var(--accent)':'var(--ink3)',w=on=>on?5:2;
    const ab=m==='rip',acb=m==='ospf';
    q('#sv').innerHTML=`<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" stroke="${col(ab)}" stroke-width="${w(ab)}" stroke-dasharray="${ab?'':'3 5'}"/>
     <text x="300" y="56" text-anchor="middle" font-size="12" fill="var(--ink)">série · 1544 kbps · cost 64</text>
     <line x1="${A[0]}" y1="${A[1]}" x2="${C[0]}" y2="${C[1]}" stroke="${col(acb)}" stroke-width="${w(acb)}"/><line x1="${B[0]}" y1="${B[1]}" x2="${C[0]}" y2="${C[1]}" stroke="${col(acb)}" stroke-width="${w(acb)}"/>
     <text x="165" y="158" font-size="12" fill="var(--ink)" text-anchor="middle">1 Gbps · cost 1</text><text x="435" y="158" font-size="12" fill="var(--ink)" text-anchor="middle">1 Gbps · cost 1</text>
     ${[['A',A],['B',B],['C',C]].map(([n,p])=>`<circle cx="${p[0]}" cy="${p[1]}" r="24" fill="var(--ink)"/><text x="${p[0]}" y="${p[1]+5}" fill="var(--bg)" font-size="15" font-weight="700" text-anchor="middle">${n}</text>`).join('')}
     <rect x="30" y="10" width="160" height="22" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="110" y="25" font-size="11.5" text-anchor="middle" fill="var(--ink)">sous-réseau 10.1.1.0</text>
     <line x1="110" y1="32" x2="110" y2="46" stroke="var(--accent)"/>`;
    q('#tx').innerHTML=m==='rip'?'<b>RIP</b> compte les sauts : B→A = <b>1 saut</b> contre B→C→A = 2 sauts. Il choisit le lien <b>lent</b> de 1,5 Mbps — alors qu\'un gigabit est tout proche.':'<b>OSPF</b> additionne les cost : B→A = <b>64</b> (100 000/1544), B→C→A = 1+1 = <b>2</b>. Il choisit le chemin <b>rapide</b> par C.';
    el.querySelectorAll('#sg button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));
  }
  q('#sg').onclick=e=>{const b=e.target.closest('button');if(b){m=b.dataset.m;draw()}};draw();
}};

/* ───── SPF ───── */
SIMS.spf={title:"SPF : plus court chemin vers netA",mount(el){
  const N={R1:[70,150],R2:[190,70],R3:[330,70],R4:[470,70],R5:[590,150],R6:[190,230],R7:[330,230]};
  const E=[['R1','R2',10],['R1','R6',10],['R2','R3',10],['R3','R4',1],['R4','R5',1],['R3','R7',1],['R6','R7',1],['R7','R5',10]];
  let broken=new Set();
  el.innerHTML=`<div class="hd"><span class="lbl">Simulateur · Dijkstra</span><span class="lbl">touche un lien = couper / rétablir</span></div><div class="in">
  <div class="ctl"><button class="btn sm ghost" id="b1">✂ couper R6–R7 (étape 7)</button><button class="btn sm ghost" id="b0">réinitialiser</button></div>
  <p class="note" style="margin-bottom:10px">trait épais = 1 Gbps (cost 1), trait fin = 10 Mbps (cost 10)</p>
  <svg class="svgw" viewBox="0 0 700 290" id="sv"></svg>
  <div class="tw" style="margin-top:14px"><table class="ptbl"><thead><tr><th>Chemin R1 → R5 (→ netA)</th><th>Cost</th><th></th></tr></thead><tbody id="tb"></tbody></table></div>
  <p class="note" id="tx" style="margin-top:12px"></p></div>`;
  const q=s=>el.querySelector(s);
  const adj=()=>{const a={};Object.keys(N).forEach(k=>a[k]=[]);E.forEach((e,i)=>{if(broken.has(i))return;a[e[0]].push([e[1],e[2],i]);a[e[1]].push([e[0],e[2],i])});return a};
  function paths(){const a=adj(),out=[];(function d(n,seen,cost,ed,names){if(n==='R5'){out.push({names,cost,ed});return}a[n].forEach(([m,c,i])=>{if(!seen.has(m))d(m,new Set([...seen,m]),cost+c,[...ed,i],[...names,m])})})('R1',new Set(['R1']),0,[],['R1']);return out.sort((x,y)=>x.cost-y.cost)}
  function draw(){
    const P=paths(),best=P[0];let s='';
    E.forEach((e,i)=>{const [x1,y1]=N[e[0]],[x2,y2]=N[e[1]],isB=broken.has(i),on=best&&best.ed.includes(i),w=e[2]===1?6:2.5;
      s+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${isB?'var(--bad)':on?'var(--accent)':'var(--ink3)'}" stroke-width="${on?w+2:w}" ${isB?'stroke-dasharray="5 6"':''} opacity="${isB?.7:1}"/>
      <line data-e="${i}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="transparent" stroke-width="30" style="cursor:pointer"/>
      <rect x="${(x1+x2)/2-14}" y="${(y1+y2)/2-9}" width="28" height="18" fill="var(--bg)" stroke="var(--line2)" style="pointer-events:none"/><text x="${(x1+x2)/2}" y="${(y1+y2)/2+4}" text-anchor="middle" font-size="11" fill="${isB?'var(--bad)':'var(--ink)'}" style="pointer-events:none">${isB?'✕':e[2]}</text>`});
    s+=`<line x1="590" y1="150" x2="650" y2="70" stroke="var(--ink3)" stroke-dasharray="3 4"/><ellipse cx="655" cy="55" rx="34" ry="20" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="655" y="59" text-anchor="middle" font-size="12" fill="var(--ink)">netA</text>`;
    Object.entries(N).forEach(([k,[x,y]])=>{const on=best&&best.names.includes(k);s+=`<circle cx="${x}" cy="${y}" r="22" fill="${on?'var(--accent)':'var(--ink)'}"/><text x="${x}" y="${y+5}" fill="${on?'#fff':'var(--bg)'}" font-size="13" font-weight="700" text-anchor="middle" style="pointer-events:none">${k}</text>`});
    q('#sv').innerHTML=s;
    q('#tb').innerHTML=P.length?P.map((p,i)=>`<tr class="${i===0?'hl':''}"><td>${p.names.join(' → ')}</td><td>${p.cost}</td><td>${i===0?'<span class="pk">MEILLEUR</span>':''}</td></tr>`).join(''):'<tr><td colspan="3"><span class="pill bad">aucun chemin — netA injoignable</span></td></tr>';
    q('#tx').innerHTML=best?`R1 ajoute la route vers netA <b>via ${best.names[1]}</b> (cost ${best.cost}). Tout changement de topologie → nouvelle LSA → <b>recalcul SPF</b>.`:'La LSDB ne contient aucun chemin vers netA.';
  }
  q('#sv').onclick=e=>{const l=e.target.closest('[data-e]');if(!l)return;const i=+l.dataset.e;broken.has(i)?broken.delete(i):broken.add(i);draw()};
  q('#b1').onclick=()=>{broken=new Set([E.findIndex(e=>e[0]==='R6'&&e[1]==='R7')]);draw()};
  q('#b0').onclick=()=>{broken=new Set();draw()};
  draw();
}};

/* ───── états d'un voisin ───── */
SIMS.states={title:"Échelle des états d'un voisin",mount(el){
  const S=[
   ['Down',"Aucun hello reçu du voisin. État initial.",'—'],
   ['Init',"Hello du voisin reçu, mais notre RID n'est pas encore dans sa liste — pas de bidirectionnalité.",'Hello (224.0.0.5)'],
   ['2-Way',"On se voit mutuellement dans les Hello. Sur un segment broadcast, c'est ici que DR/BDR sont élus. Entre routeurs DROTHER, l'état reste 2-Way.",'Hello'],
   ['ExStart',"Ils décident qui mène l'échange (master/slave). Diapo : « vient de recevoir les hello ».",'DBD'],
   ['Exchange',"Échange du résumé de leurs LSDB.",'DBD'],
   ['Loading',"Demande et réception des LSA manquantes.",'LSR / LSU / LSAck'],
   ['Full',"LSDB synchronisées. Adjacence établie et maintenue.",'Hello (maintien)']];
  let i=0;
  el.innerHTML=`<div class="hd"><span class="lbl">Simulateur · adjacence</span><span class="lbl">pas à pas</span></div><div class="in"><div class="grid2 st-grid"><div id="ld"></div><div id="dt"></div></div><div class="ctl" style="margin-top:14px"><button class="btn sm" id="p">← retour</button><button class="btn sm" id="n">suivant →</button></div></div>`;
  const q=s=>el.querySelector(s);
  function draw(){
    q('#ld').innerHTML=S.map((s,k)=>`<button data-k="${k}" style="display:grid;grid-template-columns:22px 1fr;width:100%;text-align:left;padding:10px 10px;border:1px solid ${k===i?'var(--accent)':'var(--line2)'};margin-bottom:-1px;background:${k===i?'var(--accent)':k<i?'var(--sunken)':'var(--bg)'};color:${k===i?'#fff':'inherit'}"><span class="mono" style="font-size:11px;opacity:.7">${k}</span><span class="mono" style="font-size:13px;font-weight:${k===i?700:500}">${s[0]}</span></button>`).join('');
    q('#dt').innerHTML=`<span class="lbl">État</span><h4 style="font:800 34px var(--f-ui);letter-spacing:-.04em;margin:4px 0 10px">${S[i][0]}</h4><p class="note" style="font-size:16px">${S[i][1]}</p><p style="margin-top:12px"><span class="pill mute">paquets : ${S[i][2]}</span></p>`;
    q('#p').disabled=i===0;q('#n').disabled=i===S.length-1;
  }
  q('#ld').onclick=e=>{const b=e.target.closest('[data-k]');if(b){i=+b.dataset.k;draw()}};
  q('#p').onclick=()=>{i--;draw()};q('#n').onclick=()=>{i++;draw()};draw();
}};

/* ───── élection DR ───── */
SIMS.dr={title:"Élection DR / BDR",mount(el){
  let R=[{rid:'1.1.1.1',pri:1,up:1},{rid:'2.2.2.2',pri:1,up:1},{rid:'3.3.3.3',pri:1,up:1},{rid:'4.4.4.4',pri:1,up:1}];
  el.innerHTML=`<div class="hd"><span class="lbl">Simulateur · DR/BDR</span><span class="lbl">change la priorité ou « tue » un routeur</span></div><div class="in">
  <div class="tw"><table class="ptbl"><thead><tr><th>Router ID</th><th>Priorité</th><th>Actif</th><th>Rôle</th></tr></thead><tbody id="tb"></tbody></table></div>
  <div class="ctl" style="margin-top:12px"><button class="btn sm ghost" id="rs">reset</button></div><p class="note" id="tx"></p>
  <p class="note" style="margin-top:8px;color:var(--ink3)">Résultat d'une élection « from scratch ». En réalité, un DR en place n'est pas préempté par un routeur de priorité supérieure.</p></div>`;
  const q=s=>el.querySelector(s);
  function calc(){const c=R.map((r,i)=>({i,pri:+r.pri||0,n:ip2n(r.rid)??0,ok:r.up&&(+r.pri>0)})).filter(x=>x.ok).sort((a,b)=>b.pri-a.pri||b.n-a.n);return{dr:c[0]?.i,bdr:c[1]?.i}}
  const inp='padding:8px 9px;border:1px solid var(--line2);background:var(--bg);font:inherit;font-size:16px';
  function draw(keep){
    const {dr,bdr}=calc();
    if(!keep)q('#tb').innerHTML=R.map((r,i)=>`<tr><td><input value="${esc(r.rid)}" data-i="${i}" data-f="rid" inputmode="decimal" style="width:116px;${inp}"></td><td><input type="number" min="0" max="255" value="${r.pri}" data-i="${i}" data-f="pri" style="width:72px;${inp}"></td><td><input type="checkbox" ${r.up?'checked':''} data-i="${i}" data-f="up" style="width:22px;height:22px"></td><td data-role="${i}"></td></tr>`).join('');
    R.forEach((r,i)=>{const c=q(`[data-role="${i}"]`);c.innerHTML=!r.up?'<span class="pill mute">DOWN</span>':i===dr?'<span class="pill acc">DR</span>':i===bdr?'<span class="pill ok">BDR</span>':'<span class="pill mute">DROTHER</span>'});
    q('#tx').innerHTML=dr==null?'Aucun candidat.':`<b>DR = ${esc(R[dr].rid)}</b>${bdr!=null?`, <b>BDR = ${esc(R[bdr].rid)}</b>`:''}. Règle : d'abord la <b>priorité</b> (plus haute = mieux), à égalité le <b>RID</b> (plus grand = mieux). Priorité 0 : ne participe pas à l'élection.`;
  }
  q('#tb').addEventListener('input',e=>{const t=e.target,i=+t.dataset.i,f=t.dataset.f;if(f==='up')R[i].up=t.checked?1:0;else R[i][f]=t.value;draw(true)});
  q('#rs').onclick=()=>{R=R.map((r,i)=>({rid:(i+1)+'.'+(i+1)+'.'+(i+1)+'.'+(i+1),pri:1,up:1}));draw()};
  draw();
}};

/* ───── wildcard ───── */
SIMS.wildcard={title:"network + wildcard : qui correspond ?",mount(el){
  const IF=[['G0/0','10.1.12.1'],['G0/1/0','10.1.13.1'],['G0/2/0','10.1.14.1'],['Lo0','192.168.5.1'],['S0/0/0','172.16.3.1']];
  const P=[['10.1.0.0','0.0.255.255'],['10.0.0.0','0.255.255.255'],['10.1.13.0','0.0.0.255'],['10.1.14.1','0.0.0.0']];
  el.innerHTML=`<div class="hd"><span class="lbl">Simulateur · wildcard</span><span class="lbl">network A.B.C.D W.X.Y.Z area 0</span></div><div class="in">
  <div class="ctl" id="ps">${P.map((p,i)=>`<button class="chip" data-p="${i}">${p[0]} ${p[1]}</button>`).join('')}</div>
  <div class="grid2"><div class="field"><span class="lbl">network</span><input id="n" value="10.1.0.0" inputmode="decimal"></div><div class="field"><span class="lbl">wildcard</span><input id="w" value="0.0.255.255" inputmode="decimal"></div></div>
  <div class="tw" style="margin:14px 0"><table class="ptbl"><thead><tr><th>Interface</th><th>IP</th><th>Résultat</th></tr></thead><tbody id="tb"></tbody></table></div>
  <div class="grid2"><div class="field"><span class="lbl">préfixe /N → masque et wildcard</span><input id="pf" type="number" min="0" max="32" value="24"></div><div class="note" id="cv" style="align-self:end"></div></div></div>`;
  const q=s=>el.querySelector(s);
  function draw(){
    const n=ip2n(q('#n').value),w=ip2n(q('#w').value);
    q('#tb').innerHTML=IF.map(([nm,ip])=>{const a=ip2n(ip);const m=n!=null&&w!=null?(((a^n)&~w)>>>0)===0:null;return`<tr class="${m?'hl':''}"><td>${nm}</td><td>${ip}</td><td>${m==null?'<span class="pill mute">saisie ?</span>':m?'<span class="pill ok">OSPF activé</span>':'<span class="pill mute">—</span>'}</td></tr>`}).join('');
    const p=Math.max(0,Math.min(32,+q('#pf').value||0)),mask=p===0?0:(0xFFFFFFFF<<(32-p))>>>0,f=x=>[x>>>24,(x>>>16)&255,(x>>>8)&255,x&255].join('.');
    q('#cv').innerHTML=`/${p} → masque <b class="mono">${f(mask)}</b><br>wildcard <b class="mono">${f(~mask>>>0)}</b>`;
  }
  q('#ps').onclick=e=>{const b=e.target.closest('[data-p]');if(!b)return;const p=P[+b.dataset.p];q('#n').value=p[0];q('#w').value=p[1];draw()};
  el.addEventListener('input',draw);draw();
}};

/* ───── cost ───── */
SIMS.cost={title:"Calculateur de cost",mount(el){
  const L=[['Ethernet',10000],['FastEthernet',100000],['GigabitEthernet',1000000],['10 GigabitEthernet',10000000],['Serial T1',1544]];
  let ref=100;
  el.innerHTML=`<div class="hd"><span class="lbl">Simulateur · cost</span><span class="lbl">Cost = Ref BW / Int BW</span></div><div class="in">
  <div class="ctl"><span class="lbl">reference-bandwidth, Mbit/s</span><div class="seg" id="sg">${[100,1000,10000,100000].map(v=>`<button data-v="${v}" ${v===100?'class="on"':''}>${v}</button>`).join('')}</div></div>
  <div class="tw"><table class="ptbl"><thead><tr><th>Lien</th><th>Bande passante</th><th>Calcul</th><th>Cost</th></tr></thead><tbody id="tb"></tbody></table></div>
  <p class="note" id="tx" style="margin-top:12px"></p></div>`;
  const q=s=>el.querySelector(s);
  function draw(){
    const rows=L.map(([n,bw])=>({n,bw,c:Math.max(1,Math.floor(ref*1000/bw))}));
    const dup=rows.filter(r=>r.bw>=10000).filter(r=>r.c===1);
    q('#tb').innerHTML=rows.map(r=>`<tr><td>${r.n}</td><td>${r.bw>=1000?r.bw/1000+' Mbps':r.bw+' kbps'}</td><td>${ref*1000} / ${r.bw}</td><td><b>${r.c}</b></td></tr>`).join('');
    q('#tx').innerHTML=dup.length>=2?`<span class="pill bad">⚠ ${dup.length} liens différents ont un cost de 1</span> — OSPF ne les distingue pas. Augmente la reference BW (à l'identique sur tous les routeurs !).`:'Tous les liens rapides sont maintenant distingués par leur cost.';
    el.querySelectorAll('#sg button').forEach(b=>b.classList.toggle('on',+b.dataset.v===ref));
  }
  q('#sg').onclick=e=>{const b=e.target.closest('button');if(b){ref=+b.dataset.v;draw()}};draw();
}};

/* ───── échelle de diagnostic ───── */
SIMS.ladder={title:"Échelle de diagnostic OSPF",mount(el){
  const S=[
   ['Config','Ce qui est configuré','show running-config · show ip protocols',"Pas de network / ip ospf attendu, mauvais process ID ou mauvaise area."],
   ['Enabled Interfaces','OSPF activé sur les interfaces','show ip ospf interface [brief]',"L'interface n'est pas listée — network/wildcard ne correspond pas, ou elle est shutdown."],
   ['Neighbors','Hello → voisins découverts','show ip ospf neighbor',"Vide : interface passive, areas/sous-réseaux différents, pas de liaison L2."],
   ['LSDB','LSA reçues et synchronisées','show ip ospf database',"Le réseau voulu n'est pas dans la base — le voisin ne l'annonce pas."],
   ['RIB','Résultat du SPF','show ip ospf rib',"Présent dans la LSDB mais pas dans la RIB — pas de chemin vers l'annonceur."],
   ['Routes','Routes dans la table (après Admin Distance)','show ip route [ospf]',"Route OSPF connue mais absente de la table — un autre protocole avec une AD plus basse gagne."]];
  let i=0;
  el.innerHTML=`<div class="hd"><span class="lbl">Échelle · « OSPF status »</span><span class="lbl">touche une marche</span></div><div class="in"><div id="st" style="display:flex;flex-direction:column;gap:0"></div><div id="dt" style="margin-top:14px"></div></div>`;
  const q=s=>el.querySelector(s);
  function draw(){
    q('#st').innerHTML=S.map((s,k)=>`<button data-k="${k}" class="stp" style="margin-left:${k*14}px;text-align:left;padding:12px 14px;border:1px solid ${k===i?'var(--accent)':'var(--ink)'};background:${k===i?'var(--accent)':'var(--bg)'};color:${k===i?'#fff':'inherit'};margin-bottom:-1px;font:600 14px var(--f-ui)"><span class="mono" style="opacity:.6;font-size:11px">${k+1}</span>&nbsp; ${s[0]}</button>`).join('');
    q('#dt').innerHTML=`<p class="note"><b>${S[i][1]}.</b></p><div class="codeblock" style="margin:10px 0"><pre>${esc(S[i][2].split(' · ').join('\n'))}</pre></div><p class="note"><b>Symptôme typique :</b> ${S[i][3]}</p>`;
  }
  q('#st').onclick=e=>{const b=e.target.closest('[data-k]');if(b){i=+b.dataset.k;draw()}};draw();
}};

window.SIMS=SIMS;
})();
