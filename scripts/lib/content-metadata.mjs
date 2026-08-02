const FRONTMATTER_PATTERN = /^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

const unquote = (value) => {
    const trimmed = value.trim();
    const quote = trimmed[0];
    if ((quote === '"' || quote === "'") && trimmed.at(-1) === quote) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
};

const readScalar = (frontmatter, key, file, required = true) => {
    const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, "m"));
    if (!match) {
        if (!required) return undefined;
        throw new Error(`${file}: missing ${key}`);
    }
    return unquote(match[1]);
};

export const parsePostMetadata = (source, file) => {
    const frontmatter = source.match(FRONTMATTER_PATTERN)?.[1];
    if (!frontmatter) {
        throw new Error(`${file}: missing Frontmatter block`);
    }

    const draftValue = readScalar(frontmatter, "draft", file, false);
    if (draftValue !== undefined && draftValue !== "true" && draftValue !== "false") {
        throw new Error(`${file}: draft must be true or false`);
    }

    const lang = readScalar(frontmatter, "lang", file, false) ?? "zh";
    if (lang !== "zh" && lang !== "en") {
        throw new Error(`${file}: lang must be zh or en`);
    }

    return {
        file,
        slug: readScalar(frontmatter, "slug", file),
        translationKey: readScalar(frontmatter, "translationKey", file),
        lang,
        draft: draftValue === "true",
    };
};

export const validatePostMetadata = (posts) => {
    const errors = [];
    const slugsByLocale = new Map();
    const postsByTranslationKey = new Map();

    for (const post of posts) {
        const localeSlug = `${post.lang}:${post.slug}`;
        const existingSlug = slugsByLocale.get(localeSlug);
        if (existingSlug) {
            errors.push(
                `${post.file}: duplicate ${post.lang} slug "${post.slug}" (already used by ${existingSlug})`,
            );
        } else {
            slugsByLocale.set(localeSlug, post.file);
        }

        const pair = postsByTranslationKey.get(post.translationKey) ?? [];
        pair.push(post);
        postsByTranslationKey.set(post.translationKey, pair);
    }

    for (const [translationKey, pair] of postsByTranslationKey) {
        const chinesePosts = pair.filter((post) => post.lang === "zh");
        const englishPosts = pair.filter((post) => post.lang === "en");

        if (pair.length !== 2) {
            errors.push(
                `${translationKey}: expected 2 translated posts, found ${pair.length}`,
            );
        }
        if (chinesePosts.length !== 1 || englishPosts.length !== 1) {
            errors.push(
                `${translationKey}: expected 1 zh and 1 en post, found ${chinesePosts.length} zh and ${englishPosts.length} en`,
            );
        }
        if (
            chinesePosts.length === 1 &&
            englishPosts.length === 1 &&
            chinesePosts[0].draft !== englishPosts[0].draft
        ) {
            errors.push(`${translationKey}: translated posts must use the same draft state`);
        }
    }

    return errors;
};

export const assertValidPostMetadata = (posts) => {
    const errors = validatePostMetadata(posts);
    if (errors.length > 0) {
        throw new Error(`Content metadata check failed:\n- ${errors.join("\n- ")}`);
    }
};
