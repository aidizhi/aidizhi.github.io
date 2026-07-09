// ============================================================
// 永不失联 - 标准 PWA Service Worker
// 版本: v2.0.0 | 策略: Stale-While-Revalidate + Network-First
// ============================================================

const CACHE_NAME = 'aidizhi-v3-pwa';
const STATIC_CACHE = 'aidizhi-static-v3-pwa';
const IMAGE_CACHE = 'aidizhi-images-v3-pwa';
const OFFLINE_URL = '/offline.html';

// 核心资源 - 安装时预缓存
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/favicon-32.png',
  '/apple-touch-icon.png',
  '/favicon.ico'
];

// ============================================================
// 安装阶段
// ============================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] 预缓存失败:', err))
  );
});

// ============================================================
// 激活阶段 - 清理旧缓存并立即接管页面
// ============================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name !== CACHE_NAME &&
                   name !== STATIC_CACHE &&
                   name !== IMAGE_CACHE;
          })
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ============================================================
// 辅助函数
// ============================================================
function isStaticAsset(pathname) {
  return /\.(js|css|json|woff|woff2|ttf|eot)$/i.test(pathname);
}

function isImage(pathname) {
  return /\.(png|jpg|jpeg|gif|svg|ico|webp|avif)$/i.test(pathname);
}

function isHTML(request) {
  return request.headers.get('accept')?.includes('text/html');
}

// 网络请求超时包装器
function fetchWithTimeout(request, timeout = 5000) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    )
  ]);
}

// ============================================================
// 缓存策略实现
// ============================================================

// 1. Network First - HTML 页面
async function networkFirst(request) {
  try {
    const networkResponse = await fetchWithTimeout(request, 3000);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // 返回离线页面
    const offlineResponse = await caches.match(OFFLINE_URL);
    if (offlineResponse) return offlineResponse;
    throw error;
  }
}

// 2. Stale While Revalidate - 静态资源
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

// 3. Cache First - 图片资源
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // 返回 1x1 透明像素 SVG 作为图片占位
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    throw error;
  }
}

// ============================================================
// Fetch 事件处理
// ============================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求和 chrome-extension 请求
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // 跨域请求直接走网络
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 0 })));
    return;
  }

  // HTML 页面: Network First
  if (isHTML(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 图片资源: Cache First
  if (isImage(url.pathname)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // 静态资源: Stale While Revalidate
  if (isStaticAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // 其他请求: Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
});

// ============================================================
// 消息处理 - 与页面通信
// ============================================================
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  // 接收页面发来的缓存清理请求
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((names) =>
        Promise.all(names.map((name) => caches.delete(name)))
      ).then(() => {
        event.ports[0]?.postMessage({ success: true });
      })
    );
  }

  // 接收页面发来的获取缓存状态请求
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    event.waitUntil(
      caches.keys().then(async (names) => {
        const status = {};
        for (const name of names) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          status[name] = keys.length;
        }
        event.ports[0]?.postMessage({ status });
      })
    );
  }
});
