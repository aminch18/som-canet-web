# SOM CANET · Astro + Sanity

Prototipo multipágina preparado para evolucionar a la web definitiva. Astro genera las páginas con su contenido completo en HTML. Sanity Studio gestiona textos, noticias, personas, imágenes, vídeos y documentos. El diseño público no necesita React; el editor de Sanity sí lo utiliza.

## Estado real

La web compila con una copia local de 78 documentos. El proyecto de prueba de Sanity se creó, recibió la migración inicial y contó con un [Studio alojado](https://aminch18somcanetprev.sanity.studio/). La edición visual se probó en local. Los cambios más recientes del editor están en la copia de trabajo y deben revisarse y versionarse antes de desplegarlos.

[GitHub Pages](https://aminch18.github.io/som-canet-web/) es la referencia del prototipo con la copia local. La conexión de la web pública a Sanity, el webhook de Cloudflare Pages y la vista previa alojada siguen pendientes. Consulta el [plan de salida y entrega](SANITY_SETUP.md#salida-y-entrega).

## Arranque

Requiere Node 22.12 o superior y npm.

```sh
npm ci
npm run dev
```

Abre http://127.0.0.1:4321/. El servidor anterior en el puerto 4173 pertenecía al prototipo HTML inicial.

```sh
npm run check
npm test
npm run build
npm run validate:build
npm run preview
```

`dist/` es la web publicable. Los recursos públicos se encuentran en `public/`. No hay que subir `node_modules/` ni `.env` al repositorio.

## Estructura

```text
src/
  layouts/Layout.astro     Navegación, pie, metadatos y datos estructurados
  components/              Tarjetas y lector de documentos
  pages/                   Portada, secciones y rutas generadas desde contenido
  lib/                     Proveedor local/Sanity, rutas y texto enriquecido
  styles/global.css        Diseño
  scripts/site.js          Interacciones del navegador
studio/
  sanity.config.ts         Editor Sanity y configuración
  schemaTypes/             Modelos y campos editoriales en catalán
data/content.json          Copia portable del contenido migrado
public/assets/             Imágenes y páginas renderizadas de los PDF
public/documents/          PDF originales
scripts/import-sanity.mjs  Importación inicial, sin sobrescribir documentos existentes
content/                   Inventario histórico de procedencia
```

La copia del prototipo estático anterior está guardada fuera de esta carpeta, en `../som-canet-prototipo-estatico.zip`. Las capturas originales de Wix permanecen en `../migration-source/`. Ninguna de las dos es necesaria para publicar ni para ejecutar Astro. Las herramientas de `scripts/legacy/` son históricas y no forman parte del arranque actual.

## Contenido conservado

78 registros: 37 entradas, 20 páginas, 10 personas, 6 publicaciones, 4 vídeos y una configuración general. Se mantienen las imágenes originales recuperadas y los seis PDF, cuyas 57 páginas se pueden recorrer en el lector local. El programa de 2019 contiene 43 páginas.

Las rutas HTML antiguas del prototipo tienen páginas de compatibilidad que conducen a las nuevas direcciones. En GitHub Pages usan redirección HTML y canonical, no respuestas HTTP 301. Esto no redirige el dominio Wix: esa web no está bajo nuestro control.

Los contenidos antiguos conservan el contexto histórico. No se inventan cargos vigentes, noticias o resultados. Siguen sin recuperarse la galería antigua incrustada de historia y el vídeo asociado al título «El Bon Govern». La página original «Executiva» estaba vacía y se representa mediante «Qui és qui».

## Edición y publicación

Hay dos modos explícitos:

- `CONTENT_SOURCE=local`: usa `data/content.json`, con el mismo modelo que Sanity. Sirve para revisar la web antes de conectar una cuenta.
- `CONTENT_SOURCE=sanity`: lee los documentos publicados de Sanity al generar la web. Un fallo de conexión detiene la compilación y mantiene intacto el despliegue anterior; no vuelve silenciosamente a la copia local.

Los borradores no se publican. Una noticia o página nueva obtiene una ruta sin editar plantillas. Las noticias actuales aparecen automáticamente en portada; el material anterior sigue marcado como hemeroteca. Las rutas de las páginas migradas se mantienen fijas para conservar la navegación. Los títulos, textos, galerías y campos SEO sí se editan.

Después de pulsar Publicar en Sanity, hay que reconstruir la web. El workflow admite el evento `sanity-published`; al conectar el webhook documentado en `SANITY_SETUP.md`, esa reconstrucción será automática. Sin ese webhook se puede ejecutar el workflow manualmente. En desarrollo, después de publicar cambios en Sanity, reinicia el servidor para cargar una nueva instantánea.

## SEO

- HTML prerenderizado y URLs legibles.
- Título, descripción, canonical, Open Graph y Twitter Cards.
- Datos estructurados de organización, navegación y artículos con sus fechas originales.
- Sitemap y `robots.txt`.
- Campos SEO editables desde Sanity y control de indexación por documento.
- Las imágenes secundarias se cargan de forma diferida y las interacciones usan un único script pequeño.

El prototipo arranca con **noindex**. Para la web definitiva, configura `SITE_URL` con el dominio HTTPS real y `PUBLIC_INDEXABLE=true`. `BASE_PATH=/` en un dominio propio; para GitHub Pages, el workflow obtiene automáticamente la ruta del repositorio. Esta configuración técnica no garantiza posiciones en Google: también importan la calidad y vigencia del contenido, los enlaces y la accesibilidad.

## Conectar Sanity

Consulta `SANITY_SETUP.md`. Los ejemplos de variables están en `.env.example` y `studio/.env.example`. No pegues tokens ni contraseñas en el chat ni los guardes en el código.

El comando de importación es una simulación salvo que se añada explícitamente `--apply`. Usa `--check-target` para revisar el destino sin escribir. La importación conserva los IDs y los documentos publicados existentes, y se detiene ante conflictos con borradores o versiones pendientes. Si se sustituye un PDF, las páginas renderizadas y el texto extraído anterior dejan de mostrarse; el PDF nuevo sigue accesible.

## GitHub Pages y otro alojamiento

Sube esta carpeta como raíz del repositorio, con `package-lock.json` y `.github/workflows/pages.yml`. En Settings → Pages, elige GitHub Actions. El workflow instala dependencias, genera y valida `dist/` y lo publica.

De inicio no hacen falta secretos: usa el contenido local. Después de conectar Sanity, añade las variables indicadas en `SANITY_SETUP.md`.

Para otro alojamiento compatible con archivos estáticos, publica `dist/` y configura su proceso de reconstrucción. Sanity puede continuar como servicio de contenidos aunque cambie el alojamiento de la web; los contenidos de Sanity no se trasladan automáticamente a ese servidor.

El formulario prepara un correo mediante `mailto:` y ofrece copiar el mensaje. No es un servicio de envío directo. Confirmar la vigencia de los contactos antes de publicar la versión pública.

## Pipelines de GitHub

Los controles de ramas y pull requests, el despliegue de Pages y la compilación manual de Studio están descritos en `PIPELINES.md`. Las pipelines de la web comparten instalación reproducible, comprobación de tipos, pruebas y validación de la web generada. Pages publica únicamente desde `main`, después de superar los controles.
