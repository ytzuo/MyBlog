// @vitest-environment node

import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import {
    getLocaleFromPath,
    getLocaleLabel,
    getPostUrl,
    isEnglishPost,
    isNavigationPathActive,
    localizePath,
    translateTag,
} from "../src/lib/i18n";

type BlogPost = CollectionEntry<"blog">;

const post = (lang: "zh" | "en", slug: string): BlogPost =>
    ({ data: { lang, slug } }) as BlogPost;

describe("getLocaleFromPath", () => {
    it.each([
        ["/en", "en"],
        ["/en/", "en"],
        ["/en/blog/post/", "en"],
        ["/", "zh"],
        ["/english", "zh"],
    ] as const)("maps %s to %s", (pathname, expected) => {
        expect(getLocaleFromPath(pathname)).toBe(expected);
    });
});

describe("localizePath", () => {
    it("adds the English prefix and preserves a trailing path", () => {
        expect(localizePath("blog/post/", "en")).toBe(
            "/en/blog/post/",
        );
    });

    it("uses the canonical English root", () => {
        expect(localizePath("/", "en")).toBe("/en/");
    });

    it("removes the English prefix when switching to Chinese", () => {
        expect(localizePath("/en/blog/post/", "zh")).toBe(
            "/blog/post/",
        );
        expect(localizePath("/en", "zh")).toBe("/");
    });
});

describe("isNavigationPathActive", () => {
    it.each([
        ["/", "/", true],
        ["/blog/", "/blog", true],
        ["/blog/post/", "/blog", true],
        ["/about/", "/blog", false],
        ["/en/", "/en/", true],
        ["/en/blog/", "/en/blog", true],
        ["/en/blog/post/", "/en/blog", true],
        ["/en/about/", "/en/blog", false],
        ["/en/blog/", "/en/", false],
    ] as const)(
        "matches pathname %s against %s as %s",
        (pathname, href, expected) => {
            expect(isNavigationPathActive(pathname, href)).toBe(expected);
        },
    );
});

describe("post locale helpers", () => {
    it("identifies English posts and builds locale-aware URLs", () => {
        const englishPost = post("en", "typed-post");
        const chinesePost = post("zh", "中文文章");

        expect(isEnglishPost(englishPost)).toBe(true);
        expect(isEnglishPost(chinesePost)).toBe(false);
        expect(getPostUrl(englishPost)).toBe("/en/blog/typed-post/");
        expect(getPostUrl(chinesePost)).toBe("/blog/中文文章/");
    });
});

describe("getLocaleLabel", () => {
    it("returns the display label for each supported locale", () => {
        expect(getLocaleLabel("zh")).toBe("中文");
        expect(getLocaleLabel("en")).toBe("English");
    });
});

describe("translateTag", () => {
    it("translates known tags in both directions", () => {
        expect(translateTag("数据库", "en")).toBe("Databases");
        expect(translateTag("Databases", "zh")).toBe("数据库");
    });

    it("keeps unknown tags unchanged", () => {
        expect(translateTag("Astro", "en")).toBe("Astro");
        expect(translateTag("Astro", "zh")).toBe("Astro");
    });
});
