import type { CollectionEntry } from "astro:content";

/**
 * Drafts remain previewable during local development, but are excluded from
 * every production collection consumer (pages, feeds, tags, and search).
 */
export const isVisiblePost = (post: CollectionEntry<"blog">): boolean =>
    import.meta.env.DEV || !post.data.draft;

export const assertUniquePostSlugs = (
    posts: CollectionEntry<"blog">[],
    localeLabel: string,
): void => {
    const seen = new Set<string>();

    for (const post of posts) {
        if (seen.has(post.data.slug)) {
            throw new Error(
                `Duplicate ${localeLabel} blog slug: ${post.data.slug}`,
            );
        }
        seen.add(post.data.slug);
    }
};
