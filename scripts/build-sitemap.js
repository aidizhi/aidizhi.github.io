const fs = require('fs');
const path = require('path');

const baseUrl = 'https://aidizhi.github.io';
const files = fs.readdirSync('.').filter(f => f.endsWith('.html') && f !== 'offline.html');

const urls = files.map(file => {
  const loc = file === 'index.html' ? baseUrl + '/' : baseUrl + '/' + file;
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${file === 'index.html' ? '1.0' : '0.5'}</priority>\n  </url>`;
}).join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

fs.writeFileSync('sitemap.xml', sitemap);
console.log('Sitemap generated successfully');
