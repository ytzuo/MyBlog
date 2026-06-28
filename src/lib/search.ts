import type { CollectionEntry } from "astro:content";

export interface SearchIndexItem {
    title: string;
    description: string;
    url: string;
    pubDate: string;
    tags: string[];
    content: string;
}

type BlogEntryWithBody = CollectionEntry<"blog"> & {
    body?: string;
};

const compactWhitespace = (value: string): string =>
    value.replace(/\s+/g, " ").trim();

export const stripMarkdown = (value: string): string =>
    compactWhitespace(
        value
            .replace(/^---[\s\S]*?---/, " ")
            .replace(/```[\s\S]*?```/g, " ")
            .replace(/`([^`]+)`/g, "$1")
            .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
            .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
            .replace(/^#{1,6}\s+/gm, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/[*_~>`#-]/g, " "),
    );

export const buildSearchIndexItem = (
    post: BlogEntryWithBody,
): SearchIndexItem => ({
    title: post.data.title,
    description: post.data.description,
    url: `/blog/${post.id}/`,
    pubDate: post.data.pubDate,
    tags: post.data.tags ?? [],
    content: stripMarkdown(post.body ?? ""),
});
