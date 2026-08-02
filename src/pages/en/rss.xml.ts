import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { SITE_DESCRIPTION_EN, SITE_TITLE_EN } from "../../consts";
import { getPostUrl, isEnglishPost } from "../../lib/i18n";
import { isVisiblePost } from "../../lib/posts";

export const GET: APIRoute = async (context) => {
    if (!context.site) {
        throw new Error("Astro site URL is required to generate the RSS feed.");
    }
    const posts = (await getCollection("blog"))
        .filter((post) => isVisiblePost(post) && isEnglishPost(post))
        .sort(
            (a, b) =>
                new Date(b.data.pubDate).valueOf() -
                new Date(a.data.pubDate).valueOf(),
        );

    return rss({
        title: SITE_TITLE_EN,
        description: SITE_DESCRIPTION_EN,
        site: context.site,
        items: posts.map((post) => ({
            ...post.data,
            pubDate: new Date(post.data.pubDate),
            link: getPostUrl(post),
        })),
    });
};
