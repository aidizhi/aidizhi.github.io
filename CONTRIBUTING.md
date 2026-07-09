# Contributing Guidelines

感谢你对本项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 提交 Bug 报告
- 提出新功能建议
- 改进文档
- 提交代码修复
- 优化性能

## 开发环境

本项目为纯静态站点，无需复杂构建工具：

```bash
# 克隆仓库
git clone https://github.com/aidizhi/$(basename $(pwd)).git
cd $(basename $(pwd))

# 安装开发依赖
npm install

# 启动本地预览
npm run dev
```

## 代码规范

- HTML: 使用语义化标签，确保无障碍访问
- CSS: 遵循 BEM 命名规范，支持 prefers-reduced-motion
- JavaScript: 使用 ES2022+ 语法，避免外部依赖

## 提交规范

请使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
feat: 新功能
docs: 文档更新
style: 代码格式修复
refactor: 代码重构
perf: 性能优化
fix: Bug 修复
```

## 安全报告

如发现安全漏洞，请通过邮件私下报告，不要公开提交 Issue。
