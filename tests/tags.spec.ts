// @vitest-environment node

import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import {
    buildTagCounts,
    buildTagSummaries,
    getRelatedTagSummaries,
    sortPostsByDateDesc,
} from "../src/lib/tags";

type BlogPost = CollectionEntry<"blog">;

const post = ({
    title,
    slug,
    pubDate,
    tags,
    lang = "zh",
}: {
    title: string;
    slug: string;
    pubDate: string;
    tags?: string[];
    lang?: "zh" | "en";
}): BlogPost =>
    ({ data: { title, slug, pubDate, tags, lang } }) as BlogPost;

const olderPost = post({
    title: "Older database post",
    slug: "older-database",
    pubDate: "2026-01-01",
    tags: ["Databases", "Astro"],
});
const middlePost = post({
    title: "Middle Astro post",
    slug: "middle-astro",
    pubDate: "2026-02-01",
    tags: ["Astro"],
});
const newestPost = post({
    title: "Newest database post",
    slug: "newest-database",
    pubDate: "2026-03-01",
    tags: ["Databases", "TypeScript"],
    lang: "en",
});

describe("sortPostsByDateDesc", () => {
    it("returns newest-first posts without mutating the input", () => {
        const posts = [olderPost, newestPost, middlePost];

        expect(sortPostsByDateDesc(posts)).toEqual([
            newestPost,
            middlePost,
            olderPost,
        ]);
        expect(posts).toEqual([olderPost, newestPost, middlePost]);
    });
});

describe("buildTagSummaries", () => {
    it("counts tags and keeps each tag's latest post", () => {
        const summaries = buildTagSummaries([
            olderPost,
            middlePost,
            newestPost,
            post({
                title: "Untagged",
                slug: "untagged",
                pubDate: "2026-04-01",
            }),
        ]);

        expect(summaries).toEqual([
            {
                name: "Databases",
                count: 2,
                latestPostTitle: "Newest database post",
                latestPostUrl: "/en/blog/newest-database/",
                latestPubDate: "2026-03-01",
            },
            {
                name: "Astro",
                count: 2,
                latestPostTitle: "Middle Astro post",
                latestPostUrl: "/blog/middle-astro/",
                latestPubDate: "2026-02-01",
            },
            {
                name: "TypeScript",
                count: 1,
                latestPostTitle: "Newest database post",
                latestPostUrl: "/en/blog/newest-database/",
                latestPubDate: "2026-03-01",
            },
        ]);
    });

    it("uses the tag name to break count and date ties", () => {
        const summaries = buildTagSummaries([
            post({
                title: "Tie",
                slug: "tie",
                pubDate: "2026-01-01",
                tags: ["Beta", "Alpha"],
            }),
        ]);

        expect(summaries.map((summary) => summary.name)).toEqual([
            "Alpha",
            "Beta",
        ]);
    });
});

describe("buildTagCounts", () => {
    it("converts summaries into a tag lookup", () => {
        expect(
            buildTagCounts(buildTagSummaries([olderPost, newestPost])),
        ).toEqual({ Databases: 2, Astro: 1, TypeScript: 1 });
    });
});

describe("getRelatedTagSummaries", () => {
    it("aggregates co-occurring tags and excludes the current tag", () => {
        const related = getRelatedTagSummaries(
            [olderPost, newestPost],
            "Databases",
        );

        expect(related.map(({ name, count }) => ({ name, count }))).toEqual([
            { name: "TypeScript", count: 1 },
            { name: "Astro", count: 1 },
        ]);
    });
});
