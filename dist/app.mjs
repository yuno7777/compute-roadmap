import {roadmap,lessons,glossary} from './content/index.mjs';
import {labs} from './labs.mjs';
import {STORAGE_KEY,emptyProgress,parseProgress,score,recordAttempt,localDay} from './learning.mjs';

const $=(selector,root=document)=>root.querySelector(selector);
const main=$('#main'), moduleNav=$('#modules'), moduleMap=new Map(roadmap.map(module=>[module.id,module]));
const chapters=roadmap.flatMap(module=>module.chapters.map(chapter=>({...chapter,module})));
const chapterMap=new Map(chapters.map(chapter=>[chapter.id,chapter]));
const ids=chapters.map(chapter=>chapter.id).filter(id=>lessons[id]);
let progress=emptyProgress(), storageAvailable=true;
try {
  const saved=localStorage.getItem(STORAGE_KEY);
  if(saved) progress=parseProgress(JSON.parse(saved),ids);
} catch { storageAvailable=false; }
const mobile=matchMedia('(max-width: 700px)');
let sidebarClosed=mobile.matches, cleanups=[];
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
const link=(id,text)=>'<a href="#lesson/'+id+'">'+esc(text??lessons[id]?.title??chapterMap.get(id)?.title??id)+'</a>';
const page=(text)=>'<div class="wrap">'+text+'</div>';
const recommended=()=>ids.find(id=>!progress.complete[id])??ids[0];
const countToday=()=>Object.values(progress.complete).filter(time=>localDay(time)===localDay(Date.now())).length;
function save(){
  try {localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));storageAvailable=true;}
  catch {storageAvailable=false;}
}
function setSidebar(closed){
  sidebarClosed=closed;
  document.body.classList.toggle('sidebar-closed',closed);
  $('#menu').setAttribute('aria-expanded',String(!closed));
}
function theme(){
  document.documentElement.dataset.theme=progress.theme;
  $('#theme').textContent=progress.theme==='dark'?'Light':'Dark';
}
$('#menu').addEventListener('click',()=>{
  document.body.classList.remove('reading');
  setSidebar(!sidebarClosed);
});
$('#theme').addEventListener('click',()=>{progress.theme=progress.theme==='dark'?'light':'dark';save();theme();});
mobile.addEventListener('change',event=>setSidebar(event.matches));
const moduleStatus=module=>module.chapters.filter(chapter=>lessons[chapter.id]).length;
const moduleMastery=module=>{
  const domainIds=new Set(module.chapters.map(ch=>ch.id));
  const records=Object.entries(progress.attempts).filter(([key])=>domainIds.has(key.split(':')[0])).map(([,value])=>value);
  const correct=records.reduce((sum,row)=>sum+row.correct,0), wrong=records.reduce((sum,row)=>sum+row.wrong,0);
  return correct+wrong?Math.round(100*correct/(correct+wrong))+'% practice accuracy':'No assessed mastery';
};
function renderSidebar(current){
  const open=new Set([...moduleNav.querySelectorAll('details[open]')].map(item=>item.dataset.module));
  const module=chapterMap.get(current)?.module.id;
  const completed=Object.keys(progress.complete).length;
  $('#progress-label').textContent=completed+' of '+ids.length+' published lessons complete';
  $('#progress').max=ids.length;
  $('#progress').value=completed;
  moduleNav.innerHTML=roadmap.map((m,i)=>'<details class="module-nav" data-module="'+m.id+'" '+(open.has(m.id)||module===m.id||(!open.size&&!module&&i===0)?'open':'')+'><summary>'+esc(m.title)+'</summary>'+m.chapters.map(ch=>'<a '+(current===ch.id?'aria-current="page" ':'')+'href="#lesson/'+ch.id+'">'+esc(lessons[ch.id]?.title??ch.title)+(progress.complete[ch.id]?' <span class="done" aria-label="Complete">✓</span>':lessons[ch.id]?'':' <span class="pending">(planned)</span>')+'</a>').join('')+'</details>').join('');
}
const heroDiagram=`<svg viewBox="0 0 410 260" role="img" aria-labelledby="chain-title">
<title id="chain-title">Computing layers connect charge to reasoning</title>
<defs><pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r=".8" fill="currentColor" opacity=".22"/></pattern></defs>
<rect width="410" height="260" fill="url(#dots)" rx="3"/>
<path class="signal" d="M76 70H127V111H181M230 111H287V161H331M129 199h30v-20h130v-18M69 112v69h35"/>
<circle class="node" cx="127" cy="111" r="3"/><circle class="node" cx="287" cy="161" r="3"/>
<path class="glyph" d="M38 70h21m19 0h30m-49-19v39m19-31v22"/>
<circle class="glyph" cx="69" cy="70" r="29" opacity=".35"/>
<text class="label" x="29" y="121">CHARGE</text>
<path class="glyph" d="M177 88h28a24 24 0 0 1 0 48h-28zM159 100h18m-18 24h18m52-13h17"/>
<text class="label" x="177" y="155">LOGIC</text>
<rect class="glyph" x="100" y="180" width="40" height="31" rx="2"/><path class="glyph" d="M108 175v5m9-5v5m9-5v5m-18 31v5m9-5v5m9-5v5m-36-27h10m-10 10h10m40-10h7m-7 10h7"/>
<text class="label" x="80" y="236">INSTRUCTIONS</text>
<path class="glyph" d="M332 161l22-22 25 22-25 22zM354 139v44m-22-22h47"/>
<circle class="node" cx="332" cy="161" r="3"/><circle class="node" cx="354" cy="139" r="3"/><circle class="node" cx="379" cy="161" r="3"/><circle class="node" cx="354" cy="183" r="3"/>
<text class="label" x="307" y="210">MODEL</text></svg>`;
function home(full=false){
  const list=(full?roadmap:roadmap.slice(0,6)).map((module,i)=>{
    const published=moduleStatus(module);
    return '<li><a class="road-link" href="#module/'+module.id+'"><span class="road-index">'+String(i+1).padStart(2,'0')+'</span><span><strong>'+esc(module.title)+'</strong><small>'+esc(module.outcome)+'</small></span><span class="meta">'+published+' / '+module.chapters.length+' live</span></a></li>';
  }).join('');
  const start=progress.last||recommended();
  main.innerHTML=page((full?'<h1 class="lesson-title">Curriculum roadmap</h1><p class="lead">Open any module. Review the recommended prerequisites whenever you need them.</p>':
    '<section class="hero"><div><p class="kicker eyebrow">Interactive computing course</p><h1>From electrons <span>to artificial intelligence.</span></h1><p class="lead">Follow the signal from a single charge to a running program, then use the same first principles to understand modern AI.</p><div class="actions"><a class="button primary" href="#lesson/'+start+'">'+(progress.last?'Continue learning':'Start with electrons')+'</a><a class="button" href="#graph">Explore prerequisites</a></div><p class="meta">'+roadmap.length+' modules · '+ids.length+' published lessons · '+Object.keys(labs).length+' interactive labs</p></div><div class="hero-diagram">'+heroDiagram+'</div></section>')+
    '<section class="section"><div class="section-head"><h2>'+(full?'All modules':'The learning path')+'</h2>'+(full?'':'<a href="#roadmap">Full roadmap</a>')+'</div><ol class="road-list">'+list+'</ol></section><footer class="course-footer"><a href="#progress">Your notes, goals and progress</a></footer>');
}
function modulePage(id){
  const module=moduleMap.get(id);
  if(!module){unavailable();return;}
  const prereqs=module.requires.map(key=>'<a href="#module/'+key+'">'+esc(moduleMap.get(key).title)+'</a>').join(' · ');
  const completed=module.chapters.filter(ch=>progress.complete[ch.id]).length;
  main.innerHTML=page('<nav class="crumb" aria-label="Breadcrumb"><a href="#roadmap">Roadmap</a><span>/</span>'+esc(module.title)+'</nav><h1 class="lesson-title">'+esc(module.title)+'</h1><p class="lead">'+esc(module.outcome)+'</p><p class="meta">'+completed+' of '+moduleStatus(module)+' published complete · '+moduleMastery(module)+'</p>'+(prereqs?'<p>Recommended preparation '+prereqs+'</p>':'')+'<ol class="road-list">'+module.chapters.map((chapter,i)=>'<li><a class="road-link" href="#lesson/'+chapter.id+'"><span class="road-index">'+String(i+1).padStart(2,'0')+'</span><span><strong>'+esc(lessons[chapter.id]?.title??chapter.title)+'</strong><small>'+esc(lessons[chapter.id]?.objective??'Planned chapter')+'</small></span><span class="meta">'+(progress.complete[chapter.id]?'Complete':lessons[chapter.id]?lessons[chapter.id].minutes+' min':'Planned')+'</span></a></li>').join('')+'</ol><a class="button" href="#exam/'+module.id+'">Module assessment</a>');
}
function graph(id){
  const current=moduleMap.get(id)??roadmap[0];
  const next=roadmap.filter(module=>module.requires.includes(current.id));
  const chip=module=>'<a class="button" href="#graph/'+module.id+'">'+esc(module.title)+'</a>';
  const graphLayer=(nodes,y)=>{
    if(!nodes.length)return '';
    return nodes.map((node,i)=>{
      const width=600/nodes.length, x=i*width, mid=x+width/2;
      const first=node.title.split(' ').slice(0,3).join(' ');
      const second=node.title.slice(first.length).trim();
      const edge=y<90?'M'+mid+' '+(y+35)+' V77 H300 V92':'M300 127 V147 H'+mid+' V'+y;
      return '<path d="'+edge+'"/><a href="#graph/'+node.id+'" aria-label="'+esc(node.title)+'"><rect x="'+(x+5)+'" y="'+y+'" width="'+(width-10)+'" height="35" rx="3"/><text x="'+mid+'" y="'+(y+(second?14:22))+'">'+esc(first)+(second?'<tspan x="'+mid+'" dy="13">'+esc(second)+'</tspan>':'')+'</text></a>';
    }).join('');
  };
  const visual='<svg class="knowledge-graph" viewBox="0 0 600 209" role="group" aria-label="Interactive prerequisite connections for '+esc(current.title)+'">'+graphLayer(current.requires.map(key=>moduleMap.get(key)),16)+graphLayer(next,169)+'<rect class="current" x="165" y="92" width="270" height="35" rx="3"/><text x="300" y="114">'+esc(current.title)+'</text></svg>';
  main.innerHTML=page('<h1 class="lesson-title">Prerequisite graph</h1><p class="lead">Select a domain to see what it builds on and what it unlocks.</p><div class="utility graph-focus">'+visual+'<div class="graph-neighbors"><p class="label">Builds on</p><div class="graph-nodes">'+(current.requires.length?current.requires.map(key=>chip(moduleMap.get(key))).join(''):'<span>Start here</span>')+'</div></div><div class="callout"><h2>'+esc(current.title)+'</h2><p>'+esc(current.outcome)+'</p><a href="#module/'+current.id+'">Open module</a></div><div class="graph-neighbors"><p class="label">Prepares you for</p><div class="graph-nodes">'+(next.length?next.map(chip).join(''):'<span>Final domain in this roadmap</span>')+'</div></div></div><div class="section graph-nodes">'+roadmap.map(module=>'<a class="button" '+(module===current?'aria-current="true"':'')+' href="#graph/'+module.id+'">'+esc(module.title)+'</a>').join('')+'</div>');
}
function glossaryPage(){
  main.innerHTML=page('<h1 class="lesson-title">Concept glossary</h1><p class="lead">Find a technical term and revisit the lesson that uses it.</p><label for="glossary">Search terms and definitions</label><input id="glossary" type="search" autocomplete="off"><dl class="definitions" aria-live="polite"></dl>');
  const field=$('#glossary',main), definitions=$('.definitions',main);
  const filter=()=>{
    const query=field.value.trim().toLowerCase();
    definitions.innerHTML=glossary.filter(([term,description])=>(term+' '+description).toLowerCase().includes(query)).map(([term,description,id])=>'<dt>'+esc(term)+'</dt><dd>'+esc(description)+' '+link(id,'Open lesson')+'</dd>').join('')||'<dt>No matching terms</dt>';
  };
  field.addEventListener('input',filter);
  filter();
}
function progressPage(){
  const bookmarked=progress.bookmarks.map(id=>'<li>'+link(id)+'</li>').join('');
  const notes=Object.keys(progress.notes).filter(id=>progress.notes[id].trim()).map(id=>'<li>'+link(id)+'<p>'+esc(progress.notes[id])+'</p></li>').join('');
  main.innerHTML=page('<h1 class="lesson-title">Your progress</h1><p class="lead">'+Object.keys(progress.complete).length+' of '+ids.length+' published lessons complete.</p><div class="utility"><h2>Daily goal</h2><p>'+countToday()+' of '+progress.goal+' completed today.</p><label for="daily-goal">Lessons per day</label><input id="daily-goal" type="number" min="1" max="20" value="'+progress.goal+'"><div class="actions"><button id="save-goal">Save goal</button><button id="export">Export JSON</button><button id="import">Import and replace progress</button><input type="file" id="progress-file" hidden accept=".json,application/json"></div><output id="progress-status" aria-live="polite">'+(storageAvailable?'':'Browser storage is unavailable. Export before leaving.')+'</output></div><section class="section"><h2>Bookmarks</h2>'+(bookmarked?'<ul>'+bookmarked+'</ul>':'<p class="quiet">Bookmark a lesson to find it here.</p>')+'<h2>Notes</h2>'+(notes?'<ul>'+notes+'</ul>':'<p class="quiet">You can write personal notes inside each lesson.</p>')+'</section>');
  $('#save-goal').onclick=()=>{
    const field=$('#daily-goal');
    if(!field.reportValidity()) return;
    progress.goal=field.valueAsNumber||1;save();progressPage();$('#progress-status').textContent='Goal saved.';
  };
  $('#export').onclick=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(progress,null,2)],{type:'application/json'}));
    const download=document.createElement('a');download.href=url;download.download='compute-progress.json';download.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  $('#import').onclick=()=>$('#progress-file').click();
  $('#progress-file').onchange=async event=>{
    const file=event.target.files[0];
    if(!file)return;
    try {
      if(file.size>2_000_000) throw Error('The progress file is larger than 2 MB.');
      const imported=parseProgress(JSON.parse(await file.text()),ids);
      progress=imported;save();theme();renderSidebar();progressPage();$('#progress-status').textContent='Progress imported.';
    } catch(error){$('#progress-status').textContent=error.message;}
  };
}
function unavailable(){main.innerHTML=page('<h1 class="lesson-title">Page unavailable</h1><p>Choose a lesson from the '+ '<a href="#roadmap">roadmap</a>.</p>');}
function renderLesson(id){
  const chapter=chapterMap.get(id);
  if(!chapter){unavailable();return;}
  const lesson=lessons[id], {module}=chapter;
  const crumb='<nav class="crumb" aria-label="Breadcrumb"><a href="#roadmap">Roadmap</a><span>/</span><a href="#module/'+module.id+'">'+esc(module.title)+'</a></nav>';
  if(!lesson){
    main.innerHTML=page(crumb+'<h1 class="lesson-title">'+esc(chapter.title)+'</h1><p class="lead">This lesson is planned. Continue with a published lesson in '+esc(module.title)+'.</p><ul>'+module.chapters.filter(ch=>lessons[ch.id]).map(ch=>'<li>'+link(ch.id)+'</li>').join('')+'</ul>');
    return;
  }
  progress.last=id;save();
  const position=ids.indexOf(id), local=module.chapters.findIndex(ch=>ch.id===id);
  const previous=module.chapters.slice(0,local).filter(ch=>lessons[ch.id]).slice(-1);
  const prerequisite=previous.length?previous.map(ch=>link(ch.id)):module.requires.map(key=>'<a href="#module/'+key+'">'+esc(moduleMap.get(key).title)+'</a>');
  main.innerHTML='<article class="wrap reader">'+crumb+'<p class="kicker">'+esc(module.title)+' · '+lesson.minutes+' min</p><h1 class="lesson-title">'+esc(lesson.title)+'</h1><p class="lead">'+esc(lesson.objective)+'</p><p class="quiet">Recommended preparation '+(prerequisite.join(' · ')||'None. Start here.')+'</p><div class="actions"><button id="bookmark">'+(progress.bookmarks.includes(id)?'Bookmarked':'Bookmark')+'</button><button id="reading" aria-pressed="'+document.body.classList.contains('reading')+'">Reading mode</button><a class="button" href="#progress">Progress</a></div><div class="tabs" role="group" aria-label="Explanation depth">'+['beginner','intermediate','advanced'].map(mode=>'<button type="button" data-mode="'+mode+'" aria-pressed="'+(progress.mode===mode)+'">'+mode[0].toUpperCase()+mode.slice(1)+'</button>').join('')+'</div><section id="theory"></section><section aria-label="Interactive lab" id="lab"></section><section><h2>Check your understanding</h2><div id="questions"></div></section><section><h2>Your notes</h2><label for="note">Saved on this device</label><textarea id="note" class="note" rows="4" maxlength="10000">'+esc(progress.notes[id]??'')+'</textarea></section><section><h2>References</h2><ul>'+lesson.sources.map(([label,url])=>'<li><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a></li>').join('')+'</ul></section><div class="chapter-nav">'+(position>0?link(ids[position-1],'Previous lesson'):'<a href="#roadmap">Roadmap</a>')+'<button class="primary" id="complete">'+(progress.complete[id]?'Completed ✓ · Undo':'Mark complete')+'</button>'+(position+1<ids.length?link(ids[position+1],'Next published lesson'):'<a href="#practice">Review your learning</a>')+'</div></article>';
  function theory(){
    const beginner=progress.mode==='beginner', advanced=progress.mode==='advanced';
    $('#theory').innerHTML='<h2>Start with an intuition</h2><p class="intro">'+esc(lesson.intro)+'</p><h2>How it works</h2><ol class="mechanics">'+(beginner?lesson.mechanics.slice(0,2):lesson.mechanics).map(text=>'<li>'+esc(text)+'</li>').join('')+'</ol>'+(beginner?'<details><summary>Keep going into the technical details</summary><ol>'+lesson.mechanics.slice(2).map(text=>'<li>'+esc(text)+'</li>').join('')+'</ol></details>':'')+'<h2>Worked example</h2><p>'+esc(lesson.example)+'</p>'+(advanced?'<div class="callout"><h3>Deep dive</h3><p>Read the reference alongside the lab. Identify one assumption in the lab model and predict how relaxing it changes the result.</p></div>':'')+'<details '+(advanced?'open':'')+'><summary>Common misconception</summary><p>'+esc(lesson.misconception)+'</p></details><div class="callout"><h3>Revision notes</h3><p>'+esc(lesson.recap)+'</p></div>';
  }
  main.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{
    progress.mode=button.dataset.mode;save();
    main.querySelectorAll('[data-mode]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    theory();
  });
  $('#bookmark').onclick=event=>{
    const saved=progress.bookmarks.includes(id);
    progress.bookmarks=saved?progress.bookmarks.filter(bookmark=>bookmark!==id):[...progress.bookmarks,id];
    event.target.textContent=saved?'Bookmark':'Bookmarked';save();
  };
  $('#reading').onclick=event=>{
    const active=document.body.classList.toggle('reading');event.target.setAttribute('aria-pressed',String(active));
  };
  $('#complete').onclick=event=>{
    if(progress.complete[id]) delete progress.complete[id];else progress.complete[id]=Date.now();
    event.target.textContent=progress.complete[id]?'Completed ✓ · Undo':'Mark complete';save();renderSidebar(id);
  };
  $('#note').oninput=event=>{progress.notes[id]=event.target.value;save();};
  theory();
  mountLab($('#lab'),labs[lesson.lab]);
  lesson.questions.forEach((question,index)=>mountQuestion($('#questions'),question,id,index));
}
function diagram(stages,active){
  const wide=400, span=wide/stages.length;
  return '<svg viewBox="0 0 400 83" aria-label="'+esc(stages.join(' then '))+'" role="img"><path class="wire" d="M20 40H380"/>'+stages.map((stage,i)=>{
    const lines=stage.split(' '), split=stage.length>13&&lines.length>1;
    const first=split?lines.slice(0,Math.ceil(lines.length/2)).join(' '):stage;
    const second=split?lines.slice(Math.ceil(lines.length/2)).join(' '):'';
    const x=i*span+5, center=x+(span-10)/2;
    return '<rect class="diagram-box '+(active===i?'active':'')+'" x="'+x+'" y="10" width="'+(span-10)+'" height="63" rx="4"/><text x="'+center+'" y="'+(second?33:45)+'" text-anchor="middle">'+esc(first)+(second?'<tspan x="'+center+'" dy="15">'+esc(second)+'</tspan>':'')+'</text>';
  }).join('')+'</svg>';
}
function extraDiagram(state){
  if(state.grid){
    const {x,y,vertices}=state.grid;
    return '<svg viewBox="0 0 190 190" style="max-width:240px" role="img" aria-label="Triangle and sample at '+x+', '+y+'">'+Array.from({length:10},(_,i)=>'<path class="grid-line" d="M'+(i*20+5)+' 5v180M5 '+(i*20+5)+'h180"/>').join('')+'<polygon class="triangle" points="'+vertices.map(([vx,vy])=>(vx*20+5)+','+(vy*20+5)).join(' ')+'"/><circle class="sample" cx="'+(x*20+15)+'" cy="'+(y*20+15)+'" r="4"/></svg>';
  }
  if(state.weights){
    let x=0;
    return '<svg viewBox="0 0 400 40" role="img" aria-label="Attention weights '+state.weights.map(w=>w.toFixed(2)).join(', ')+'">'+state.weights.map((value,i)=>{
      const width=value*400, start=x;x+=width;
      return '<rect class="bar-segment" opacity="'+(1-i*.22)+'" x="'+start+'" y="2" width="'+width+'" height="34"><title>Key '+i+': '+value.toFixed(4)+'</title></rect>';
    }).join('')+'</svg>';
  }
  return '';
}
function mountLab(root,lab){
  if(!lab)return;
  root.innerHTML='<div class="lab"><p class="kicker">Interactive lab</p><h2>'+esc(lab.title)+'</h2><p class="quiet">'+esc(lab.procedure)+'</p><div class="lab-diagram"></div><div class="form-grid">'+Object.entries(lab.fields).map(([key,field])=>'<label '+(field.type==='text'?'class="wide"':'')+'>'+esc(field.label)+(field.type==='select'?'<select name="'+key+'">'+field.options.map(option=>'<option>'+esc(option)+'</option>').join('')+'</select>':'<input name="'+key+'" type="'+field.type+'" value="'+esc(field.value)+'" '+(field.type==='number'?'required min="'+field.min+'" max="'+field.max+'" step="'+field.step+'"':'maxlength="200"')+'>')+'</label>').join('')+'</div><div class="actions lab-buttons"><button data-action="step">Step</button><button data-action="play">Play</button><button data-action="reset">Reset</button><span class="meta lab-step"></span></div><output class="readout" aria-live="polite"></output><dl class="state"></dl><div class="lab-extra"></div></div>';
  const stepButton=$('[data-action="step"]',root), playButton=$('[data-action="play"]',root), out=$('output',root);
  let step=0,total=0,timer=null;
  function stop(){clearInterval(timer);timer=null;playButton.textContent='Play';}
  function draw(){
    const values={};
    for(const element of root.querySelectorAll('input,select')){
      if(!element.checkValidity()){stop();out.textContent='Check the highlighted input range and step.';total=0;stepButton.disabled=true;playButton.disabled=true;return;}
      values[element.name]=element.type==='number'?element.valueAsNumber:element.value;
    }
    try {
      const state=lab.run(values,step);
      total=state.total;
      $('.lab-diagram',root).innerHTML=diagram(lab.stages,state.active);
      out.textContent=state.summary;
      $('.state',root).innerHTML=state.rows.map(([key,value])=>'<div><dt>'+esc(key)+'</dt><dd>'+esc(value)+'</dd></div>').join('');
      $('.lab-extra',root).innerHTML=extraDiagram(state);
      $('.lab-step',root).textContent=total?'Step '+step+' of '+total:'';
      stepButton.hidden=playButton.hidden=!total;
      stepButton.disabled=playButton.disabled=step>=total;
      if(!total||step>=total)stop();
    } catch(error){
      total=0;stop();out.textContent=error.message;
      $('.state',root).replaceChildren();$('.lab-extra',root).replaceChildren();
      stepButton.disabled=playButton.disabled=true;
    }
  }
  root.addEventListener('input',()=>{stop();step=0;draw();});
  stepButton.onclick=()=>{if(step<total){step++;draw();}};
  playButton.onclick=()=>{
    if(timer){stop();return;}
    playButton.textContent='Pause';
    timer=setInterval(()=>{step++;draw();},550);
  };
  $('[data-action="reset"]',root).onclick=()=>{
    stop();step=0;Object.entries(lab.fields).forEach(([key,field])=>{root.querySelector('[name="'+key+'"]').value=field.value;});draw();
  };
  cleanups.push(stop);draw();
}
function mountQuestion(root,question,id,index){
  const item=document.createElement('form'), key=id+':'+index;
  item.className='question';
  let ordered=[...question.options];
  const choices=['choice','multi','true'].includes(question.type);
  item.innerHTML='<fieldset><legend>'+esc(question.prompt)+'</legend><p class="meta">'+esc(question.difficulty)+'</p><div class="question-controls"></div></fieldset><div class="actions"><button type="submit" class="primary">Check answer</button><button type="button" class="retry">Retry</button></div><details><summary>Show hint</summary><p>'+esc(question.hint)+'</p></details><output aria-live="polite"></output>';
  root.append(item);
  const controls=$('.question-controls',item), output=$('output',item);
  function reorder(from,to){
    if(from===to||to<0||to>=ordered.length||from<0||from>=ordered.length)return;
    ordered.splice(to,0,ordered.splice(from,1)[0]);fields();controls.querySelectorAll('li')[to]?.focus();
  }
  function fields(){
    if(question.type==='order'){
      controls.innerHTML='<ol class="sequence">'+ordered.map((label,i)=>'<li draggable="true" tabindex="-1" data-index="'+i+'">'+esc(label)+' <button type="button" aria-label="Move '+esc(label)+' up" data-offset="-1" '+(!i?'disabled':'')+'>Up</button><button type="button" aria-label="Move '+esc(label)+' down" data-offset="1" '+(i===ordered.length-1?'disabled':'')+'>Down</button></li>').join('')+'</ol>';
      controls.querySelectorAll('li').forEach(li=>{
        li.ondragstart=event=>event.dataTransfer.setData('text/plain',li.dataset.index);
        li.ondragover=event=>event.preventDefault();
        li.ondrop=event=>{event.preventDefault();const from=event.dataTransfer.getData('text/plain');if(/^\d+$/.test(from))reorder(Number(from),Number(li.dataset.index));};
      });
      controls.querySelectorAll('[data-offset]').forEach(button=>button.onclick=()=>{const from=Number(button.closest('li').dataset.index);reorder(from,from+Number(button.dataset.offset));});
    } else if(question.type==='match'){
      const options=[...question.answer].sort();
      controls.innerHTML='<div class="form-grid">'+question.options.map((label,i)=>'<label>'+esc(label)+'<select required name="match-'+i+'"><option value="">Choose a match</option>'+options.map(option=>'<option>'+esc(option)+'</option>').join('')+'</select></label>').join('')+'</div>';
    } else if(choices){
      controls.innerHTML=question.options.map((label,i)=>'<label class="option"><input name="answer" value="'+i+'" type="'+(question.type==='multi'?'checkbox':'radio')+'">'+esc(label)+'</label>').join('');
    } else {
      controls.innerHTML='<label>Your answer <input name="answer" '+(question.type==='number'?'inputmode="decimal"':'')+' autocomplete="off" required></label>';
    }
  }
  fields();
  $('.retry',item).onclick=()=>{item.reset();ordered=[...question.options];fields();output.textContent='Try again.';output.className='';};
  item.onsubmit=event=>{
    event.preventDefault();
    const data=new FormData(item);
    let answer=data.get('answer')??'';
    if(question.type==='multi')answer=data.getAll('answer').map(Number);
    if(question.type==='order')answer=ordered;
    if(question.type==='match')answer=question.options.map((_,i)=>data.get('match-'+i));
    if(answer===''||question.type==='multi'&&!answer.length){output.textContent='Choose an answer first.';return;}
    const correct=score(question,answer);
    progress.attempts[key]=recordAttempt(progress.attempts[key],correct);save();
    output.className=correct?'':'incorrect';
    output.textContent=(correct?'Correct. ':'Needs another look. ')+question.explanation;
  };
}
function practice(moduleId){
  const module=moduleMap.get(moduleId);
  const exam=Boolean(moduleId), now=Date.now();
  const lessonsToUse=module?module.chapters.map(ch=>ch.id).filter(id=>lessons[id]):ids;
  let items=lessonsToUse.flatMap(id=>lessons[id].questions.map((question,index)=>({id,question,index,attempt:progress.attempts[id+':'+index]})));
  const due=items.filter(item=>item.attempt&&item.attempt.due<=now);
  const weak=items.filter(item=>item.attempt&&item.attempt.wrong>item.attempt.correct).sort((a,b)=>b.attempt.wrong-a.attempt.wrong);
  if(!exam)items=[...new Set([...due,...weak,...items.filter(item=>!item.attempt)])].slice(0,8);
  main.innerHTML=page('<h1 class="lesson-title">'+esc(module?module.title+' assessment':exam?'Cumulative assessment':'Revision practice')+'</h1><p class="lead">'+(exam?items.length+' questions from published lessons.':'Review due questions and revisit concepts where you’ve made mistakes.')+'</p><div class="actions"><a class="button" href="#exam/all">Cumulative assessment</a><a class="button" href="#progress">Your progress</a></div>'+(exam?'':'<p class="meta">'+due.length+' due · '+weak.length+' need attention</p>')+'<div id="practice-items"></div>');
  const root=$('#practice-items');
  if(!items.length)root.textContent='No questions due. Use the cumulative assessment for more practice.';
  items.forEach(({id,question,index})=>mountQuestion(root,question,id,index));
}
function render(){
  cleanups.forEach(cleanup=>cleanup());cleanups=[];
  const [route,id]=location.hash.slice(1).split('/');
  if(mobile.matches)setSidebar(true);
  document.body.classList.remove('reading');
  renderSidebar(route==='lesson'?id:null);
  document.querySelectorAll('.top-nav a').forEach(item=>{
    if(item.hash==='#'+route)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');
  });
  switch(route){
    case '': home();break;
    case 'roadmap':home(true);break;
    case 'module':modulePage(id);break;
    case 'lesson':renderLesson(id);break;
    case 'graph':graph(id);break;
    case 'glossary':glossaryPage();break;
    case 'progress':progressPage();break;
    case 'practice':practice();break;
    case 'exam':practice(id||'all');break;
    case 'main':main.focus();return;
    default:unavailable();
  }
  const title=$('h1',main)?.textContent?.trim();
  document.title=title?title+' | COMPUTE':'COMPUTE';
  window.scrollTo(0,0);
}
document.querySelector('.skip').addEventListener('click',event=>{event.preventDefault();main.focus();});
setSidebar(sidebarClosed);theme();render();
window.addEventListener('hashchange',()=>{render();main.focus({preventScroll:true});});
