import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lessons,roadmap,glossary} from '../dist/content/index.mjs';
import {labs,parseExpression} from '../dist/labs.mjs';
import {emptyProgress,parseProgress,recordAttempt,score} from '../dist/learning.mjs';

const defaults=lab=>Object.fromEntries(Object.entries(lab.fields).map(([key,field])=>[key,field.value]));
const run=(id,values={},step=0)=>labs[id].run({...defaults(labs[id]),...values},step);
const row=(r,key)=>r.rows.find(([name])=>name===key)?.[1];

test('roadmap dependencies precede consumers and cover every live lesson',()=>{
  const prior=new Set(), chapters=new Set();
  for(const module of roadmap){
    assert(!prior.has(module.id));
    for(const required of module.requires)assert(prior.has(required),module.id+' → '+required);
    prior.add(module.id);
    assert(module.chapters.some(({id})=>lessons[id]),module.id);
    for(const {id} of module.chapters){assert(!chapters.has(id));chapters.add(id);}
  }
  assert.equal(roadmap.length,24);
  for(const lesson of Object.values(lessons)){
    assert(chapters.has(lesson.id));
    assert(labs[lesson.lab]);
    assert(lesson.mechanics.length>=3);
    assert(lesson.example&&lesson.objective&&lesson.misconception&&lesson.recap);
    for(const [,url] of lesson.sources)assert.equal(new URL(url).protocol,'https:');
  }
  for(const [,,id] of glossary)assert(lessons[id]);
});
test('coverage matches actual live content',()=>{
  const coverage=JSON.parse(readFileSync(new URL('../curriculum-coverage.json',import.meta.url)));
  assert.equal(coverage.lessonsPublished,Object.keys(lessons).length);
  assert.equal(coverage.labsImplemented,Object.keys(labs).length);
  assert.equal(coverage.lessonsPlanned,roadmap.flatMap(m=>m.chapters).length-coverage.lessonsPublished);
});
for(const [id,lab] of Object.entries(labs)){
  test('lab model and default controls: '+id,()=>{
    const state=run(id);
    assert(state.summary&&state.rows.length&&state.active<lab.stages.length);
    for(const field of Object.values(lab.fields)){
      if(field.type!=='number')continue;
      assert(field.value>=field.min&&field.value<=field.max);
      const tick=(field.value-field.min)/field.step;
      assert(Math.abs(tick-Math.round(tick))<1e-8);
    }
    for(let step=1;step<=state.total;step++)assert(run(id,{},step).summary);
  });
}
test('electrical and logic reference cases',()=>{
  assert.equal(run('charge',{q:3,t:2}).summary,'1.5 A');
  assert.equal(run('ohm').summary,'0.2 A total');
  assert.equal(run('ohm',{mode:'Parallel',a:20,b:20}).summary,'0.6 A total');
  assert.equal(run('cmos',{bit:'1'}).summary,'Output LOW');
  const gate='NAND(A,A) → NAND with NAND(B,B)';
  for (const a of ['0','1'])for(const b of ['0','1'])assert.equal(run('logic',{gate,a,b}).summary,'Y = '+(Number(a)|Number(b)));
  assert.equal(row(run('alu'), 'Signed overflow'), 'Yes');
  assert.equal(row(run('alu',{a:15}), 'Carry-out'),1);
  assert.equal(row(run('bits'),'Signed'),-1);
  assert.equal(row(run('float',{n:'0.5'}),'Exponent'),'01111110 (126)');
  assert.equal(run('flip',{device:'Two-bit counter'},4).summary,'Q = 00');
});
test('instruction, memory, scheduling and networking reference traces',()=>{
  assert.equal(row(run('cpu',{},9),'Memory cells 0–3'),'5 · 0 · 0 · 0');
  assert.equal(row(run('cache',{},4),'Hits'),'1 of 4');
  assert.equal(run('pipeline',{outcomes:'TT'},2).summary,'Correct prediction');
  assert.equal(row(run('schedule',{},8),'Timeline'),'A A B B C A A A');
  assert.equal(run('pages').summary,'Physical 0x7345');
  assert.equal(run('pages',{address:4096}).summary,'Page fault');
  assert.equal(run('route',{ttl:1},1).summary,'Discarded at router A');
  assert.equal(run('route',{},3).summary,'Delivered');
  assert.equal(run('index',{key:13},2).summary,'Key absent');
  assert.equal(row(run('race',{},4),'Counter'),1);
  assert.equal(row(run('race',{mode:'Atomic fetch-add'},2),'Counter'),2);
  assert.equal(run('bounds',{offset:17,length:0}).summary,'Slice rejected');
});
test('parser and language execution models',()=>{
  assert.equal(parseExpression('2+3*4').root.value,14);
  assert.equal(parseExpression('(2+3)*4').root.value,20);
  assert.equal(parseExpression('9-3-2').root.value,4);
  assert.throws(()=>parseExpression('(2+3'));
  assert.equal(row(run('binding',{mode:'Shallow copy',operation:'Change nested value to 7'}),'A'),'[[7]]');
  assert.equal(run('eventloop',{},4).summary,'Output: A · B · promise · timer');
  assert.equal(run('eventloop',{mode:'Inside timer callback'},4).summary,'Output: A · B · timer · promise');
});
test('math, graphics and AI numerical reference cases',()=>{
  assert.equal(run('vector').summary,'Dot product 3');
  assert.equal(run('raster').summary,'Covered');
  assert.equal(run('raster',{x:8,y:7}).summary,'Outside');
  assert.equal(run('warp').summary,'50% active per issued slot');
  assert.equal(run('entropy',{p:.5}).summary,'1 bits of entropy');
  assert.match(run('derivative').summary,/12\.01/);
  assert(Number(row(run('gradient',{},30),'Weight'))>1.99);
  assert(Number(run('backprop',{},25).summary.slice(5))<Number(run('backprop').summary.slice(5)));
  const attention=run('attention',{pos:0});
  assert.equal(attention.summary,'Output 2');
  assert.deepEqual(attention.weights,[1,0,0]);
  assert.equal(run('kv').summary,'256 MiB');
  assert(Number(run('quant',{width:'8'}).summary.slice(4))<Number(run('quant').summary.slice(4)));
  assert.equal(run('qubit',{},3).summary,'P(1) = 1');
});
test('assessment keys evaluate correctly, including alternate accepted formatting',()=>{
  for(const lesson of Object.values(lessons)){
    for(const question of lesson.questions){
      assert(question.prompt&&question.explanation&&question.hint);
      assert(score(question,question.answer));
      if(question.type==='choice'||question.type==='true')assert(!score(question,(question.answer+1)%question.options.length));
    }
  }
  assert(score(lessons['assembly-1'].questions[1],'store r0,2'));
  assert(!score(lessons['electricity-1'].questions[1],''));
});
test('progress import filters unknown IDs and preserves valid progress',()=>{
  const state={...emptyProgress(),complete:{'electricity-1':100,'missing':50},notes:{'electricity-1':'test'},bookmarks:['electricity-1','electricity-1','missing'],goal:100};
  const parsed=parseProgress(state,Object.keys(lessons));
  assert.deepEqual(parsed.complete,{'electricity-1':100});
  assert.deepEqual(parsed.bookmarks,['electricity-1']);
  assert.equal(parsed.goal,20);
  assert.throws(()=>parseProgress({version:99},[]));
});
test('review intervals grow on success and shorten after a missed answer',()=>{
  const first=recordAttempt(null,true,0);
  const second=recordAttempt(first,true,0);
  const wrong=recordAttempt(second,false,0);
  assert(second.due>first.due&&wrong.due<first.due);
  assert.equal(wrong.streak,0);
  assert.equal(wrong.correct,2);
  assert.equal(wrong.wrong,1);
});
