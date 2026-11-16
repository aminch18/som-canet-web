# Conexión de Sanity

La web de SOM CANET usa por defecto los 78 documentos migrados de `data/content.json`. El proveedor Sanity, los modelos, el Studio y el evento de reconstrucción están preparados. Ya se usó un proyecto de prueba con contenido migrado y Studio alojado. Los pasos 1 a 3 sirven para una instalación nueva o para comprobar la existente. Reutiliza el proyecto de prueba para las verificaciones y comprueba sus documentos publicados antes de plantear otra importación. Los pasos 5 y 6 documentan la opción de GitHub Pages. El destino acordado para la web definitiva es Cloudflare Pages.

## 1. Proyecto y acceso

1. Crea un proyecto dedicado a SOM CANET en [Sanity Manage](https://www.sanity.io/manage), bajo la cuenta u organización que deba ser propietaria. Crea el dataset `production` y decide su visibilidad. Un dataset público permite leer contenido publicado sin token. Si el dataset es privado, la web necesitará un token de lectura para compilar y los campos usados en las páginas se convertirán en HTML público.
2. Desde la raíz, instala las dependencias con `npm ci`. Crea `.env` y `studio/.env` a partir de sus ejemplos si todavía no existen. Configura el mismo proyecto y dataset en ambos. El importador usa `SANITY_PROJECT_ID` y `SANITY_DATASET`, y Studio usa `SANITY_STUDIO_PROJECT_ID` y `SANITY_STUDIO_DATASET`.
3. Conserva `CONTENT_SOURCE=local` mientras revisas el destino. Guarda los tokens solo en el entorno local o en el almacén de secretos indicado en cada paso. Los IDs de proyecto y los nombres de dataset son configuración pública.

## 2. Importar conservando los documentos existentes

Ejecuta primero la simulación local. Comprueba los archivos que se subirían y muestra el inventario por tipo. Funciona sin credenciales y sin red.

```sh
npm run content:import
```

Cuando esté autorizado importar, crea un token temporal con lectura de borradores y versiones, creación de documentos y subida de archivos en el dataset elegido. Ponlo en el `.env` local como `SANITY_WRITE_TOKEN`. Revisa que el destino impreso coincide con Sanity Manage y que el plan contiene las cifras esperadas.

```sh
npm run content:import -- --check-target
```

La comprobación consulta Sanity sin escribir. Si el dataset ya tiene contenido, guarda un respaldo antes de la importación y coordina una pausa de edición y publicaciones hasta verificar el resultado. Si un ID migrado solo tiene borrador o versión de una release, o el documento publicado tiene un tipo distinto, resuelve el conflicto en Studio y repite la comprobación. Si el ID publicado ya tiene el tipo esperado, el importador lo conserva tal como está. Revisa manualmente los registros incompletos y posibles contenidos equivalentes con otros IDs.

```sh
npm run content:import -- --apply
```

La importación conserva IDs, fechas, slugs, rutas antiguas y referencias. Sube imágenes y PDF de los documentos pendientes, crea las publicaciones antes de las entradas y páginas que las referencian y usa `createIfNotExists` en cada escritura. Si se interrumpe, comprueba el destino de nuevo y reintenta. Al final verifica por ID y tipo que los 78 documentos migrados estén publicados. Las páginas renderizadas de PDF y demás originales siguen en el repositorio. Revoca el token temporal al terminar y retíralo del entorno.

## 3. Comprobar y desplegar Studio

Con el proyecto real configurado en `studio/.env`, ejecuta desde la raíz:

```sh
npm exec --workspace studio -- sanity login
npm run studio
npm run studio:build
```

Comprueba que la cuenta tiene acceso, que el origen local que imprime el CLI está permitido en API → CORS origins si hace falta y que aparecen los tipos editoriales y `site-settings`. El build genera `studio/dist/`. El workflow manual **Build Sanity Studio** también puede generar ese artefacto con las variables del repositorio.

Cuando se autorice publicar el editor, el propietario o una cuenta delegada puede usar el CLI fijado en el lockfile. El primer despliegue interactivo permite elegir el nombre del Studio alojado por Sanity. La primera orden comprueba el plan de despliegue y la segunda realiza el despliegue y exige que se publique también el esquema. [Despliegue de Studio en Sanity](https://www.sanity.io/docs/studio/deployment).

```sh
npm exec --workspace studio -- sanity deploy --dry-run
npm exec --workspace studio -- sanity deploy --schema-required
```

Guarda el `appId` que devuelve el primer despliegue como `SANITY_STUDIO_APP_ID` en `studio/.env` para reutilizar esa aplicación al volver a desplegar.

Abre la URL devuelta por Sanity, invita a los editores con los permisos adecuados y verifica con una cuenta de editor que puede abrir el Studio y guardar un borrador. Usa esa URL HTTPS para `PUBLIC_STUDIO_URL`. La ruta `/admin/` enlaza al editor, cuyo acceso se administra en Sanity.

## 4. Validar la web con datos reales antes de activarla

Configura `SANITY_READ_TOKEN` en el `.env` local si el dataset es privado. Valida el build con los valores del prototipo:

```sh
CONTENT_SOURCE=sanity PUBLIC_INDEXABLE=false SITE_URL=https://aminch18.github.io BASE_PATH=/som-canet-web/ npm run build
npm run validate:build
npm run preview
```

En la vista previa compara el archivo con el prototipo local. Comprueba portada, noticias, equipo, las seis publicaciones, el lector y las rutas HTML históricas. Verifica que un borrador queda fuera y que las imágenes y PDF se pueden abrir con la sesión cerrada. Si se sustituye un PDF, el lector debe dejar de mostrar la transcripción y las páginas renderizadas del anterior. El build consume la perspectiva `published` y falla si Sanity no responde. Las actualizaciones editoriales llegan a la web tras una reconstrucción.

## 5. Activar la publicación en GitHub Pages

Después de aprobar la vista previa y autorizar el despliegue, configura en GitHub Actions:

| Tipo | Nombre | Valor |
| --- | --- | --- |
| Variable | `SANITY_PROJECT_ID` | ID del proyecto real |
| Variable | `SANITY_DATASET` | Dataset validado |
| Variable | `PUBLIC_STUDIO_URL` | URL HTTPS del editor |
| Variable | `PUBLIC_INDEXABLE` | `false` para el prototipo |
| Secret | `SANITY_READ_TOKEN` | Solo para un dataset privado |
| Variable | `CONTENT_SOURCE` | `sanity`, al activar la integración |

Ejecuta **Publish to GitHub Pages** sobre `main` y comprueba el resultado antes de habilitar el webhook. Si hay que volver temporalmente a la copia inicial, desactiva el webhook, restablece `CONTENT_SOURCE=local` y vuelve a ejecutar el workflow autorizado. La copia local refleja la migración inicial y las ediciones posteriores permanecen en Sanity.

## 6. Automatizar la publicación editorial

Crea el webhook en el proyecto real y mantenlo deshabilitado hasta que el despliegue manual haya pasado. Configura:

- **Método y URL**. POST a `https://api.github.com/repos/aminch18/som-canet-web/dispatches`.
- **Dataset y eventos**. Dataset conectado, Create, Update y Delete. Usa el tipo de webhook por documento y deja desactivados los eventos de borradores y versiones.
- **Filtro GROQ**. Usa este filtro para que las eliminaciones también coincidan con el documento anterior.

  ```groq
  coalesce(after()._type, before()._type) in ["post", "page", "person", "publication", "video", "siteSettings"]
  && !(coalesce(after()._id, before()._id) in path("drafts.**"))
  && !(coalesce(after()._id, before()._id) in path("versions.**"))
  ```

- **Proyección**. `{"event_type":"sanity-published"}`.
- **Cabeceras**. `Accept: application/vnd.github+json`, `Content-Type: application/json` y `Authorization: Bearer <TOKEN>`. GitHub exige permiso de repositorio **Contents: write** para este endpoint. Usa un token fine-grained limitado a `som-canet-web` con caducidad y guárdalo en las cabeceras del webhook. [Configuración de webhooks de Sanity](https://www.sanity.io/docs/http-reference/webhooks) y [permisos de repository dispatch en GitHub](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event).

Con el webhook activo y el despliegue autorizado, crea un borrador de prueba y comprueba que no dispara Actions. Publica un cambio aprobado, confirma la entrega `204` en Sanity, comprueba que el workflow se ejecuta desde `main` y verifica el cambio en la web. Repite con la retirada de una entrada de prueba aprobada para verificar el evento de eliminación. Si falla el build, la versión publicada anterior queda servida. Para recuperar la publicación después de arreglar el fallo, vuelve a ejecutar el workflow desde `main`.

Cloudflare Pages es el destino previsto del manifiesto. Su conexión y su mecanismo de reconstrucción se prepararán con la migración de hosting. Esta configuración corresponde al prototipo en GitHub Pages.

## Alcance editorial actual

Sanity controla los registros de noticias, páginas, personas, publicaciones, vídeos y la configuración general. La navegación, los rótulos de la interfaz y la composición de las páginas especiales viven en Astro. Los PDF migrados conservan sus páginas renderizadas y transcripciones locales mientras correspondan al mismo archivo. Los cambios de estructura, presentación o generación de esas copias siguen siendo tareas del repositorio.

## Edición visual y bloques

En Studio, abre **Edició visual** y navega a la página. Puedes seleccionar campos marcados en la vista previa para abrirlos en el editor. Los cambios guardados como borrador se cargan en la vista previa. En **Blocs de contingut** se pueden añadir y reordenar bloques de texto, foto y botón. La portada se edita en **Configuració del web**. Los bloques aparecen después del texto en noticias y páginas generales, y al final de la portada y de las páginas con plantilla propia.

La vista previa necesita un servicio Node separado que ejecuta las plantillas Astro por petición. La web pública se sigue compilando en modo estático y el webhook de publicación conserva el mismo flujo.

1. Configura `SANITY_PROJECT_ID`, `SANITY_DATASET` y `CONTENT_SOURCE=sanity` para el servicio de vista previa. Crea un token de **lectura** de Sanity con acceso a borradores y configúralo únicamente en el entorno de ejecución como `SANITY_PREVIEW_TOKEN`. Configura `SANITY_PREVIEW_STUDIO_ORIGINS` con los orígenes de Studio autorizados, separados por comas. Para las dos entradas actuales del Studio de prueba son `https://aminch18somcanetprev.sanity.studio,https://www.sanity.io`.
2. Genera la vista previa con `EDITOR_PREVIEW=true CONTENT_SOURCE=sanity PUBLIC_INDEXABLE=false SITE_URL=https://TU-PREVIEW npm run build`. Arranca el servicio con `node ./dist/server/entry.mjs` y publícalo detrás de HTTPS. Usa una salida o entorno de build independiente de Cloudflare Pages.
3. En `studio/.env`, configura `SANITY_STUDIO_PREVIEW_URL=https://TU-PREVIEW` y vuelve a desplegar Studio. El modo borrador se activa con un enlace temporal generado por Studio y una cookie firmada. Una visita sin esa sesión solo recibe contenido publicado.
4. Desde Studio edita un borrador de una noticia, confirma que aparece en **Edició visual** y abre la misma página en una ventana privada para comprobar que solo se ve la versión publicada. Prueba también añadir y reordenar un bloque.

Para probar en el ordenador, usa `SANITY_STUDIO_PREVIEW_URL=http://localhost:4322 npm run studio` y, en otra terminal, `EDITOR_PREVIEW=true CONTENT_SOURCE=sanity PUBLIC_INDEXABLE=false SITE_URL=http://localhost:4322 npm run dev -- --host localhost --port 4322`. Si hace falta, autoriza el origen local de Studio en Sanity. Pon ese mismo origen en `SANITY_PREVIEW_STUDIO_ORIGINS` y carga el token de lectura en el entorno del proceso de Astro.


## Salida y entrega

**Prueba sin dominio propio.** Una vez acordado quién administrará los servicios, usa el proyecto Sanity existente para probar el flujo. Revisa y versiona el trabajo local. En Cloudflare Pages configura un entorno de prueba con Node 22, comando `npm run build`, salida `dist`, `CONTENT_SOURCE=sanity`, `BASE_PATH=/`, `PUBLIC_INDEXABLE=false` y `SITE_URL` igual a la URL HTTPS de prueba `pages.dev`. Carga el proyecto y el dataset de Sanity, y un token de solo lectura si el dataset es privado. Deja `EDITOR_PREVIEW` desactivado para este build. Comprueba también `npm run validate:build`.

Configura un [Deploy Hook de Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/deploy-hooks/) para la rama de prueba. En Sanity configura un webhook POST a esa URL con el filtro de publicaciones descrito arriba. Mantén privada la URL del hook. Verifica que un borrador no dispara un build y que publicar y retirar una noticia de prueba sí reconstruye la web. Revisa rutas antiguas, imágenes y PDF. La vista previa de borradores se puede usar en local y, si el equipo la necesita a distancia, requiere un servicio separado con acceso restringido.

**Coste y propiedad.** [Cloudflare Pages Free](https://developers.cloudflare.com/pages/platform/limits/) y [Sanity Free](https://www.sanity.io/pricing) permiten plantear la prueba sin cuotas de alojamiento ni CMS, dentro de sus límites. Sanity Free ofrece datasets públicos, por lo que el contenido publicado en ellos es accesible. Si el equipo necesita un dataset privado, debe valorar el coste antes de adoptar ese plan. El dominio propio tiene un coste de registro y renovación aparte. El precio depende de la extensión y del registrador.

**Decisiones con el equipo.** Confirmad quién se hace cargo de las cuentas, quién publica contenidos y si hay presupuesto para renovar un dominio. Si se aprueba un dominio propio, registradlo a nombre de la organización o de la entidad que acordéis. Tras validar la prueba, conectad el dominio, comprobando HTTPS, enlaces, indexación y cualquier registro de correo que deba conservarse. Mientras tanto, el dominio de prueba permite validar el flujo completo de publicación.
