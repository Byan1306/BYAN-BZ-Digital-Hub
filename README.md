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

1. **Música popular** (descubrimiento por catálogo): consulta el buscador público iTunes/Apple Music de Costa Rica, con intento alternativo en EE. UU. cuando no hay coincidencias. Muestra título, artista, carátula, álbum, enlace oficial en Apple Music y búsqueda directa en YouTube. Los resultados de este catálogo **no se pueden poner directamente como banda sonora** porque la API no concede derechos de sincronización.
2. **Para mi Story**: consulta la API de Audius y ordena hasta 35 resultados por coincidencia de nombre, artista y popularidad. El botón **Buscar versión ▶** de un resultado popular realiza esta búsqueda con el título de la canción. No garantiza que sea la grabación original ni sustituye autorizaciones de titulares de derechos.
3. **Mis audios**: canciones subidas por el propietario a Supabase, tras confirmar permiso para su publicación; pueden reutilizarse.

Una canción de Apple Music no se reproduce ni se extrae como audio; las vistas previas promocionales tampoco se sincronizan con fotografías. El enlace a YouTube se abre en su sitio, nunca en un reproductor invisible.

**Uso:** abre [BYAN_BZ Digital Hub](https://byan1306.github.io/BYAN-BZ-Digital-Hub/), inicia sesión → **Mis Stories → Crear story → Música**. Prueba un artista famoso en «Música popular», toca «Buscar versión» y, si aparece una pista apropiada en Audius, escúchala y comprueba tus permisos antes de publicarla.

**Notas operativas:** El servicio gratuito de búsquedas puede aplicar límites de peticiones, estar temporalmente caído o devolver un catálogo distinto según la región. El uso de canciones comerciales de terceros en stories requiere un proveedor de música específicamente licenciado. No se ha contratado ningún servicio de pago. El buscador ya fue comprobado mediante revisión de código y sintaxis; la búsqueda en navegador y la reproducción requieren prueba real.
