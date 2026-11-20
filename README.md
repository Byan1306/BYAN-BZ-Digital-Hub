# BYAN_BZ — Digital Hub

Portafolio personal creado para BYAN_BZ. Diseño oscuro violeta, galería, gamertags y proyectos. El contenido se lee y guarda en Supabase, de modo que las ediciones se publican sin modificar el HTML.

## Estado
- **Web:** `index.html` ya está en la rama `main` de este repositorio.
- **Supabase:** proyecto `pcgpsrbmdiumtnkzlwym` en la organización Byan; creación cotizada a **$0/mes**.
- **Base de datos:** `site_content` (lectura pública, cambios restringidos) y `site_admins` (lista privada de administradores, sin permisos de escritura para visitantes).
- **Fotos:** bucket público `byan-photos` (subir y borrar solo con cuenta autorizada).
- **Pendiente:** activar GitHub Pages y autorizar el primer administrador.

## 1. Publicar la web con GitHub Pages
Abre [Settings → Pages](https://github.com/Byan1306/BYAN-BZ-Digital-Hub/settings/pages).

En **Build and deployment**, elige **Deploy from a branch**, selecciona **main** y **/(root)** y pulsa **Save**.

Dirección prevista: https://byan1306.github.io/BYAN-BZ-Digital-Hub/

## 2. Configurar la URL de retorno de Supabase Auth
Abre [Authentication → URL Configuration](https://supabase.com/dashboard/project/pcgpsrbmdiumtnkzlwym/auth/url-configuration) e introduce:

- **Site URL:** `https://byan1306.github.io/BYAN-BZ-Digital-Hub/`
- **Redirect URLs:** agrega `https://byan1306.github.io/BYAN-BZ-Digital-Hub/`

Esto es necesario para que el enlace de inicio de sesión enviado por correo regrese al sitio publicado.

## 3. Activar tu usuario administrador (una sola vez)
1. En la web pública, entra a **☰ → Iniciar sesión**. Escribe **tu correo privado** y abre el enlace recibido.
2. Confirma que ya tienes una sesión, aunque aparezca el mensaje «Esta cuenta todavía no está autorizada».
3. En [SQL Editor](https://supabase.com/dashboard/project/pcgpsrbmdiumtnkzlwym/sql/new), ejecuta (sustituye únicamente el correo por el tuyo):

```sql
insert into public.site_admins (user_id)
select id from auth.users
where lower(email) = lower('TU_CORREO_REAL@EJEMPLO.COM')
on conflict (user_id) do nothing;
```

4. Recarga la página. En **☰** aparecerá **Administrar página**.
5. A partir de entonces, podrás subir fotos y guardar cambios en Supabase. Los visitantes no necesitan registrarse.

**Importante:** nunca coloques la contraseña del correo ni una clave de administrador en este repositorio. `index.html` solo incluye una clave pública de Supabase, protegida por RLS.

## 4. Mantenimiento
- No necesitas volver a subir HTML cuando cambies fotos, nombres, textos o proyectos en el editor.
- Es recomendable desactivar nuevos registros en Supabase Auth cuando tu cuenta de administrador esté creada, si ya no necesitas invitar usuarios.
- Haz copias periódicas de tu contenido desde el editor.
- Supabase Free tiene límites de almacenamiento, transferencia y actividad; monitorízalos en el dashboard.

## Seguridad
Tablas públicas con RLS, permisos de escritura reservados exclusivamente a IDs de `site_admins`. Las fotografías que publiques se verán públicamente. No compartas la clave `service_role` ni claves secretas.

## ✨ Stories — editor visual y música (v2)

El propietario entra a **Mis Stories → Crear story**. El editor visual ofrece:
- **Foto**: ajuste «Llenar» (recorta el fondo) o «Foto completa» (sin recortar), arrastrar para ajustar horizontal/vertical y zoom de 100% a 300%.
- **Música**: búsqueda por título/artista mediante el [catálogo público Audius](https://audius.co/) y biblioteca de audios propios.
- **Elección de audio**: «Toda la canción» (duración real, hasta 60 min) o «Elegir segundos» (inicio en una línea de tiempo y entre 5 y 120 segundos).
- **Escuchar** antes de guardar; muestra artista y título.
- **Texto**, stickers, ocho filtros y modo Destacada o story normal de 24 horas.
- **Publicación** y edición con permisos del propietario; visitantes únicamente pueden ver/reproducir.

**Importante:** Audius es un servicio externo a Instagram; no ofrece ni garantiza las mismas canciones, y algunas pistas podrían no estar disponibles por restricciones de los artistas. Se transmiten desde Audius, no se descargan al bucket del proyecto. Se atribuye el título, artista y origen. Subir un audio propio exige confirmar que puedes publicarlo. No se licencian automáticamente canciones comerciales que no pertenezcan a ese catálogo.

**Almacenamiento:** Base de datos `stories`, biblioteca `music_library` y bucket `byan-stories`. El propietario puede reutilizar audios de su biblioteca sin duplicarlos. Al borrar una story se elimina su foto pero **no** la canción compartida de la biblioteca. Las stories vencidas se ocultan y sus imágenes pueden limpiarse desde «Limpiar vencidas».

**Pruebas:** código y permisos SQL revisados; una publicación real con Audius y archivo musical debe validarse con sesión de propietario en el navegador. Pueden existir restricciones de reproducción automática de audio en ciertos navegadores.

## Buscador musical ampliado (v3)

Se añadió un flujo de búsqueda musical de tres fuentes al editor de Stories:

1. **Música popular** (descubrimiento por catálogo): consulta el buscador público iTunes/Apple Music de Costa Rica, con intento alternativo en EE. UU. cuando no hay coincidencias. Muestra título, artista, carátula, álbum, enlace oficial en Apple Music y accesos oficiales a Apple Music. Los resultados de este catálogo **no se pueden poner directamente como banda sonora** porque la API no concede derechos de sincronización.
2. **Para mi Story**: consulta la API de Audius y ordena hasta 35 resultados por coincidencia de nombre, artista y popularidad. El botón **Buscar versión ▶** de un resultado popular realiza esta búsqueda con el título de la canción. No garantiza que sea la grabación original ni sustituye autorizaciones de titulares de derechos.
3. **Mis audios**: canciones subidas por el propietario a Supabase, tras confirmar permiso para su publicación; pueden reutilizarse.

Una canción de Apple Music no se reproduce ni se extrae como audio; las vistas previas promocionales tampoco se sincronizan con fotografías. La escucha promocional se hace con un reproductor oficial sin extraer su audio.

**Uso:** abre [BYAN_BZ Digital Hub](https://byan1306.github.io/BYAN-BZ-Digital-Hub/), inicia sesión → **Mis Stories → Crear story → Música**. Prueba un artista famoso en «Música popular», toca «Buscar versión» y, si aparece una pista apropiada en Audius, escúchala y comprueba tus permisos antes de publicarla.

**Notas operativas:** El servicio gratuito de búsquedas puede aplicar límites de peticiones, estar temporalmente caído o devolver un catálogo distinto según la región. El uso de canciones comerciales de terceros en stories requiere un proveedor de música específicamente licenciado. No se ha contratado ningún servicio de pago. El buscador ya fue comprobado mediante revisión de código y sintaxis; la búsqueda en navegador y la reproducción requieren prueba real.


## 🎧 Escuchar música popular y publicar música de licencia abierta (v4)

Se añadió un panel de música con **cuatro fuentes** al editor de Stories:
- **Popular:** búsqueda en el catálogo público iTunes/Apple Music. Al pulsar «▶ Escuchar» aparece un **reproductor oficial visible de Apple Music** dentro del editor. Apple indica que, sin iniciar sesión, las vistas previas suelen durar 30 segundos. También puedes abrir Apple Music mediante su enlace oficial. **El audio de Apple Music NO se inserta en las Stories** (el reproductor no concede sincronización audiovisual).
- **Licencia CC:** busca en la [API Openverse](https://api.openverse.org/v1/) por título, artista o género. Muestra únicamente pistas indexadas como CC0, dominio público (PDM) o CC BY. Permite escuchar la pista en un reproductor de audio y seleccionar «Toda la canción» o «Elegir segundos». **Openverse no verifica los derechos de cada archivo**. Antes de publicar, el propietario debe abrir su fuente y licencia originales y confirmar los permisos. El sitio guarda los créditos, la licencia y enlaces, y los muestra en la Story.
- **Audius:** búsqueda de pistas reproducibles en Audius, también con comprobación de derechos del artista y condiciones de la pista.
- **Mis audios:** biblioteca privada de archivos propios/autorizados que se suben a Supabase.

**Ninguna de estas fuentes reproduce sin permiso éxitos comerciales sobre fotografías.** Para ofrecer música comercial directamente como soundtrack de las Stories necesitamos un acuerdo específico con un licenciante especializado. No hay claves privadas de servicios musicales en el código y no se han contratado servicios de pago.

**Uso:** iniciar sesión → Mis Stories → Crear Story → Música → Popular → «▶ Escuchar» para usar el reproductor de Apple Music. Para publicar música libre: cambiar a «✓ Licencia CC», buscar, escuchar, abrir la fuente/licencia y marcar la confirmación. La reproducción efectiva depende de la disponibilidad, permisos y restricciones del servidor que aloja el audio.

**Estado de verificación:** archivos de GitHub y JavaScript revisados; políticas SQL confirman que solo el propietario puede publicar. La reproducción de Apple Music y cada URL de Openverse debe verificarse mediante un navegador conectado.


## 🎵 Música en Stories — un solo buscador (v7)

El editor presenta **una caja de búsqueda musical** sin pestañas ni etiquetas de «con licencia»/«sin licencia» en la lista. Conserva el editor fotográfico, el control de fragmentos, los audios propios y las letras sincronizadas.

### Catálogos integrados

El buscador consulta simultáneamente:

- **Apple Music Search** para referencias de éxitos comerciales en las tiendas de Costa Rica y Estados Unidos (datos de la API promocional de Apple; no se permite utilizar el audio como banda sonora sin autorización).
- **Audius** para pistas reproducibles vía la API de Audius; el propietario debe verificar los derechos antes de sincronizar las grabaciones con fotografías.
- **Openverse** para pistas indexadas con licencias CC0, CC BY o marcadas como dominio público; verifica siempre su fuente y permisos reales.
- **Mis canciones** guardadas en Supabase, con la referencia privada del tipo de permiso.

Las coincidencias se normalizan, se deduplican dentro de cada fuente por título/artista/álbum y se ordenan por relevancia; hasta 110 resultados por búsqueda. Las respuestas parciales se mantienen aunque otro proveedor falle o aplique límites de solicitudes. Los catálogos no incluyen todas las canciones existentes. *Shock The World*, de That Boy Franco, tiene un enlace oficial a Apple Music como referencia de respaldo si no aparece mediante la API regional.

### Al seleccionar una canción

- **Éxito comercial:** aparece su ficha de Apple Music (reproductor oficial cuando está disponible) y la opción de gestionar la autorización correspondiente. **No se incorpora el audio comercial sin permiso**.
- **Pista CC/Openverse o Audius:** permite escuchar, escoger segundos y publicar tras comprobar que la grabación tiene derechos suficientes. En Openverse se muestran los créditos y la licencia en la Story.
- **Canción en biblioteca privada:** permite escuchar y publicar los archivos autorizados que hayas guardado. El formulario registra el tipo de permiso y la referencia privada.

Puedes importar tu propio MP3/OGG/M4A/WAV autorizado desde «Añadir un audio a Mis canciones»; máximo 12 MB por archivo. El editor comprueba que el archivo pueda cargarse antes de guardar la Story.

### Limitación de derechos

Ninguna API de descubrimiento concede por sí sola una licencia para sincronizar con fotografías, alojar y comunicar públicamente grabaciones comerciales de terceros. El sitio puede mostrarlas como resultados de búsqueda, pero publicarlas con sonido requiere un permiso adecuado o una API comercial con contrato. El uso no monetizado no elimina esos derechos.

Se investigaron alternativas comerciales como Feed Clips: su catálogo de éxitos comerciales y su servicio global tienen diferencias de disponibilidad territorial y repertorio. No hay un contrato activo ni cargos generados. Sin un acuerdo, no es posible prometer un 90% de éxitos disponibles para sincronizar ni el 100% de reproducción.

Documentación de referencia:
- https://developer.spotify.com/policy
- https://performance-partners.apple.com/search-api
- https://clips.feed.fm/docs/
- https://www.feed.fm/clips/global-music-solution
- https://www.wipo.int/wipolex/es/legislation/details/11316

**Estado de prueba:** archivos de GitHub revisados y validados sintácticamente, componentes de resultados simulados; las consultas HTTP reales, la reproducción y la publicación con música deben verificarse desde el navegador.
