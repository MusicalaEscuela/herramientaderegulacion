const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function harness(){
  const intervals=new Map();let timerId=0,now=0;const listeners={};
  const nodes=new Map();const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{textContent:'',dataset:{},tabIndex:0,focus(){},setAttribute(){},removeAttribute(){},classList:{add(){},remove(){},toggle(){}}});return nodes.get(selector);};
  const root={innerHTML:'',querySelector:node,addEventListener:(name,fn)=>listeners[name]=fn};
  const context={console,Date:{now:()=>now},window:{scrollTo(){}},
    document:{querySelector:s=>s==='#childApp'?root:node(s),addEventListener(){},body:{classList:{toggle(){}}}},
    setInterval:fn=>{intervals.set(++timerId,fn);return timerId;},clearInterval:id=>intervals.delete(id)};
  vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../child.js'),'utf8'),context);
  return {context,root,intervals,node,run:code=>vm.runInContext(code,context),advance:ms=>{now+=ms;for(const fn of [...intervals.values()])fn();},click:action=>listeners.click({preventDefault(){},target:{closest:()=>({dataset:{child:action}})}})};
}
test('guided pause has three stages and a route through all colours',()=>{
  const h=harness();h.context.childGuided();assert.match(h.root.innerHTML,/1 DE 3/);
  h.context.childComplete();assert.match(h.root.innerHTML,/Busca algo azul/);
  h.click('nextColor');assert.match(h.root.innerHTML,/Busca algo verde/);
  h.click('nextColor');assert.match(h.root.innerHTML,/Busca algo amarillo/);
  h.click('nextColor');assert.match(h.root.innerHTML,/Descansa un momento/);
  h.context.childComplete();assert.match(h.root.innerHTML,/Qué necesitas/);
});
test('movement releases after a brief phase and stops after its last rest',()=>{
  const h=harness();h.context.childMovement('hands');h.context.startMovement('hands');
  assert.equal(h.node('h1').textContent,'Cierra suave las manos.');h.advance(3000);
  assert.equal(h.node('h1').textContent,'Abre. Deja las manos flojitas.');
  h.advance(6000);h.advance(3000);h.advance(6000);
  assert.equal(h.intervals.size,0);assert.equal(h.node('h1').textContent,'Deja descansar tu cuerpo.');
});
test('changing activity stops a movement timer and cancels guided progression',()=>{
  const h=harness();h.context.childGuided();h.context.startMovement('hands');
  assert.equal(h.intervals.size,1);h.context.childCatalog();assert.equal(h.intervals.size,0);
  assert.equal(h.run('guidedPause'),false);
});
test('child and handoff scripts work together and finish behind adult gate',()=>{
  const h=harness();const session=new Map();h.context.sessionStorage={getItem:k=>session.get(k)||null,setItem:(k,v)=>session.set(k,v)};
  h.context.localStorage={getItem:()=>null};h.context.document.documentElement={classList:{remove(){}}};
  h.context.document.body.classList.add=()=>{};h.context.document.createElement=()=>({dataset:{}});h.root.append=()=>{};
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../handoff.js'),'utf8'),h.context);
  h.run('handoff={deadline:999999}; childGuided()');h.context.childComplete();
  h.click('nextColor');h.click('nextColor');h.click('nextColor');h.context.childComplete();
  assert.match(h.root.innerHTML,/Es momento de ver al profe/);assert.equal(h.run('handoff.awaitingReview'),true);
});
