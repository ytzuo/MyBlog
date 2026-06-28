import type { CollectionEntry } from "astro:content";

type BlogPost = CollectionEntry<"blog">;

export interface TagSummary {
    name: string;
    count: number;
    latestPostTitle: string;
    latestPostUrl: string;
    latestPubDate: string;
}

const getPostTime = (post: BlogPost): number =>
    new Date(post.data.pubDate).valueOf();

export const sortPostsByDateDesc = (posts: BlogPost[]): BlogPost[] =>
    [...posts].sort((a, b) => getPostTime(b) - getPostTime(a));

export const buildTagSummaries = (posts: BlogPost[]): TagSummary[] => {
    const sortedPosts = sortPostsByDateDesc(posts);
    const summaryByTag = new Map<string, TagSummary>();

    sortedPosts.forEach((post) => {
        (post.data.tags || []).forEach((tag) => {
            const summary = summaryByTag.get(tag);
            if (summary) {
                summary.count += 1;
                return;
            }

            summaryByTag.set(tag, {
                name: tag,
                count: 1,
                latestPostTitle: post.data.title,
                latestPostUrl: `/blog/${post.id}/`,
                latestPubDate: post.data.pubDate,
            });
        });
    });

    return [...summaryByTag.values()].sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        const latestDiff =
            new Date(b.latestPubDate).valueOf() -
            new Date(a.latestPubDate).valueOf();
        if (latestDiff !== 0) return latestDiff;
        return a.name.localeCompare(b.name);
    });
};

export const buildTagCounts = (
    tagSummaries: TagSummary[],
): Record<string, number> =>
    Object.fromEntries(
        tagSummaries.map((summary) => [summary.name, summary.count]),
    );

export const getRelatedTagSummaries = (
    posts: BlogPost[],
    currentTag: string,
): TagSummary[] =>
    buildTagSummaries(
        posts.filter((post) =>
            (post.data.tags || []).some((tag) => tag !== currentTag),
        ),
    ).filter((summary) => summary.name !== currentTag);
