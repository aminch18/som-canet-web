# Pipelines de SOM CANET

## Checks

Se ejecuta al subir cambios a ramas distintas de `main`, al abrir/actualizar pull requests hacia `main` y manualmente desde Actions. Usa el contenido local, sin secretos de Sanity.

Instala las versiones de `package-lock.json`, comprueba Astro/TypeScript/Studio, ejecuta las pruebas, compila la web y valida enlaces, recursos y metadatos. Guarda un artefacto `site-review-*` durante siete días para descargar la compilación. No publica una vista previa de cada PR.

## Publish to GitHub Pages

Se ejecuta en cada push a `main`, manualmente o mediante el evento `sanity-published`. Primero pasa exactamente las comprobaciones comunes y crea el artefacto de Pages. Un segundo trabajo, dependiente del primero, publica el artefacto con los permisos de despliegue.

La URL y la ruta base se obtienen de GitHub Pages. El prototipo usa `CONTENT_SOURCE=local` y `PUBLIC_INDEXABLE=false` de forma predeterminada; no necesita claves para publicarse. Las ejecuciones en ramas diferentes de `main` no despliegan.

Si falla la comprobación, compilación o validación, no se ejecuta el despliegue y la versión publicada anteriormente permanece disponible. Para volver a publicar una revisión anterior, revierte el cambio en Git y súbelo a `main`, o ejecuta el workflow sobre la revisión que se haya restaurado en esa rama.

## Build Sanity Studio

Es manual y está preparado para cuando exista el proyecto real. Requiere la variable de repositorio `SANITY_PROJECT_ID`; opcionalmente `SANITY_DATASET`. Compila el editor y guarda `sanity-studio-*` como artefacto. No crea proyectos de Sanity ni publica el editor en una cuenta externa.

## Configuración

GitHub → Settings → Pages → Source: GitHub Actions. El repositorio debe usar `main`. El entorno de despliegue es `github-pages`.

Después de conectar Sanity, utiliza las variables y el webhook de `SANITY_SETUP.md`. El token de escritura usado para importar no se necesita en estas pipelines. Solo un dataset privado requiere un secret de lectura para compilar.

Para hacer obligatorias las comprobaciones antes de integrar cambios, se puede crear posteriormente una regla de protección de `main` que exija el trabajo `Verify and build` y el uso de pull requests. Esta regla no se impone automáticamente: el propietario conserva su flujo de trabajo.

## Enlaces del proyecto

- Código: https://github.com/aminch18/som-canet-web
- Prototipo: https://aminch18.github.io/som-canet-web/
- Ejecuciones: https://github.com/aminch18/som-canet-web/actions
