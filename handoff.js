/* Pausas acompañadas. El PIN limita la interfaz; el bloqueo del teléfono es del sistema. */
const HANDOFF_KEY = 'mr.handoff.session';
const PREFS_KEY = 'mr.handoff.preferences';
let handoff = null;
let handoffReminder = null;
let handoffReturnTarget = 'child';
let unlockFailures = 0;
let unlockAfter = 0;

function readPauseJSON(storage, key) {
  try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; }
}
function pauseLocked() { return !!handoff; }
function persistHandoff() { sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(handoff)); }
async function pauseDigest(pin, salt) {
  const bytes = new TextEncoder().encode(salt + ':' + pin);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}
function pauseButton(action, text, primary = false) {
  return `<button type="button" data-pause="${action}"${primary ? ' class="child-primary"' : ''}>${text}</button>`;
}
function pauseLayout(title, instruction, body) {
  childScreen(`<p class="child-eyebrow">PAUSA ACOMPAÑADA</p><h1>${title}</h1><p class="child-instruction">${instruction}</p>${body}`);
}
function preparePause() {
  if (pauseLocked()) return showPauseUnlock('prepare');
  setAudience(true);
  childStop();
  childVoice = false;
  const prefs = readPauseJSON(localStorage, PREFS_KEY) || {};
  if (prefs.version !== 2) { prefs.activity = 'guided'; prefs.duration = '120'; }
  childScreen(`<p class="child-eyebrow">PARA EL PROFE</p><h1>Prepara y entrega.</h1>
    <p class="child-instruction">«Estoy cerca. Hacemos una pausa y vuelvo contigo».</p>
    <form id="pauseSetup" class="pause-form compact-setup">
      <div class="setup-row"><label>Lenguaje<select name="language"><option value="simple">Con dibujos</option><option value="reader">Para lectores</option></select></label>
      <label>Guía<select name="voice"><option value="off">Sin voz</option><option value="on">Con voz</option></select></label></div>
      <div class="setup-row"><label>Tu PIN<input name="pin" aria-label="PIN de esta pausa" type="password" inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8" autocomplete="new-password" required></label>
      <label>Repítelo<input name="pinAgain" aria-label="Repite el PIN" type="password" inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8" autocomplete="new-password" required></label></div>
      <p class="pause-hint">4–8 números. Distinto al del celular.</p>
      <label class="pause-check"><input type="checkbox" name="ready" required><span>Sin riesgo inmediato, a mi vista. Protegí el celular y volveré a acompañarlo.</span></label>
      <p id="pauseSetupError" role="alert"></p><button class="child-primary" type="submit">▶ Empezar y entregar</button>
      <p class="pause-hint">El PIN protege esta app. Para impedir salir: fija la app (Android) o activa Acceso guiado (iPhone).</p>
      <details class="pause-device"><summary>Cambiar actividad o tiempo</summary>
        <label>Empezar con<select name="activity"><option value="guided">Guíame · 3 pasos</option><option value="hands">Manos suaves</option><option value="shoulders">La tortuga</option><option value="colors">Busca colores</option><option value="breath">La flor</option><option value="senses">Mira y siente</option><option value="pebbles">El jardín</option><option value="cloud">Solo mirar</option></select></label>
        <label>Volver a revisar en<select name="duration"><option value="120">2 minutos</option><option value="60">1 minuto</option><option value="180">3 minutos</option></select></label>
        <p class="pause-hint">Al terminar pide volver al profe. No envía alertas a otro celular.</p>
        ${pauseButton('testVoice','Probar voz')}
        <p class="pause-hint">La voz depende del dispositivo; puede necesitar conexión.</p>
      </details>
      <details class="pause-device"><summary>Proteger el teléfono: Android / iPhone</summary>
        <p><b>La app no puede activar el bloqueo del sistema.</b> Configúralo una vez y pruébalo antes de prestar el teléfono.</p>
        <p><b>Android:</b> activa Fijar aplicaciones en Ajustes → Seguridad (el nombre varía). Exige PIN, patrón o contraseña al salir. Abre esta herramienta instalada, entra en Recientes y fija su aplicación.</p>
        <p><b>iPhone:</b> Ajustes → Accesibilidad → Acceso guiado. Configura código o biometría. Abre esta herramienta instalada y activa Acceso guiado con el atajo configurado.</p>
        <p>Si la usas dentro de un navegador, fijarlo puede dejar accesibles otras pestañas o la barra de direcciones. Comprueba esas salidas y las notificaciones en tu equipo. Pantalla completa por sí sola no protege el teléfono.</p>
        <p>Para recuperar el teléfono usa la autenticación del sistema. Después, el PIN de esta pausa permite abrir los controles internos. En iPhone, sal de Acceso guiado para usar los servicios de emergencia.</p>
        <p><a href="https://support.google.com/android/answer/9455138?hl=es" target="_blank" rel="noopener noreferrer">Guía oficial Android</a> · <a href="https://support.apple.com/es-co/guide/iphone/iph7fad0d10/ios" target="_blank" rel="noopener noreferrer">Guía oficial iPhone</a></p>
      </details>
      <details class="pause-device"><summary>Cómo acompañar esta pausa</summary><p>Mantén al niño a la vista y vuelve a acompañarlo al terminar. Si hay riesgo o requiere atención continua, pide apoyo. Practiquen estas actividades también en momentos tranquilos.</p><p>Puede mirar, pasar o parar. No se exige respirar ni moverse. Si un movimiento molesta, se detiene.</p><p>Al volver, observa cómo está y ofrece compañía o regreso gradual. Terminar no confirma que esté regulado.</p>${pauseButton('adult','Guía de acompañantes')}</details>
      ${pauseButton('cancelSetup','Volver')}
    </form>`);
  const form = document.querySelector('#pauseSetup');
  for (const name of ['language', 'voice', 'activity', 'duration']) {
    if ([...form.elements[name].options].some(o => o.value === prefs[name])) form.elements[name].value = prefs[name];
  }
  form.addEventListener('submit', startHandoff);
}
async function startHandoff(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const error = document.querySelector('#pauseSetupError');
  const values = new FormData(form);
  const pin = values.get('pin');
  if (!form.reportValidity()) return;
  if (!/^[0-9]{4,8}$/.test(pin) || pin !== values.get('pinAgain')) {
    error.textContent = 'Revisa el PIN: deben coincidir (4–8 números).';
    return;
  }
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
    const preferences = { ...Object.fromEntries(['language', 'voice', 'activity', 'duration'].map(key => [key, values.get(key)])), version: 2 };
    const session = { ...preferences, salt, digest: await pauseDigest(pin, salt), deadline: Date.now() + Number(preferences.duration) * 1000 };
    // No se guarda el PIN, las emociones ni respuestas del niño.
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(session));
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(preferences)); } catch { /* preferencias opcionales */ }
    handoff = session;
    childVoice = preferences.voice === 'on';
    childLanguage = preferences.language;
    document.body.classList.add('handoff-active');
    form.reset();
    startPauseReminder();
    startPauseActivity(preferences.activity);
  } catch {
    error.textContent = 'No se pudo preparar el modo entrega en este navegador. No se activó la pausa. Prueba en una conexión segura con almacenamiento disponible.';
    submit.disabled = false;
  }
}
function startPauseReminder() {
  clearInterval(handoffReminder);
  if (!handoff || handoff.awaitingReview) return;
  handoffReminder = setInterval(() => {
    if (!handoff || Date.now() < handoff.deadline || document.hidden || document.querySelector('#pauseUnlock')) return;
    clearInterval(handoffReminder);
    showTeacherReturn();
  }, 1000);
}
function startPauseActivity(activity) {
  guidedPause = false;
  if (activity === 'guided') return childGuided();
  if (activity === 'hands' || activity === 'shoulders') return childMovement(activity);
  if (activity === 'colors') { childStep = 0; return childColors(); }
  if (activity === 'breath') return childBreath();
  if (activity === 'senses') { childStep = 0; return childSense(); }
  if (activity === 'pebbles') return childPebbles();
  pauseLayout('Podemos quedarnos aquí.', 'No tienes que contar nada. Mira la nube o descansa un momento.',
    `<div class="child-mascot resting-cloud">${childArt.cloud}</div><div class="child-stacked">${pauseButton('choices', 'Probar otra cosa', true)}${pauseButton('rest', 'Prefiero descansar')}</div>`);
}
function pauseChoices() {
  if (handoff?.awaitingReview || (handoff && Date.now() >= handoff.deadline)) return showTeacherReturn();
  childCatalog();
}
function pauseRest() {
  guidedPause = false;
  pauseLayout('Puedes parar.', 'Deja el celular cerca de tu profe.',
    `<div class="child-mascot">${childArt.cloud}</div>${pauseButton('return','♡ Mi profe',true)}`);
}
function showTeacherReturn() {
  clearInterval(handoffReminder);
  guidedPause = false;
  if (handoff) { handoff.awaitingReview = true; persistHandoff(); }
  pauseLayout('Es momento de ver al profe.', 'Muéstrale esto o levanta la mano.',
    `<div class="child-mascot">${childArt.cloud}</div><div class="company-message">¿Me acompañas?</div><p class="child-note">No envía un aviso. Está bien si te sientes igual.</p>${pauseButton('teacher','Ya está mi profe',true)}`);
}
function showPauseUnlock(target = 'child') {
  if (!handoff) return;
  handoffReturnTarget = target;
  childStop();
  const dialog = document.createElement('dialog');
  dialog.id = 'pauseUnlock';
  dialog.setAttribute('aria-labelledby', 'pauseUnlockTitle');
  dialog.innerHTML = `<form id="pauseUnlockForm" class="pause-form"><h2 id="pauseUnlockTitle">Para el profe</h2><p>Introduce el PIN de esta pausa. Esto abre los controles internos; el bloqueo del celular se desactiva desde el sistema.</p><label>PIN<input name="unlockPin" type="password" inputmode="numeric" maxlength="8" autocomplete="off" required></label><p id="pauseUnlockError" role="alert"></p><button class="child-primary" type="submit">Abrir controles</button>${pauseButton('cancelUnlock', 'Seguir en la pausa')}<details><summary>Olvidé el PIN</summary><p>Recupera primero el teléfono con el bloqueo del sistema. Cierra esta pestaña o ventana de la herramienta y vuelve a abrirla. La protección interna es solo para esta pestaña; no sustituye el bloqueo del teléfono.</p></details></form>`;
  document.body.append(dialog);
  dialog.addEventListener('close', () => { dialog.remove(); childSpeak(); startPauseReminder(); });
  dialog.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault();
    const error = dialog.querySelector('#pauseUnlockError');
    if (Date.now() < unlockAfter) { error.textContent = 'Espera unos segundos antes de volver a intentar.'; return; }
    const pin = dialog.querySelector('input').value;
    const button = dialog.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      if (await pauseDigest(pin, handoff.salt) !== handoff.digest) {
        unlockFailures++;
        if (unlockFailures >= 5) unlockAfter = Date.now() + 30000;
        error.textContent = 'El PIN no coincide.';
        dialog.querySelector('input').value = '';
        return;
      }
      sessionStorage.removeItem(HANDOFF_KEY);
      handoff = null;
      childVoice = false;
      clearInterval(handoffReminder);
      document.body.classList.remove('handoff-active');
      dialog.close();
      unlockFailures = 0;
      unlockAfter = 0;
      if (handoffReturnTarget === 'adult') setAudience(false);
      else if (handoffReturnTarget === 'prepare') preparePause();
      else showTeacherReview();
    } catch { error.textContent = 'No se pudo comprobar el PIN. Inténtalo otra vez.'; }
    finally { button.disabled = false; }
  });
  dialog.showModal();
}
function showTeacherReview() {
  childStop();
  pauseLayout('Vuelve a conectar.', 'Terminar una actividad no confirma que el niño esté regulado.',
    `<div class="pause-form"><p>Acércate con voz tranquila: «Estoy aquí. ¿Qué necesitas ahora?».</p><ul><li>Observa cómo está y si necesita más compañía.</li><li>Ofrece descanso o un regreso gradual, sin exigir explicaciones.</li><li>Si sigue igual o peor, pide apoyo. Si aparece riesgo, usa el protocolo de seguridad.</li></ul><div class="child-stacked">${pauseButton('prepare', 'Preparar otra pausa', true)}${pauseButton('adult', 'Abrir guía de acompañantes')}</div></div>`);
}

// Intercepta los accesos del adulto y la navegación infantil antes de sus manejadores.
document.addEventListener('click', event => {
  const button = event.target.closest('button,a');
  if (!button) return;
  const action = button.dataset.pause;
  if (action) {
    event.preventDefault(); event.stopImmediatePropagation();
    if (action === 'prepare') preparePause();
    if (action === 'adult') setAudience(false);
    if (action === 'cancelSetup') childHome();
    if (action === 'choices') pauseChoices();
    if (action === 'breath') childBreath();
    if (action === 'senses') { childStep = 0; childSense(); }
    if (action === 'rest') pauseRest();
    if (action === 'return') showTeacherReturn();
    if (action === 'teacher') showPauseUnlock();
    if (action === 'cancelUnlock') document.querySelector('#pauseUnlock')?.close();
    if (action === 'testVoice') {
      if (!('speechSynthesis' in window)) { document.querySelector('#pauseSetupError').textContent = 'Este navegador no dispone de voz. Usa la guía en silencio.'; return; }
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Podemos hacer una pausa. Tú eliges.');
      utterance.lang = 'es-CO'; utterance.rate = .85;
      utterance.onerror = () => { const error = document.querySelector('#pauseSetupError'); if (error) error.textContent = 'No se pudo reproducir la voz. Prueba en silencio.'; };
      speechSynthesis.speak(utterance);
    }
    return;
  }
  if (button.id === 'preparePause') { event.preventDefault(); event.stopImmediatePropagation(); preparePause(); return; }
  if (!handoff) return;
  if (button.id === 'adultMode' || button.id === 'childMode') {
    event.preventDefault(); event.stopImmediatePropagation(); showPauseUnlock(button.id === 'adultMode' ? 'adult' : 'child'); return;
  }
  const actionChild = button.dataset.child;
  if (actionChild && actionChild !== 'voice' && (handoff.awaitingReview || Date.now() >= handoff.deadline)) {
    event.preventDefault(); event.stopImmediatePropagation();
    if (actionChild === 'rest') pauseRest(); else showTeacherReturn();
    return;
  }
  if (['home', 'catalog', 'finish', 'help', 'rest', 'feeling', 'feel'].includes(actionChild)) {
    event.preventDefault(); event.stopImmediatePropagation();
    if (actionChild === 'help') showTeacherReturn();
    else if (actionChild === 'rest') pauseRest();
    else if (actionChild === 'finish') showTeacherReturn();
    else pauseChoices();
  }
}, true);

// Aplica el modo entrega a todas las pantallas, incluidas las que terminan por temporizador.
const originalChildScreen = childScreen;
childScreen = function (html) {
  originalChildScreen(html);
  if (!handoff) return;
  const brand = childRoot.querySelector('.child-brand');
  if (brand) brand.removeAttribute('href');
  const footer = childRoot.querySelector('.child-bottom');
  footer.innerHTML = `${handoff.awaitingReview ? pauseButton('rest', 'Descansar') : pauseButton('choices', '⌂ Cambiar')}${pauseButton('return', '♡ Mi profe')}`;
  const teacher = document.createElement('button');
  teacher.type = 'button'; teacher.dataset.pause = 'teacher'; teacher.textContent = 'Para el profe';
  teacher.className = 'teacher-access';
  childRoot.append(teacher);
};
const originalChildFinish = childFinish;
childFinish = function () { if (handoff) showTeacherReturn(); else originalChildFinish(); };

const restoredHandoff = readPauseJSON(sessionStorage, HANDOFF_KEY);
if (restoredHandoff && /^[a-f0-9]{64}$/.test(restoredHandoff.digest) && /^[a-f0-9]{32}$/.test(restoredHandoff.salt) && Number.isFinite(restoredHandoff.deadline)) {
  handoff = restoredHandoff;
  childVoice = handoff.voice === 'on';
  childLanguage = handoff.language;
  document.body.classList.add('handoff-active');
  setAudience(true);
  // Tras recargar se solicita retomar contacto, sin repetir una actividad automáticamente.
  showTeacherReturn();
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && handoff && Date.now() >= handoff.deadline && !document.querySelector('#pauseUnlock')) showTeacherReturn();
});

// Libera la pantalla solo después de restaurar la protección interna.
document.documentElement.classList.remove('pause-restoring');
