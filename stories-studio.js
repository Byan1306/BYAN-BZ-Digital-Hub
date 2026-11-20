
/* BYAN_BZ · Stories Studio. Audius search streams tracks, private library reuses owned uploads. */
(function () {
'use strict';
var S=null,opts=null,searchAbort=null,searchTimer=null,listenAudio=null,previewURL=null,listenEndsAt=0;
var fns={
  esc:function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})},
  clamp:function(n,low,high){return Math.min(high,Math.max(low,Number(n)||0))},
  minutes:function(s){var n=Math.max(0,Math.floor(Number(s)||0));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')},
  url:function(track){if(!track)return '';if(track.source==='audius'){return /^[a-zA-Z0-9_-]{2,100}$/.test(track.id)?'https://api.audius.co/v1/tracks/'+encodeURIComponent(track.id)+'/stream?app_name=BYAN_BZ_Digital_Hub':''}if(track.source==='openverse')return safeHTTPS(track.audioUrl);return track.path?opts.mediaURL(track.path):''}
};
function $(x){return document.querySelector(x)}
function timeNow(){return Date.now()}
function safeLink(s){try{var url=new URL(s);return url.protocol==='https:'&&(url.hostname==='audius.co'||url.hostname.endsWith('.audius.co'))?url.href:''}catch(e){return ''}}
function imgSrc(u){try{var v=new URL(u);return v.protocol==='https:'?v.href:''}catch(e){return ''}}
function safeHTTPS(s){try{var u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password&&u.href.length<=1200?u.href:''}catch(e){return ''}}
function appleEmbedURL(t){try{if(!t||!t.link)return '';var u=new URL(t.link);if(u.hostname!=='music.apple.com')return '';u.hostname='embed.music.apple.com';return u.href}catch(e){return ''}}
function cleanup(){if(searchTimer){clearTimeout(searchTimer);searchTimer=null}if(searchAbort){searchAbort.abort();searchAbort=null}stopAudio();if(previewURL){URL.revokeObjectURL(previewURL);previewURL=null}}
function stopAudio(){if(listenAudio){listenAudio.pause();listenAudio.removeAttribute('src');listenAudio.load();listenAudio=null}listenEndsAt=0}
function markup(){
 return '<div class="story-dialog story-studio" id="studio-root">'
 +'<div class="studio-left"><div class="studio-top"><button type="button" class="studio-ghost" id="studio-cancel">← Cancelar</button><strong>BYAN_BZ · STORY</strong><button type="button" class="studio-publish" id="studio-publish">Publicar</button></div>'
 +'<div class="studio-canvas" id="studio-canvas"><div class="studio-placeholder" id="studio-photo-placeholder"><span>✦</span>Selecciona una fotografía<br>para comenzar tu story</div><img id="studio-preview" alt="Vista previa de la story"><div class="story-lyrics karaoke" id="studio-lyrics-preview"></div><div class="story-textoverlay bottom" id="studio-caption-preview"></div><div class="story-emoji" id="studio-emoji-preview"></div><div class="studio-crop-hint" id="studio-drag-hint" hidden>Arrastra la foto para ajustar el encuadre</div></div></div>'
 +'<div class="studio-right"><nav class="studio-tools" aria-label="Herramientas de Stories">'
 +'<button type="button" class="studio-tab" data-studio-panel="photo"><span class="studio-tab-icon">◱</span> Foto</button>'
 +'<button type="button" class="studio-tab" data-studio-panel="music"><span class="studio-tab-icon">♫</span> Música</button>'
  +'<button type="button" class="studio-tab" data-studio-panel="text"><span class="studio-tab-icon">Aa</span> Texto</button>'
 +'<button type="button" class="studio-tab" data-studio-panel="lyrics"><span class="studio-tab-icon">♬</span> Letras</button>'
 +'<button type="button" class="studio-tab" data-studio-panel="filters"><span class="studio-tab-icon">✦</span> Filtros</button>'
 +'<button type="button" class="studio-tab" data-studio-panel="options"><span class="studio-tab-icon">⚙</span> Más</button>'
 +'</nav><div class="studio-body"><div class="studio-status" id="studio-status" role="status"></div><div id="studio-panel-body"></div><p class="studio-error" id="studio-error" aria-live="polite"></p></div></div></div>';
}
function initStoryState(editing){
 return {
   editing:editing||null, panel:'photo', file:null, selected:null, catalog:'popular', searchTerm:'', searchArtist:'', results:[], library:[], loading:false, applePreview:null,licenseConfirmed:false,
   filter:editing&&editing.image_filter||'original', fit:editing&&editing.photo_fit||'cover',
   photoX:editing?Number(editing.photo_x):50,photoY:editing?Number(editing.photo_y):50,photoZoom:editing?Number(editing.photo_zoom):1,
   caption:editing&&editing.caption||'',captionColor:editing&&editing.caption_color||'#ffffff',captionPosition:editing&&editing.caption_position||'bottom',
   emoji:editing&&editing.emoji||'',title:editing&&editing.title||'',pinned:!!(editing&&editing.pinned),
   mode:editing&&editing.music_mode||'clip',start:editing?Number(editing.music_start_sec||0):0,clip:editing?Math.min(120,Number(editing.duration_seconds||15)):15,
   noMusicDuration:editing?fns.clamp(editing.duration_seconds||8,5,20):8,
   lyricsEnabled:!!(editing&&editing.lyrics_enabled),lyricsLrc:editing&&editing.lyrics_lrc||'',lyricsStyle:editing&&editing.lyrics_style||'karaoke',busy:false
 };
}
function preview(){
 if(!S)return;
 var img=$('#studio-preview'),holder=$('#studio-photo-placeholder');if(!img)return;
 var src=previewURL||(S.editing?opts.mediaURL(S.editing.image_path):'');
 if(src){img.src=src;img.style.display='block';holder.hidden=true}
 else{img.style.display='none';holder.hidden=false}
 img.style.objectFit=S.fit;img.style.objectPosition=fns.clamp(S.photoX,0,100)+'% '+fns.clamp(S.photoY,0,100)+'%';
 img.style.transform='scale('+fns.clamp(S.photoZoom,1,3)+')';
 var filterClasses={original:'none',cinematico:'contrast(1.24) saturate(.86) brightness(.83)',vintage:'sepia(.45) saturate(.78) contrast(.98)',
 noir:'grayscale(1) contrast(1.28)',calido:'sepia(.22) saturate(1.25) brightness(1.05)',frio:'hue-rotate(15deg) saturate(.84) contrast(1.07)',
 lila:'hue-rotate(24deg) saturate(1.36) contrast(1.07)',dreamy:'brightness(1.09) saturate(.78) contrast(.84)'};
 img.style.filter=filterClasses[S.filter]||'none';
 var c=$('#studio-caption-preview');c.textContent=S.caption;c.style.color=S.captionColor;c.className='story-textoverlay '+S.captionPosition;
 $('#studio-emoji-preview').textContent=S.emoji;
 showStudioLyrics(listenAudio?listenAudio.currentTime:S.start);
 var hint=$('#studio-drag-hint');hint.hidden=!src;
}
function setPanel(panel){
 if(!S)return;
 S.panel=panel;
 document.querySelectorAll('[data-studio-panel]').forEach(function(b){b.classList.toggle('active',b.dataset.studioPanel===panel)});
 var html;
 if(panel==='photo')html=photoPanel();
 if(panel==='music')html=musicPanel();
 if(panel==='text')html=textPanel();
 if(panel==='lyrics')html=lyricsPanel();
 if(panel==='filters')html=filtersPanel();
 if(panel==='options')html=optionsPanel();
 $('#studio-panel-body').innerHTML=html||'';
 if(panel==='music'){paintResults(); if(S.catalog==='library') loadLibrary();if(S.catalog==='openverse'&&S.searchTerm.length>=2)searchOpenverse();}
}
function photoPanel(){
 return '<div class="studio-panel"><h3>Encuadre de foto</h3><p class="studio-sub">Como en las Stories: elige cómo llenar el marco y arrastra la foto para recolocarla.</p>'
 +(S.editing?'<p class="studio-note">Puedes cambiar el encuadre sin volver a subir la fotografía.</p>':
 '<label>Fotografía para la story<input id="studio-photo-file" type="file" accept="image/jpeg,image/png,image/webp,image/avif"></label>')
 +'<div class="studio-preview-controls"><span class="studio-note">Ajuste</span><div class="studio-photo-modes">'
 +'<button type="button" data-photo-fit="cover" class="'+(S.fit==='cover'?'active':'')+'">Llenar</button>'
 +'<button type="button" data-photo-fit="contain" class="'+(S.fit==='contain'?'active':'')+'">Foto completa</button></div></div>'
 +'<label>Zoom: <b>'+Math.round(S.photoZoom*100)+'%</b><input type="range" id="studio-photo-zoom" min="1" max="3" step=".05" value="'+S.photoZoom+'"></label>'
 +'<div class="studio-row"><label>Horizontal <input type="range" id="studio-photo-x" min="0" max="100" value="'+S.photoX+'"></label>'
 +'<label>Vertical <input type="range" id="studio-photo-y" min="0" max="100" value="'+S.photoY+'"></label></div>'
 +'<button type="button" class="studio-action secondary" id="studio-photo-reset">↺ Centrar la foto</button>'
 +'<p class="studio-note">«Llenar» recorta los bordes para ocupar toda la pantalla; «Foto completa» conserva toda la imagen con márgenes.</p></div>';
}
function textPanel(){
 return '<div class="studio-panel"><h3>Texto y stickers</h3><p class="studio-sub">Escribe un mensaje sobre tu fotografía.</p>'
 +'<label>Mensaje <textarea maxlength="280" id="studio-text-value" placeholder="Algo que quieras compartir...">'+fns.esc(S.caption)+'</textarea></label>'
 +'<div class="studio-row"><label>Color <input type="color" id="studio-text-color" value="'+fns.esc(S.captionColor)+'"></label>'
 +'<label>Posición <select id="studio-text-position"><option value="bottom"'+(S.captionPosition==='bottom'?' selected':'')+'>Abajo</option><option value="middle"'+(S.captionPosition==='middle'?' selected':'')+'>Centro</option><option value="top"'+(S.captionPosition==='top'?' selected':'')+'>Arriba</option></select></label></div>'
 +'<label>Sticker <select id="studio-emoji"><option value="">Ninguno</option>'
 +['💜','✨','🔥','🎮','🏀','😍','🌙','🌴','⭐','🪐'].map(function(x){return '<option value="'+x+'"'+(S.emoji===x?' selected':'')+'>'+x+'</option>'}).join('')
 +'</select></label></div>';
}

function parseTimedLyrics(raw){
 return String(raw||'').split(/\r?\n/).map(function(line){
  var m=line.match(/^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.{0,200})$/);
  if(!m||Number(m[2])>59||!m[4].trim())return null;
  return {time:Number(m[1])*60+Number(m[2])+(m[3]?Number(m[3].padEnd(3,'0'))/1000:0),text:m[4].trim()};
 }).filter(Boolean).sort(function(a,b){return a.time-b.time}).slice(0,140);
}
function showStudioLyrics(seconds){
 var box=$('#studio-lyrics-preview');if(!box||!S)return;
 box.className='story-lyrics '+S.lyricsStyle;
 if(!S.lyricsEnabled){box.textContent='';box.style.display='none';return}
 var lines=parseTimedLyrics(S.lyricsLrc),on=lines.filter(function(l){return l.time<=seconds}).pop();
 box.style.display='block';
 box.textContent=on?on.text:'♪ Sincroniza las frases en la pestaña Letras';
}
function lyricsPanel(){
 return '<div class="studio-panel"><h3>Letras sincronizadas</h3>'
 +'<p class="studio-sub">Estilo karaoke: cada frase aparece cuando suena su segundo. Añade únicamente letras que sean tuyas o tengas permiso de publicar.</p>'
 +'<label class="studio-check"><input id="studio-lyrics-enabled" type="checkbox"'+(S.lyricsEnabled?' checked':'')+'> Mostrar letras sobre la story</label>'
 +'<label>Estilo<select id="studio-lyrics-style"><option value="karaoke"'+(S.lyricsStyle==='karaoke'?' selected':'')+'>Karaoke luminoso</option><option value="clean"'+(S.lyricsStyle==='clean'?' selected':'')+'>Blanco limpio</option><option value="glass"'+(S.lyricsStyle==='glass'?' selected':'')+'>Cristal violeta</option></select></label>'
 +'<label>Letras con tiempo (formato LRC)<textarea id="studio-lyrics-lrc" rows="9" maxlength="12000" spellcheck="false" placeholder="[00:00.00]Primera frase\n[00:05.50]Siguiente frase">'+fns.esc(S.lyricsLrc)+'</textarea></label>'
 +'<div class="studio-preview-controls"><button class="studio-action secondary" id="studio-stamp-lyric" type="button">⏱ Insertar segundo actual</button><button class="studio-action secondary" id="studio-check-lyrics" type="button">Verificar letras</button></div>'
 +'<p class="studio-note">Reproduce tu audio desde Música y pulsa «Insertar segundo actual» para marcar el momento. Después escribe la frase. Las marcas son relativas a la canción completa.</p>'
 +'<div id="studio-lyrics-info" class="studio-status" aria-live="polite"></div>'
 +'</div>';
}

function filtersPanel(){
 var filters=[['original','Natural'],['cinematico','Cine'],['vintage','Vintage'],['noir','Blanco y negro'],['calido','Cálido'],['frio','Frío'],['lila','Violeta'],['dreamy','Dreamy']];
 return '<div class="studio-panel"><h3>Filtros</h3><p class="studio-sub">Elige el aspecto de la foto y mira el cambio al instante.</p><div class="studio-filters">'
 +filters.map(function(k){return '<button type="button" class="studio-filter'+(k[0]===S.filter?' active':'')+'" data-studio-filter="'+k[0]+'">'+k[1]+'</button>'}).join('')
 +'</div></div>';
}
function optionsPanel(){
 return '<div class="studio-panel"><h3>Detalles de la story</h3><p class="studio-sub">El nombre aparece bajo la miniatura.</p>'
 +'<label>Nombre<input type="text" id="studio-title" maxlength="72" value="'+fns.esc(S.title)+'" placeholder="Ej. Un día increíble"></label>'
 +'<label class="studio-check"><input type="checkbox" id="studio-highlight"'+(S.pinned?' checked':'')+'> ★ Guardar en destacadas</label>'
 +'<p class="studio-note">Las stories normales dejan de aparecer después de 24 horas. Las destacadas permanecen visibles.</p>'
 +(!S.selected?'<label>Duración sin música (5–20 s)<input type="number" id="studio-no-music-duration" min="5" max="20" value="'+S.noMusicDuration+'"></label>':'')
 +'<div class="studio-preview-controls"><button type="button" class="studio-action secondary" id="studio-go-music">♫ Añadir música</button></div>'
 +'</div>';
}
function musicPanel(){
 return '<div class="studio-panel"><h3>Tu música ♫</h3>'
 +'<p class="studio-sub">Escucha canciones populares en el reproductor oficial o elige una pista cuyo uso esté permitido para tu Story.</p>'
 +'<div class="studio-catalog-tabs">'
 +'<button class="studio-source-tab'+(S.catalog==='popular'?' active':'')+'" type="button" data-studio-source="popular">🔥 Popular</button>'
 +'<button class="studio-source-tab'+(S.catalog==='openverse'?' active':'')+'" type="button" data-studio-source="openverse">✓ Licencia CC</button>'
 +'<button class="studio-source-tab'+(S.catalog==='audius'?' active':'')+'" type="button" data-studio-source="audius">▶ Audius</button>'
 +'<button class="studio-source-tab'+(S.catalog==='library'?' active':'')+'" type="button" data-studio-source="library">♫ Mis audios</button>'
 +'</div>'
 +'<label class="studio-music-query"><input autocomplete="off" type="search" id="studio-search" placeholder="Nombre de la canción o artista" value="'+fns.esc(S.searchTerm)+'"></label>'
 +'<p class="studio-source-note">'+(S.catalog==='popular'?'Busca éxitos conocidos y escúchalos con Apple Music (vista previa oficial, habitualmente 30 segundos). La escucha no autoriza poner la canción en una foto.':S.catalog==='openverse'?'Música con licencia Creative Commons CC0, dominio público o CC BY. Revisa siempre los permisos en la fuente original; el buscador no los verifica.':S.catalog==='audius'?'Escucha artistas de Audius. Verifica los derechos de cada pista antes de sincronizarla con una foto.':'Tu propia música autorizada, lista para reproducir y reutilizar.')+'</p>'
 +'<div class="studio-results" id="studio-results"><div class="studio-message">Escribe el nombre de una canción o artista.</div></div>'
 +'<div id="studio-apple-preview"></div>'
 +'<div id="studio-selected-box">'+selectedMarkup()+'</div>'
 +'<details class="studio-uploads"><summary>＋ Agregar mi propio audio a la biblioteca</summary>'
 +'<div><label>Archivo MP3, WAV, OGG o M4A (máximo 12 MB)<input type="file" id="studio-upload-audio" accept=".mp3,.ogg,.wav,.m4a,audio/mpeg,audio/mp4,audio/ogg,audio/wav"></label>'
 +'<label>Nombre de la canción<input id="studio-upload-title" placeholder="Título"></label>'
 +'<label>Artista<input id="studio-upload-artist" placeholder="Artista"></label>'
 +'<label class="studio-check"><input id="studio-rights" type="checkbox"> Confirmo que tengo permiso para publicar este audio</label>'
 +'<button class="studio-action" id="studio-upload-track" type="button">Guardar en mi biblioteca</button></div></details>'
 +'<p class="studio-copyright">Apple Music: reproductor oficial solo para escuchar; no se incorpora su audio a las Stories. Openverse: verifica cada licencia y atribuye al autor. Ni Apple Music ni Openverse garantizan permisos sobre todas las grabaciones.</p>'
 +'</div>';
}
function selectedMarkup(){
 if(!S.selected)return '<div class="studio-message">Ninguna canción seleccionada. Puedes publicar la foto sin música.</div>';
 var t=S.selected;
 var dur=t.duration||null;
 var maxStart=dur?Math.max(0,dur-5):600;
 S.start=fns.clamp(S.start,0,maxStart);
 var maxClip=Math.max(5,Math.min(120,dur?dur-S.start:120));
 S.clip=fns.clamp(S.clip,5,maxClip);
 var openLic=t.source==='openverse';
 var licenseLine=openLic?'<div class="studio-search-hint"><strong>Licencia declarada: '+fns.esc(t.license.toUpperCase())+'</strong>'
  +'<div class="studio-note">Crédito: '+fns.esc(t.attribution||t.artist+' — '+t.title)+'</div>'
  +(safeHTTPS(t.licenseUrl)?'<a href="'+fns.esc(safeHTTPS(t.licenseUrl))+'" target="_blank" rel="noopener noreferrer">Leer licencia ↗</a> ':'')
  +(safeHTTPS(t.link)?'<a href="'+fns.esc(safeHTTPS(t.link))+'" target="_blank" rel="noopener noreferrer">Ver origen ↗</a>':'')
  +'<label class="studio-check"><input type="checkbox" id="studio-license-confirm"'+(S.licenseConfirmed?' checked':'')+'> Revisé la fuente original y confirmo que puedo usar esta grabación junto a mi fotografía.</label></div>':'';
 var trackLink=t.source==='audius'?safeLink(t.link):t.source==='openverse'?safeHTTPS(t.link):'';
 return '<div class="studio-track-selected"><div class="studio-flex"><div style="min-width:0"><strong>♫ '+fns.esc(t.title)+'</strong><small>'+fns.esc(t.artist||'Artista')+' · '+(dur?fns.minutes(dur):'Duración sin confirmar')+'</small></div>'
 +'<button class="studio-ghost" id="studio-clear-song" type="button" title="Quitar canción">✕</button></div>'
 +'<div class="studio-preview-controls"><button id="studio-listen" class="studio-action secondary" type="button">▶ Escuchar</button>'
 +(trackLink?'<a href="'+fns.esc(trackLink)+'" target="_blank" rel="noopener noreferrer" class="studio-note">Ver fuente original ↗</a>':'')+'</div>'
 +licenseLine
 +'<div class="studio-mode"><button type="button" data-studio-mode="full" class="'+(S.mode==='full'?'active':'')+'">Toda la canción</button>'
 +'<button type="button" data-studio-mode="clip" class="'+(S.mode==='clip'?'active':'')+'">Elegir segundos</button></div>'
 +'<div class="studio-timeline">'
 +(S.mode==='clip'?'<div class="studio-time-labels"><span>Inicio <b id="studio-start-label" class="studio-time-value">'+fns.minutes(S.start)+'</b></span>'
 +'<span>Duración <b id="studio-clip-label" class="studio-time-value">'+S.clip+' s</b></span></div>'
 +'<input type="range" id="studio-start" min="0" max="'+maxStart+'" step="1" value="'+S.start+'">'
 +'<label>Segundos del fragmento (5–120)<input type="range" id="studio-clip" min="5" max="'+maxClip+'" step="1" value="'+S.clip+'"></label>'
 +'<span class="studio-note">Se escuchará desde '+fns.minutes(S.start)+' hasta '+fns.minutes(S.start+S.clip)+'.</span>'
 :'<div class="studio-time-labels"><span>Reproducción completa</span><span class="studio-time-value">'+(dur?fns.minutes(dur):'Sin duración')+'</span></div>'
 +'<p class="studio-note">La story seguirá visible mientras se reproduce la canción (hasta 60 minutos).</p>')+'</div></div>';
}
function updateSelectionMarkup(){
 var box=$('#studio-selected-box');if(box)box.innerHTML=selectedMarkup();
}
function showApplePreview(){
 var root=$('#studio-apple-preview');if(!root)return;
 if(S.catalog!=='popular'||!S.applePreview){root.replaceChildren();return}
 var embed=appleEmbedURL(S.applePreview);
 if(!embed){root.textContent='Vista previa no disponible para esta canción. Puedes abrirla en Apple Music.';return}
 var section=document.createElement('div');section.className='studio-official-player';
 var title=document.createElement('div');title.className='studio-official-header';title.textContent='▶ Escucha oficial: '+S.applePreview.title+' — '+S.applePreview.artist;
 var frame=document.createElement('iframe');frame.src=embed;frame.title='Reproductor oficial Apple Music';frame.loading='lazy';
 frame.width='100%';frame.height='150';frame.style.cssText='width:100%;height:150px;border:0;border-radius:13px;background:#1c1b29';
 frame.setAttribute('allow','autoplay *; encrypted-media *; clipboard-write');
 frame.referrerPolicy='strict-origin-when-cross-origin';
 var note=document.createElement('p');note.className='studio-note';
 note.textContent='Apple Music permite preescuchar mediante su reproductor oficial. Para musicalizar una Story necesitas una licencia independiente.';
 section.append(title,frame,note);root.replaceChildren(section);
}

function renderSearchMessage(msg){
 var target=$('#studio-results');if(target)target.innerHTML='<div class="studio-message">'+fns.esc(msg)+'</div>';
}
function paintResults(){
 var box=$('#studio-results');if(!box||!S||S.panel!=='music')return;
 if(S.loading){renderSearchMessage('Buscando canciones…');showApplePreview();return}
 var q=S.searchTerm.trim();
 if(S.catalog!=='library'&&q.length<2){
   box.innerHTML='<div class="studio-message">Busca una canción o artista. Por ejemplo:</div><div class="studio-suggest">'
    +['Bad Bunny','Taylor Swift','Karol G','Feid','The Weeknd'].map(function(t){return '<button type="button" data-studio-suggest="'+fns.esc(t)+'">'+fns.esc(t)+'</button>'}).join('')+'</div>';
   showApplePreview();return;
 }
 var list=S.results||[];
 if(!list.length){renderSearchMessage(S.catalog==='library'?'No hay canciones en tu biblioteca. Puedes subir las tuyas abajo.':S.catalog==='popular'?'No se encontró la canción en Apple Music. Prueba otro artista.':S.catalog==='openverse'?'No hay resultados con CC0, dominio público o CC BY. Prueba un género o utiliza un audio propio.':'No encontramos pistas disponibles en Audius. Prueba otro nombre.');showApplePreview();return}
 if(S.catalog==='popular'){
   box.innerHTML='<div class="studio-section-count"><span>'+list.length+' canciones encontradas</span><span>Reproductor oficial Apple Music</span></div>'
   +list.map(function(t,i){
      var art=imgSrc(t.artwork);
      var url=safeCatalogLink(t.link),yt='https://www.youtube.com/results?search_query='+encodeURIComponent([t.artist,t.title].filter(Boolean).join(' '));
      return '<div class="studio-song popular" role="group">'
       +(art?'<img class="studio-art" loading="lazy" alt="" src="'+fns.esc(art)+'">':'<span class="studio-art" style="display:grid;place-items:center">♫</span>')
       +'<div class="studio-song-main"><strong class="studio-song-title">'+fns.esc(t.title)+'</strong><span class="studio-song-artist">'+fns.esc(t.artist)+'</span>'
       +'<span class="studio-song-meta">'+fns.esc(t.album||'')+'</span><span class="studio-song-pill discovery">Escucha oficial · no publicable en Story</span></div>'
       +'<div class="studio-popular-actions"><button type="button" data-apple-play="'+i+'">▶ Escuchar</button><button type="button" data-find-cc="'+i+'">Buscar libre</button><button type="button" data-find-playable="'+i+'">Ver Audius</button>'
       +(url?'<a href="'+fns.esc(url)+'" target="_blank" rel="noopener noreferrer">Apple Music ↗</a>':'')
       +'<a href="'+yt+'" target="_blank" rel="noopener noreferrer">YouTube ↗</a></div></div>';
   }).join('');
   showApplePreview();return;
 }
 box.innerHTML='<div class="studio-section-count"><span>'+list.length+' pistas</span><span>'+(S.catalog==='openverse'?'Licencia declarada: CC0 / CC BY / PD':'Reproducción disponible')+'</span></div>'
 +list.map(function(t,i){
   var art=imgSrc(t.artwork);
   return '<button type="button" class="studio-song'+(S.selected&&t.source===S.selected.source&&t.id===S.selected.id?' selected':'')+'" data-studio-song="'+i+'">'
   +(art?'<img alt="" loading="lazy" class="studio-art" src="'+fns.esc(art)+'">':'<span class="studio-art" style="display:grid;place-items:center;font-size:22px">♫</span>')
   +'<span class="studio-song-main"><span class="studio-song-title">'+fns.esc(t.title)+'</span><span class="studio-song-artist">'+fns.esc(t.artist||'Artista')+'</span>'
   +'<span class="studio-song-pill can-use">'+(S.catalog==='openverse'?'Licencia '+fns.esc(t.license.toUpperCase())+' · verificar':'▶ Escuchar')+'</span></span>'
   +'<span class="studio-song-time">'+(t.duration?fns.minutes(t.duration):'♫')+'</span></button>'
 }).join('');
 showApplePreview();
}
function updateResultsFromLibrary(){
 if(!S)return;
 var q=S.searchTerm.trim().toLocaleLowerCase();
 S.results=S.library.filter(function(t){return !q||String(t.title+' '+t.artist).toLocaleLowerCase().includes(q)});
 S.loading=false;paintResults();
}
async function loadLibrary(){
 if(!S||!opts.db)return;
 var out=await opts.db.from('music_library').select('id,title,artist,path,duration_seconds').order('created_at',{ascending:false}).limit(100);
 if(!S)return;
 if(out.error){renderSearchMessage('No se pudo leer tu biblioteca: '+out.error.message);return}
 S.library=(out.data||[]).map(function(t){return {source:'library',id:t.id,title:t.title,artist:t.artist||'',path:t.path,duration:Number(t.duration_seconds)||0,artwork:'',link:''}});
 if(S.catalog==='library')updateResultsFromLibrary();
}
function safeCatalogLink(s){
 try{var u=new URL(s);if(u.protocol!=='https:')return '';
 if(['music.apple.com','itunes.apple.com','musicbrainz.org'].includes(u.hostname))return u.href;
 return '';}catch(e){return ''}
}
async function searchPopular(){
 if(!S||S.catalog!=='popular')return;
 if(searchAbort)searchAbort.abort();
 var q=S.searchTerm.trim();if(q.length<2){S.results=[];S.loading=false;paintResults();return}
 var token=searchAbort=new AbortController();
 S.loading=true;paintResults();
 try{
   var url='https://itunes.apple.com/search?term='+encodeURIComponent(q)+'&entity=song&media=music&country=CR&limit=45';
   var response=await fetch(url,{signal:token.signal});
   if(!response.ok)throw Error('Apple Music no respondió (HTTP '+response.status+')');
   var body=await response.json();
   if(token!==searchAbort||!S||S.catalog!=='popular')return;
   if(!Array.isArray(body.results))throw Error('Respuesta musical no reconocida');
   var songs=body.results.filter(function(t){return t&&t.kind==='song'&&t.trackName&&t.artistName});
   if(!songs.length){
      response=await fetch('https://itunes.apple.com/search?term='+encodeURIComponent(q)+'&entity=song&media=music&country=US&limit=35',{signal:token.signal});
      if(response.ok){var alt=await response.json();songs=Array.isArray(alt.results)?alt.results.filter(function(t){return t&&t.kind==='song'&&t.trackName&&t.artistName}):[]}
   }
   if(token!==searchAbort||!S||S.catalog!=='popular')return;
   var seen=new Set();
   S.results=songs.filter(function(t){
     var key=(String(t.trackName)+'|'+String(t.artistName)).toLowerCase();
     if(seen.has(key))return false;seen.add(key);return true;
   }).map(function(t){return {
     source:'popular',provider:'Apple Music',id:String(t.trackId||''),
     title:String(t.trackName).slice(0,140),artist:String(t.artistName).slice(0,100),
     album:String(t.collectionName||'').slice(0,120),duration:Math.round((t.trackTimeMillis||0)/1000),
     artwork:String(t.artworkUrl100||'').replace(/^http:/,'https:'),
     link:safeCatalogLink(t.trackViewUrl||t.collectionViewUrl||'')
   }});
   S.loading=false;paintResults();
 }catch(e){
   if(e.name==='AbortError')return;
   if(token!==searchAbort||!S)return;
   S.loading=false;S.results=[];renderSearchMessage('No se pudo consultar música popular ahora: '+e.message+'. Prueba «Para mi Story» o vuelve a intentarlo.');
 }
}

async function searchOpenverse(){
 if(!S||S.catalog!=='openverse')return;
 if(searchAbort)searchAbort.abort();
 var q=S.searchTerm.trim();if(q.length<2){S.results=[];S.loading=false;paintResults();return}
 var token=searchAbort=new AbortController();S.loading=true;paintResults();
 try{
  var url='https://api.openverse.org/v1/audio/?q='+encodeURIComponent(q)+'&license=cc0,by,pdm&category=music&page_size=30';
  var response=await fetch(url,{signal:token.signal});
  if(!response.ok)throw Error('Openverse temporalmente no disponible (HTTP '+response.status+')');
  var body=await response.json();
  if(token!==searchAbort||!S||S.catalog!=='openverse')return;
  if(!Array.isArray(body.results))throw Error('La respuesta de Openverse no es válida');
  var seen=new Set();
  S.results=body.results.filter(function(t){
    if(!t||!['cc0','by','pdm'].includes(String(t.license||'').toLowerCase()))return false;
    var u=safeHTTPS(t.url),origin=safeHTTPS(t.foreign_landing_url);
    if(!u||!origin||seen.has(u)||t.category&&t.category!=='music')return false;
    seen.add(u);return true;
  }).map(function(t){
    var n=Number(t.duration)||0; /* Openverse supplies milliseconds in the indexed audio API */
    var seconds=n>7200?Math.round(n/1000):Math.round(n);
    var l=String(t.license||'').toLowerCase();
    var licLink=safeHTTPS(t.license_url)||'';
    return {source:'openverse',id:String(t.id||''),title:String(t.title||'Sin título').slice(0,100),
      artist:String(t.creator||'Autor sin identificar').slice(0,100),
      duration:seconds>=5&&seconds<=7200?seconds:0,
      artwork:String(t.thumbnail||''),audioUrl:safeHTTPS(t.url),link:safeHTTPS(t.foreign_landing_url),
      license:l,licenseUrl:licLink,attribution:String(t.attribution||((t.title||'Audio')+' — '+(t.creator||'Autor')+' · '+l.toUpperCase())).slice(0,450)};
  });
  S.loading=false;paintResults();
 }catch(e){
  if(e.name==='AbortError')return;
  if(token!==searchAbort||!S)return;
  S.results=[];S.loading=false;renderSearchMessage('Openverse no está disponible: '+e.message+'. Puedes probar más tarde o usar tu biblioteca.');
 }
}
async function searchAudius(){
 if(!S||S.catalog!=='audius')return;
 if(searchAbort)searchAbort.abort();
 var q=S.searchTerm.trim();
 if(q.length<2){S.results=[];S.loading=false;paintResults();return}
 searchAbort=new AbortController();var token=searchAbort;
 S.loading=true;paintResults();
 try{
  var url='https://api.audius.co/v1/tracks/search?query='+encodeURIComponent(q)+'&limit=35&sort_method=relevant&app_name=BYAN_BZ_Digital_Hub';
  var response=await fetch(url,{signal:token.signal});
  if(!response.ok)throw Error('Servidor musical temporalmente no disponible (HTTP '+response.status+')');
  var json=await response.json();
  if(!S||token!==searchAbort||S.catalog!=='audius')return;
  var tracks=Array.isArray(json.data)?json.data:[];
  var seen=new Set();
  function norm(x){return String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
  var normalized=norm(q),requestedArtist=norm(S.searchArtist);
  var words=normalized.split(/\s+/).filter(function(w){return w.length>1});
  S.results=tracks.filter(function(t){
    if(!t||!/^[A-Za-z0-9_-]{2,100}$/.test(String(t.id||''))||t.is_streamable===false||(t.access&&t.access.stream===false)||t.is_delete)return false;
    if(seen.has(t.id))return false;seen.add(t.id);return true;
  }).map(function(t){
    var title=String(t.title||'Sin título'),artist=String((t.user&&t.user.name)||'Artista');
    var nt=norm(title),na=norm(artist),score=0;
    if(nt===normalized)score+=95;
    if(nt.startsWith(normalized))score+=55;
    if(nt.includes(normalized))score+=35;
    if(na.includes(normalized))score+=25;
    words.forEach(function(w){if(nt.includes(w))score+=8;if(na.includes(w))score+=4});
    if(requestedArtist&&na.includes(requestedArtist))score+=40;
    score+=Math.min(12,Math.log10(Math.max(1,Number(t.play_count)||1))*2);
    return {source:'audius',id:String(t.id),title:title.slice(0,100),
      artist:artist.slice(0,100),duration:Math.max(0,Number(t.duration)||0),score:score,
      artwork:String((t.artwork&&(t.artwork['150x150']||t.artwork['480x480']))||''),
      link:safeLink(t.permalink||'')};
  }).sort(function(a,b){return b.score-a.score}).slice(0,35);
  S.loading=false;paintResults();
 }catch(e){
  if(e.name==='AbortError')return;
  if(!S||token!==searchAbort)return;
  S.results=[];S.loading=false;
  renderSearchMessage('No se pudo buscar en Audius: '+e.message+'. Prueba otra vez o usa Mis audios.');
 }
}
function setSource(source){
 if(!S)return;
 if(searchAbort)searchAbort.abort();
 S.catalog=source;S.results=[];S.loading=false;stopAudio();
 setPanel('music');
 if(source==='audius'&&S.searchTerm.length>=2)searchAudius();
 if(source==='popular'&&S.searchTerm.length>=2)searchPopular();
 if(source==='openverse'&&S.searchTerm.length>=2)searchOpenverse();
}
function onSongSelected(i){
 var t=S.results[i];if(!t||t.source==='popular')return;S.selected=t;S.start=0;S.clip=Math.min(15,Math.max(5,t.duration||15));S.mode='clip';S.licenseConfirmed=false;stopAudio();setPanel('music');
}
function listen(){
 if(!S||!S.selected)return;
 if(listenAudio){stopAudio();var btn=$('#studio-listen');if(btn)btn.textContent='▶ Escuchar';return}
 var src=fns.url(S.selected);
 if(!src){setError('Esta canción no tiene una fuente reproducible.');return}
 try{
  listenAudio=new Audio(src);listenAudio.preload='metadata';
  var current=listenAudio;
  listenAudio.addEventListener('loadedmetadata',function(){
    if(!S||current!==listenAudio)return;
    var known=Number(S.selected.duration)||0;
    if(!known&&Number.isFinite(current.duration)&&current.duration>0){S.selected.duration=Math.round(current.duration);updateSelectionMarkup()}
    var start=S.mode==='full'?0:S.start;
    try{current.currentTime=Math.min(start,Math.max(0,current.duration-0.5))}catch(e){}
  },{once:true});
  listenAudio.addEventListener('timeupdate',function(){
    if(!S||current!==listenAudio)return;
    showStudioLyrics(current.currentTime);
    if(S.mode==='clip'&&current.currentTime>=listenEndsAt)stopAudio();
  });
  listenAudio.addEventListener('ended',function(){if(current===listenAudio)stopAudio()});
  listenAudio.addEventListener('error',function(){setError('No se pudo reproducir este tema. Prueba otra canción o sube tu audio.');stopAudio()});
  listenEndsAt=S.mode==='full'?Number.POSITIVE_INFINITY:S.start+S.clip;
  listenAudio.play().then(function(){var b=$('#studio-listen');if(b)b.textContent='❚❚ Pausar'}).catch(function(e){setError('El navegador bloqueó o no pudo reproducir esta canción. Selecciona otra.');stopAudio()});
 }catch(e){setError('No se pudo abrir el audio.');stopAudio()}
}
function setError(s){var b=$('#studio-error');if(b)b.textContent=s||''}
function setStatus(s){var b=$('#studio-status');if(b)b.textContent=s||''}
function metadataFromAudio(file){
 return new Promise(function(resolve){
  var temp=URL.createObjectURL(file),a=new Audio();var done=false;
  function finish(v){if(done)return;done=true;a.removeAttribute('src');a.load();URL.revokeObjectURL(temp);resolve(v)}
  a.addEventListener('loadedmetadata',function(){finish(Number.isFinite(a.duration)?Math.round(a.duration):0)},{once:true});
  a.addEventListener('error',function(){finish(0)},{once:true});
  a.preload='metadata';a.src=temp;
  setTimeout(function(){finish(0)},6000);
 });
}
async function uploadMusic(){
 if(!S||S.busy||!opts.isAdmin())return;
 var file=$('#studio-upload-audio')&&$('#studio-upload-audio').files[0];
 var title=($('#studio-upload-title')&&$('#studio-upload-title').value.trim())||file&&file.name.replace(/\.[^.]+$/,'').slice(0,120);
 var artist=($('#studio-upload-artist')&&$('#studio-upload-artist').value.trim())||'Artista';
 var rights=$('#studio-rights')&&$('#studio-rights').checked;
 if(!file){setError('Selecciona un archivo de música primero.');return}
 if(!rights){setError('Confirma que tienes permiso para usar este audio.');return}
 if(!title){setError('Escribe el nombre de la canción.');return}
 if(file.size>12582912){setError('El audio supera 12 MB. Prueba un MP3 más comprimido.');return}
 var ext=(file.name.match(/\.(mp3|ogg|wav|m4a)$/i)||[])[1];
 if(!ext){setError('Formato no compatible. Usa MP3, WAV, OGG o M4A.');return}
 var mime={mp3:'audio/mpeg',ogg:'audio/ogg',wav:'audio/wav',m4a:'audio/mp4'}[ext.toLowerCase()];
 var blob=file.type===mime?file:file.slice(0,file.size,mime);
 var path='audio/library/'+crypto.randomUUID()+'.'+ext.toLowerCase();
 S.busy=true;setStatus('Guardando canción en tu biblioteca…');setError('');
 try{
  var duration=await metadataFromAudio(blob);
  await opts.uploadFile(path,blob);
  var out=await opts.db.from('music_library').insert({title:title.slice(0,140),artist:artist.slice(0,100),path:path,duration_seconds:duration||null,rights_confirmed:true}).select('id,title,artist,path,duration_seconds').single();
  if(out.error){await opts.db.storage.from('byan-stories').remove([path]);throw Error(out.error.message)}
  var r=out.data;
  S.selected={source:'library',id:r.id,title:r.title,artist:r.artist,path:r.path,duration:r.duration_seconds||0};
  S.mode='clip';S.start=0;S.clip=Math.min(15,S.selected.duration||15);
  S.catalog='library';S.searchTerm='';setPanel('music');await loadLibrary();
  setStatus('Canción guardada. Ya puedes elegir fragmento o reproducción completa.');
 }catch(e){setError('Error al guardar canción: '+e.message)}
 finally{if(S)S.busy=false}
}
function attachEvents(){
 var root=$('#studio-root');if(!root)return;
 root.addEventListener('click',function(e){
  var t=e.target.closest('button');if(!t)return;
  if(t.id==='studio-cancel'){opts.removeLayer();return}
  if(t.id==='studio-publish'){publish();return}
  if(t.dataset.studioPanel){setPanel(t.dataset.studioPanel);return}
  if(t.dataset.photoFit){S.fit=t.dataset.photoFit;setPanel('photo');preview();return}
  if(t.id==='studio-photo-reset'){S.photoX=50;S.photoY=50;S.photoZoom=1;setPanel('photo');preview();return}
  if(t.dataset.studioFilter){S.filter=t.dataset.studioFilter;setPanel('filters');preview();return}
  if(t.dataset.studioSource){setSource(t.dataset.studioSource);return}
  if(t.dataset.studioSong!==undefined){onSongSelected(Number(t.dataset.studioSong));return}
  if(t.dataset.studioSuggest){S.searchTerm=t.dataset.studioSuggest;setPanel('music');if(S.catalog==='popular')searchPopular();else if(S.catalog==='audius')searchAudius();return}
  if(t.dataset.findPlayable!==undefined){var hit=S.results[Number(t.dataset.findPlayable)];if(!hit)return;S.searchTerm=hit.title;S.searchArtist=hit.artist;setSource('audius');return}
  if(t.id==='studio-clear-song'){S.selected=null;S.mode='clip';S.start=0;stopAudio();setPanel('music');return}
  if(t.dataset.studioMode){S.mode=t.dataset.studioMode;S.start=S.mode==='full'?0:S.start;stopAudio();updateSelectionMarkup();return}
  if(t.id==='studio-listen'){listen();return}
  if(t.id==='studio-upload-track'){uploadMusic();return}
  if(t.id==='studio-go-music'){setPanel('music');return}
  if(t.id==='studio-stamp-lyric'){
   var secs=listenAudio?listenAudio.currentTime:(S.start||0),mm=Math.floor(secs/60),ss=(secs%60).toFixed(2).padStart(5,'0'),area=$('#studio-lyrics-lrc');if(!area)return;
   var stamp='['+String(mm).padStart(2,'0')+':'+ss+']';
   var at=area.selectionStart||0;area.value=area.value.slice(0,at)+(at&&area.value[at-1]!=='\n'?'\n':'')+stamp+area.value.slice(at);S.lyricsLrc=area.value;area.focus();area.selectionStart=area.selectionEnd=area.value.indexOf(stamp,at)+stamp.length;preview();return;
  }
  if(t.id==='studio-check-lyrics'){
   var count=parseTimedLyrics(S.lyricsLrc).length,info=$('#studio-lyrics-info');if(info)info.textContent=count?count+' frases sincronizadas.':'No se encontraron marcas válidas. Usa [00:05.00]Texto';return;
  }
 });
 root.addEventListener('input',function(e){
  var t=e.target;
  if(t.id==='studio-photo-x')S.photoX=fns.clamp(t.value,0,100);
  if(t.id==='studio-photo-y')S.photoY=fns.clamp(t.value,0,100);
  if(t.id==='studio-photo-zoom')S.photoZoom=fns.clamp(t.value,1,3);
  if(['studio-photo-x','studio-photo-y','studio-photo-zoom'].includes(t.id)){preview();if(t.id==='studio-photo-zoom'){var b=t.closest('label').querySelector('b');if(b)b.textContent=Math.round(S.photoZoom*100)+'%'}return}
  if(t.id==='studio-text-value')S.caption=t.value;
  if(t.id==='studio-text-color')S.captionColor=t.value;
  if(t.id==='studio-text-position')S.captionPosition=t.value;
  if(t.id==='studio-emoji')S.emoji=t.value;
  if(['studio-text-value','studio-text-color','studio-text-position','studio-emoji'].includes(t.id)){preview();return}
  if(t.id==='studio-title')S.title=t.value;
  if(t.id==='studio-highlight')S.pinned=t.checked;
  if(t.id==='studio-lyrics-enabled')S.lyricsEnabled=t.checked;
  if(t.id==='studio-lyrics-lrc')S.lyricsLrc=t.value;
  if(t.id==='studio-lyrics-style')S.lyricsStyle=t.value;
  if(['studio-lyrics-enabled','studio-lyrics-lrc','studio-lyrics-style'].includes(t.id)){preview();return}
  if(t.id==='studio-no-music-duration')S.noMusicDuration=fns.clamp(t.value,5,20);
  if(t.id==='studio-search'){
   S.searchTerm=t.value;S.searchArtist='';
   if(S.catalog==='library')updateResultsFromLibrary();
   else{
    if(searchTimer)clearTimeout(searchTimer);
    searchTimer=setTimeout(function(){if(!S)return;if(S.catalog==='popular')searchPopular();else if(S.catalog==='audius')searchAudius()},380);
   }
   return;
  }
  if(t.id==='studio-start'){S.start=fns.clamp(t.value,0,7200);stopAudio();var label=$('#studio-start-label');if(label)label.textContent=fns.minutes(S.start);return}
  if(t.id==='studio-clip'){S.clip=fns.clamp(t.value,5,120);stopAudio();var label=$('#studio-clip-label');if(label)label.textContent=S.clip+' s';return}
 });
 root.addEventListener('change',function(e){
   var t=e.target;if(t.id==='studio-photo-file'){setPhoto(t.files[0])}if(t.id==='studio-start'||t.id==='studio-clip'){updateSelectionMarkup()}
 });
 var canvas=$('#studio-canvas'),pointer=null;
 canvas.addEventListener('pointerdown',function(e){if(!S.file&&!S.editing)return;pointer={x:e.clientX,y:e.clientY,sx:S.photoX,sy:S.photoY};try{canvas.setPointerCapture(e.pointerId)}catch(err){}});
 canvas.addEventListener('pointermove',function(e){
  if(!pointer)return;
  S.photoX=fns.clamp(pointer.sx-(e.clientX-pointer.x)*100/(canvas.clientWidth||1),0,100);
  S.photoY=fns.clamp(pointer.sy-(e.clientY-pointer.y)*100/(canvas.clientHeight||1),0,100);preview();
 });
 canvas.addEventListener('pointerup',function(){pointer=null});canvas.addEventListener('pointercancel',function(){pointer=null});
}
function setPhoto(file){
 if(previewURL){URL.revokeObjectURL(previewURL);previewURL=null}
 S.file=file||null;if(file)previewURL=URL.createObjectURL(file);preview();
}
function payloadForStory(){
 var t=S.selected;
 var duration=S.noMusicDuration||8;
 if(t){
  if(S.mode==='full'){
   if(!t.duration||t.duration<5||t.duration>3600)throw Error('Para publicar la canción completa necesitamos conocer su duración (de 5 segundos a 60 minutos). Prueba «Elegir segundos».');
   duration=Math.round(t.duration);
  }else duration=Math.round(fns.clamp(S.clip,5,120));
 }
 return {
  title:S.title.trim().slice(0,72),image_filter:S.filter,caption:S.caption.trim().slice(0,280),
  caption_color:S.captionColor,caption_position:S.captionPosition,emoji:S.emoji,
  pinned:S.pinned,music_mode:t?S.mode:'clip',music_source:t?t.source:'upload',
  music_track_id:t&&t.source==='audius'?t.id:null,
  music_path:t&&(t.source==='library'||t.source==='upload')?t.path:null,
  music_title:t?t.title.slice(0,100):'',
  music_artist:t?(t.artist||'').slice(0,100):'',
  music_link:t&&t.source==='audius'?safeLink(t.link)||null:null,
  music_track_seconds:t&&t.duration?Math.round(t.duration):null,
  music_start_sec:t&&S.mode==='clip'?Math.round(fns.clamp(S.start,0,7200)):0,
  duration_seconds:duration,
  lyrics_enabled:S.lyricsEnabled,lyrics_lrc:S.lyricsEnabled?S.lyricsLrc:'',lyrics_style:S.lyricsStyle,
  photo_fit:S.fit,photo_x:Math.round(S.photoX*100)/100,photo_y:Math.round(S.photoY*100)/100,
  photo_zoom:Math.round(S.photoZoom*100)/100
 };
}
async function publish(){
 if(!S||S.busy)return;
 if(!opts.isAdmin()){setError('No tienes permiso para publicar. Inicia sesión como propietario.');return}
 if(!S.file&&!S.editing){setPanel('photo');setError('Primero elige una foto.');return}
 if(S.selected&&S.mode==='clip'&&S.selected.duration && S.start+S.clip>S.selected.duration){
  setPanel('music');setError('El fragmento debe terminar antes que la canción.');return
 }
 if(S.lyricsEnabled&&!parseTimedLyrics(S.lyricsLrc).length){setPanel('lyrics');setError('Añade al menos una frase con tiempo válido [00:05.00]Texto');return}
 var payload;try{payload=payloadForStory()}catch(e){setPanel('music');setError(e.message);return}
 S.busy=true;var btn=$('#studio-publish');btn.disabled=true;btn.textContent='Publicando…';setError('');
 var uploaded=[];
 try{
  if(S.editing){
    var out=await opts.db.from('stories').update(payload).eq('id',S.editing.id);
    if(out.error)throw Error(out.error.message);
  }else{
    var optimized=await opts.compressPhoto(S.file);
    var extension=optimized.type==='image/webp'?'webp':optimized.type==='image/jpeg'?'jpg':optimized.type==='image/png'?'png':'avif';
    payload.image_path=await opts.uploadFile('images/'+crypto.randomUUID()+'.'+extension,optimized);
    uploaded.push(payload.image_path);
    var created=await opts.db.from('stories').insert(payload).select('id').single();
    if(created.error)throw Error(created.error.message);
  }
  var refreshStories=opts.load;opts.removeLayer();await refreshStories();
 }catch(e){
  setError('No se pudo publicar: '+e.message);
  if(uploaded.length)await opts.db.storage.from('byan-stories').remove(uploaded);
 }finally{if(S){S.busy=false;var b=$('#studio-publish');if(b){b.disabled=false;b.textContent='Publicar'}}}
}
function open(editing,options){
 if(!options.isAdmin())return;
 options.mount('compose',markup());
 opts=options;
 S=initStoryState(editing);
 if(editing&&(editing.music_path||editing.music_track_id)){
  S.selected={source:editing.music_source||'upload',
    id:editing.music_track_id||String(editing.music_path||''),
    title:editing.music_title||'Audio',artist:editing.music_artist||'',
    path:editing.music_path||null,link:editing.music_link||'',
    duration:Number(editing.music_track_seconds)||0};
 }
 attachEvents();setPanel('photo');preview();
}
window.BYAN_STORY_STUDIO={open:open,cleanup:function(){cleanup();S=null;opts=null}};
})();
