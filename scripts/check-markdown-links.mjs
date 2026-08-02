import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parsePostMetadata } from "./lib/content-metadata.mjs";

const contentRoot = path.resolve("src/content/blog");
const distRoot = path.resolve("dist");

const findContentFiles = async (directory) => {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(
        entries.map(async (entry) => {
            const entryPath = path.join(directory, entry.name);
            if (entry.isDirectory()) return findContentFiles(entryPath);
            return /\.(?:md|mdx)$/.test(entry.name) ? [entryPath] : [];
        }),
    );
    return files.flat();
};

const extractLinkTargets = (source) => {
    const withoutCode = source
        .replace(/```[\s\S]*?```/g, "")
        .replace(/~~~[\s\S]*?~~~/g, "")
        .replace(/`[^`]*`/g, "");
    const targets = new Set();
    const patterns = [
        /(?<!!)\[[^\]]*]\(\s*(<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\s*\)/g,
        /^\s*\[[^\]]+]:\s*(<[^>]+>|\S+)/gm,
        /\bhref=["']([^"']+)["']/g,
    ];

    for (const pattern of patterns) {
        for (const match of withoutCode.matchAll(pattern)) {
            const target = match[1].replace(/^<|>$/g, "");
            targets.add(target);
        }
    }
    return [...targets];
};

const isExternalTarget = (target) =>
    target.startsWith("//") || /^[a-z][a-z\d+.-]*:/i.test(target);

const findBuiltTarget = async (pathname) => {
    let decodedPath;
    try {
        decodedPath = decodeURIComponent(pathname);
    } catch {
        return undefined;
    }

    const relativePath = decodedPath.replace(/^\/+/, "");
    const resolvedPath = path.resolve(distRoot, relativePath);
    if (resolvedPath !== distRoot && !resolvedPath.startsWith(`${distRoot}${path.sep}`)) {
        return undefined;
    }

    const candidates = decodedPath.endsWith("/")
        ? [path.join(resolvedPath, "index.html")]
        : [resolvedPath, `${resolvedPath}.html`, path.join(resolvedPath, "index.html")];

    for (const candidate of candidates) {
        try {
            if ((await stat(candidate)).isFile()) return candidate;
        } catch {
            // Try the next static-output shape.
        }
    }
    return undefined;
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

await access(distRoot).catch(() => {
    throw new Error("dist/ does not exist; run the production build before checking links");
});

const files = await findContentFiles(contentRoot);
const failures = [];
let checkedLinks = 0;

for (const file of files) {
    const relativeFile = path.relative(process.cwd(), file);
    const source = await readFile(file, "utf8");
    const metadata = parsePostMetadata(source, relativeFile);
    const routePrefix = metadata.lang === "en" ? "/en" : "";
    const sourceUrl = `https://saten.website${routePrefix}/blog/${metadata.slug}/`;

    for (const target of extractLinkTargets(source)) {
        if (isExternalTarget(target)) continue;

        const resolvedUrl = new URL(target, sourceUrl);
        const builtTarget = await findBuiltTarget(resolvedUrl.pathname);
        checkedLinks += 1;

        if (!builtTarget) {
            failures.push(`${relativeFile}: ${target} points to a missing page`);
            continue;
        }

        if (resolvedUrl.hash.length > 1 && builtTarget.endsWith(".html")) {
            const fragment = decodeURIComponent(resolvedUrl.hash.slice(1));
            const html = await readFile(builtTarget, "utf8");
            const idPattern = new RegExp(`\\bid=["']${escapeRegExp(fragment)}["']`);
            if (!idPattern.test(html)) {
                failures.push(`${relativeFile}: ${target} points to a missing anchor`);
            }
        }
    }
}

if (failures.length > 0) {
    throw new Error(`Markdown internal-link check failed:\n- ${failures.join("\n- ")}`);
}

console.log(`Markdown internal-link check passed (${checkedLinks} internal links).`);
