import { getCollection } from "astro:content";
import { isEnglishPost } from "../../lib/i18n";
import { isVisiblePost } from "../../lib/posts";
import { buildSearchIndexItem } from "../../lib/search";

export async function GET() {
    const posts = (await getCollection("blog"))
        .filter((post) => isVisiblePost(post) && isEnglishPost(post))
        .sort(
            (a, b) =>
                new Date(b.data.pubDate).valueOf() -
                new Date(a.data.pubDate).valueOf(),
        );

    return new Response(JSON.stringify(posts.map(buildSearchIndexItem)), {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
        },
    });
}
