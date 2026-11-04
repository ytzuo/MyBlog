// @vitest-environment node

import { describe, expect, it } from "vitest";
import { stripMarkdownFencedCodeBlocks } from "../src/lib/markdown";

describe("stripMarkdownFencedCodeBlocks", () => {
    it("removes backtick and tilde fenced blocks with 0 to 3 spaces indentation", () => {
        const markdown = [
            "before",
            "```ts",
            "const ignoredBackticks = true;",
            "```",
            "  ~~~js",
            "const ignoredTildes = true;",
            "  ~~~",
            "after",
        ].join("\n");

        const stripped = stripMarkdownFencedCodeBlocks(markdown);

        expect(stripped).toContain("before");
        expect(stripped).toContain("after");
        expect(stripped).not.toContain("ignoredBackticks");
        expect(stripped).not.toContain("ignoredTildes");
    });

    it("requires closing fences to use the same marker with at least the opening length", () => {
        const markdown = [
            "start",
            "````md",
            "```",
            "short backtick example stays inside code",
            "~~~",
            "wrong marker stays inside code",
            "````",
            "end",
        ].join("\n");

        const stripped = stripMarkdownFencedCodeBlocks(markdown);

        expect(stripped).toContain("start");
        expect(stripped).toContain("end");
        expect(stripped).not.toContain("short backtick example");
        expect(stripped).not.toContain("wrong marker");
    });

    it("supports CRLF, multiple blocks, and strips an unclosed block to the end", () => {
        const markdown = [
            "first",
            "~~~",
            "ignored one",
            "~~~~",
            "second",
            "```",
            "ignored two",
        ].join("\r\n");

        const stripped = stripMarkdownFencedCodeBlocks(markdown);

        expect(stripped).toContain("first");
        expect(stripped).toContain("second");
        expect(stripped).not.toContain("ignored one");
        expect(stripped).not.toContain("ignored two");
    });

    it("preserves indented text beyond Markdown fence indentation and inline code", () => {
        const markdown = [
            "    ```",
            "still text `inline-code`",
            "    ~~~",
        ].join("\n");

        expect(stripMarkdownFencedCodeBlocks(markdown)).toBe(markdown);
    });
});
