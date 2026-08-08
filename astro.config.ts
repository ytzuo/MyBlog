import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

const noindexPaths = new Set([
	'/404/',
	'/en/404/',
	'/search/',
	'/en/search/',
]);

// https://astro.build/config
export default defineConfig({
	site: 'https://saten.website',
	integrations: [
		mdx(),
		sitemap({
			filter: (page) => !noindexPaths.has(new URL(page).pathname),
		}),
	],
	prefetch: true,
	compressHTML: true,
});
