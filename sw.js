// ============================================================
// 永不失联 - S 级 PWA Service Worker
// 版本: v2.0.0 | 策略: Stale-While-Revalidate + Network-First
// ============================================================

const CACHE_NAME = 'aidizhi-v2';
const STATIC_CACHE = 'aidizhi-static-v2';
const IMAGE_CACHE = 'aidizhi-images-v2';
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
// 后台同步 - 用于离线时记录用户操作，联网后同步
// ============================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-logs') {
    event.waitUntil(syncOfflineLogs());
  }
});

async function syncOfflineLogs() {
  // 从 IndexedDB 读取离线日志并同步
  // 这里预留接口，实际使用时接入后端
  console.log('[SW] 后台同步触发');
}

// ============================================================
// 推送通知支持
// ============================================================
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '永不失联';
  const options = {
    body: data.body || '有新的地址更新，点击查看',
    icon: '/icon-192x192.png',
    badge: '/favicon-32.png',
    tag: data.tag || 'default',
    requireInteraction: false,
    data: data.url || '/',
    actions: data.actions || [
      { action: 'open', title: '打开' },
      { action: 'close', title: '关闭' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 点击通知
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 如果已有窗口打开，聚焦它
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // 否则打开新窗口
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
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

// ============================================================
// 定期清理过期图片缓存
// ============================================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cleanup-cache') {
    event.waitUntil(cleanupOldCaches());
  }
});

async function cleanupOldCaches() {
  const imageCache = await caches.open(IMAGE_CACHE);
  const requests = await imageCache.keys();
  const now = Date.now();
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 天

  for (const request of requests) {
    const response = await imageCache.match(request);
    if (response) {
      const dateHeader = response.headers.get('date');
      if (dateHeader) {
        const date = new Date(dateHeader).getTime();
        if (now - date > maxAge) {
          await imageCache.delete(request);
        }
      }
    }
  }
}

console.log('[SW] S 级 PWA Service Worker 已加载');
