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
  childScreen(`<p class="child-eyebrow">PARA EL PROFE · ANTES DE ENTREGAR EL CELULAR</p>
    <h1>Prepara una pausa.</h1>
    <p class="child-instruction">Conecta primero y acuerda un lugar cercano donde puedas mantener al niño a la vista.</p>
    <form id="pauseSetup" class="pause-form">
      <label>Lenguaje<select name="language"><option value="simple">Breve, con dibujos</option><option value="reader">Para lectores</option></select></label>
      <label>Guía<select name="voice"><option value="off">En silencio</option><option value="on">Con voz</option></select></label>
      <p class="pause-hint">La voz depende del dispositivo y puede requerir conexión. Puedes probarla antes de entregar.</p>
      ${pauseButton('testVoice', 'Probar voz')}
      <label>Empezar con<select name="activity"><option value="cloud">Mirar una nube</option><option value="breath">La flor que respira</option><option value="senses">Explorar alrededor</option><option value="pebbles">Jardín de piedras</option></select></label>
      <label>Volver a revisar al niño en<select name="duration"><option value="60">1 minuto</option><option value="120">2 minutos</option><option value="180">3 minutos</option></select></label>
      <p class="pause-hint">Al cumplirse el tiempo, la app pide mostrar el celular al profe. No envía alertas a otro dispositivo y no determina si ya está regulado.</p>
      <label>PIN de esta pausa<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8" autocomplete="new-password" required aria-describedby="pinHint"></label>
      <p id="pinHint" class="pause-hint">De 4 a 8 números. Usa uno distinto al del teléfono. Se pide para acceder a los controles del profe; no bloquea otras aplicaciones.</p>
      <label>Repite el PIN<input name="pinAgain" type="password" inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8" autocomplete="new-password" required></label>
      <details class="pause-device"><summary>Proteger el teléfono: Android / iPhone</summary>
        <p><b>La app no puede activar el bloqueo del sistema.</b> Configúralo una vez y pruébalo antes de prestar el teléfono.</p>
        <p><b>Android:</b> activa Fijar aplicaciones en Ajustes → Seguridad (el nombre varía). Exige PIN, patrón o contraseña al salir. Abre esta herramienta instalada, entra en Recientes y fija su aplicación.</p>
        <p><b>iPhone:</b> Ajustes → Accesibilidad → Acceso guiado. Configura código o biometría. Abre esta herramienta instalada y activa Acceso guiado con el atajo configurado.</p>
        <p>Si la usas dentro de un navegador, fijarlo puede dejar accesibles otras pestañas o la barra de direcciones. Comprueba esas salidas y las notificaciones en tu equipo. Pantalla completa por sí sola no protege el teléfono.</p>
        <p>Para recuperar el teléfono usa la autenticación del sistema. Después, el PIN de esta pausa permite abrir los controles internos. En iPhone, sal de Acceso guiado para usar los servicios de emergencia.</p>
        <p><a href="https://support.google.com/android/answer/9455138?hl=es" target="_blank" rel="noopener noreferrer">Guía oficial Android</a> · <a href="https://support.apple.com/es-co/guide/iphone/iph7fad0d10/ios" target="_blank" rel="noopener noreferrer">Guía oficial iPhone</a></p>
      </details>
      <div class="pause-script"><b>Puedes decir:</b><p>«Veo que esto se siente difícil. Puedes quedarte aquí cerca y probar una pausa. Voy a atender al grupo y vuelvo a mirarte cuando termine. Si me necesitas antes, levanta la mano».</p></div>
      <label class="pause-check"><input type="checkbox" name="ready" required><span>Puede usar la pausa sin riesgo inmediato, permanecerá a la vista y volveré a acompañarlo. Revisé cómo impedir que salga a otras apps en este celular.</span></label>
      <p class="pause-hint">Si hay riesgo físico o necesita atención continua, pide apoyo y usa la guía de seguridad para acompañantes. No entregues el celular como único apoyo.</p>
      <p id="pauseSetupError" role="alert"></p>
      <button class="child-primary" type="submit">Iniciar modo entrega</button>
      ${pauseButton('cancelSetup', 'Volver sin iniciar')}
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
    error.textContent = 'Los PIN deben coincidir y tener entre 4 y 8 números.';
    return;
  }
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
    const preferences = Object.fromEntries(['language', 'voice', 'activity', 'duration'].map(key => [key, values.get(key)]));
    const session = { ...preferences, salt, digest: await pauseDigest(pin, salt), deadline: Date.now() + Number(preferences.duration) * 1000 };
    // No se guarda el PIN, las emociones ni respuestas del niño.
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(session));
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(preferences)); } catch { /* preferencias opcionales */ }
    handoff = session;
    childVoice = preferences.voice === 'on';
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
  if (activity === 'breath') return childBreath();
  if (activity === 'senses') { childStep = 0; return childSense(); }
  if (activity === 'pebbles') return childPebbles();
  pauseLayout('Podemos quedarnos aquí.', 'No tienes que contar nada. Mira la nube o descansa un momento.',
    `<div class="child-mascot resting-cloud">${childArt.cloud}</div><div class="child-stacked">${pauseButton('choices', 'Probar otra cosa', true)}${pauseButton('rest', 'Prefiero descansar')}</div>`);
}
function pauseChoices() {
  if (handoff?.awaitingReview || (handoff && Date.now() >= handoff.deadline)) return showTeacherReturn();
  pauseLayout('Tú eliges.', handoff?.language === 'simple' ? '¿Miramos o exploramos?' : 'Puedes probar una actividad o descansar. No hay que hacerlo perfecto.',
    `<div class="child-stacked">${pauseButton('breath', '❀ Mirar la flor', true)}${pauseButton('senses', '✧ Explorar alrededor')}</div>`);
}
function pauseRest() {
  pauseLayout('Puedes descansar.', 'Deja el celular a un lado, cerca de tu acompañante. Si lo necesitas, levanta la mano.',
    `<div class="child-mascot">${childArt.cloud}</div>${pauseButton('return', 'Mostrar al profe', true)}`);
}
function showTeacherReturn() {
  clearInterval(handoffReminder);
  if (handoff) { handoff.awaitingReview = true; persistHandoff(); }
  pauseLayout('Es momento de ver al profe.', 'Muéstrale esta pantalla o levanta la mano. Está bien si todavía te sientes igual.',
    `<div class="company-message">Profe, ¿me acompañas un momento?</div><p class="child-note">Este botón no envía un aviso. Acércate solo si puedes hacerlo con seguridad.</p>${pauseButton('teacher', 'Ya estoy con mi profe', true)}`);
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
  if (['home', 'finish', 'help', 'rest', 'feeling', 'feel'].includes(actionChild)) {
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
  if (handoff?.language === 'simple') {
    html = html.replace('Si te resulta cómodo, toma aire suave cuando la flor crece y suéltalo cuando se hace pequeña.', 'Mira la flor. Si quieres, respira suave con ella.')
      .replace('Mira a tu alrededor. Puede ser un color o un objeto.', 'Mira un color o un objeto.')
      .replace('Si quieres, siente tu ropa o una superficie cercana.', 'Puedes tocar tu ropa.')
      .replace('Toca las piedras para llevarlas al jardín. No hay tiempo límite.', 'Toca una piedra. Sin afán.');
  }
  originalChildScreen(html);
  if (!handoff) return;
  const brand = childRoot.querySelector('.child-brand');
  if (brand) brand.removeAttribute('href');
  const footer = childRoot.querySelector('.child-bottom');
  footer.innerHTML = `${handoff.awaitingReview ? pauseButton('rest', 'Descansar de la pantalla') : pauseButton('choices', 'Elegir otra pausa')}${pauseButton('return', '♡ Quiero compañía')}`;
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
