---
title: "The First Version of This Blog Is Done"
description: "A quick note about the initial build"
pubDate: "Feb 09 2026"
heroImage: "../../../assets/blog-placeholder-1.jpg"
tags: ["Astro", "Notes"]
lang: "en"
translationKey: "初期施工完成"
---

After a stretch of intense vibe coding, the first version of my personal blog is finally ready. 🎉

## 🛠️ Technology overview

- **Core framework:** [Astro](https://astro.build/), chosen for its content-first approach and excellent static-site performance.
- **Content:** [MDX](https://mdxjs.com/) through `@astrojs/mdx`, so components can be embedded in Markdown.
- **Styling:** native CSS and Astro scoped styles, keeping components isolated without a large CSS framework.
- **Build tool:** Vite, built into Astro.
- **SEO and feeds:** `@astrojs/sitemap` and `@astrojs/rss`.

## Current progress

- [x] Post lists and article pages
- [x] Tag filtering
- [x] Playful interactive ghosts
- [x] Responsive design

My favorite part is the screen full of Lost ghosts. I spent an entire evening finding and separating the sprites, and it was worth it.

I originally wanted to use an animation player from *The Binding of Isaac* Wiki, but its official GitHub repository had no documentation. I eventually used a practical workaround: cycle through the extracted game sprites in sequence to recreate the animation.
