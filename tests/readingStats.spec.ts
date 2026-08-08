// @vitest-environment node

import { describe, expect, it } from "vitest";
import { getReadingStats } from "../src/lib/readingStats";

describe("getReadingStats", () => {
    it("returns a one-minute Chinese reading time for empty content", () => {
        expect(getReadingStats("")).toEqual({
            wordCount: 0,
            readingMinutes: 1,
            wordCountText: "0 字",
            readingTimeText: "约 1 分钟",
        });
    });

    it("counts readable Markdown text while excluding metadata and assets", () => {
        const content = `---
title: ignored metadata
---
# 标题 Hello world
[链接](https://example.com) \`inline-code\`
![ignored alt](image.png)
\`\`\`ts
const ignored = true;
\`\`\`
`;

        expect(getReadingStats(content)).toEqual({
            wordCount: 7,
            readingMinutes: 1,
            wordCountText: "7 字",
            readingTimeText: "约 1 分钟",
        });
    });

    it("uses the English reading speed and rounds minutes up", () => {
        const content = Array.from(
            { length: 226 },
            (_, index) => `word-${index}`,
        ).join(" ");

        expect(getReadingStats(content, "en")).toEqual({
            wordCount: 226,
            readingMinutes: 2,
            wordCountText: "226 words",
            readingTimeText: "2 min read",
        });
    });

    it("formats large Chinese counts in ten-thousands", () => {
        const stats = getReadingStats("文".repeat(10_000));

        expect(stats.wordCount).toBe(10_000);
        expect(stats.readingMinutes).toBe(25);
        expect(stats.wordCountText).toBe("1.0 万字");
    });
});
