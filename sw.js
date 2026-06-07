const CACHE_NAME = 'aidizhi-v2';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30天缓存

// 安装时预缓存核心资源
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('预缓存核心资源');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('预缓存失败:', err);
      })
  );
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 缓存优先策略：优先从缓存读取，缓存没有才走网络
// 这样即使域名被封（网络不通），也能从本地缓存加载页面
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // 缓存命中，直接返回（不关心网络状态）
        if (cachedResponse) {
          return cachedResponse;
        }

        // 缓存未命中，尝试网络请求
        return fetch(event.request)
          .then((networkResponse) => {
            // 检查响应是否有效
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // 将响应存入缓存，供下次离线使用
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch(() => {}); // 缓存写入失败不影响

            return networkResponse;
          })
          .catch(() => {
            // 网络请求失败（域名被封/无网络），返回缓存的首页作为兜底
            return caches.match('/index.html');
          });
      })
  );
});
