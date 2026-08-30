# Musicala · Regulación V2

Herramienta interna, rápida y móvil para orientar el acompañamiento durante momentos de alta intensidad emocional. Ofrece orientación general y **no reemplaza protocolos de emergencia ni valoración clínica**.

## Propósito y privacidad

Incluye triage SOS, prevención, herramientas voluntarias, semáforo, registro objetivo y plan personal. No hay base de datos ni envío de formularios. Los registros no se guardan. Solo se conservan en este navegador las preferencias visuales, selector de persona y el plan si se presiona **Guardar en este dispositivo**. No escribas nombres, diagnósticos ni datos sensibles en dispositivos compartidos.

## Uso, offline y despliegue

No requiere npm ni build: son archivos HTML, CSS y JavaScript. Para probar Service Worker/PWA localmente, ejecuta `python -m http.server 8000` y abre `http://localhost:8000`. Tras la primera carga, pon el navegador sin conexión y recarga. GitHub Pages publica los archivos estáticos; verifica en **Settings → Pages** la rama elegida. Al actualizar recursos offline, incrementa `CACHE` en `service-worker.js`.

## Estructura

- `index.html`: interfaz accesible y formularios.
- `style.css`: responsive, modo tranquilo e impresión.
- `app.js`: SOS, herramientas, almacenamiento local, accesibilidad y PWA.
- `manifest.webmanifest`, `service-worker.js`, `icon.svg`: instalación y caché.

## Limitaciones

La instalación depende del navegador/HTTPS y la herramienta no sustituye protocolos institucionales de seguridad, urgencias ni personal autorizado. Versión 2.0.0.
