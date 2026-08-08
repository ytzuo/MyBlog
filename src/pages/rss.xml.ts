import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { getPostUrl } from '../lib/i18n';
import { getVisiblePosts } from '../lib/posts';

// 生成 RSS feed，包含所有博客文章
export const GET: APIRoute = async (context) => {
	if (!context.site) {
		throw new Error('Astro site URL is required to generate the RSS feed.');
	}
	const posts = await getVisiblePosts('zh');
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			pubDate: new Date(post.data.pubDate),
			link: getPostUrl(post),
		})),
	});
};
