const childRoot = document.querySelector('#childApp');
let childTimer = null, childVoice = false, childStep = 0, childCount = 0;
let guidedPause = false, guidedIndex = 0, childLanguage = 'simple';
function childWords(simple, reader) { return childLanguage === 'reader' ? reader : simple; }
const childArt={cloud:'<svg viewBox="0 0 240 180" aria-hidden="true"><circle cx="120" cy="86" r="63" fill="#e9ddff"/><path d="M57 130C25 125 28 86 59 84C60 42 116 27 139 65C174 45 210 80 196 104C222 132 181 151 157 141H72Z" fill="white"/><path d="M91 103q7 9 14 0m30 0q7 9 14 0" fill="none" stroke="#665184" stroke-width="4" stroke-linecap="round"/><path d="M112 119q9 7 18 0" fill="none" stroke="#665184" stroke-width="3" stroke-linecap="round"/></svg>',flower:'<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M100 110v75m0-20q-45 0-42-29q35-4 42 29m0-12q40 0 39-28q-32 0-39 28" fill="#79aa92" stroke="#79aa92" stroke-width="6"/><g fill="#c9b4ed"><ellipse cx="100" cy="55" rx="24" ry="35"/><ellipse cx="100" cy="119" rx="24" ry="35"/><ellipse cx="68" cy="87" rx="35" ry="24"/><ellipse cx="132" cy="87" rx="35" ry="24"/></g><circle cx="100" cy="87" r="24" fill="#f8d987"/></svg>'};
const movementArt = {
  hands: `<svg viewBox="0 0 240 220" aria-hidden="true"><circle cx="120" cy="110" r="98" fill="#e8eedd"/><g class="moving-hand" fill="#e8b990" stroke="#986947" stroke-width="3" stroke-linejoin="round"><path d="M77 180v-52l-20-30q-9-17 5-21q8-3 16 10l12 16V50q0-17 13-17q13 0 13 17v42-63q0-18 13-18q13 0 13 18v63-53q0-17 13-17q13 0 13 17v57-34q0-16 12-16q12 0 12 16v66q0 34-30 53v19Z"/><path class="palm-line" d="M101 127q22-18 47 0" fill="none"/></g><circle cx="123" cy="116" r="26" fill="#f2d66b" class="lemon-dot"/></svg>`,
  shoulders: `<svg viewBox="0 0 240 220" aria-hidden="true"><circle cx="120" cy="110" r="98" fill="#dfeaec"/><g class="turtle-head"><ellipse cx="120" cy="72" rx="30" ry="37" fill="#9ab495"/><path d="M105 69q4 5 8 0m15 0q4 5 8 0" stroke="#49614b" stroke-width="3" fill="none"/><path d="M113 84q7 6 14 0" stroke="#49614b" stroke-width="3" fill="none"/></g><g class="turtle-shell"><ellipse cx="120" cy="139" rx="67" ry="49" fill="#789d7a"/><path d="M120 96l30 26-10 38h-40l-10-38Z" fill="#a6c398"/><ellipse cx="67" cy="172" rx="22" ry="13" fill="#9ab495"/><ellipse cx="173" cy="172" rx="22" ry="13" fill="#9ab495"/></g></svg>`
};
function childStop() {
  clearInterval(childTimer); childTimer = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
function childSpeak(text) {
  if (!childVoice || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text || [...childRoot.querySelectorAll('h1,.child-instruction')].map(e => e.textContent).join('. '));
  utterance.lang = 'es-CO'; utterance.rate = .85;
  utterance.onerror = event => {
    if (['canceled', 'interrupted'].includes(event.error) || childRoot.querySelector('.voice-status')) return;
    const note = document.createElement('p'); note.className = 'voice-status child-note'; note.setAttribute('role', 'status');
    note.textContent = 'Sin voz por ahora. Sigue los dibujos.'; childRoot.append(note);
  };
  speechSynthesis.speak(utterance);
}
function childScreen(html) {
  childStop();
  childRoot.innerHTML = `<div class="child-top"><span class="child-brand">Musicala</span><button data-child="voice" aria-pressed="${childVoice}" aria-label="${childVoice ? 'Apagar voz' : 'Escuchar guía'}">${childVoice ? '🔊 Voz' : '🔈 Escuchar'}</button></div><div class="child-screen">${html}</div><div class="child-bottom"><button data-child="home">⌂ Cambiar</button><button data-child="help">♡ Mi profe</button></div>`;
  const heading = childRoot.querySelector('h1');
  if (heading) { heading.tabIndex = -1; heading.focus({preventScroll:true}); }
  window.scrollTo(0, 0); childSpeak();
}
function childButton(action, label, primary = false) {
  return `<button type="button" data-child="${action}"${primary ? ' class="child-primary"' : ''}>${label}</button>`;
}
function childProgress() {
  return guidedPause ? `<p class="child-eyebrow">JUNTOS · ${guidedIndex + 1} DE 3</p>` : '';
}
function childHome() {
  guidedPause = false;
  childScreen(`<div class="child-mascot">${childArt.cloud}</div><h1>Una pausa contigo.</h1><p class="child-instruction">Vamos despacio. Tú eliges.</p><div class="child-stacked">${childButton('guided','▶ Guíame',true)}${childButton('catalog','Quiero elegir')}</div>`);
}
const CHILD_ACTIVITIES = [
  ['breath','❀','La flor'], ['hands','✋','Manos suaves'], ['shoulders','🐢','La tortuga'],
  ['colors','◉','Busca colores'], ['senses','✧','Mira y siente'], ['pebbles','◌','El jardín']
];
function childCatalog() {
  guidedPause = false;
  childScreen(`<h1>¿Qué probamos?</h1><p class="child-instruction">Puedes cambiar cuando quieras.</p><div class="child-choices">${CHILD_ACTIVITIES.map(([key,icon,label])=>`<button data-child="${key}"><span aria-hidden="true">${icon}</span><b>${label}</b></button>`).join('')}</div><div class="quiet-options">${childButton('rest','Solo descansar')}${childButton('feel','Así me siento')}</div>`);
}
function childGuided() { guidedPause = true; guidedIndex = 0; childGuidedStage(); }
function childGuidedStage() {
  if (guidedIndex === 0) return childMovement('hands');
  if (guidedIndex === 1) { childStep = 0; return childColors(); }
  childScreen(`${childProgress()}<h1>Descansa un momento.</h1><p class="child-instruction">No tienes que contar nada.</p><div class="child-mascot resting-cloud">${childArt.cloud}</div>${childButton('complete','Ya está mi pausa',true)}`);
}
function childComplete() {
  childStop();
  if (guidedPause && guidedIndex < 2) { guidedIndex++; return childGuidedStage(); }
  guidedPause = false; childFinish();
}
function childMovement(kind) {
  childScreen(`${childProgress()}<h1>${kind === 'hands' ? childWords('Vamos con las manos.','Relaja las manos.') : childWords('Como una tortuga.','Relaja los hombros.')}</h1><p class="child-instruction">Apoya el celular. Imita sin forzar.</p><div id="movementArt" class="movement-art">${movementArt[kind]}</div><p class="child-note">Si molesta, para. Puedes solo mirar.</p>${childButton('move-'+kind,'▶ Empezar',true)}`);
}
function startMovement(kind) {
  childStop();
  const phases = kind === 'hands'
    ? [['Cierra suave las manos.',true,3000],[childWords('Abre. Deja las manos flojitas.','Abre las manos y descansa.'),false,6000],['Cierra suave otra vez.',true,3000],['Abre. Descansa.',false,6000]]
    : [['Sube un poquito los hombros.',true,3000],['Bájalos. Déjalos descansar.',false,6000],['Sube un poquito otra vez.',true,3000],['Baja los hombros. Descansa.',false,6000]];
  let phase = 0, phaseStarted = Date.now();
  const art = childRoot.querySelector('#movementArt');
  const title = childRoot.querySelector('h1');
  const hint = childRoot.querySelector('.child-instruction');
  const button = childRoot.querySelector('[data-child^="move-"]');
  button.dataset.child = 'complete'; button.textContent = 'Prefiero seguir'; button.classList.remove('child-primary');
  const paint = () => { title.textContent = phases[phase][0]; hint.textContent = 'Suave. Sin dolor.'; art.classList.toggle('tense',phases[phase][1]); childSpeak(phases[phase][0]); };
  paint();
  childTimer = setInterval(() => {
    if (Date.now()-phaseStarted < phases[phase][2]) return;
    phase++; phaseStarted = Date.now();
    if (phase >= phases.length) {
      childStop(); title.textContent = 'Deja descansar tu cuerpo.'; hint.textContent = 'Puedes seguir o quedarte un momento.';
      button.textContent = guidedPause ? 'Seguimos →' : 'Terminar'; button.classList.add('child-primary'); childSpeak(); return;
    }
    paint();
  }, 200);
}
const CHILD_COLORS = [['azul','#6687bb'],['verde','#6f9b79'],['amarillo','#dfb94e']];
function childColors() {
  const [name,color] = CHILD_COLORS[childStep];
  childScreen(`${childProgress()}<h1>Busca algo ${name}.</h1><p class="child-instruction">Mira a tu alrededor, sin alejarte.</p><div class="color-target" style="--target:${color}" aria-hidden="true"><span>◉</span></div><p class="child-note">${childStep + 1} de 3 · No hay respuestas malas.</p>${childButton('nextColor','Lo vi →',true)}${childButton('nextColor','Pasar')}`);
}
function childBreath() {
  childScreen(`<h1>Mira cómo crece.</h1><p class="child-instruction" id="childBreathText">Si quieres, respira suave con la flor.</p><div class="flower-stage"><div id="childFlower">${childArt.flower}</div></div>${childButton('startBreath','▶ Vamos',true)}<p class="child-note">Puedes solo mirar.</p>`);
}
function childBreathe() {
  childStop(); let phase = 0, started = Date.now();
  const flower = childRoot.querySelector('#childFlower'), text = childRoot.querySelector('#childBreathText');
  const button = childRoot.querySelector('[data-child="startBreath"]'); button.dataset.child = 'complete'; button.textContent = 'Terminar';
  const paint = () => { flower.classList.toggle('grow',phase%2 === 0); text.textContent = phase%2 === 0 ? 'Toma aire suave, si quieres.' : 'Suelta el aire despacio.'; childSpeak(text.textContent); };
  paint(); childTimer = setInterval(()=>{
    if (Date.now()-started < 4000) return;
    phase++; started = Date.now();
    if (phase === 6) { childStop(); flower.classList.remove('grow'); text.textContent = 'Puedes descansar.'; childSpeak(text.textContent); return; }
    paint();
  },200);
}
const childSenses = [['👀','Mira una cosa.','Un objeto o un color.'],['🖐️','Toca algo cercano.','Puede ser tu ropa.'],['👂','Escucha un sonido.','Si molesta, puedes pasar.']];
function childSense() {
  const [icon,title,hint] = childSenses[childStep];
  childScreen(`<p class="child-eyebrow">${childStep+1} DE 3</p><div class="sense-art" aria-hidden="true">${icon}</div><h1>${title}</h1><p class="child-instruction">${hint}</p>${childButton('nextSense','Listo →',true)}${childButton('nextSense','Pasar')}`);
}
function childPebbles() {
  childCount = 0;
  childScreen(`<h1>Una piedra a la vez.</h1><p class="child-instruction">Toca sin afán.</p><div class="pebble-garden">${Array.from({length:8},(_,i)=>`<button class="pebble p${i%4}" data-child="pebble" aria-label="Piedra ${i+1}"><span></span></button>`).join('')}</div><p id="gardenNote" class="child-note" aria-live="polite">Sin prisa.</p>${childButton('complete','Terminar',true)}`);
}
function childFeel() {
  childScreen(`<h1>¿Cómo te sientes?</h1><p class="child-instruction">Puedes pasar.</p><div class="feelings">${[['😢','Triste'],['😠','Con rabia'],['😟','Con miedo'],['😵‍💫','Saturado'],['😴','Con cansancio'],['💭','No sé']].map(([icon,label])=>`<button data-child="feeling"><span>${icon}</span>${label}</button>`).join('')}</div>${childButton('catalog','Pasar')}`);
}
function childFinish() {
  childScreen(`<div class="child-mascot">${childArt.cloud}</div><h1>¿Qué necesitas?</h1><p class="child-instruction">Está bien si te sientes igual.</p><div class="child-stacked">${childButton('help','♡ Mi profe',true)}${childButton('home','Otra pausa')}</div>`);
}
function childHelp() {
  childScreen(`<div class="child-mascot">${childArt.cloud}</div><h1>Busca a tu profe.</h1><p class="child-instruction">Muéstrale esto o levanta la mano.</p><div class="company-message">¿Te quedas conmigo?</div><p class="child-note">No envía un aviso.</p>${childButton('home','Esperar con una pausa',true)}`);
}
function childRest() {
  guidedPause = false;
  childScreen(`<div class="child-mascot">${childArt.cloud}</div><h1>Podemos parar.</h1><p class="child-instruction">Deja el celular cerca de tu profe.</p>${childButton('home','Volver',true)}`);
}
childRoot.addEventListener('click', event => {
  const button = event.target.closest('[data-child]'); if (!button) return;
  event.preventDefault(); const action = button.dataset.child;
  if (action === 'voice') {
    childVoice = !childVoice; button.textContent = childVoice ? '🔊 Voz' : '🔈 Escuchar'; button.setAttribute('aria-pressed',childVoice);
    button.setAttribute('aria-label',childVoice ? 'Apagar voz' : 'Escuchar guía');
    if (childVoice) childSpeak(); else if ('speechSynthesis' in window) speechSynthesis.cancel();
  }
  if (action === 'home') childHome();
  if (action === 'catalog') childCatalog();
  if (action === 'guided') childGuided();
  if (action === 'hands' || action === 'shoulders') { guidedPause = false; childMovement(action); }
  if (action === 'move-hands') startMovement('hands');
  if (action === 'move-shoulders') startMovement('shoulders');
  if (action === 'colors') { guidedPause = false; childStep = 0; childColors(); }
  if (action === 'nextColor') { childStep++; childStep < 3 ? childColors() : childComplete(); }
  if (action === 'complete') childComplete();
  if (action === 'breath') { guidedPause = false; childBreath(); }
  if (action === 'startBreath') childBreathe();
  if (action === 'senses') { guidedPause = false; childStep = 0; childSense(); }
  if (action === 'nextSense') { childStep++; childStep < childSenses.length ? childSense() : childComplete(); }
  if (action === 'pebbles') { guidedPause = false; childPebbles(); }
  if (action === 'pebble' && !button.disabled) { button.disabled = true; button.classList.add('planted'); if (++childCount === 8) childRoot.querySelector('#gardenNote').textContent = 'Tu jardín está listo.'; }
  if (action === 'feel') childFeel();
  if (action === 'feeling') childScreen(`<div class="child-mascot">${childArt.cloud}</div><h1>Gracias por contarlo.</h1><p class="child-instruction">No tienes que explicarlo.</p>${childButton('guided','Guíame',true)}`);
  if (action === 'help') childHelp();
  if (action === 'rest') childRest();
});
function setAudience(child) {
  childStop(); guidedPause = false; document.body.classList.toggle('child-mode',child); childRoot.hidden = !child;
  document.querySelector('#childMode').setAttribute('aria-pressed',child); document.querySelector('#adultMode').setAttribute('aria-pressed',!child);
  if (child) childHome(); else window.scrollTo(0,0);
}
document.querySelector('#childMode').onclick = () => setAudience(true);
document.querySelector('#adultMode').onclick = () => setAudience(false);
document.addEventListener('visibilitychange',()=>{
  if (!document.hidden || !childTimer) return;
  childStop();
  childScreen(`<div class="child-mascot">${childArt.cloud}</div><h1>Hicimos una pausa.</h1><p class="child-instruction">Puedes seguir cuando quieras.</p>${childButton('home','Elegir',true)}`);
});
childHome();
