// @vitest-environment node

import type { CollectionEntry } from "astro:content";
import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

const { getCollectionMock } = vi.hoisted(() => ({
    getCollectionMock: vi.fn(),
}));

vi.mock("astro:content", () => ({
    getCollection: getCollectionMock,
}));

import {
    assertUniquePostSlugs,
    assertValidTranslationPairs,
    getPostNavigation,
    getVisiblePosts,
    isVisiblePost,
} from "../src/lib/posts";

type BlogPost = CollectionEntry<"blog">;

const post = ({
    slug,
    translationKey = slug,
    lang = "zh",
    pubDate = "2026-01-01",
    draft = false,
}: {
    slug: string;
    translationKey?: string;
    lang?: "zh" | "en";
    pubDate?: string;
    draft?: boolean;
}): BlogPost =>
    ({
        data: {
            slug,
            translationKey,
            lang,
            pubDate,
            draft,
        },
    }) as BlogPost;

afterEach(() => {
    getCollectionMock.mockReset();
    vi.unstubAllEnvs();
});

describe("isVisiblePost", () => {
    it("excludes drafts in production", () => {
        vi.stubEnv("DEV", false);

        expect(isVisiblePost(post({ slug: "published" }))).toBe(true);
        expect(
            isVisiblePost(post({ slug: "draft", draft: true })),
        ).toBe(false);
    });

    it("keeps drafts previewable during development", () => {
        vi.stubEnv("DEV", true);

        expect(
            isVisiblePost(post({ slug: "draft", draft: true })),
        ).toBe(true);
    });
});

describe("getVisiblePosts", () => {
    it("returns production posts for one locale, newest first", async () => {
        vi.stubEnv("DEV", false);
        const older = post({
            slug: "older",
            pubDate: "2026-01-01",
        });
        const newer = post({
            slug: "newer",
            pubDate: "2026-03-01",
        });
        getCollectionMock.mockResolvedValue([
            older,
            post({
                slug: "english",
                lang: "en",
                pubDate: "2026-04-01",
            }),
            post({
                slug: "draft",
                pubDate: "2026-05-01",
                draft: true,
            }),
            newer,
        ]);

        await expect(getVisiblePosts("zh")).resolves.toEqual([
            newer,
            older,
        ]);
        expect(getCollectionMock).toHaveBeenCalledOnce();
        expect(getCollectionMock).toHaveBeenCalledWith("blog");
    });

    it("includes drafts in development while retaining locale filtering", async () => {
        vi.stubEnv("DEV", true);
        const draft = post({
            slug: "draft",
            lang: "en",
            draft: true,
        });
        getCollectionMock.mockResolvedValue([
            draft,
            post({ slug: "chinese", lang: "zh" }),
        ]);

        await expect(getVisiblePosts("en")).resolves.toEqual([draft]);
    });
});

describe("getPostNavigation", () => {
    it("returns chronological neighbors without mutating the input", () => {
        const oldest = post({
            slug: "oldest",
            pubDate: "2026-01-01",
        });
        const current = post({
            slug: "current",
            pubDate: "2026-02-01",
        });
        const newest = post({
            slug: "newest",
            pubDate: "2026-03-01",
        });
        const posts = [newest, oldest, current];

        expect(getPostNavigation(posts, current)).toEqual({
            previousPost: oldest,
            nextPost: newest,
        });
        expect(posts).toEqual([newest, oldest, current]);
    });

    it("uses translation keys to order posts published on the same day", () => {
        const alpha = post({
            slug: "alpha",
            translationKey: "alpha",
        });
        const beta = post({
            slug: "beta",
            translationKey: "beta",
        });
        const gamma = post({
            slug: "gamma",
            translationKey: "gamma",
        });

        expect(getPostNavigation([gamma, alpha, beta], beta)).toEqual({
            previousPost: alpha,
            nextPost: gamma,
        });
    });

    it("returns no navigation for a post outside the collection", () => {
        expect(
            getPostNavigation(
                [post({ slug: "known" })],
                post({ slug: "missing" }),
            ),
        ).toEqual({});
    });
});

describe("assertUniquePostSlugs", () => {
    it("accepts unique slugs", () => {
        expect(() =>
            assertUniquePostSlugs(
                [post({ slug: "first" }), post({ slug: "second" })],
                "Chinese",
            ),
        ).not.toThrow();
    });

    it("reports the locale and duplicate slug", () => {
        expect(() =>
            assertUniquePostSlugs(
                [post({ slug: "same" }), post({ slug: "same" })],
                "Chinese",
            ),
        ).toThrow("Duplicate Chinese blog slug: same");
    });
});

describe("assertValidTranslationPairs", () => {
    it("accepts one Chinese and one English post with matching draft states", () => {
        expect(() =>
            assertValidTranslationPairs([
                post({ slug: "zh", translationKey: "article" }),
                post({
                    slug: "en",
                    translationKey: "article",
                    lang: "en",
                }),
            ]),
        ).not.toThrow();
    });

    it("aggregates missing and duplicate-locale translation errors", () => {
        expect(() =>
            assertValidTranslationPairs([
                post({ slug: "first", translationKey: "article" }),
                post({ slug: "second", translationKey: "article" }),
                post({ slug: "lonely", translationKey: "lonely" }),
            ]),
        ).toThrow(
            /article: expected 1 Chinese and 1 English post[\s\S]*lonely: expected 2 posts, found 1/,
        );
    });

    it("rejects translated posts with mismatched draft states", () => {
        expect(() =>
            assertValidTranslationPairs([
                post({ slug: "zh", translationKey: "article" }),
                post({
                    slug: "en",
                    translationKey: "article",
                    lang: "en",
                    draft: true,
                }),
            ]),
        ).toThrow("Chinese and English draft states must match");
    });
});
