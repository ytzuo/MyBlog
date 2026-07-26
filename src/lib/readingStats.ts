export interface ReadingStats {
    wordCount: number;
    readingMinutes: number;
    wordCountText: string;
    readingTimeText: string;
}

const stripMarkdownForReading = (value: string): string =>
    value
        .replace(/^---[\s\S]*?---/, " ")
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
        .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
        .replace(/<[^>]+>/g, " ")
        .replace(/^#{1,6}\s+/gm, " ")
        .replace(/[*_~>`#|:[\]{}()\\/+.,;!?，。；：！？、“”‘’（）【】《》]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const formatWordCount = (wordCount: number, locale: Locale): string => {
    if (locale === "en") {
        return `${wordCount.toLocaleString("en-US")} words`;
    }
    if (wordCount >= 10000) {
        const wan = wordCount / 10000;
        return `${wan.toFixed(wan >= 10 ? 0 : 1)} 万字`;
    }
    return `${wordCount.toLocaleString("zh-CN")} 字`;
};

export const getReadingStats = (
    content: string,
    locale: Locale = "zh",
): ReadingStats => {
    const plainText = stripMarkdownForReading(content);
    const cjkCount = (plainText.match(/[\u3400-\u9fff]/g) || []).length;
    const latinWordCount = (
        plainText
            .replace(/[\u3400-\u9fff]/g, " ")
            .match(/[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*/g) || []
    ).length;
    const wordCount = cjkCount + latinWordCount;
    const readingMinutes = Math.max(
        1,
        Math.ceil(wordCount / (locale === "en" ? 225 : 400)),
    );

    return {
        wordCount,
        readingMinutes,
        wordCountText: formatWordCount(wordCount, locale),
        readingTimeText:
            locale === "en"
                ? `${readingMinutes} min read`
                : `约 ${readingMinutes} 分钟`,
    };
};
import type { Locale } from "./i18n";
