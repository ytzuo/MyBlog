export const stripMarkdownFencedCodeBlocks = (value: string): string => {
    const lines = value.match(/.*(?:\r\n|\n|$)/g) ?? [];
    let fence: { marker: "`" | "~"; length: number } | undefined;

    return lines
        .map((line) => {
            const lineContent = line.replace(/\r?\n$/, "");

            if (fence) {
                const closeMatch = lineContent.match(/^( {0,3})(`{3,}|~{3,})[ \t]*$/);
                // 关闭围栏必须和开启字符一致，且长度不能短于开启围栏。
                if (
                    closeMatch &&
                    closeMatch[2]?.[0] === fence.marker &&
                    closeMatch[2].length >= fence.length
                ) {
                    fence = undefined;
                }
                return " ";
            }

            const openMatch = lineContent.match(/^( {0,3})(`{3,}|~{3,})/);
            if (openMatch) {
                fence = {
                    marker: openMatch[2][0] as "`" | "~",
                    length: openMatch[2].length,
                };
                return " ";
            }

            return line;
        })
        .join("");
};
