# Saten 同学的小基地 🐱

> **⚠️ 免责声明**：本项目由一个前端菜鸟在 AI 的全程陪伴下 Vibe Coding 而成。如果你在代码里发现了什么奇怪的东西，那大概率是 AI 写的，和我没有关系（确信）。（这个README也是AI写的）

🌐 **线上地址**：[saten.website](https://saten.website)

---

## 这是什么

一个用 [Astro](https://astro.build) 搭建的个人博客，记录技术折腾过程、生活随笔和一些奇思妙想。整个项目从设计到实现几乎都是我坐在旁边指手画脚、让 AI 噼里啪啦敲代码完成的——这就是所谓的 **Vibe Coding**。

作为一个后端出身、对前端一知半解的菜鸟，CSS 对我来说依然是个谜，TypeScript 报错我基本靠蒙，但这不妨碍博客跑起来。

---

## 技术栈

| 类别 | 技术 |
| :--- | :--- |
| 框架 | [Astro 6](https://astro.build) |
| 语言 | TypeScript |
| 内容 | Markdown / MDX |
| 图表 | [Mermaid](https://mermaid.js.org) |
| 图片优化 | sharp |
| 包管理 | pnpm |
| CI/CD | GitHub Actions |
| 服务器 | 自托管 + [Caddy](https://caddyserver.com) 反代 |

### 主要特性

- 🎨 **磨砂陶瓷 / 纸张**视觉风格——米色背景 + 噪点纹理 + 多层投影
- 🌗 **亮色 / 暗色主题**切换，带圆形扩散过渡动画
- 🔄 **View Transitions** 页面切换动效
- 📊 **Mermaid 图表**自动渲染，主题跟随明暗模式
- 📋 代码块**一键复制**按钮 + 复古终端风格高亮
- 🏷️ **标签系统** + 博文列表筛选
- 📖 **阅读进度条**
- 📰 **RSS Feed** + **Sitemap** 自动生成
- 🔁 **转载卡片**组件，展示原文作者、标题及外链

---

## 博客内容

博客内容以技术为主，偶尔夹杂一点生活：

- **后端踩坑**：Spring 事务、异步任务、微服务配置等日常翻车实录
- **语言杂谈**：Java 与 Kotlin 混用的一次小事故
- **Web 安全**：Chrome Private Network Access / Local Network Access 问题
- **游戏**：偶尔写写玩过的独立游戏体验（比如 MEWGENICS）
- **转载**：值得留存的好文章

---

## 项目结构

```text
src/
├── assets/BlogImg/       # 博文配图
├── components/
│   ├── Cards/            # PostCard、ReprintCard 等卡片组件
│   ├── HeaderAndFooter/  # Header、Footer、BaseHead
│   ├── FormattedDate.astro
│   ├── ReadingProgress.astro
│   ├── SmartIcon.astro   # 支持帧动画的图标组件
│   └── Tag.astro
├── content/blog/         # Markdown / MDX 博文
├── content.config.ts     # 内容集合 Schema
├── layouts/
│   └── BlogPost.astro    # 博文页面布局
├── pages/
│   ├── index.astro       # 首页
│   ├── blog/             # 博文列表 & 详情
│   └── tags/             # 标签页
├── styles/global.css     # 全局样式变量
└── consts.ts             # 站点配置常量
```

---

## 本地开发

```sh
# 安装依赖
pnpm install

# 启动开发服务器 http://localhost:4321
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

---

## 部署

推送到 `master` 分支后，GitHub Actions 自动完成：

1. 安装依赖（`pnpm install --frozen-lockfile`）
2. 构建静态文件（`astro build`）
3. 通过 SCP 将 `dist/` 上传至服务器
4. 重载 Caddy（`systemctl reload caddy`）

---

## Vibe Coding 说明

本项目 **95% 的代码由 AI（主要是 Claude）编写**，我的工作主要是：

- 👉 用人话描述我想要的效果
- 🔍 盯着页面说"这个再大一点""这个颜色不对"
- 🤔 在 AI 解释代码的时候假装听懂了
- ✅ 按下回车键确认部署

如果你是前端大佬，看到这份代码可能会有轻微不适，请多包涵。如果你也是菜鸟，希望这个项目能给你一点"AI 可以帮你搭起来一个还不错的博客"的信心。

---

## License

博客**源代码**使用 MIT 协议开源，随便用。  
博客**文章内容**版权归作者本人所有，转载请注明出处。
