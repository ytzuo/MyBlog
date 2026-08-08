import { getVisiblePosts } from "../lib/posts";
import { buildSearchIndexItem } from "../lib/search";

export async function GET() {
    const posts = await getVisiblePosts("zh");

    return new Response(JSON.stringify(posts.map(buildSearchIndexItem)), {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
        },
    });
}
