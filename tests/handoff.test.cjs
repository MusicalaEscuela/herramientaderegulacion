const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {webcrypto}=require('node:crypto');
const source=fs.readFileSync(require('node:path').join(__dirname,'../handoff.js'),'utf8');
function harness(saved=null){
  const session=new Map(saved?[['mr.handoff.session',JSON.stringify(saved)]]:[]);
  const intervals=new Map();let nextId=0;let now=1000;
  const storage={getItem:key=>session.get(key)||null,setItem:(key,value)=>session.set(key,value),removeItem:key=>session.delete(key)};
  const footer={innerHTML:''};
  const context={TextEncoder,crypto:webcrypto,Uint8Array,FormData,console,
    Date:{now:()=>now},sessionStorage:storage,localStorage:{getItem:()=>null},
    setInterval:fn=>{intervals.set(++nextId,fn);return nextId;},clearInterval:id=>intervals.delete(id),
    document:{documentElement:{classList:{remove(){}}},hidden:false,body:{classList:{add(){},remove(){}}},addEventListener(){},querySelector:()=>null,createElement:()=>({dataset:{}})},
    childRoot:{querySelector:selector=>selector==='.child-bottom'?footer:null,append(){}},
    childStop(){},childScreen:html=>context.lastHTML=html,childFinish:()=>context.freeFinish=true,
    childArt:{cloud:'cloud'},childVoice:false,setAudience(){},childBreath(){},childPebbles(){},childSense(){},childStep:0,
    childSpeak(){},childHome(){},childCatalog(){}};
  vm.createContext(context);vm.runInContext(source,context);
  return {context,session,intervals,footer,run:code=>vm.runInContext(code,context),advance:ms=>{now+=ms;for(const fn of [...intervals.values()])fn();}};
}
test('PIN digest is salted and does not retain the PIN',async()=>{
  const h=harness();const first=await h.context.pauseDigest('7391','a');const second=await h.context.pauseDigest('7391','b');
  assert.match(first,/^[a-f0-9]{64}$/);assert.notEqual(first,second);assert.notEqual(first,'7391');
});
test('deadline requests adult review and blocks repeating activities until review',()=>{
  const h=harness();h.run('handoff={deadline:2000}; startPauseReminder()');
  h.advance(999);assert.equal(h.context.lastHTML,undefined);
  h.advance(1);assert.match(h.context.lastHTML,/Es momento de ver al profe/);
  assert.equal(JSON.parse(h.session.get('mr.handoff.session')).awaitingReview,true);
  h.context.pauseChoices();assert.match(h.context.lastHTML,/Es momento de ver al profe/);
  assert.doesNotMatch(h.footer.innerHTML,/Elegir otra pausa/);
});
test('reloading an active session preserves the adult gate and requests review',()=>{
  const h=harness({digest:'a'.repeat(64),salt:'b'.repeat(32),deadline:9000,voice:'off'});
  assert.equal(h.context.pauseLocked(),true);assert.match(h.context.lastHTML,/Es momento de ver al profe/);
});
test('activity completion in handoff routes to adult, free play retains original finish',()=>{
  const h=harness();h.context.childFinish();assert.equal(h.context.freeFinish,true);
  h.run('handoff={deadline:2000}');h.context.childFinish();assert.match(h.context.lastHTML,/Es momento de ver al profe/);
});
test('no reminder timer is installed without an active handoff',()=>{
  const h=harness();h.context.startPauseReminder();assert.equal(h.intervals.size,0);
});

test('starting a pause stores only preferences and verifier, never plaintext PIN',async()=>{
  const h=harness();const values={pin:'4826',pinAgain:'4826',language:'simple',voice:'off',activity:'cloud',duration:'60'};
  h.context.FormData=function(form){this.get=key=>form.values[key];};
  h.context.startPauseActivity=activity=>h.context.startedActivity=activity;
  h.context.document.querySelector=()=>({textContent:''});
  const submit={disabled:false};
  const form={values,reportValidity:()=>true,querySelector:()=>submit,reset(){}};
  await h.context.startHandoff({preventDefault(){},currentTarget:form});
  const raw=h.session.get('mr.handoff.session');assert.ok(raw);assert.equal(Object.hasOwn(JSON.parse(raw),'pin'),false);assert.equal(Object.hasOwn(JSON.parse(raw),'pinAgain'),false);
  const stored=JSON.parse(raw);assert.equal(stored.activity,'cloud');assert.equal(stored.deadline,61000);
  assert.equal(stored.digest,await h.context.pauseDigest('4826',stored.salt));
  assert.equal(h.context.pauseLocked(),true);assert.equal(h.context.startedActivity,'cloud');
});
