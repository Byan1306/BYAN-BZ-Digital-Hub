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

## ✨ Stories estilo Instagram (novedad)
La sección **Mis Stories** permite publicar fotografías verticales con:
- 8 filtros visuales (Natural, Cine, Vintage, B&N, Cálido, Frío, Violeta y Dreamy).
- Texto, color, posición (arriba / centro / abajo) y stickers de emoji.
- Música en MP3/OGG/WAV/M4A subida por el administrador (solo audio con derechos de publicación).
- Duración configurable de 5 a 20 segundos, reproducción vertical con barra de progreso y navegación táctil.
- Stories normales de 24 horas y opción **Destacada** permanente.
- Edición de textos, filtros y duración, eliminación, y limpieza manual de archivos vencidos.

**Publicar:** inicia sesión en la página → busca **Mis Stories** → **Crear story** → elige foto, música opcional y ajustes → **Publicar story**. Aparece en el sitio sin modificar HTML ni repositorio.

**Almacenamiento:** Supabase `public.stories` y bucket público `byan-stories`; solo `site_admins` puede publicar/editar/borrar. El archivo completo de audio se almacena, aunque suene solo 5–20 segundos. Para ahorrar cuota usa archivos pequeños. Las stories que vencen dejan de aparecer automáticamente pero **sus archivos se conservan hasta usar «Limpiar vencidas»**.

**Derechos de autor:** este editor no se conecta a la biblioteca musical de Instagram ni licencia canciones comerciales. Publica únicamente música original, de uso libre o para la que tengas permisos.

**Verificación:** código y permisos revisados; el flujo de carga de una foto/música real debe probarse en un navegador con la cuenta de administrador.
