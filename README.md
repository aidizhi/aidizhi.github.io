#爱播爱播地址发布页 视频 官方 https://455555.xyz

> 爱播爱播官方最新地址页与发布页导航。集回家页、备用页、防失联页、永久域名落脚点于一体的引导页、中转桥接页及核心入口页，实时发布最新网址，防止失联。

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-brightgreen?logo=github)](https://aidizhi.github.io/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-Mirrored-f38020?logo=cloudflare)](https://aidizhi.pages.dev/)
[![Netlify](https://img.shields.io/badge/Netlify-Mirrored-00ad9f?logo=netlify)](https://aidizhi.netlify.app/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 项目简介

本项目是一个专为 **爱播爱播** 打造的高性能智能地址导航发布页，采用纯静态 HTML / CSS / JavaScript 构建，零后端依赖，部署于 GitHub Pages，并同步镜像至 Cloudflare Pages 与 Netlify，确保全球多线路高可用访问。

核心特性：
- **多线路智能测速**：实时 Ping 检测，自动选择最优入口
- **内置浏览器检测**：智能识别微信/QQ/抖音等内置浏览器并给出引导
- **邮件自动回复**：发送邮件 30 秒内自动回复最新地址
- **PWA 支持**：可一键安装到桌面，离线可用
- **纯前端实现**：零后端、零数据库、零运维成本
- **响应式设计**：完美适配手机、平板、桌面端
- **SEO 全面优化**：结构化数据、OG 标签、Twitter Card、Sitemap 完整覆盖

---

## 在线演示

| 平台 | 地址 | 状态 |
|------|------|------|
| GitHub Pages | [aidizhi.github.io](https://aidizhi.github.io/) | 主站点 |
| Cloudflare Pages | [aidizhi.pages.dev](https://aidizhi.pages.dev/) | 镜像一 |
| Netlify | [aidizhi.netlify.app](https://aidizhi.netlify.app/) | 镜像二 |

---

## 技术架构

| 技术 | 说明 |
|------|------|
| HTML5 | 语义化标签，无障碍支持 |
| CSS3 | 渐变背景、暗黑模式、响应式布局 |
| Vanilla JS | 无框架依赖，极致轻量 |
| GitHub Pages | 主站点托管，全球 CDN 加速 |
| Cloudflare Pages | 线路一镜像，边缘节点部署 |
| Netlify | 线路二镜像，自动构建部署 |
| PWA | Service Worker + Manifest，支持离线访问 |
| CSP / 安全头 | 完整的 Content Security Policy 与 HTTP 安全头策略 |

---

## 功能模块

### 1. 智能线路选择 (`go.html`)
- 实时 Ping 测速，自动选择延迟最低的可用线路
- 本地 `localStorage` 缓存线路历史状态，记录成功率与延迟
- 智能识别微信、QQ、抖音、快手、微博、支付宝、钉钉、百度、小红书、淘宝、今日头条等内置浏览器
- 对内置浏览器提供「复制到系统浏览器打开」引导，避免拦截
- 对爬虫/Bot 自动返回 404，保护真实地址

### 2. 多入口路由 (`r1.html` ~ `r4.html`)
- 4 条独立路由入口，分别指向不同平台镜像
- 自动 hash 路由至 `go.html` 进行智能选择
- 搜索引擎完全屏蔽（`noindex,nofollow,noarchive`），仅首页可索引

### 3. 首页导航 (`index.html`)
- 最新地址聚合展示，一键直达各线路
- 邮件快捷入口：点击即可发送邮件获取最新地址
- PWA 安装引导：一键添加到主屏幕
- 截图保存提示，防止用户丢失入口

---

## 目录结构

```
.
├── index.html          # 首页导航（SEO 可索引）
├── go.html             # 智能线路选择（noindex）
├── r1.html ~ r4.html   # 路由入口（noindex）
├── pwa.html            # PWA 安装页（noindex）
├── robots.txt          # 搜索引擎抓取规则
├── sitemap.xml         # 站点地图
├── _headers            # HTTP 安全头配置（Cloudflare Pages / Netlify）
├── manifest.json       # PWA 应用清单
├── sw.js               # Service Worker
└── README.md           # 项目说明
```

---

## 快速开始

本项目为纯静态站点，无需构建，直接部署即可：

```bash
# 克隆仓库
git clone https://github.com/aidizhi/aidizhi.github.io.git
cd aidizhi.github.io

# 本地预览（任意静态服务器）
python3 -m http.server 8080
# 或
npx serve .

# 部署到 GitHub Pages（推送到 main 分支即可）
git push origin main
```

---

## 部署平台

### GitHub Pages
1. 进入仓库 Settings → Pages
2. Source 选择 Deploy from a branch → main → / (root)
3. 访问 `https://aidizhi.github.io/`

### Cloudflare Pages
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Pages → Create a project → Connect to Git
3. 选择本仓库，Build settings 留空（纯静态）
4. 访问 `https://aidizhi.pages.dev/`

### Netlify
1. 登录 [Netlify](https://app.netlify.com/)
2. Add new site → Import an existing project → GitHub
3. Build command 留空，Publish directory 填 `.`
4. 访问 `https://aidizhi.netlify.app/`

---

## 安全与隐私

- **Content Security Policy (CSP)**：严格限制资源加载来源
- **Referrer-Policy: no-referrer**：不泄露来源页面信息
- **Permissions-Policy**：禁用相机、麦克风、地理位置等敏感权限
- **X-Content-Type-Options: nosniff**：防止 MIME 类型嗅探攻击
- **无第三方追踪脚本**：零外部依赖，零数据收集
- **无 Cookie**：不存储任何追踪 Cookie
- **无服务端日志**：纯静态部署，无后端日志留存

---

## SEO 优化亮点

- **结构化数据**：完整 JSON-LD（WebSite + WebPage + Organization + ItemList）
- **Open Graph**：全量 OG 标签，支持微信/QQ/Facebook 等社交分享预览
- **Twitter Card**：`summary_large_image` 卡片优化
- **Sitemap**：自动提交搜索引擎的站点地图
- **Robots.txt**：精确控制搜索引擎抓取范围
- **Canonical URL**：防止重复内容问题
- **语义化 HTML**：`<main>`、`<nav>`、`<section>`、ARIA 标签完整覆盖
- **Preconnect / DNS-Prefetch**：加速关键资源加载

---

## 开源协议

[MIT License](LICENSE) © 爱播爱播
