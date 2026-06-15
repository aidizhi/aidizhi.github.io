const CACHE_NAME = 'aidizhi-v4';
const OFFLINE_URL = '/offline.html';

// 预缓存的静态资源
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// 硬编码的备用域名列表（即使没有任何网络资源也能生成页面）
const FALLBACK_DOMAINS = [
  { name: '994555.xyz', url: 'https://994555.xyz/' },
  { name: '4666.eu.org', url: 'https://4666.eu.org/' },
  { name: '4545.eu.org', url: 'https://4545.eu.org/' },
  { name: '6767.eu.org', url: 'https://6767.eu.org/' },
  { name: 'buqu.eu.org', url: 'https://buqu.eu.org/' },
  { name: 'daba.eu.org', url: 'https://daba.eu.org/' },
  { name: 'nixi.eu.org', url: 'https://nixi.eu.org/' },
  { name: 'qima.eu.org', url: 'https://qima.eu.org/' }
];

// 备用域名（用于回源获取页面，按优先级排序）
const FALLBACK_SOURCES = [
  'https://994555.xyz/',
  'https://4666.eu.org/',
  'https://4545.eu.org/',
  'https://6767.eu.org/',
  'https://buqu.eu.org/',
  'https://daba.eu.org/',
  'https://nixi.eu.org/',
  'https://qima.eu.org/'
];

// 生成兜底 HTML 页面（完全不依赖网络）
function generateFallbackHTML() {
  const domainLinks = FALLBACK_DOMAINS.map(d =>
    `<li><a href="${d.url}" target="_blank" rel="noopener">${d.name}</a></li>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>永不失联 · 最新地址永久入口</title>
<style>
*{margin:0;padding:0}
body{font:16px/1.6 system-ui,-apple-system,sans-serif;background:#fff;color:#000;text-align:center}
a{color:#f90;text-decoration:none;font-weight:500;letter-spacing:1px}
a:hover{text-decoration:underline}
.h1{background:#000;padding:12px 20px;color:#fff;font-size:22px;font-weight:700;letter-spacing:2px}
.h2{background:#f90;padding:8px 20px;font-size:18px;font-weight:700;letter-spacing:1px}
.c{padding:20px;max-width:600px;margin:0 auto}
.tip{font-size:14px;color:#333;margin-bottom:6px}
.tip-s{font-size:12px;color:#666;margin-bottom:16px}
ul{list-style:none;margin-bottom:24px}
ul li{padding:4px 0}
.bt{margin-top:30px;padding-top:20px;border-top:1px solid #eee;font-size:13px;color:#333}
.bt p{margin-bottom:4px}
.warn{background:#fff3cd;color:#856404;padding:8px 12px;border-radius:4px;font-size:13px;margin-bottom:16px}
</style>
</head>
<body>
<div class="h1">永不失联</div>
<div class="h2">4@455555.XYZ</div>
<div class="c">
<div class="warn">⚠️ 当前处于离线/缓存恢复模式，请点击下方可用域名访问</div>
<p class="tip">📧 发邮件 30 秒内自动回复最新地址</p>
<p class="tip-s">未回复就是被拦截请更换其它邮箱发送</p>
<ul>
${domainLinks}
</ul>
<div class="bt">
<p>多收藏不同网址 📌 推荐电信联通访问</p>
<p>移动网 / 国产浏览器会拦截网址</p>
<p>推荐截图 📷 保存本页不迷路</p>
</div>
</div>
</body>
</html>`;
}

// 安装事件：预缓存关键资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 预缓存核心资源');
        return cache.addAll(PRECACHE_URLS);
      })
      .catch((err) => {
        console.log('[SW] 预缓存失败:', err);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活事件：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] 删除旧缓存:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// 从备用域名回源获取页面
async function fetchFromFallback() {
  for (const source of FALLBACK_SOURCES) {
    try {
      const resp = await fetch(source, {
        mode: 'no-cors',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000)
      });
      if (resp) {
        console.log('[SW] 回源成功:', source);
        return { available: source, response: null };
      }
    } catch (e) {
      console.log('[SW] 回源失败:', source, e.message);
    }
  }
  return null;
}

// 生成兜底响应
async function getFallbackResponse() {
  // 尝试从备用域名回源
  const fallback = await fetchFromFallback();

  if (fallback && fallback.response) {
    return fallback.response;
  }

  // 所有回源都失败 → 用硬编码域名列表生成兜底页面
  console.log('[SW] 使用硬编码兜底页面');
  const html = generateFallbackHTML();
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
}

// 判断是否为静态资源
function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif)$/i.test(pathname);
}

// 请求拦截策略：
// - HTML 页面：Network First，离线时回退到缓存 → 兜底页面
// - 静态资源（图片等）：Cache First
// - 其他请求：Stale While Revalidate
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理 GET 请求
  if (request.method !== 'GET') return;

  // HTML 页面：Network First
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功获取后缓存一份
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // 离线时从缓存获取
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL).then((offlineCached) => {
              return offlineCached || getFallbackResponse();
            });
          });
        })
    );
    return;
  }

  // 静态资源：Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        }).catch(() => {
          // 图片离线回退
          if (request.destination === 'image') {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
        });
      })
    );
    return;
  }

  // 其他请求：Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
