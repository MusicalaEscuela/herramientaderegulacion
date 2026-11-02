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

La instalación depende del navegador/HTTPS y la herramienta no sustituye protocolos institucionales de seguridad, urgencias ni personal autorizado. Versión 2.0.1.

## Espacio infantil

La entrada principal ofrece caritas, una flor con respiración opcional, exploración guiada de sentidos y un jardín táctil sin puntajes. Cada actividad permite salir y pedir compañía. La voz es opcional y depende de las voces disponibles en el navegador o dispositivo; puede no funcionar sin conexión. Un adulto debe permanecer disponible durante el uso. La guía y los registros para acompañantes se abren desde el selector superior. No se guardan emociones ni actividad infantil.
