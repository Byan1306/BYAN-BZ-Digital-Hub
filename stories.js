
/* BYAN_BZ Stories v1 — owner-only editor, public story viewer */
(function(){
'use strict';
var ctx,db,rows=[],active=[],index=-1,layer=null,timer=null,audio=null,photoPreview=null,locked=false,working=false;
var bucket='byan-stories';
var filters={
 original:{label:'Natural',css:'none'},
 cinematico:{label:'Cine',css:'contrast(1.24) saturate(.86) brightness(.83)'},
 vintage:{label:'Vintage',css:'sepia(.45) saturate(.78) contrast(.98)'},
 noir:{label:'B&N',css:'grayscale(1) contrast(1.28)'},
 calido:{label:'Cálido',css:'sepia(.22) saturate(1.25) brightness(1.05)'},
 frio:{label:'Frío',css:'hue-rotate(15deg) saturate(.84) contrast(1.07)'},
 lila:{label:'Violeta',css:'hue-rotate(24deg) saturate(1.36) contrast(1.07)'},
 dreamy:{label:'Dreamy',css:'brightness(1.09) saturate(.78) contrast(.84)'}
};
function el(sel,base){return (base||document).querySelector(sel)}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
function isAdmin(){return !!(ctx&&ctx.getIsAdmin&&ctx.getIsAdmin())}
function cssFilter(v){return (filters[v]||filters.original).css}
function mediaURL(path){if(!path||!/^[a-zA-Z0-9_./-]{1,300}$/.test(path))return '';return db.storage.from(bucket).getPublicUrl(path).data.publicUrl}
function showMsg(message){var e=el('#story-message');if(e)e.textContent=message}
function labelDate(s){if(s.pinned)return 'Destacada';var mins=Math.max(0,Math.round((Date.now()-Date.parse(s.created_at))/60000));return mins<60?String(mins)+' min':String(Math.floor(mins/60))+' h'}
function validActive(s){return !!s.pinned||Date.parse(s.expires_at)>Date.now()}
function draw(){
 var strip=el('#story-strip');if(!strip)return;
 active=rows.filter(validActive).sort(function(a,b){return Date.parse(b.created_at)-Date.parse(a.created_at)});
 if(!active.length){strip.innerHTML='<div class="story-empty"><span class="story-empty-icon">✧</span><span>Todavía no hay stories publicadas. Aquí aparecerán fotos con música, efectos y recuerdos.</span></div>'}
 else{strip.innerHTML=active.map(function(s,i){return '<button class="story-thumb" type="button" data-story-index="'+i+'" aria-label="Ver story '+esc(s.title||'de BYAN_BZ')+'"><span class="story-ring"><img loading="lazy" src="'+esc(mediaURL(s.image_path))+'" alt="'+esc(s.title||'Story')+'"></span><span class="story-bubble-name">'+esc(s.title||'Mi story')+'</span><span class="story-bubble-time">'+esc(labelDate(s))+'</span></button>'}).join('')}
 var pending=rows.filter(function(s){return !validActive(s)});
 var clean=el('#story-clean-btn');if(clean)clean.hidden=!isAdmin()||!pending.length;
 var add=el('#story-new-btn');if(add)add.hidden=!isAdmin();
}
async function load(){
 if(!db)return;
 var out=await db.from('stories').select('*').order('created_at',{ascending:false}).limit(100);
 if(out.error){showMsg('No se pudieron cargar las stories: '+out.error.message);return}
 rows=out.data||[];draw();showMsg('');
}
function stopPlayback(){
 if(timer){clearTimeout(timer);timer=null}
 if(audio){audio.pause();audio.src='';audio=null}
}
function removeLayer(){
 if(window.BYAN_STORY_STUDIO)window.BYAN_STORY_STUDIO.cleanup();
 stopPlayback();
 if(photoPreview){URL.revokeObjectURL(photoPreview);photoPreview=null}
 if(layer){layer.remove();layer=null}
 document.body.style.overflow='';
 index=-1;
}
function mount(className,markup){
 removeLayer();
 layer=document.createElement('div');layer.className='story-layer';layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-label',className==='viewer'?'Ver story':'Crear story');layer.innerHTML=markup;document.body.appendChild(layer);document.body.style.overflow='hidden';
 layer.addEventListener('click',function(e){if(e.target===layer)removeLayer()});
}
function viewerMarkup(){
 return '<div class="story-dialog story-viewer" id="story-viewer">'
 +'<div class="story-backdrop"><img class="story-photo" id="story-main-photo" alt="Story de BYAN_BZ"><div class="story-shade"></div></div>'
 +'<div class="story-lyrics karaoke" id="story-view-lyrics" aria-live="off"></div><div class="story-textoverlay bottom" id="story-view-caption"></div><div class="story-emoji" id="story-view-emoji"></div>'
 +'<div class="story-vtop"><div class="story-bars" id="story-bars"></div><div class="story-vheader"><div class="story-avatar">BZ</div><div><strong>BYAN_BZ</strong><small id="story-view-time"></small></div><div class="spacer"></div><button type="button" class="story-icon-btn" id="story-mute" title="Silenciar música" aria-label="Silenciar música">♫</button><button type="button" class="story-icon-btn" id="story-close" aria-label="Cerrar">×</button></div></div>'
 +'<div class="story-controls"><button type="button" class="story-tap" id="story-prev" aria-label="Story anterior"></button><button type="button" class="story-tap" id="story-next" aria-label="Siguiente story"></button></div>'
 +'<div class="story-license-credit" id="story-credit"></div><div class="story-vfooter"><div class="story-sound-label" id="story-song"></div><div class="story-admin-actions" id="story-admin-actions"></div></div>'
 +'</div>';
}
function openViewer(i){
 if(!active.length)return;
 mount('viewer',viewerMarkup());
 el('#story-close').onclick=removeLayer;
 el('#story-prev').onclick=function(){showStory(index-1)};
 el('#story-next').onclick=function(){showStory(index+1)};
 el('#story-mute').onclick=function(){if(!audio)return;if(audio.paused){audio.muted=false;audio.play().then(function(){el('#story-mute').textContent='♫'}).catch(function(){el('#story-song').textContent='No se pudo reproducir esta canción.'});return}audio.muted=!audio.muted;el('#story-mute').textContent=audio.muted?'♪':'♫'};
 var startX=0;layer.addEventListener('touchstart',function(e){startX=e.touches[0].clientX},{passive:true});
 layer.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-startX;if(Math.abs(dx)>70)showStory(index+(dx<0?1:-1))},{passive:true});
 showStory(i);
}

function parseStoryLyrics(raw){
 return String(raw||'').split(/\r?\n/).map(function(line){
  var m=line.match(/^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.{0,200})$/);
  if(!m||Number(m[2])>59||!m[4].trim())return null;
  return {time:Number(m[1])*60+Number(m[2])+(m[3]?Number(m[3].padEnd(3,'0'))/1000:0),text:m[4].trim()};
 }).filter(Boolean).sort(function(a,b){return a.time-b.time}).slice(0,140);
}

function showStory(i){
 if(!layer)return;
 if(i<0){showStory(0);return}
 if(i>=active.length){removeLayer();return}
 stopPlayback();index=i;var s=active[i];
 var seconds=Math.min(3600,Math.max(5,Number(s.duration_seconds||8)));
 el('#story-bars').innerHTML=active.map(function(v,j){return '<span class="'+(j<i?'done':j===i?'playing':'')+'" style="--story-duration:'+seconds+'s"><i></i></span>'}).join('');
 var p=el('#story-main-photo');
 p.src=mediaURL(s.image_path);
 p.style.filter=cssFilter(s.image_filter);
 p.style.objectFit=s.photo_fit==='contain'?'contain':'cover';
 p.style.objectPosition=(Number(s.photo_x==null?50:s.photo_x)||0)+'% '+(Number(s.photo_y==null?50:s.photo_y)||0)+'%';
 p.style.transform='scale('+Math.min(3,Math.max(1,Number(s.photo_zoom)||1))+')';
 el('#story-view-time').textContent=(s.title||'Mi story')+' · '+labelDate(s);
 var c=el('#story-view-caption');c.textContent=s.caption||'';c.style.color=s.caption_color||'#fff';c.className='story-textoverlay '+(s.caption_position||'bottom');
 el('#story-view-emoji').textContent=s.emoji||'';
 var lyricBox=el('#story-view-lyrics');
 var lyricLines=s.lyrics_enabled?parseStoryLyrics(s.lyrics_lrc):[];
 lyricBox.className='story-lyrics '+(['karaoke','clean','glass'].includes(s.lyrics_style)?s.lyrics_style:'karaoke');
 lyricBox.style.display=lyricLines.length?'block':'none';
 function paintLyric(at){if(!lyricLines.length)return;
   var line=lyricLines.filter(function(x){return x.time<=at}).pop();
   lyricBox.textContent=line?line.text:'';
 }
 paintLyric(s.music_mode==='full'?0:Number(s.music_start_sec)||0);
 el('#story-song').textContent=s.music_title?'♫ '+s.music_title+(s.music_artist?' — '+s.music_artist:'')+(s.music_source==='audius'?' · Audius':''):'BYAN_BZ · Digital Hub';
 el('#story-mute').style.display=(s.music_path||s.music_source==='audius'&&s.music_track_id||s.music_source==='openverse'&&s.music_external_url)?'grid':'none';
 var credit=el('#story-credit');credit.replaceChildren();
 if(s.music_source==='openverse'){
   credit.style.display='block';
   var creditText=document.createElement('span');creditText.textContent='♫ '+(s.music_attribution||s.music_artist+' — '+s.music_title)+' ('+String(s.music_license||'CC').toUpperCase()+')';credit.appendChild(creditText);
   try{var origin=new URL(s.music_origin||'');if(origin.protocol==='https:'){var anchor=document.createElement('a');anchor.href=origin.href;anchor.target='_blank';anchor.rel='noopener noreferrer';anchor.textContent=' · Fuente ↗';credit.appendChild(anchor)}}catch(err){}
   try{var licenseUrl=new URL(s.music_license_url||'');if(licenseUrl.protocol==='https:'){var licenseLink=document.createElement('a');licenseLink.href=licenseUrl.href;licenseLink.target='_blank';licenseLink.rel='noopener noreferrer';licenseLink.textContent=' · Licencia ↗';credit.appendChild(licenseLink)}}catch(err){}
 }else{credit.style.display='none'}
 var controls=el('#story-admin-actions');
 controls.innerHTML=isAdmin()?'<button type="button" id="story-edit">✎ Editar</button><button type="button" id="story-highlight">'+(s.pinned?'☆ Quitar destacada':'★ Destacar')+'</button><button type="button" id="story-delete">Eliminar</button>':'';
 if(isAdmin()){
   el('#story-edit').onclick=function(){openComposer(s)};
   el('#story-delete').onclick=function(){deleteStory(s)};
   el('#story-highlight').onclick=function(){togglePinned(s)};
 }
 var audioSrc='';
 if(s.music_source==='audius'&&s.music_track_id&&/^[A-Za-z0-9_-]{2,100}$/.test(s.music_track_id))
   audioSrc='https://api.audius.co/v1/tracks/'+encodeURIComponent(s.music_track_id)+'/stream?app_name=BYAN_BZ_Digital_Hub';
 else if(s.music_source==='openverse'&&s.music_external_url){try{var audioURL=new URL(s.music_external_url);if(audioURL.protocol==='https:'&&audioURL.href.length<=1200)audioSrc=audioURL.href}catch(err){}}
 else if(s.music_path)audioSrc=mediaURL(s.music_path);
 if(audioSrc){
   var current=new Audio(audioSrc);audio=current;
   current.preload='metadata';current.loop=s.music_mode!=='full';
   current.addEventListener('loadedmetadata',function(){
     if(audio!==current)return;
     var start=s.music_mode==='full'?0:Number(s.music_start_sec)||0;
     try{current.currentTime=Math.min(start,Math.max(0,current.duration-.3))}catch(err){}
   },{once:true});
   current.addEventListener('timeupdate',function(){if(audio===current&&index===i)paintLyric(current.currentTime)});
   current.addEventListener('ended',function(){if(s.music_mode==='full'&&audio===current&&index===i)showStory(i+1)});
   current.addEventListener('error',function(){
     if(audio!==current)return;
     el('#story-song').textContent='La canción no está disponible. Puedes pasar a la siguiente story.';
     if(s.music_mode==='full'){clearTimeout(timer);timer=setTimeout(function(){showStory(i+1)},8000)}
   },{once:true});
   current.play().catch(function(){if(audio===current)el('#story-mute').textContent='▶'});
 }
 timer=setTimeout(function(){if(layer&&index===i)showStory(i+1)},seconds*1000);
}
async function togglePinned(s){
 if(!isAdmin())return;
 var out=await db.from('stories').update({pinned:!s.pinned}).eq('id',s.id);
 if(out.error){alert('No se pudo cambiar: '+out.error.message);return}
 removeLayer();await load();
}
async function deleteStory(s,skipConfirm){
 if(!isAdmin())return;
 if(!skipConfirm&&!confirm('¿Eliminar esta story y sus archivos?'))return;
 var out=await db.from('stories').delete().eq('id',s.id);
 if(out.error){alert('No se pudo eliminar: '+out.error.message);return}
 var files=[s.image_path];if(s.music_source==='upload'&&s.music_path)files.push(s.music_path);
 if(files.length){var removed=await db.storage.from(bucket).remove(files);if(removed.error)console.warn('No se pudo borrar un archivo:',removed.error)}
 removeLayer();await load();
}
async function cleanExpired(){
 var expired=rows.filter(function(s){return !validActive(s)});
 if(!expired.length)return;
 if(!confirm('¿Eliminar '+expired.length+' stories vencidas y sus fotos y música?'))return;
 for(var i=0;i<expired.length;i++){
   var s=expired[i],out=await db.from('stories').delete().eq('id',s.id);
   if(!out.error)await db.storage.from(bucket).remove([s.image_path].concat(s.music_source==='upload'&&s.music_path?[s.music_path]:[]));
 }
 await load();
}
function composeMarkup(editing){
 return '<div class="story-dialog story-compose" id="story-compose">'
 +'<div class="story-compose-preview"><h3>Vista previa · 9:16</h3><div class="story-phone"><div class="story-phone-placeholder" id="story-placeholder"><b>✦</b><span>Tu próxima story aquí</span></div><img class="story-photo" id="story-preview-image" alt="Vista previa"><div class="story-textoverlay bottom" id="story-preview-caption"></div><div class="story-emoji" id="story-preview-emoji"></div></div></div>'
 +'<div class="story-compose-panel"><div class="story-compose-title"><h2>'+(editing?'Editar story':'Crear nueva story')+'</h2><button type="button" class="story-icon-btn" id="story-cancel" aria-label="Cerrar">×</button></div>'
 +'<form class="story-form" id="story-form">'
 +(editing?'<p class="story-note">Puedes cambiar el filtro, texto, duración o destacarla. Para sustituir la foto o música, publica otra story.</p>':'<label>📷 Fotografía (se optimiza automáticamente)<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" id="story-file" required></label>')
 +'<label>Nombre de la story<input id="story-title" maxlength="72" placeholder="Ej. Un día en la playa" value="'+esc(editing?editing.title:'')+'"></label>'
 +'<div><label>✨ Filtros de imagen</label><div class="story-filter-row" id="story-filters">'
 +Object.keys(filters).map(function(id){return '<button class="story-filter'+((editing?editing.image_filter:'original')===id?' active':'')+'" data-filter="'+id+'" type="button">'+esc(filters[id].label)+'</button>'}).join('')
 +'</div></div><label>Texto sobre la foto<textarea id="story-caption" maxlength="280" placeholder="Escribe algo bonito...">'+esc(editing?editing.caption:'')+'</textarea></label>'
 +'<div class="story-row three"><label>Color de letra<input type="color" id="story-color" value="'+(editing?esc(editing.caption_color):'#ffffff')+'"></label>'
 +'<label>Posición<select id="story-position"><option value="bottom">Abajo</option><option value="middle">Centro</option><option value="top">Arriba</option></select></label>'
 +'<label>Sticker / emoji<select id="story-emoji-select"><option value="">Ninguno</option><option value="💜">💜</option><option value="✨">✨</option><option value="🔥">🔥</option><option value="🎮">🎮</option><option value="🏀">🏀</option><option value="😍">😍</option><option value="🌙">🌙</option><option value="🌴">🌴</option><option value="⭐">⭐</option><option value="🪐">🪐</option></select></label></div>'
 +(editing?'<p class="story-note">Música actual: '+esc(editing.music_title||'sin música')+'</p>':'<label>🎵 Canción (opcional, MP3 / OGG / WAV / M4A, máximo 12 MB)<input type="file" id="story-music-file" accept=".mp3,.ogg,.wav,.m4a,audio/mpeg,audio/ogg,audio/mp4,audio/wav"></label>')
 +'<div class="story-row"><label>Nombre de la canción<input id="story-music-title" maxlength="100" placeholder="Artista — título" value="'+esc(editing?editing.music_title:'')+'"></label>'
 +'<label>Empezar música en el segundo<input id="story-start" type="number" min="0" max="600" value="'+Number(editing?editing.music_start_sec:0)+'"></label></div>'
 +'<div class="story-row"><label>Duración de story (5–20 segundos)<input id="story-duration" type="number" min="5" max="20" value="'+Number(editing?editing.duration_seconds:8)+'"></label>'
 +'<label class="story-check"><input type="checkbox" id="story-pinned"'+(editing&&editing.pinned?' checked':'')+'>★ Destacada (no desaparece)</label></div>'
 +'<p class="story-note">Las stories normales desaparecen de la vista después de 24 horas. Usa únicamente música propia o que tengas permiso de publicar; no incluye el catálogo de Instagram.</p>'
 +'<div id="story-form-error" class="story-error" aria-live="polite"></div>'
 +'<div class="story-submit"><button type="submit" class="story-button primary" id="story-publish">'+(editing?'Guardar cambios':'Publicar story')+'</button><button type="button" class="story-button" id="story-back">Cancelar</button></div>'
 +'</form></div></div>';
}
function openComposer(editing){
 if(!isAdmin()){alert('Solo el propietario puede publicar stories.');return}
 if(!window.BYAN_STORY_STUDIO){alert('El editor está cargando. Actualiza la página y prueba otra vez.');return}
 window.BYAN_STORY_STUDIO.open(editing,{db:db,isAdmin:function(){return isAdmin},mount:mount,removeLayer:removeLayer,mediaURL:mediaURL,compressPhoto:compressPhoto,uploadFile:uploadFile,load:load});
}
async function compressPhoto(file){
 if(!file||!/^image\/(jpeg|png|webp|avif)$/.test(file.type))throw Error('Usa una foto JPG, PNG, WebP o AVIF.');
 var img=await createImageBitmap(file);
 try{
   var scale=Math.min(1,1600/Math.max(img.width,img.height)),can=document.createElement('canvas');
   can.width=Math.max(1,Math.round(img.width*scale));can.height=Math.max(1,Math.round(img.height*scale));
   can.getContext('2d',{alpha:false}).drawImage(img,0,0,can.width,can.height);
   var blob=await new Promise(function(resolve){can.toBlob(resolve,'image/webp',.83)});
   var result=blob&&blob.type==='image/webp'?blob:file;
   if(result.size>12582912)throw Error('La fotografía supera 12 MB. Prueba con una imagen más pequeña.');
   return result;
 }finally{if(img.close)img.close()}
}
async function uploadFile(path,file){
 var out=await db.storage.from(bucket).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
 if(out.error)throw Error(out.error.message);
 return path;
}
async function submitStory(editing,filterName){
 if(working)return;
 if(!isAdmin()){alert('No tienes permisos de administrador');return}
 var err=el('#story-form-error'),btn=el('#story-publish');err.textContent='';
 var duration=Number(el('#story-duration').value),start=Number(el('#story-start').value);
 if(!Number.isInteger(duration)||duration<5||duration>20){err.textContent='Elige entre 5 y 20 segundos.';return}
 if(!Number.isInteger(start)||start<0||start>600){err.textContent='El segundo de la canción debe estar entre 0 y 600.';return}
 var payload={
 title:el('#story-title').value.trim(),
 image_filter:filterName,
 caption:el('#story-caption').value.trim(),
 caption_color:el('#story-color').value,
 caption_position:el('#story-position').value,
 emoji:el('#story-emoji-select').value,
 music_title:el('#story-music-title').value.trim(),
 music_start_sec:start,
 duration_seconds:duration,
 pinned:el('#story-pinned').checked
 };
 var uploaded=[];
 working=true;btn.disabled=true;btn.textContent='Guardando…';
 try{
   if(editing){
     var change=await db.from('stories').update(payload).eq('id',editing.id);
     if(change.error)throw Error(change.error.message);
   } else {
     var photo=el('#story-file').files[0];if(!photo)throw Error('Primero elige una fotografía.');
     var optimized=await compressPhoto(photo);
     var ext=optimized.type==='image/webp'?'webp':optimized.type==='image/png'?'png':optimized.type==='image/avif'?'avif':'jpg';
     payload.image_path=await uploadFile('images/'+crypto.randomUUID()+'.'+ext,optimized);uploaded.push(payload.image_path);
     var track=el('#story-music-file').files[0];
     if(track){
       if(track.size>12582912)throw Error('La canción supera 12 MB. Usa un archivo de audio más corto.');
       var types={'audio/mpeg':'mp3','audio/ogg':'ogg','audio/wav':'wav','audio/x-wav':'wav','audio/mp4':'m4a','audio/x-m4a':'m4a'};
       var type=track.type;
       if(!types[type]&&/\.mp3$/i.test(track.name))type='audio/mpeg';
       if(!types[type]&&/\.m4a$/i.test(track.name))type='audio/mp4';
       if(!types[type])throw Error('Formato no compatible. Prueba una canción MP3.');
       var audioBlob=track.type===type?track:track.slice(0,track.size,type);
       payload.music_path=await uploadFile('audio/'+crypto.randomUUID()+'.'+types[type],audioBlob);uploaded.push(payload.music_path);
       if(!payload.music_title)payload.music_title=track.name.replace(/\.[^.]+$/,'').slice(0,100);
     }
     var result=await db.from('stories').insert(payload).select('id').single();
     if(result.error)throw Error(result.error.message);
   }
   removeLayer();await load();
 }catch(ex){
   err.textContent='No se pudo guardar: '+ex.message;
   if(uploaded.length){await db.storage.from(bucket).remove(uploaded)}
 }finally{working=false;if(layer&&el('#story-publish')){btn.disabled=false;btn.textContent=editing?'Guardar cambios':'Publicar story'}}
}
function bind(){
 var add=el('#story-new-btn'),clean=el('#story-clean-btn'),strip=el('#story-strip');
 if(add)add.onclick=function(){openComposer(null)};
 if(clean)clean.onclick=cleanExpired;
 if(strip)strip.addEventListener('click',function(e){var button=e.target.closest('[data-story-index]');if(button)openViewer(Number(button.dataset.storyIndex))});
 document.addEventListener('keydown',function(e){if(!layer)return;if(e.key==='Escape')removeLayer();else if(index>=0&&e.key==='ArrowRight')showStory(index+1);else if(index>=0&&e.key==='ArrowLeft')showStory(index-1)});
 window.addEventListener('byan-auth-changed',function(){load()});
 document.addEventListener('visibilitychange',function(){if(document.hidden&&audio)audio.pause();else if(!document.hidden&&audio)audio.play().catch(function(){})});
}
var tries=0;
function boot(){
 if(!el('#stories'))return;
 ctx=window.BYAN_STORIES_CONTEXT;
 db=ctx&&ctx.getClient&&ctx.getClient();
 if(!db){if(++tries<100){setTimeout(boot,120)}else{var strip=el('#story-strip');if(strip)strip.innerHTML='<div class="story-empty"><span class="story-empty-icon">!</span><span>No se pudo conectar a Stories. Actualiza la página o revisa tu conexión.</span></div>'}return}
 bind();load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
