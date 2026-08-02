import assert from "node:assert/strict";
import test from "node:test";
import { validatePostMetadata } from "../scripts/lib/content-metadata.mjs";

const post = (file, lang, translationKey, options = {}) => ({
    file,
    lang,
    translationKey,
    slug: options.slug ?? file,
    draft: options.draft ?? false,
});

test("accepts one Chinese and one English post per translation key", () => {
    const errors = validatePostMetadata([
        post("zh-post", "zh", "article"),
        post("en-post", "en", "article"),
    ]);
    assert.deepEqual(errors, []);
});

test("rejects a missing translation", () => {
    const errors = validatePostMetadata([post("zh-post", "zh", "article")]);
    assert.ok(errors.some((error) => error.includes("expected 2 translated posts")));
});

test("rejects duplicate locales and slugs", () => {
    const errors = validatePostMetadata([
        post("first", "zh", "article", { slug: "same" }),
        post("second", "zh", "article", { slug: "same" }),
    ]);
    assert.ok(errors.some((error) => error.includes("duplicate zh slug")));
    assert.ok(errors.some((error) => error.includes("expected 1 zh and 1 en")));
});

test("rejects mismatched draft states", () => {
    const errors = validatePostMetadata([
        post("zh-post", "zh", "article"),
        post("en-post", "en", "article", { draft: true }),
    ]);
    assert.ok(errors.some((error) => error.includes("same draft state")));
});
