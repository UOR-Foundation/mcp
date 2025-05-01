/**
 * MCP Server Service Worker
 * Manages caching and offline functionality
 */

const CACHE_NAME = 'mcp-cache-v2';
const RESOURCES_TO_CACHE = [
  '/',
  '/index.html',
  '/config.js',
  '/auth-service.js',
  '/styles.css',
  '/app.js',
  '/mcp-client.js',
  '/mcp-handler.js'
];

// Install event - cache core resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(RESOURCES_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Don't cache GitHub API requests or authentication endpoints
  if (event.request.url.includes('api.github.com') || 
      event.request.url.includes('github.com/login')) {
    return;
  }
  
  // For MCP endpoints, use network only
  if (event.request.url.includes('/mcp')) {
    return;
  }
  
  // Add authentication header to GitHub API requests if we have a token
  if (event.request.url.includes('api.github.com')) {
    event.respondWith(
      caches.open('github-auth-cache').then(cache => {
        return cache.match('auth-state').then(authResponse => {
          if (authResponse) {
            return authResponse.json().then(authState => {
              if (authState && authState.token) {
                // Clone the request and add the auth header
                const authenticatedRequest = new Request(event.request, {
                  headers: {
                    ...Object.fromEntries(event.request.headers.entries()),
                    'Authorization': `token ${authState.token}`
                  }
                });
                return fetch(authenticatedRequest);
              }
              return fetch(event.request);
            });
          } else {
            return fetch(event.request);
          }
        });
      })
    );
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request);
      })
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME);
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle auth state updates
  if (event.data && event.data.type === 'AUTH_STATE_CHANGE') {
    caches.open('github-auth-cache').then(cache => {
      if (event.data.authState) {
        // Store auth state in service worker cache
        cache.put('auth-state', new Response(JSON.stringify(event.data.authState)));
      } else {
        // Clear auth state from cache
        cache.delete('auth-state');
      }
    });
  }
});
