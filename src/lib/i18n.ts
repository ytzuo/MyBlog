import type { CollectionEntry } from "astro:content";

export type Locale = "zh" | "en";

export const DEFAULT_LOCALE: Locale = "zh";

export const getLocaleFromPath = (pathname: string): Locale =>
    pathname === "/en" || pathname.startsWith("/en/") ? "en" : "zh";

export const localizePath = (path: string, locale: Locale): string => {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    if (locale === "en") {
        return normalized === "/" ? "/en/" : `/en${normalized}`;
    }
    return normalized.replace(/^\/en(?=\/|$)/, "") || "/";
};

const normalizeNavigationPath = (path: string): string => {
    const pathname = path.split(/[?#]/, 1)[0] || "/";
    const normalized = pathname.startsWith("/")
        ? pathname
        : `/${pathname}`;
    return normalized === "/" ? normalized : normalized.replace(/\/+$/, "");
};

export const isNavigationPathActive = (
    pathname: string,
    href: string,
): boolean => {
    const currentPath = normalizeNavigationPath(pathname);
    const targetPath = normalizeNavigationPath(href);
    const isLocaleRoot = targetPath === "/" || targetPath === "/en";

    return (
        currentPath === targetPath ||
        (!isLocaleRoot && currentPath.startsWith(`${targetPath}/`))
    );
};

export const isEnglishPost = (
    post: CollectionEntry<"blog">,
): boolean => post.data.lang === "en";

export const getPostUrl = (post: CollectionEntry<"blog">): string =>
    isEnglishPost(post)
        ? `/en/blog/${post.data.slug}/`
        : `/blog/${post.data.slug}/`;

export const getLocaleLabel = (locale: Locale): string =>
    locale === "en" ? "English" : "中文";

const TAG_TRANSLATIONS: Record<string, string> = {
    事务: "Transactions",
    数据库: "Databases",
    记录: "Notes",
    游戏: "Games",
    缓存设计: "Caching",
    Linux运维: "Linux Operations",
    "Web 安全": "Web Security",
    转载: "Repost",
};

const ENGLISH_TO_CHINESE_TAG = Object.fromEntries(
    Object.entries(TAG_TRANSLATIONS).map(([chinese, english]) => [
        english,
        chinese,
    ]),
);

export const translateTag = (tag: string, locale: Locale): string =>
    locale === "en"
        ? (TAG_TRANSLATIONS[tag] ?? tag)
        : (ENGLISH_TO_CHINESE_TAG[tag] ?? tag);
