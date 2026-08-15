// Service Worker MECO-T — permite usar las herramientas sin conexión
// después de haberlas visitado al menos una vez con internet.

var CACHE_NAME = 'meco-t-cache-v1';
var ARCHIVOS_A_GUARDAR = [
  './captura_entrevista.html',
  './configuracion_hipotesis.html',
  './configuracion_gestion_auditada.html',
  './ponderacion_aspectos.html',
  './arbol_organizacional.html',
  './resumen_dia.html',
  './sincronizar_configuracion.html',
  './diagnostico.html'
];

// Al instalar el Service Worker, intenta guardar las 8 herramientas.
self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ARCHIVOS_A_GUARDAR).catch(function(err) {
        // Si alguno falla al guardarse, no se detiene todo el proceso.
        console.log('Aviso: algún archivo no se pudo guardar para uso sin conexión.', err);
      });
    })
  );
});

// Al activarse, limpia versiones anteriores del caché si existieran.
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(nombres) {
      return Promise.all(
        nombres.filter(function(nombre) { return nombre !== CACHE_NAME; })
               .map(function(nombre) { return caches.delete(nombre); })
      );
    })
  );
  self.clients.claim();
});

// Estrategia: intenta internet primero (para tener siempre la versión más
// reciente); si no hay conexión, entrega la copia guardada.
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then(function(respuestaRed) {
      var copia = respuestaRed.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(event.request, copia);
      });
      return respuestaRed;
    }).catch(function() {
      return caches.match(event.request).then(function(respuestaGuardada) {
        return respuestaGuardada || new Response(
          '<html><body style="font-family:sans-serif; padding:40px; text-align:center;">' +
          '<h2>Sin conexión y sin copia guardada</h2>' +
          '<p>Esta página todavía no se guardó para uso sin conexión. ' +
          'Ábrela una vez con internet y vuelve a intentarlo.</p>' +
          '</body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      });
    })
  );
});
