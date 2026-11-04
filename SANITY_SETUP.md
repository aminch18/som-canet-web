# Conexión de Sanity

La configuración está preparada. Estos pasos requieren que el propietario inicie sesión y cree un proyecto real; no se han realizado ni se han contratado planes.

## 1. Proyecto y dataset

En https://www.sanity.io/manage, crea un proyecto llamado SOM CANET con el plan Free y un dataset `production`. Para contenido público, el dataset público permite generar la web sin un token de lectura. El propietario debe revisar las condiciones y los permisos que acepte al crear su cuenta.

Copia el project ID y el dataset. Son identificadores, no secretos. Crea `.env` a partir de `.env.example` y `studio/.env` a partir de `studio/.env.example`. Configura el mismo project ID y dataset en ambos archivos; el Studio utiliza los nombres `SANITY_STUDIO_PROJECT_ID` y `SANITY_STUDIO_DATASET`.

Deja `CONTENT_SOURCE=local` hasta completar la importación. No inventes un ID para simular la conexión: el Studio falla con un mensaje claro cuando no está configurado.

## 2. Importación inicial

Primero inspecciona lo que se importará:

```sh
npm run content:import
```

La simulación no realiza escrituras remotas. Para importar, crea en Sanity un token con permisos de escritura en el dataset y guárdalo como `SANITY_WRITE_TOKEN` en el `.env` local, que está ignorado por Git.

```sh
npm run content:import -- --apply
```

El proceso sube las imágenes y PDF desde `public/` y crea los 78 documentos. Las publicaciones se crean primero para resolver las referencias. Usa IDs estables y `createIfNotExists`: no sobrescribe contenido ya editado y se puede reintentar tras una interrupción. Un ID existente se omite, aunque el registro esté incompleto; en ese caso hay que revisar el documento concreto, no forzar una sustitución general.

Después de importar, elimina el token de escritura del entorno si ya no necesitas volver a importar. La web y GitHub Pages no lo necesitan.

## 3. Editor

```sh
npm run studio
```

Abre la URL local que imprime Sanity y entra con la cuenta autorizada. Si Sanity solicita autorizar el origen local, configúralo en API → CORS origins del proyecto. Los permisos de usuario se administran en Sanity; el esquema no otorga acceso por sí solo.

Para alojar el editor, utiliza las opciones de alojamiento de Sanity Studio o publica su compilación en otro alojamiento compatible:

```sh
npm run studio:build
```

El resultado queda en `studio/dist/`. Configura `PUBLIC_STUDIO_URL` con la dirección real del editor. `/admin/` en la web pública enlazará allí; no contiene credenciales ni concede acceso.

Los campos disponibles permiten gestionar noticias, páginas, personas, documentos, vídeos, portada y contactos. Las imágenes nuevas se guardan en Sanity. Los recursos locales migrados permanecen disponibles para los lectores de archivo.

## 4. Activar el contenido de Sanity

Cambia `CONTENT_SOURCE=sanity` y ejecuta:

```sh
npm run build
npm run validate:build
```

Comprueba las páginas antes de publicar. Para un dataset privado se necesita `SANITY_READ_TOKEN` únicamente en el entorno de compilación. Nunca lo nombres con el prefijo `PUBLIC_`.

## 5. GitHub Pages

Variables del repositorio:

- `CONTENT_SOURCE=sanity`
- `SANITY_PROJECT_ID`: el ID real.
- `SANITY_DATASET=production`
- `PUBLIC_STUDIO_URL`: URL real del Studio.
- `PUBLIC_INDEXABLE=false` para el prototipo.

Secret opcional: `SANITY_READ_TOKEN` si el dataset requiere autenticación. El token de escritura no se añade a GitHub para compilar la web.

## 6. Publicar sin tocar código

Para que publicar en Sanity reconstruya GitHub Pages, configura un webhook del proyecto:

- Método: POST.
- Destino: `https://api.github.com/repos/PROPIETARIO/REPOSITORIO/dispatches`.
- Eventos: Create, Update y Delete.
- Dataset: `production`.
- Filtro GROQ: `_type in ["post", "page", "person", "publication", "video", "siteSettings"] && !(_id in path("drafts.**"))`.
- Proyección del cuerpo: `{"event_type": "sanity-published"}`.
- Cabeceras: `Accept: application/vnd.github+json`, `Content-Type: application/json` y `Authorization: Bearer TOKEN`.

Ese token es de GitHub, distinto de los tokens de Sanity. Debe limitarse al repositorio elegido, con los permisos necesarios para crear un repository dispatch. Guárdalo únicamente en las cabeceras privadas del webhook; no en código, capturas, logs o variables públicas. Usa la entrega de prueba y revisa los registros de entrega. El webhook todavía no está creado ni verificado contra servicios reales.

El workflow escucha `repository_dispatch` con tipo `sanity-published`. Si falla una compilación, GitHub mantiene el despliegue anterior y se puede corregir y reintentar. Mientras no haya webhook, Actions → Publish to GitHub Pages → Run workflow reconstruye manualmente.

## Fuentes de referencia

- Astro y GitHub Pages: https://docs.astro.build/en/guides/deploy/github/
- Importación de Sanity: https://www.sanity.io/docs/apis-and-sdks/importing-data
- Webhooks de Sanity: https://www.sanity.io/docs/content-lake/webhooks
- GitHub repository dispatch: https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event
