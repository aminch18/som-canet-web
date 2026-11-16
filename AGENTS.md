# AGENTS.md — Som Canet

## Alcance y forma de trabajar

Estas instrucciones se aplican a todo `som-canet-web`.
Trabaja sobre la web existente y adapta cada cambio a sus convenciones.
Este documento orienta el trabajo; no autoriza por sí solo migraciones, importaciones ni despliegues.

Antes de editar:

1. Lee `README.md`, `PIPELINES.md` y, para tareas de contenido o CMS, `SANITY_SETUP.md`.
2. Revisa `package.json`, el lockfile, los archivos afectados y sus pruebas.
3. Comprueba el estado de Git y conserva los cambios ajenos.
4. Explica brevemente qué cambiarás y cómo lo comprobarás; continúa con el trabajo autorizado sin pedir confirmación para pasos rutinarios.
5. Consulta `MANIFIESTO.md` para las decisiones de arquitectura y distingue el objetivo futuro de lo ya implementado.

No reconstruyas ni rediseñes la web salvo petición expresa. Evita refactorizaciones generales y dependencias ajenas al problema.

## Plan principal de SOM CANET

La prioridad es que el equipo pueda gestionar la web sin conocimientos técnicos. Continuar con el sitio existente y conservar sus rutas, diseño y archivo histórico. Usar nombres de secciones reconocibles, indicaciones claras sobre dónde aparece cada contenido y edición visual para revisar borradores. Mantener el archivo histórico identificado y distinguirlo de los ejemplos de prueba.

La arquitectura acordada es Sanity Studio alojado para editar y publicar, Astro estático en Cloudflare Pages para la web pública y un Deploy Hook de Cloudflare que regenere la web al publicarse contenido en Sanity. La vista previa de borradores usa un servicio separado con acceso restringido. GitHub Pages sirve el prototipo de referencia.

**Alojamiento sin coste para el cliente.** Mantener la web pública en un plan gratuito. Si la vista previa alojada se ofrece al equipo, validar primero que también cabe en una opción gratuita. Tratar la renovación del dominio y los planes del CMS como costes separados. No activar servicios de pago sin autorización.

**Pausa activa.** El usuario ha pedido esperar. Retomar la conexión de alojamientos, los webhooks y los despliegues cuando el usuario indique que quiere continuar. Antes de un cambio de dominio, validar el flujo completo en una URL de prueba.

## Estado observado y arquitectura

Referencia de esta revisión: commit `e3e564d7ba0fb9fc65606d8ef7e980cd7047d027`.
Vuelve a comprobar el checkout antes de actuar: esta descripción no demuestra el estado actual de servicios externos.

- Web pública: Astro 6.4.8, TypeScript, generación estática, CSS propio y JavaScript del navegador.
- No hay integración React en la web pública. React pertenece al workspace de Sanity Studio.
- Entorno: Node >=22.12.0, npm y `package-lock.json`; CI utiliza Node 22.
- CMS: cliente Sanity, esquemas, Studio e importación ya implementados.
- El proyecto Sanity de prueba existe, tiene el contenido migrado y un Studio alojado. La edición visual y el menú editorial actualizado se han probado en local.
- GitHub Pages publica el prototipo desde el contenido local del repositorio. La conexión de Cloudflare Pages y el webhook están pendientes.
- La web genera `dist/`; el Studio genera `studio/dist/` de forma independiente.

Usa Astro por defecto. Añade React a la web pública o un backend solamente si una necesidad concreta lo justifica. No introduzcas SSR para resolver edición de contenido que puede servirse estáticamente.

## Mapa del código

| Ruta | Responsabilidad |
| --- | --- |
| `src/layouts/Layout.astro` | Estructura común, navegación, pie, metadatos y JSON-LD |
| `src/components/` | Componentes compartidos, tarjetas y lector PDF |
| `src/pages/` | Portada, páginas especiales, rutas de contenido y compatibilidad histórica |
| `src/lib/content.ts` | Proveedor local/Sanity, tipos, validaciones y rutas editoriales |
| `src/lib/urls.ts` | Ruta base y resolución de enlaces históricos |
| `src/lib/render.ts` | Portable Text, saneamiento de HTML y serialización de JSON-LD |
| `src/styles/global.css` | Variables visuales, estilos y adaptación a pantallas |
| `src/scripts/site.js` | Menú, contacto, filtros del archivo y lector PDF |
| `data/content.json` | Copia local portable del contenido migrado |
| `content/migration-manifest.json` | Procedencia y correspondencias de la migración |
| `public/assets/`, `public/documents/` | Imágenes, páginas de PDF y documentos originales |
| `studio/schemaTypes/index.ts` | Modelos y validación editorial |
| `studio/sanity.config.ts` | Estructura del editor y protecciones de edición |
| `scripts/import-sanity.mjs` | Importación inicial con simulación por defecto |
| `tests/` | Pruebas de contenido, publicación, rutas base y esquemas |
| `.github/actions/verify/action.yml` | Comprobaciones comunes de CI y publicación |

No generes una estructura paralela como `sanity/` o un segundo proveedor sin revisar primero estas piezas.
`scripts/prepare-content.mjs` requiere un respaldo histórico externo; `scripts/legacy/` contiene herramientas históricas. No son pasos del arranque ni del build habitual.

## Contenido y Sanity

Mantén los dos modos explícitos:

- `CONTENT_SOURCE=local`: utiliza la copia local y permite trabajar sin credenciales.
- `CONTENT_SOURCE=sanity`: consulta contenido publicado durante el build. Un error debe detenerlo; nunca ocultes el fallo con una vuelta automática al contenido local.

Conserva la perspectiva `published` y la exclusión de IDs `drafts.*`.
El proveedor comparte una instantánea por proceso; no prometas actualización inmediata de una web estática.
Tras publicar contenido hace falta un nuevo build. En desarrollo puede ser necesario reiniciar el servidor.

Los tipos actuales son `page`, `post`, `person`, `publication`, `video` y `siteSettings`.
Introduce tipos nuevos solo cuando el contenido real los necesite.
Mantén los campos y ayudas del editor en catalán y la interfaz pública en catalán.

Cuando cambie un modelo, revisa conjuntamente:

- Esquema de Studio, tipos TypeScript y consulta del proveedor.
- Fixture local, importador, renderizado y rutas.
- Validaciones y pruebas que protegen ese comportamiento.
- Documentación editorial y configuración afectada.

Conserva el documento de configuración `site-settings`, las referencias entre documentos y las protecciones del Studio para páginas especiales.
Las restricciones de la interfaz del Studio no sustituyen los permisos del proyecto Sanity.

## Migración y archivo histórico

La copia revisada contiene 78 documentos: 37 entradas, 20 páginas, 10 personas, 6 publicaciones, 4 vídeos y una configuración general; conserva 57 páginas renderizadas de PDF.
Estas cifras describen el respaldo inicial, no un límite para nuevas publicaciones.

- Conserva IDs, referencias, fechas, slugs, `legacyPath`, `sourceUrl` y marcas históricas.
- No conviertas cargos, propuestas o noticias antiguas en información vigente ni inventes contenido ausente.
- Conserva atribuciones y créditos de imágenes.
- No elimines originales locales sin comprobar todas sus referencias y el procedimiento de recuperación.
- No ejecutes herramientas históricas sobre la copia editorial actual como parte de una limpieza.

`npm run content:import` solo simula.
`npm run content:import -- --apply` escribe en Sanity: ejecútalo únicamente si la tarea autoriza la importación y el proyecto/dataset de destino están verificados.
Mantén IDs estables, publicaciones antes de documentos que las referencian y `createIfNotExists`.
No sustituyas esto por una sobreescritura general. Un documento existente e incompleto requiere una reparación concreta.

Cuando se sustituye un PDF, no deben mostrarse páginas renderizadas ni transcripciones de la versión anterior. Conserva la comprobación de `renderedFileRef` y el acceso al PDF nuevo.

## Rutas, SEO y seguridad de renderizado

- Usa `routeFor`, `withBase` y `resolveLink`; no fijes `/som-canet-web/` en componentes nuevos.
- Mantén compatibilidad tanto con `BASE_PATH=/` como con un subdirectorio de GitHub Pages.
- Conserva `/articles/<slug>/`, `/documents/<slug>/`, las páginas especiales y las rutas HTML históricas.
- Respeta validaciones de slugs, rutas duplicadas y nombres reservados.
- Las redirecciones heredadas actuales son HTML con canonical; no las describas como HTTP 301.
- Conserva canonical, descripción, Open Graph, Twitter Cards, JSON-LD, sitemap y `robots.txt`.
- Mantén `PUBLIC_INDEXABLE=false` para el prototipo. Activar indexación requiere un `SITE_URL` HTTPS real y una decisión de publicación.
- El contenido Portable Text debe pasar por `renderBody` y su saneamiento antes de `set:html`.
- Conserva el escape de atributos, el filtrado de protocolos y `jsonLd` al serializar datos estructurados.
- No expongas credenciales, borradores ni información privada en HTML, JavaScript, artefactos o logs.

`SANITY_READ_TOKEN` y `SANITY_WRITE_TOKEN` son secretos; nunca uses `PUBLIC_` ni `SANITY_STUDIO_` para ellos.
El project ID y el dataset son configuración pública, no credenciales.
El token de escritura del importador no es necesario para compilar la web.
Actualiza los ejemplos de entorno sin incluir valores reales.

El formulario actual prepara un `mailto:` y permite copiar el mensaje; no envía mediante un backend.
No muestres confirmaciones de envío real ni añadas almacenamiento o servicios externos sin que la tarea lo requiera.

## Diseño y patrones del portfolio

Referencia complementaria: `aminch18/portfolio`, commit `497baecada916dff4a59abd7b225d7fe4444f507`.
La entrada revisada sigue `src/app/page.tsx → TimelinePortfolio → brand/EditorialPortfolio`.
Su stack es Next.js/React; utiliza esa referencia para patrones de organización, no como una dependencia de Som Canet.

Aplica estos criterios observados y compatibles con esta web:

- Separa los datos y textos editoriales de los componentes de presentación.
- Mantén piezas compartidas con responsabilidades claras y evita duplicar navegación o metadatos.
- Reutiliza variables CSS y estilos existentes antes de añadir otra solución visual.
- Conserva enlaces para navegar y botones para acciones, foco visible, etiquetas accesibles y navegación por teclado.
- Comprueba menú móvil, cierre con Escape y alternativas cuando una API del navegador no esté disponible.
- Mantén adaptación a móvil y `prefers-reduced-motion`.
- Accede a `window`, `document`, almacenamiento y otras APIs del navegador solo en código de cliente.

Conserva la identidad de Som Canet: morado, verde, tipografía, composición y recursos actuales.
No copies la paleta, fuentes, contenido personal, idiomas adicionales, animaciones ni dependencias del portfolio por defecto.
Prioriza el código realmente utilizado sobre descripciones antiguas del README.

## Comandos y validación

Instala desde la raíz con `npm ci`; el workspace `studio` comparte el lockfile.
No cambies de gestor de paquetes ni añadas otro lockfile.

Para cambios de código, contenido, modelos o publicación, reproduce las comprobaciones compartidas:

```sh
npm run check
npm test
npm run build
npm run validate:build
```

Usa `CONTENT_SOURCE=local` para verificaciones reproducibles sin secretos.
`npm run check` comprueba Astro y TypeScript del Studio.
`npm test` usa el runner de Node e incluye una prueba que genera una web temporal.

Para cambios del Studio, ejecuta también `npm run studio:build` cuando exista configuración real. Si falta, explica esa limitación sin inventar un ID ni afirmar que se ha verificado.
Para cambios de URLs, comprueba raíz y subdirectorio; para cambios visuales, revisa móvil y escritorio, teclado y consola.
Si se modifica una conducta protegida, añade o adapta una prueba que reproduzca el problema; no rebajes controles para conseguir un resultado verde.
Los cambios exclusivamente documentales requieren comprobar rutas, comandos y coherencia, sin ejecutar toda la suite innecesariamente.

## Publicación y objetivo de clientes independientes

Conserva las pipelines actuales hasta implementar y validar una migración solicitada.
`pages.yml` publica desde `main` tras verificar el build y escucha `sanity-published`.
El workflow de Studio compila y entrega un artefacto; no despliega el editor.
Los artefactos de PR no equivalen a previews alojadas.

La arquitectura acordada para futuros clientes es:

- Un repositorio, un proyecto Sanity y un despliegue independiente por cliente.
- Dataset inicial `production`, con credenciales, accesos y facturación separados.
- Astro estático y Studio desplegable de forma independiente.
- Cloudflare Pages como destino previsto; conservar dominio, correo y propiedad del cliente.
- Publicación editorial seguida de reconstrucción mediante un webhook protegido.
- Extraer patrones al futuro `clients-headless-cms-builder` después de validarlos aquí, sin incluir contenido ni credenciales de Som Canet.

Cuando se solicite migrar a Cloudflare, revisa build, variables, ruta base, HTTPS, enlaces heredados, webhook, procedimiento de vuelta atrás y documentación.
No des por compatible el webhook de GitHub con Cloudflare sin adaptarlo.
Conserva los registros de correo al cambiar DNS y no cambies cuentas, planes, DNS o producción por el mero hecho de leer estas instrucciones.

## Entrega de cada tarea

Resume qué cambió, por qué y cómo se comprobó.
Distingue código preparado, pruebas ejecutadas y servicios externos realmente configurados.
Indica bloqueos concretos y pasos pendientes sin afirmar que Sanity, un webhook o un despliegue funcionan si solo se ha revisado su código.
Actualiza este archivo cuando cambien de forma deliberada la arquitectura o los comandos.
