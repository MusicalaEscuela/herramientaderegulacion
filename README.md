# Musicala · Regulación

Herramienta interna, rápida y móvil para orientar el acompañamiento durante momentos de alta intensidad emocional. Ofrece orientación general y **no reemplaza protocolos de emergencia ni valoración clínica**.

## Propósito y privacidad

Incluye triage SOS, prevención, herramientas voluntarias, semáforo, registro objetivo y plan personal. No hay base de datos ni envío de formularios. Los registros no se guardan. Solo se conservan en este navegador las preferencias visuales, selector de persona y el plan si se presiona **Guardar en este dispositivo**. No escribas nombres, diagnósticos ni datos sensibles en dispositivos compartidos.

## Uso, offline y despliegue

No requiere npm ni build: son archivos HTML, CSS y JavaScript. Para probar Service Worker/PWA localmente, ejecuta `python -m http.server 8000` y abre `http://localhost:8000`. Tras la primera carga, pon el navegador sin conexión y recarga. GitHub Pages publica los archivos estáticos; verifica en **Settings → Pages** la rama elegida. Al actualizar recursos offline, incrementa `CACHE` en `service-worker.js`. La aplicación consulta primero la red y usa la caché sin conexión; al activar una actualización, recarga la pestaña una vez.

## Estructura

- `index.html`: interfaz accesible y formularios.
- `style.css`: responsive, modo tranquilo e impresión.
- `app.js`: SOS, herramientas, almacenamiento local, accesibilidad y PWA.
- `manifest.webmanifest`, `service-worker.js`, `icon.svg`: instalación y caché.

## Limitaciones

La instalación depende del navegador/HTTPS y la herramienta no sustituye protocolos institucionales de seguridad, urgencias ni personal autorizado. Versión 2.2.0.

## Espacio infantil

La entrada principal ofrece caritas, una flor con respiración opcional, exploración guiada de sentidos y un jardín táctil sin puntajes. Cada actividad permite salir y pedir compañía. La voz es opcional y depende de las voces disponibles en el navegador o dispositivo; puede no funcionar sin conexión. Un adulto debe permanecer disponible durante el uso. La guía y los registros para acompañantes se abren desde el selector superior. No se guardan emociones ni actividad infantil.

## Pausa acompañada y modo entrega

1. Antes de clase, instala la herramienta desde el navegador si está disponible y configura Fijar aplicaciones (Android) o Acceso guiado (iPhone). Comprueba la salida a otras apps, controles del navegador y notificaciones en cada equipo.
2. Toca **Para el profe**. Selecciona lenguaje breve o para lectores, voz o silencio, primera actividad y revisión en 1, 2 o 3 minutos desde los ajustes desplegables. Por defecto se propone una secuencia guiada y revisión en 2 minutos. La voz se puede probar antes de entregar.
3. Define y confirma un PIN de 4–8 cifras, distinto al del teléfono. Acuerda la pausa con el niño, comprueba seguridad y acompañamiento a la vista, inicia el modo entrega y activa el bloqueo del sistema antes de prestar el equipo.
4. Al finalizar la actividad, pedir compañía o cumplirse el tiempo, se solicita volver al profe. No se envían notificaciones al adulto ni se infiere que el niño está regulado. Para otra pausa, el adulto introduce el PIN y vuelve a revisar cómo está.

El modo entrega oculta la navegación de adulto. El PIN solo protege controles de esta pestaña; **no impide salir del navegador ni bloquea el teléfono**. Se conserva en `sessionStorage` un resumen criptográfico con sal aleatoria y el estado mínimo de la pausa, sin el PIN en texto, emociones ni respuestas infantiles. Recargar conserva la protección y pide retomar contacto con el profe. Si se olvida el PIN, recupera el teléfono con el bloqueo del sistema y cierra la pestaña/ventana; abrir otra sesión no conserva esta protección interna. Las preferencias de lenguaje, voz, actividad y duración se guardan localmente sin identidad. No se usa IA ni se envían estos datos a un servidor.

El tiempo es un recordatorio de revisión adulta, no una duración de tratamiento. La pantalla puede descansar en silencio; las actividades son voluntarias. La voz depende del navegador y de las voces instaladas y no está garantizada sin conexión. Si se oculta la app, la respiración se detiene; al volver se revisa si corresponde regresar al adulto.

### Fundamento y límites del contenido

El diseño prioriza conexión, seguridad, pocas instrucciones y regulación antes de pedir explicaciones, siguiendo orientaciones generales de [AAP](https://www.healthychildren.org/English/healthy-living/emotional-wellness/Building-Resilience/Pages/creating-calm-how-to-talk-with-your-child-when-theyre-stressed.aspx) y [CDC para niños pequeños](https://www.cdc.gov/parenting-toddlers/noticing-and-naming/emotion-coaching.html). Estas fuentes no validan clínicamente esta aplicación. Falta revisión de los guiones por psicología infantil y prueba supervisada en el contexto de Musicala. No sustituye la presencia disponible de un adulto ni se usa como único apoyo ante riesgo o necesidad de atención continua.

Bloqueo del dispositivo: [Android](https://support.google.com/android/answer/9455138?hl=es) · [iPhone](https://support.apple.com/es-co/guide/iphone/iph7fad0d10/ios). En iPhone, es necesario salir de Acceso guiado para usar servicios de emergencia.

### Verificación

Ejecuta `node --test tests/handoff.test.cjs` para comprobar el cierre por tiempo, protección tras recargar, cierre de actividades y resumen del PIN. La comprobación de bloqueo del sistema, notificaciones y voz debe hacerse en los Android/iPhone reales de los profes.

## Actividades visuales y entrada simple · 2.2

La entrada muestra **Guíame** y **Quiero elegir**. Guíame recorre tres momentos: manos suaves (se puede solo mirar o pasar), encontrar tres colores en el entorno y descansar. La actividad usa frases cortas y una sola indicación por fase, con lectura opcional. No comprueba movimientos mediante sensores ni evalúa si el niño está calmado. Las actividades libres añaden hombros suaves (la tortuga) y búsqueda de colores, además de flor, sentidos y jardín. Se puede pasar cualquier paso sin penalización. Los temporizadores se detienen al cambiar de actividad o esconder la pestaña.

### Fuentes y adaptaciones

- [Newcastle Hospitals · psicología infantil, relajación](https://www.newcastle-hospitals.nhs.uk/services/great-north-childrens-hospital/childrens-health-psychology/resources/relaxation-2/): alternancia de tensión y descanso de manos y hombros. Adaptación conservadora: movimiento suave y breve, sin empujar el cuello, sin exigir tensión máxima ni sincronizar con retención de aire. Detenerse ante molestia.
- [Sheffield Children's · estrategias de relajación](https://www.sheffieldchildrens.nhs.uk/download/846/autism-resources/14634/relaxation-strategies.pdf): referencias infantiles de manos y tortuga. La app no reproduce el guion de tensión fuerte del documento.
- [University Hospitals Dorset · Managing emotions and feelings, p. 29](https://www.uhd.nhs.uk/uploads/about/docs/our_publications/patient_information_leaflets/cdc/managing-emotions-and-feelings.pdf): observar objetos y colores del entorno como grounding. Adaptación: buscar un color a la vez, sin alejarse y con opción de pasar; no es una prueba de reconocimiento de colores.
- [UNICEF · actividades de bienestar para estudiantes](https://www.unicef.org/stories/teacher-student-activities-support-well-being): respiración y apoyos de bienestar en contexto educativo. La flor mantiene respiración suave, opcional, sin pausas de retención ni exigencia de un ritmo determinado.

La selección y las adaptaciones son decisiones de diseño, no ensayos clínicos sobre esta app. Las fuentes no avalan el producto. Se mantiene pendiente la revisión profesional y la prueba supervisada con las edades y necesidades de Musicala.
