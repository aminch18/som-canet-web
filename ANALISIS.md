# Análisis y evolución del prototipo · 4 de noviembre de 2026

## Corrección del enfoque

La primera entrega era una landing con enlaces al sitio original. El usuario aclaró que necesita una evolución de la web completa, con páginas propias y el contenido real incorporado, y señaló que el aspecto se parecía demasiado a su portfolio.

La entrega revisada cambia tanto la arquitectura como la dirección visual: navegación de una organización municipal, logotipo original, tipografía sans serif, superficies rectangulares, más densidad de contenido y eliminación de las cursivas editoriales, sellos y tarjetas decorativas de portada.

## Arquitectura

- **Inicio:** presentación y puertas de entrada a historia, vida municipal, revista y hemeroteca.
- **El proyecto:** declaración original de identidad, historia completa, equipo histórico y Sant Jordi 2016.
- **Grupo municipal:** entrada al gobierno, regidoria, valoración 2015–2019, discurso y programa 2019.
- **Revista:** los documentos originales, páginas de seis autores y vídeos.
- **Archivo:** 37 entradas del blog, más 17 recursos de las otras secciones, con filtros y búsqueda por título.
- **Participación y contacto:** páginas nuevas para orientar propuestas, consultas y peticiones de información.
- **Lectores de documentos:** los seis PDF con navegación visual por páginas y texto extraído.

## Método de recuperación

Se inventariaron todos los destinos del menú original, los archivos mensuales y las cuatro páginas del blog. El blog de Wix carga entradas de forma diferida: fue necesario recorrer las páginas y volver a inspeccionarlas tras el desplazamiento para recuperar las 37 entradas.

Se extrajo el cuerpo de cada artículo y los bloques de texto originales; se eliminaron únicamente el marcado de Wix, sus estilos de presentación, elementos vacíos, controles y duplicados de navegación. Se descargaron las imágenes públicas y los PDF enlazados. Los textos escaneados se conservan como imágenes ampliables. El programa tiene 43 páginas; los seis PDF suman 57.

## Criterio editorial

El contenido original conserva su contexto histórico. Las biografías, las convocatorias y los programas no se presentan como vigentes. El prototipo añade la interfaz y las llamadas a participar, sin inventar noticias, equipo actual, eventos o resultados de gestión. Los enlaces a Wix identifican la procedencia de los contenidos; la navegación principal y la lectura ocurren en el nuevo sitio.

## Límites conocidos

La página original «Executiva» no tiene cuerpo propio; se utiliza «Qui és qui». No se ha recuperado la galería antigua incrustada en historia. «El Bon Govern» figura como título en la página de vídeos, pero no tiene un reproductor recuperable asociado. Los cuatro vídeos accesibles se integran desde YouTube.

## Antes de publicar

Confirmar contactos y revisar editorialmente el archivo, aportar información vigente si se desea una sección de actualidad, y elegir el repositorio de GitHub. El sitio está preparado para GitHub Pages sin dependencias ni compilación.

## Evolución a Astro + Sanity

Tras la validación del enfoque multipágina, se sustituyeron los HTML independientes por plantillas Astro y 78 registros de contenido estructurado en Portable Text. El usuario descartó WordPress y quiere que el prototipo se parezca a la web final, con edición por parte de la organización.

Astro conserva el HTML completo por página y limita el JavaScript público. Sanity Studio utiliza React como aplicación separada. La copia local permite revisar el proyecto sin inventar una cuenta CMS. La importación, los modelos y el proveedor de lectura real están preparados; la sesión de Sanity requiere inicio de sesión del propietario y el proyecto aún no existe.

La prueba de publicación añade contenido en una copia temporal y comprueba que la página, portada, archivo, canonical, Article JSON-LD y sitemap se generan sin editar plantillas, también bajo una ruta de GitHub Pages. Se excluyen borradores. El prototipo usa noindex y requiere dominio real e indexación explícita antes de servir como web definitiva.
