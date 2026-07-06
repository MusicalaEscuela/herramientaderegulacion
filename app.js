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

/* ---------- Copiar (delegado) ---------- */
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

/* ---------- Versión niños / adultos ---------- */
function setMode(mode){
  document.body.dataset.mode = mode;
  $$(".mode-btn").forEach(b => b.classList.toggle("is-active", b.dataset.mode === mode));
  $$("[data-mode-text]").forEach(el => el.hidden = el.dataset.modeText !== mode);
  renderEmotions();
  hideEmoResult();
}
$$(".mode-btn").forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode)));

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

/* ---------- Selector de emociones ---------- */
const EMOTIONS = [
  {
    id: "triste", emoji: "😢", color: "#5b8def",
    ninos: "Triste", adultos: "Tristeza",
    tipN: "Está bien llorar. Una emoción no dura para siempre. ¿Quieres un abrazo o estar tranquilo un ratito?",
    tipA: "Permítete sentirlo sin juzgarte. Nombrar la tristeza en voz alta ya baja su intensidad.",
    actions: ["frase", "respirar"]
  },
  {
    id: "rabia", emoji: "😡", color: "#ef5d7a",
    ninos: "Con rabia", adultos: "Rabia / enojo",
    tipN: "Tu rabia quiere salir. Vamos a sacarla sin lastimar: aprieta los puños fuerte y suéltalos, o empuja la pared.",
    tipA: "La rabia pide movimiento. Descarga con trabajo físico breve antes de hablar o decidir.",
    actions: ["cuerpo", "respirar"]
  },
  {
    id: "miedo", emoji: "😨", color: "#7c3ff2",
    ninos: "Con miedo", adultos: "Miedo",
    tipN: "Estás a salvo, yo estoy contigo. Vamos a mirar juntos qué hay a tu alrededor.",
    tipA: "Ancla la atención en el presente: lo que temes casi nunca está ocurriendo ahora mismo.",
    actions: ["grounding", "respirar"]
  },
  {
    id: "ansiedad", emoji: "😰", color: "#2ec4b6",
    ninos: "Nervioso", adultos: "Ansiedad",
    tipN: "Tu corazón va rápido. Vamos a soplar despacio como si apagáramos velas, y baja solito.",
    tipA: "Alarga la exhalación más que la inhalación: es la vía más rápida para calmar el cuerpo.",
    actions: ["respirar", "grounding"]
  },
  {
    id: "saturado", emoji: "🤯", color: "#b7791f",
    ninos: "Saturado", adultos: "Sobrecargado",
    tipN: "Hay demasiado a la vez. Vamos a un lugar más tranquilo y hacemos una sola cosa.",
    tipA: "Reduce entradas: menos ruido, luz y pantallas. Una tarea a la vez.",
    actions: ["respirar", "cuerpo"]
  },
  {
    id: "rebelde", emoji: "😤", color: "#e3a008",
    ninos: "Quiero decidir yo", adultos: "Necesito autonomía",
    tipN: "Está bien querer decidir. Aquí puedes elegir muchas cosas. ¿Cuál eliges tú primero?",
    tipA: "La necesidad de control es legítima. Busca dónde SÍ puedes elegir y decide ahí.",
    actions: ["situ:oposicion", "respirar"]
  },
  {
    id: "cansado", emoji: "😴", color: "#6f6182",
    ninos: "Cansado", adultos: "Agotado",
    tipN: "Tu cuerpo pide descanso. Vamos a bajar el ritmo un ratito.",
    tipA: "El cansancio dispara la irritabilidad. Baja exigencias y date una pausa real.",
    actions: ["respirar"]
  },
  {
    id: "confuso", emoji: "🥴", color: "#9d6bff",
    ninos: "No sé qué siento", adultos: "Confuso/a",
    tipN: "No pasa nada si no sabes. Vamos a calmar el cuerpo primero y ya vemos.",
    tipA: "No necesitas nombrarlo aún. Regula el cuerpo y la claridad llega después.",
    actions: ["respirar", "grounding"]
  }
];

const ACTION_LABELS = {
  respirar:  { label: "🌬️ Respirar", go: () => scrollToStart("#respirar", () => mainBreathing.start(60)) },
  grounding: { label: "🖐️ Jugar 5·4·3·2·1", go: () => scrollToStart("#grounding", () => groundGame.start()) },
  cuerpo:    { label: "🧸 Mover el cuerpo", go: () => scrollTo2("#cuerpo") },
  frase:     { label: "💬 Ver frases", go: () => scrollTo2("#frases") }
};

function scrollTo2(sel){ $(sel)?.scrollIntoView({ behavior: "smooth", block: "start" }); }
function scrollToStart(sel, fn){ scrollTo2(sel); setTimeout(fn, 450); }

const emoGrid = $("#emoGrid");
const emoResult = $("#emoResult");

function renderEmotions(){
  const mode = document.body.dataset.mode;
  emoGrid.innerHTML = EMOTIONS.map(e => `
    <button class="emo-card" role="listitem" data-emo="${e.id}" style="--emo:${e.color}">
      <span class="emo-face">${e.emoji}</span>
      <span class="emo-name">${mode === "adultos" ? e.adultos : e.ninos}</span>
    </button>`).join("");
}

function hideEmoResult(){ emoResult.hidden = true; emoResult.innerHTML = ""; }

function showEmoResult(id){
  const mode = document.body.dataset.mode;
  const e = EMOTIONS.find(x => x.id === id);
  if(!e) return;
  const tip = mode === "adultos" ? e.tipA : e.tipN;
  const buttons = e.actions.map(a => {
    if(a.startsWith("situ:")){
      const key = a.split(":")[1];
      return `<button class="btn-primary emo-go" data-flow="${key}">📋 Ver guía paso a paso</button>`;
    }
    const info = ACTION_LABELS[a];
    return `<button class="btn-soft emo-go" data-act="${a}">${info.label}</button>`;
  }).join("");

  emoResult.innerHTML = `
    <div class="emo-result-inner" style="--emo:${e.color}">
      <span class="emo-result-face">${e.emoji}</span>
      <div>
        <h3>${mode === "adultos" ? e.adultos : e.ninos}</h3>
        <p>${tip}</p>
        <div class="btn-row emo-actions">${buttons}</div>
      </div>
    </div>`;
  emoResult.hidden = false;
  emoResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

emoGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".emo-card");
  if(!card) return;
  $$(".emo-card").forEach(c => c.classList.toggle("is-picked", c === card));
  showEmoResult(card.dataset.emo);
  if(navigator.vibrate) navigator.vibrate(12);
});

emoResult.addEventListener("click", (e) => {
  const btn = e.target.closest(".emo-go");
  if(!btn) return;
  if(btn.dataset.flow){ openWizard(btn.dataset.flow); return; }
  ACTION_LABELS[btn.dataset.act]?.go();
});

/* ---------- 5·4·3·2·1 grande e interactivo ---------- */
const GROUND_STEPS = [
  { n: 5, verb: "cosas que puedas VER",     icon: "👀", hint: "Busca 5 cosas a tu alrededor y dilas en voz alta." },
  { n: 4, verb: "cosas que puedas TOCAR",   icon: "✋", hint: "Toca 4 cosas y siente si son suaves, duras, frías…" },
  { n: 3, verb: "sonidos que puedas OÍR",   icon: "👂", hint: "Escucha 3 sonidos, aunque sean muy suaves." },
  { n: 2, verb: "olores o cosas que OLER",  icon: "👃", hint: "Encuentra 2 olores o respira hondo por la nariz." },
  { n: 1, verb: "cosa buena de TI",          icon: "💜", hint: "Di 1 frase segura: “Estoy aquí y estoy a salvo”." }
];

function createGroundGame(){
  const big = $("#groundBig");
  const verb = $("#groundVerb");
  const icon = $("#groundIcon");
  const hint = $("#groundHint");
  const dots = $("#groundDots");
  const startBtn = $("#groundStart");
  const nextBtn = $("#groundNext");
  const resetBtn = $("#groundReset");
  const card = $(".ground-game");
  let i = -1;

  function renderDots(){
    dots.innerHTML = GROUND_STEPS.map((s, idx) =>
      `<span class="g-dot ${idx < i ? "done" : idx === i ? "current" : ""}">${s.n}</span>`).join("");
  }

  function paint(){
    const s = GROUND_STEPS[i];
    big.textContent = s.n;
    verb.textContent = s.verb;
    icon.textContent = s.icon;
    hint.textContent = s.hint;
    big.classList.remove("pop"); void big.offsetWidth; big.classList.add("pop");
    renderDots();
    if(navigator.vibrate) navigator.vibrate(10);
  }

  function start(){
    i = 0;
    card.classList.add("playing");
    startBtn.hidden = true;
    nextBtn.hidden = false;
    resetBtn.hidden = false;
    nextBtn.textContent = "Listo, siguiente ›";
    scrollTo2("#grounding");
    paint();
  }

  function next(){
    if(i < GROUND_STEPS.length - 1){
      i++;
      paint();
      if(i === GROUND_STEPS.length - 1) nextBtn.textContent = "Terminar ✓";
    }else{
      finish();
    }
  }

  function finish(){
    card.classList.remove("playing");
    card.classList.add("done");
    big.textContent = "🌟";
    verb.textContent = "¡Lo lograste!";
    icon.textContent = "";
    hint.textContent = "Muy bien. Observa si tu cuerpo se siente un poquito más tranquilo.";
    nextBtn.hidden = true;
    renderDots();
    showToast("¡Completaste 5·4·3·2·1! 🌟");
    if(navigator.vibrate) navigator.vibrate([30, 60, 30]);
  }

  function reset(){
    i = -1;
    card.classList.remove("playing", "done");
    big.textContent = "5";
    verb.textContent = "cosas que puedas VER";
    icon.textContent = "👀";
    hint.textContent = "Busca 5 cosas a tu alrededor y dilas en voz alta.";
    startBtn.hidden = false;
    nextBtn.hidden = true;
    resetBtn.hidden = true;
    dots.innerHTML = "";
  }

  startBtn.addEventListener("click", start);
  nextBtn.addEventListener("click", next);
  resetBtn.addEventListener("click", reset);

  return { start };
}
const groundGame = createGroundGame();

/* ---------- Guía paso a paso (wizard con varios flujos) ---------- */
const FLOWS = {
  crisis: {
    title: "Crisis emocional",
    steps: [
      { icon: "🔇", title: "Baja el estímulo", body: "Lleva al niño o niña a un lugar más tranquilo, con una sola persona adulta. Baja volumen, luces fuertes, público y preguntas.", phrase: "Te creo. Eso se sintió demasiado fuerte. Estás segura/o. Vamos a un lugar más tranquilo conmigo." },
      { icon: "💜", title: "Valida sin discutir", body: "No digas “no pasa nada”: para su cuerpo sí está pasando. Usa voz baja, pocas palabras y presencia tranquila.", phrase: "Estoy contigo. Tu cuerpo se asustó, pero ahora vamos a ayudarlo a calmarse. No tienes que explicarme todavía." },
      { icon: "🤲", title: "Da opciones pequeñas", body: "Devuelve control sin abrumar. Dos opciones máximo.", phrase: "¿Quieres sentarte aquí o allá? ¿Quieres agua o prefieres respirar primero?" },
      { icon: "🌬️", title: "Regula el cuerpo", body: "Respiren juntos: huele una flor, sopla una vela. La meta no es que obedezca, es que su sistema nervioso baje.", phrase: "Huele una flor suavemente... ahora sopla una vela despacito. Yo lo hago contigo.", breathing: true },
      { icon: "🌈", title: "Regreso gradual", body: "No vuelvan de golpe al grupo. Primero cerca del salón, luego dentro con una tarea tranquila, y acuerden una señal para pedir pausa.", phrase: "Cuando estés lista/o, volvemos poquito a poquito. Puedes usar esta señal si necesitas salir otra vez." }
    ]
  },
  oposicion: {
    title: "No quiere seguir las normas",
    steps: [
      { icon: "🧘", title: "Primero, tu propia calma", body: "Cuando un niño busca hacer solo lo que quiere y se altera, lo más importante es NO entrar en lucha de poder. Respira antes de responder. Tu calma es el ancla.", phrase: "(Para ti) No es contra mí. Su cuerpo necesita ayuda para regularse y sentir que decide algo." },
      { icon: "💜", title: "Conecta antes de corregir", body: "Reconoce el deseo antes que la norma. Sentirse comprendido baja la resistencia mucho más que insistir en la regla.", phrase: "Veo que quieres hacerlo a tu manera. Eso tiene sentido, a mí también me gusta decidir. Te escucho." },
      { icon: "🤲", title: "Ofrece opciones reales", body: "Devuelve autonomía dentro del límite. Elegir entre opciones que tú ofreces le da control sin romper la actividad.", phrase: "Puedes elegir: empezamos por esto o por aquello. ¿Cuál eliges tú? Tú decides el orden." },
      { icon: "🚧", title: "Límite claro, corto y amable", body: "Pocas normas, siempre las mismas, dichas con calma y en positivo (qué SÍ hacer). Sin sermones ni amenazas.", phrase: "Aquí puedes elegir muchas cosas. Esta la cuidamos entre todos para estar seguros. Te ayudo a lograrlo." },
      { icon: "🌬️", title: "Si se altera, regula el cuerpo", body: "Si sube la intensidad, prioriza calmar el cuerpo antes que exigir obediencia. Baja estímulo, ofrece movimiento o respiración. La conducta baja cuando el cuerpo baja.", phrase: "Tu cuerpo está muy activado. Vamos a ayudarlo a bajar y después seguimos. Estoy contigo.", breathing: true },
      { icon: "🔁", title: "Anticipa y avisa los cambios", body: "Muchos choques se evitan anticipando transiciones: avisa antes de cambiar de actividad, usa rutinas visibles y da tiempo. La previsibilidad reduce la oposición.", phrase: "En dos canciones más guardamos y pasamos a lo siguiente. Te aviso otra vez cuando falte poquito." },
      { icon: "📝", title: "Observa y registra, sin etiquetar", body: "Anota qué pasó, cuándo y qué lo detonó. Comparte con coordinación y familia lo que OBSERVAS (conductas y patrones), nunca un diagnóstico. No nos corresponde nombrar condiciones.", phrase: "(Para el registro) Describir hechos y detonantes observados. Sugerir seguimiento con la familia. Evitar etiquetas o diagnósticos." }
    ]
  },
  adultos: {
    title: "Regularte tú (adultos)",
    steps: [
      { icon: "⏸️", title: "Haz una pausa", body: "Antes de reaccionar, date 10 segundos. No tienes que resolver nada en este instante.", phrase: "(Para ti) Puedo tomarme un momento antes de responder. La pausa también es una respuesta." },
      { icon: "🏷️", title: "Nombra lo que sientes", body: "Ponle nombre a la emoción: “estoy sintiendo rabia / ansiedad / cansancio”. Nombrar reduce la intensidad.", phrase: "Ahora mismo estoy sintiendo… y está bien. Es información, no una orden." },
      { icon: "🌬️", title: "Respira para bajar", body: "Exhala más largo que inhalas durante un minuto. Tu cuerpo lee eso como señal de seguridad.", phrase: "Inhalo 4, exhalo 6. Con cada exhalación suelto un poco de tensión.", breathing: true },
      { icon: "🖐️", title: "Ancla en el presente", body: "Usa 5·4·3·2·1 o siente los pies en el suelo. Vuelves del pensamiento acelerado al aquí y ahora.", phrase: "Estoy aquí, es este momento, estoy a salvo. Solo necesito atender lo de ahora." },
      { icon: "🎯", title: "Elige el siguiente paso pequeño", body: "No toda la montaña, solo el próximo paso realista. Y pide apoyo si lo necesitas.", phrase: "¿Cuál es la cosa más pequeña y útil que puedo hacer ahora? Empiezo por ahí." }
    ]
  }
};

const SITUATIONS = [
  { key: "crisis",    emoji: "😭", title: "Llanto, miedo o ansiedad", desc: "Crisis emocional, sobrecarga o bloqueo." },
  { key: "oposicion", emoji: "🙅", title: "No quiere seguir las normas", desc: "Quiere hacer lo que quiera y se altera." },
  { key: "adultos",   emoji: "🧑", title: "Regularte tú (adulto)", desc: "Para la profe o acompañante que necesita calma." }
];

const situGrid = $("#situGrid");
situGrid.innerHTML = SITUATIONS.map(s => `
  <button class="situ-card" data-flow="${s.key}">
    <span class="situ-emoji">${s.emoji}</span>
    <span class="situ-txt"><strong>${s.title}</strong><small>${s.desc}</small></span>
    <span class="sos-arrow">›</span>
  </button>`).join("");
situGrid.addEventListener("click", (e) => {
  const c = e.target.closest(".situ-card");
  if(c) openWizard(c.dataset.flow);
});

const wizard = $("#wizard");
const wizardBody = $("#wizardBody");
const wizardProgress = $("#wizardProgress");
const wizardPrev = $("#wizardPrev");
const wizardNext = $("#wizardNext");
let wizardStep = 0;
let wizardBreathing = null;
let currentSteps = FLOWS.crisis.steps;

function renderProgress(){
  wizardProgress.innerHTML = currentSteps.map((_, i) => {
    const cls = i < wizardStep ? "done" : i === wizardStep ? "current" : "";
    return `<span class="p-dot ${cls}"></span>`;
  }).join("");
}

function renderWizard(){
  if(wizardBreathing){ wizardBreathing.stop(); wizardBreathing = null; }

  if(wizardStep >= currentSteps.length){
    wizardBody.innerHTML = `
      <div class="w-step w-done">
        <span class="w-icon">🌟</span>
        <span class="w-badge">Guía completada</span>
        <h2>Muy bien. Respira tú también.</h2>
        <p class="w-body">Acompañaste con calma. Revisa el <b>semáforo</b>: si la situación fue amarilla o roja, avisa a coordinación y familia. Registra lo que observaste, sin etiquetas.</p>
        <div class="btn-row">
          <button id="wRestart" class="btn-soft">↺ Empezar de nuevo</button>
        </div>
      </div>`;
    $("#wRestart").addEventListener("click", () => { wizardStep = 0; renderWizard(); });
    wizardPrev.disabled = false;
    wizardNext.textContent = "Cerrar ✓";
  }else{
    const s = currentSteps[wizardStep];
    wizardBody.innerHTML = `
      <div class="w-step">
        <span class="w-badge">Paso ${wizardStep + 1} de ${currentSteps.length}</span>
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
    wizardNext.textContent = wizardStep === currentSteps.length - 1 ? "Terminar ✓" : "Siguiente ›";
  }
  renderProgress();
  wizardBody.scrollTop = 0;
}

function openWizard(flowKey = "crisis"){
  currentSteps = (FLOWS[flowKey] || FLOWS.crisis).steps;
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
  if(wizardStep >= currentSteps.length){ closeWizard(); return; }
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

$("#sosHero").addEventListener("click", () => openWizard("crisis"));
$("#sosFab").addEventListener("click", () => openWizard("crisis"));

/* ---------- Botón flotante ---------- */
const fab = $("#sosFab");
const hero = $("#sosHero");
if("IntersectionObserver" in window){
  new IntersectionObserver(([entry]) => {
    fab.classList.toggle("show", !entry.isIntersecting);
  }, { threshold: 0 }).observe(hero);
}else{
  fab.classList.add("show");
}

/* ---------- Init ---------- */
renderEmotions();
const yearEl = $("#year");
if(yearEl) yearEl.textContent = new Date().getFullYear();
