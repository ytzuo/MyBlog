import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { defineConfig } from "vitest/config";

const mermaidTestModuleId = "virtual:mermaid-enhancements-test";
const mermaidComponentPath = fileURLToPath(
    new URL(
        "./src/components/Blog/MermaidEnhancements.astro",
        import.meta.url,
    ),
);
const resolvedMermaidTestModuleId =
    `${mermaidComponentPath}?mermaid-enhancements-test`;

export default defineConfig({
    plugins: [
        {
            name: "mermaid-enhancements-test-module",
            resolveId(id) {
                return id === mermaidTestModuleId
                    ? resolvedMermaidTestModuleId
                    : null;
            },
            load(id) {
                if (id !== resolvedMermaidTestModuleId) return null;

                const component = readFileSync(
                    mermaidComponentPath,
                    "utf8",
                );
                const clientScript = component.match(
                    /<script>([\s\S]*?)<\/script>/,
                )?.[1];
                if (!clientScript) {
                    throw new Error(
                        "MermaidEnhancements.astro client script was not found.",
                    );
                }

                const transpiled = ts.transpileModule(
                    `${clientScript}\nexport { createMermaidZoomModal, openMermaidZoom, addMermaidZoomControls };`,
                    {
                        compilerOptions: {
                            module: ts.ModuleKind.ESNext,
                            sourceMap: true,
                            inlineSources: true,
                            target: ts.ScriptTarget.ES2022,
                        },
                        fileName: mermaidComponentPath,
                    },
                );

                return {
                    code: transpiled.outputText,
                    map: transpiled.sourceMapText
                        ? JSON.parse(transpiled.sourceMapText)
                        : null,
                };
            },
        },
    ],
    test: {
        environment: "jsdom",
        environmentOptions: {
            jsdom: {
                html: '<!doctype html><html lang="en"><body></body></html>',
                url: "https://example.test/blog/post/",
            },
        },
        include: ["tests/**/*.spec.ts"],
        setupFiles: ["./tests/setup-dom.ts"],
        clearMocks: true,
        restoreMocks: true,
        coverage: {
            provider: "v8",
            include: [
                "scripts/lib/content-metadata.mjs",
                "src/components/Blog/MermaidEnhancements.astro",
                "src/lib/i18n.ts",
                "src/lib/posts.ts",
                "src/lib/readingStats.ts",
                "src/lib/search.ts",
                "src/lib/tags.ts",
            ],
            reporter: ["text", "json", "html"],
            reportsDirectory: "coverage",
        },
    },
});
