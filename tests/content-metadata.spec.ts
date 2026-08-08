// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
    assertValidPostMetadata,
    parsePostMetadata,
    validatePostMetadata,
} from "../scripts/lib/content-metadata.mjs";

type Locale = "zh" | "en";

interface PostMetadata {
    file: string;
    lang: Locale;
    translationKey: string;
    slug: string;
    draft: boolean;
}

const post = (
    file: string,
    lang: Locale,
    translationKey: string,
    options: Partial<Pick<PostMetadata, "slug" | "draft">> = {},
): PostMetadata => ({
    file,
    lang,
    translationKey,
    slug: options.slug ?? file,
    draft: options.draft ?? false,
});

describe("parsePostMetadata", () => {
    it("parses required fields and applies Chinese published defaults", () => {
        const metadata = parsePostMetadata(
            `---
slug: getting-started
translationKey: getting-started
---
Article body
`,
            "getting-started.md",
        );

        expect(metadata).toEqual({
            file: "getting-started.md",
            slug: "getting-started",
            translationKey: "getting-started",
            lang: "zh",
            draft: false,
        });
    });

    it("unquotes scalar values and parses an English draft", () => {
        const metadata = parsePostMetadata(
            `---
slug: "english-post"
translationKey: 'shared-post'
lang: en
draft: true
---
`,
            "english-post.md",
        );

        expect(metadata).toEqual({
            file: "english-post.md",
            slug: "english-post",
            translationKey: "shared-post",
            lang: "en",
            draft: true,
        });
    });

    it.each([
        {
            name: "missing Frontmatter",
            source: "Article body only",
            message: "post.md: missing Frontmatter block",
        },
        {
            name: "missing slug",
            source: "---\ntranslationKey: shared-post\n---\n",
            message: "post.md: missing slug",
        },
        {
            name: "invalid draft state",
            source:
                "---\nslug: post\ntranslationKey: shared-post\ndraft: yes\n---\n",
            message: "post.md: draft must be true or false",
        },
        {
            name: "unsupported locale",
            source:
                "---\nslug: post\ntranslationKey: shared-post\nlang: fr\n---\n",
            message: "post.md: lang must be zh or en",
        },
    ])("rejects $name", ({ source, message }) => {
        expect(() => parsePostMetadata(source, "post.md")).toThrow(
            message,
        );
    });
});

describe("validatePostMetadata", () => {
    it("accepts one Chinese and one English post per translation key", () => {
        const errors = validatePostMetadata([
            post("zh-post", "zh", "article"),
            post("en-post", "en", "article"),
        ]);

        expect(errors).toEqual([]);
    });

    it("rejects a missing translation", () => {
        const errors = validatePostMetadata([
            post("zh-post", "zh", "article"),
        ]);

        expect(errors).toEqual(
            expect.arrayContaining([
                expect.stringContaining("expected 2 translated posts"),
            ]),
        );
    });

    it("rejects duplicate locales and slugs", () => {
        const errors = validatePostMetadata([
            post("first", "zh", "article", { slug: "same" }),
            post("second", "zh", "article", { slug: "same" }),
        ]);

        expect(errors).toEqual(
            expect.arrayContaining([
                expect.stringContaining("duplicate zh slug"),
                expect.stringContaining("expected 1 zh and 1 en"),
            ]),
        );
    });

    it("rejects mismatched draft states", () => {
        const errors = validatePostMetadata([
            post("zh-post", "zh", "article"),
            post("en-post", "en", "article", { draft: true }),
        ]);

        expect(errors).toEqual(
            expect.arrayContaining([
                expect.stringContaining("same draft state"),
            ]),
        );
    });
});

describe("assertValidPostMetadata", () => {
    it("returns normally for valid translated posts", () => {
        const posts = [
            post("zh-post", "zh", "article"),
            post("en-post", "en", "article"),
        ];

        expect(() => assertValidPostMetadata(posts)).not.toThrow();
    });

    it("throws one formatted error containing every validation issue", () => {
        const posts = [
            post("first", "zh", "article", { slug: "same" }),
            post("second", "zh", "article", { slug: "same" }),
        ];

        expect(() => assertValidPostMetadata(posts)).toThrow(
            /Content metadata check failed:\n- .*duplicate zh slug[\s\S]*\n- .*expected 1 zh and 1 en/,
        );
    });
});
