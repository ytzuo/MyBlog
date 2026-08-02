import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { getPostUrl, isEnglishPost } from '../lib/i18n';
import { isVisiblePost } from '../lib/posts';

// 生成 RSS feed，包含所有博客文章
export const GET: APIRoute = async (context) => {
	const posts = (await getCollection('blog'))
		.filter((post) => isVisiblePost(post) && !isEnglishPost(post))
		.sort(
			(a, b) =>
				new Date(b.data.pubDate).valueOf() -
				new Date(a.data.pubDate).valueOf(),
		);
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
