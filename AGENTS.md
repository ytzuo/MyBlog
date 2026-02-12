# AI 编码指南 (agent.md)

本文件为 AI 大模型提供项目的编码规范、架构模式及开发偏好，以确保生成的代码与现有 codebase 保持高度一致。

## 1. 技术栈偏好
- **框架**: Astro 5 (使用 [astro.config.mjs](file:///c:/Users/zz/Desktop/Code/MyBlog/astro.config.mjs))。
- **语言**: 严格使用 TypeScript。
- **样式**: 
  - 优先使用 [global.css](file:///c:/Users/zz/Desktop/Code/MyBlog/src/styles/global.css) 中定义的全局变量（如 `--accent`, `--gray`, `--box-shadow`）。
  - 组件样式应写在 Astro 文件的 `<style>` 标签内。
  - 视觉风格：倾向于“磨砂陶瓷/纸张”感，常用 `box-shadow` 和噪点纹理 (`--noise-texture`)。

## 2. 目录结构规范
- **组件**: [src/components/](file:///c:/Users/zz/Desktop/Code/MyBlog/src/components/)。按功能分类（如 `Cards/`, `HeaderAndFooter/`）。
- **页面**: [src/pages/](file:///c:/Users/zz/Desktop/Code/MyBlog/src/pages/)。遵循 Astro 基于文件的路由。
- **布局**: [src/layouts/](file:///c:/Users/zz/Desktop/Code/MyBlog/src/layouts/)。通用页面结构定义。
- **内容**: [src/content/blog/](file:///c:/Users/zz/Desktop/Code/MyBlog/src/content/blog/)。Markdown/MDX 文件。
- **常量**: [src/consts.ts](file:///c:/Users/zz/Desktop/Code/MyBlog/src/consts.ts)。全局配置信息。

## 3. 编码偏好
- **组件模式**:
  - 使用 `interface Props` 定义组件属性。
  - 使用 `const { ... } = Astro.props` 解构属性。
  - 尽量复用基础组件（如 [Card.astro](file:///c:/Users/zz/Desktop/Code/MyBlog/src/components/Cards/Card.astro)）。
- **内容处理**:
  - 始终通过 `getCollection('blog')` 获取内容，并依据 [src/content/config.ts](file:///c:/Users/zz/Desktop/Code/MyBlog/src/content/config.ts) 定义的 Schema 进行类型校验。
  - 所有的日期处理应使用 [FormattedDate.astro](file:///c:/Users/zz/Desktop/Code/MyBlog/src/components/FormattedDate.astro)。
- **交互与动画**:
  - 优先使用 CSS 动画（如 `transition`, `@keyframes`）。
  - 启用 View Transitions (`<ClientRouter />`)。

## 4. Frontmatter 规范 (blog)
新增博客文章时，必须包含以下字段：
```yaml
title: string
description: string
pubDate: string (格式: 'YYYY-MM-DD')
updatedDate: string (可选)
heroImage: Image (可选)
heroImageScale: number (可选)
tags: string[] (可选)
```

## 5. 资源使用
- **图标**: 使用 [SmartIcon.astro](file:///c:/Users/zz/Desktop/Code/MyBlog/src/components/SmartIcon.astro) 处理图标显示。
- **图片**: 优先使用 `import { Image } from 'astro:assets'` 进行优化。
- **静态资源**: 放在 `public/` 目录下（如字体、Logo）。

## 6. AI 协作原则
- **代码一致性**: 在修改或新增功能前，先查阅相关文件夹下的现有实现。
- **简洁性**: 避免引入不必要的第三方依赖，优先利用 Astro 原生功能。
- **验证**: 确保修改后的代码符合 TypeScript 类型定义，且不破坏现有的布局结构。
