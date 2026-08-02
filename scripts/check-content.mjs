import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
    assertValidPostMetadata,
    parsePostMetadata,
} from "./lib/content-metadata.mjs";

const contentRoot = path.resolve("src/content/blog");

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

const files = await findContentFiles(contentRoot);
const posts = await Promise.all(
    files.map(async (file) =>
        parsePostMetadata(await readFile(file, "utf8"), path.relative(process.cwd(), file)),
    ),
);

assertValidPostMetadata(posts);
console.log(`Content metadata check passed (${posts.length} posts).`);
