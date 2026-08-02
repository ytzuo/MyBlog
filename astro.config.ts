import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://saten.website',
	integrations: [
		mdx(),
		sitemap({ filter: (page) => !page.endsWith('/en/404/') }),
	],
	prefetch: true,
	compressHTML: true,
});
