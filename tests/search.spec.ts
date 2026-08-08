// @vitest-environment node

import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import {
    buildSearchIndexItem,
    stripMarkdown,
} from "../src/lib/search";

type BlogPost = CollectionEntry<"blog"> & { body?: string };

const post = (
    data: Partial<BlogPost["data"]> &
        Pick<BlogPost["data"], "title" | "description" | "slug" | "pubDate" | "lang">,
    body?: string,
): BlogPost => ({ data, body }) as BlogPost;

describe("stripMarkdown", () => {
    it("keeps searchable text while removing Markdown structure", () => {
        const markdown = `---
title: ignored metadata
---
# Heading
**bold** [link](https://example.com) \`inline\`
![ignored alt](image.png)
\`\`\`ts
const ignored = true;
\`\`\`
<span>HTML text</span>
`;

        expect(stripMarkdown(markdown)).toBe(
            "Heading bold link inline HTML text",
        );
    });

    it("compacts repeated whitespace", () => {
        expect(stripMarkdown("first\n\n\tsecond   third")).toBe(
            "first second third",
        );
    });
});

describe("buildSearchIndexItem", () => {
    it("builds an English search item with normalized body content", () => {
        const item = buildSearchIndexItem(
            post(
                {
                    title: "Typed search",
                    description: "Search description",
                    slug: "typed-search",
                    pubDate: "2026-08-08",
                    lang: "en",
                    tags: ["TypeScript", "Astro"],
                },
                "## Search **body**",
            ),
        );

        expect(item).toEqual({
            title: "Typed search",
            description: "Search description",
            url: "/en/blog/typed-search/",
            pubDate: "2026-08-08",
            tags: ["TypeScript", "Astro"],
            content: "Search body",
        });
    });

    it("defaults optional tags and body for Chinese posts", () => {
        const item = buildSearchIndexItem(
            post({
                title: "中文搜索",
                description: "搜索描述",
                slug: "中文搜索",
                pubDate: "2026-08-07",
                lang: "zh",
            }),
        );

        expect(item.tags).toEqual([]);
        expect(item.content).toBe("");
        expect(item.url).toBe("/blog/中文搜索/");
    });
});
