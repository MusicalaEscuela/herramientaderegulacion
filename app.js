const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* ---------- Toast ---------- */
const toast = $("#toast");
let toastTimeout = null;
function showToast(text = "Copiado"){
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 1600);
}

/* ---------- Copiar (delegado: sirve para frases fijas y del wizard) ---------- */
async function copyText(txt){
  try{
    await navigator.clipboard.writeText(txt);
    showToast("📋 Texto copiado");
    if(navigator.vibrate) navigator.vibrate(15);
  }catch(e){
    showToast("No se pudo copiar");
  }
}
document.addEventListener("click", (e) => {
  const el = e.target.closest(".copy");
  if(el && el.dataset.copy) copyText(el.dataset.copy);
});

/* ---------- Respiración guiada (reutilizable) ---------- */
const BREATH_PHASES = [
  { cls: "is-inhale", label: "Inhala", text: "Huele una flor 🌸", dur: 4 },
  { cls: "is-hold",   label: "Sostén", text: "Quédate suave ✨",  dur: 2 },
  { cls: "is-exhale", label: "Exhala", text: "Sopla una vela 🕯️", dur: 6 }
];
const BREATH_CYCLE = BREATH_PHASES.reduce((a, p) => a + p.dur, 0);

function createBreathing(stage, text){
  stage.innerHTML = `
    <div class="breath-halo halo-1"></div>
    <div class="breath-halo halo-2"></div>
    <div class="breath-progress"></div>
    <div class="breath-circle">
      <span class="b-label">Inhala</span>
      <span class="b-count"></span>
    </div>`;
  const label = stage.querySelector(".b-label");
  const count = stage.querySelector(".b-count");
  const progress = stage.querySelector(".breath-progress");
  let timer = null;

  function setPhase(cls){
    stage.classList.remove("is-inhale", "is-hold", "is-exhale");
    if(cls) stage.classList.add(cls);
  }

  function stop(message = "Huele una flor"){
    clearInterval(timer);
    timer = null;
    stage.classList.remove("running");
    setPhase(null);
    label.textContent = "Inhala";
    count.textContent = "";
    progress.style.setProperty("--p", "0");
    text.textContent = message;
  }

  function start(seconds = 60){
    stop();
    stage.classList.add("running");
    const t0 = performance.now();
    let lastPhase = -1;

    function tick(){
      const elapsed = (performance.now() - t0) / 1000;
      if(elapsed >= seconds){
        stop("Muy bien. Observa si el cuerpo bajó un poquito. 💜");
        showToast("Respiración terminada");
        if(navigator.vibrate) navigator.vibrate([30, 60, 30]);
        return;
      }
      progress.style.setProperty("--p", String((elapsed / seconds) * 100));

      const tc = elapsed % BREATH_CYCLE;
      let acc = 0, idx = 0, remain = 0;
      for(let i = 0; i < BREATH_PHASES.length; i++){
        if(tc < acc + BREATH_PHASES[i].dur){
          idx = i;
          remain = Math.ceil(acc + BREATH_PHASES[i].dur - tc);
          break;
        }
        acc += BREATH_PHASES[i].dur;
      }
      count.textContent = remain;
      if(idx !== lastPhase){
        lastPhase = idx;
        const p = BREATH_PHASES[idx];
        setPhase(p.cls);
        label.textContent = p.label;
        text.textContent = p.text;
        if(navigator.vibrate) navigator.vibrate(8);
      }
    }

    tick();
    timer = setInterval(tick, 200);
  }

  return { start, stop: () => stop() };
}

const mainBreathing = createBreathing($("#breathStage"), $("#breathText"));
$("#startBreathing").addEventListener("click", () => mainBreathing.start(60));
$("#stopBreathing").addEventListener("click", () => mainBreathing.stop());

/* ---------- Guía de emergencia (wizard) ---------- */
const STEPS = [
  {
    icon: "🔇",
    title: "Baja el estímulo",
    body: "Lleva al niño o niña a un lugar más tranquilo, con una sola persona adulta. Baja volumen, luces fuertes, público y preguntas.",
    phrase: "Te creo. El ruido se sintió demasiado fuerte. Estás segura/o. Vamos a un lugar más tranquilo conmigo."
  },
  {
    icon: "💜",
    title: "Valida sin discutir",
    body: "No digas “no pasa nada”: para su cuerpo sí está pasando. Usa voz baja, pocas palabras y presencia tranquila.",
    phrase: "Estoy contigo. Tu cuerpo se asustó, pero ahora vamos a ayudarlo a calmarse. No tienes que explicarme todavía."
  },
  {
    icon: "🤲",
    title: "Da opciones pequeñas",
    body: "Devuelve control sin abrumar. Dos opciones máximo.",
    phrase: "¿Quieres sentarte aquí o allá? ¿Quieres agua o prefieres respirar primero? ¿Quieres que me siente cerca o un poquito más lejos?"
  },
  {
    icon: "🌬️",
    title: "Regula el cuerpo",
    body: "Respiren juntos: huele una flor, sopla una vela. La meta no es que obedezca, es que su sistema nervioso baje.",
    phrase: "Huele una flor suavemente... ahora sopla una vela despacito. Yo lo hago contigo.",
    breathing: true
  },
  {
    icon: "🌈",
    title: "Regreso gradual",
    body: "No vuelvan de golpe al grupo. Primero cerca del salón, luego dentro con una tarea tranquila, y acuerden una señal para pedir pausa.",
    phrase: "Cuando estés lista/o, volvemos poquito a poquito. Puedes usar esta señal si necesitas salir otra vez."
  }
];

const wizard = $("#wizard");
const wizardBody = $("#wizardBody");
const wizardProgress = $("#wizardProgress");
const wizardPrev = $("#wizardPrev");
const wizardNext = $("#wizardNext");
let wizardStep = 0;           // 0..4 pasos, 5 = pantalla final
let wizardBreathing = null;

function renderProgress(){
  wizardProgress.innerHTML = STEPS.map((_, i) => {
    const cls = i < wizardStep ? "done" : i === wizardStep ? "current" : "";
    return `<span class="p-dot ${cls}"></span>`;
  }).join("");
}

function renderWizard(){
  if(wizardBreathing){ wizardBreathing.stop(); wizardBreathing = null; }

  if(wizardStep >= STEPS.length){
    wizardBody.innerHTML = `
      <div class="w-step w-done">
        <span class="w-icon">🌟</span>
        <span class="w-badge">Guía completada</span>
        <h2>Muy bien. Respira tú también.</h2>
        <p class="w-body">Acompañaste con calma. Revisa el <b>semáforo</b>: si la situación fue amarilla o roja, avisa a coordinación y familia.</p>
        <div class="btn-row">
          <button id="wRestart" class="btn-soft">↺ Empezar de nuevo</button>
        </div>
      </div>`;
    $("#wRestart").addEventListener("click", () => { wizardStep = 0; renderWizard(); });
    wizardPrev.disabled = false;
    wizardNext.textContent = "Cerrar ✓";
  }else{
    const s = STEPS[wizardStep];
    wizardBody.innerHTML = `
      <div class="w-step">
        <span class="w-badge">Paso ${wizardStep + 1} de ${STEPS.length}</span>
        <span class="w-icon">${s.icon}</span>
        <h2>${s.title}</h2>
        <p class="w-body">${s.body}</p>
        <div class="w-phrase copy" data-copy="${s.phrase.replaceAll('"', "&quot;")}">
          <p class="w-say">“${s.phrase}”</p>
          <span class="tap-hint">📋 Tocar para copiar</span>
        </div>
        ${s.breathing ? `
        <div class="w-breathing">
          <div id="wBreathStage" class="breath-stage small"></div>
          <p id="wBreathText" class="breath-text">Huele una flor</p>
          <div class="btn-row">
            <button id="wStartBreathing" class="btn-primary">▶ Respirar 1 minuto</button>
          </div>
        </div>` : ""}
      </div>`;

    if(s.breathing){
      wizardBreathing = createBreathing($("#wBreathStage"), $("#wBreathText"));
      $("#wStartBreathing").addEventListener("click", () => wizardBreathing.start(60));
    }
    wizardPrev.disabled = wizardStep === 0;
    wizardNext.textContent = wizardStep === STEPS.length - 1 ? "Terminar ✓" : "Siguiente ›";
  }
  renderProgress();
  wizardBody.scrollTop = 0;
}

function openWizard(){
  wizardStep = 0;
  wizard.hidden = false;
  document.body.style.overflow = "hidden";
  renderWizard();
  if(navigator.vibrate) navigator.vibrate(20);
}

function closeWizard(){
  if(wizardBreathing){ wizardBreathing.stop(); wizardBreathing = null; }
  wizard.hidden = true;
  document.body.style.overflow = "";
}

wizardNext.addEventListener("click", () => {
  if(wizardStep >= STEPS.length){ closeWizard(); return; }
  wizardStep++;
  renderWizard();
  if(navigator.vibrate) navigator.vibrate(10);
});
wizardPrev.addEventListener("click", () => {
  wizardStep = Math.max(0, wizardStep - 1);
  renderWizard();
});
$("#wizardClose").addEventListener("click", closeWizard);
document.addEventListener("keydown", (e) => {
  if(e.key === "Escape" && !wizard.hidden) closeWizard();
});

$("#sosHero").addEventListener("click", openWizard);
$("#sosFab").addEventListener("click", openWizard);

/* ---------- Botón flotante: aparece al dejar de ver el botón principal ---------- */
const fab = $("#sosFab");
const hero = $("#sosHero");
if("IntersectionObserver" in window){
  new IntersectionObserver(([entry]) => {
    fab.classList.toggle("show", !entry.isIntersecting);
  }, { threshold: 0 }).observe(hero);
}else{
  fab.classList.add("show");
}
