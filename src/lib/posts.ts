import { getCollection, type CollectionEntry } from "astro:content";
import type { Locale } from "./i18n";

type BlogPost = CollectionEntry<"blog">;

export interface PostNavigation {
    previousPost?: BlogPost;
    nextPost?: BlogPost;
}

/**
 * Drafts remain previewable during local development, but are excluded from
 * every production collection consumer (pages, feeds, tags, and search).
 */
export const isVisiblePost = (post: CollectionEntry<"blog">): boolean =>
    import.meta.env.DEV || !post.data.draft;

/**
 * Returns posts visible in the current environment for one locale, newest first.
 * Keep collection-wide visibility and ordering rules centralized here so every
 * public entry point handles drafts consistently.
 */
export const getVisiblePosts = async (locale: Locale): Promise<BlogPost[]> =>
    (await getCollection("blog"))
        .filter((post) => isVisiblePost(post) && post.data.lang === locale)
        .sort(
            (a, b) =>
                new Date(b.data.pubDate).valueOf() -
                new Date(a.data.pubDate).valueOf(),
        );

/**
 * Returns the posts immediately before and after the current post in
 * chronological order. translationKey keeps same-day ordering stable across
 * the Chinese and English collections.
 */
export const getPostNavigation = (
    posts: BlogPost[],
    currentPost: BlogPost,
): PostNavigation => {
    const chronologicalPosts = [...posts].sort((a, b) => {
        const dateDifference =
            new Date(a.data.pubDate).valueOf() -
            new Date(b.data.pubDate).valueOf();
        return (
            dateDifference ||
            a.data.translationKey.localeCompare(b.data.translationKey)
        );
    });
    const currentIndex = chronologicalPosts.findIndex(
        (post) =>
            post.data.lang === currentPost.data.lang &&
            post.data.slug === currentPost.data.slug,
    );

    if (currentIndex === -1) return {};

    return {
        previousPost: chronologicalPosts[currentIndex - 1],
        nextPost: chronologicalPosts[currentIndex + 1],
    };
};

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

export const assertValidTranslationPairs = (
    posts: CollectionEntry<"blog">[],
): void => {
    const postsByKey = new Map<string, CollectionEntry<"blog">[]>();

    for (const post of posts) {
        const pair = postsByKey.get(post.data.translationKey) ?? [];
        pair.push(post);
        postsByKey.set(post.data.translationKey, pair);
    }

    const errors: string[] = [];
    for (const [translationKey, pair] of postsByKey) {
        const chinesePosts = pair.filter((post) => post.data.lang === "zh");
        const englishPosts = pair.filter((post) => post.data.lang === "en");

        if (pair.length !== 2) {
            errors.push(
                `${translationKey}: expected 2 posts, found ${pair.length}`,
            );
        }
        if (chinesePosts.length !== 1 || englishPosts.length !== 1) {
            errors.push(
                `${translationKey}: expected 1 Chinese and 1 English post, found ${chinesePosts.length} Chinese and ${englishPosts.length} English`,
            );
        }
        if (
            chinesePosts.length === 1 &&
            englishPosts.length === 1 &&
            chinesePosts[0].data.draft !== englishPosts[0].data.draft
        ) {
            errors.push(
                `${translationKey}: Chinese and English draft states must match`,
            );
        }
    }

    if (errors.length > 0) {
        throw new Error(`Invalid blog translation pairs:\n- ${errors.join("\n- ")}`);
    }
};
