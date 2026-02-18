interface Decorator {
    type:
        | "identifier"
        | "literal"
        | "parameter"
        | "comment"
        | "keyword"
        | "function"
        | "error"
        | "template-keyword";
    start: number;
    end: number;
}

/**
 * Highlights Nunjucks syntax in a template string using regex patterns.
 * Supports: {{ expressions }}, {% tags %}, {# comments #}, and | filters.
 */
function highlightNunjucks(template: string): Decorator[] {
    const decorators: Decorator[] = [];
    let match: RegExpExecArray | null;

    const keywords = [
        "if",
        "elif",
        "else",
        "endif",
        "for",
        "endfor",
        "in",
        "block",
        "endblock",
        "extends",
        "include",
        "import",
        "from",
        "macro",
        "endmacro",
        "call",
        "endcall",
        "set",
        "endset",
        "filter",
        "endfilter",
        "raw",
        "endraw",
        "as",
        "with",
        "not",
        "and",
        "or",
        "is",
        "true",
        "false",
        "none",
        "null",
    ];

    function add(
        type: Decorator["type"],
        start: number,
        end: number,
    ): void {
        if (start >= 0 && end <= template.length && start < end) {
            decorators.push({ type, start, end });
        }
    }

    // 1. Comments: {# ... #}
    const commentRegex = /\{#[\s\S]*?#\}/g;
    while ((match = commentRegex.exec(template)) !== null) {
        add("comment", match.index, match.index + match[0].length);
    }

    // 2. Block tags: {% ... %}
    const blockTagRegex = /\{%[-~]?\s*([\s\S]*?)\s*[-~]?%\}/g;
    while ((match = blockTagRegex.exec(template)) !== null) {
        const fullStart = match.index;
        const fullEnd = fullStart + match[0].length;

        // Delimiters
        add("template-keyword", fullStart, fullStart + 2);
        add("template-keyword", fullEnd - 2, fullEnd);

        // Tag content
        const content = match[1];
        const contentStart =
            fullStart + match[0].indexOf(content);

        // First word is the tag keyword
        const tagMatch = /^([^\s]+)/.exec(content);
        if (tagMatch) {
            const tagName = tagMatch[1];
            const tagEnd = contentStart + tagName.length;

            if (keywords.includes(tagName)) {
                add("template-keyword", contentStart, tagEnd);
            } else {
                add("function", contentStart, tagEnd);
            }

            // Process remaining content
            const rest = content.substring(tagName.length).trim();
            if (rest.length > 0) {
                const restStart =
                    contentStart +
                    content.indexOf(rest, tagName.length);
                processExpression(rest, restStart);
            }
        }
    }

    // 3. Expression tags: {{ ... }}
    const exprRegex = /\{\{[-~]?\s*([\s\S]*?)\s*[-~]?\}\}/g;
    while ((match = exprRegex.exec(template)) !== null) {
        const fullStart = match.index;
        const fullEnd = fullStart + match[0].length;

        // Delimiters
        add("template-keyword", fullStart, fullStart + 2);
        add("template-keyword", fullEnd - 2, fullEnd);

        // Expression content
        const content = match[1];
        const contentStart =
            fullStart + match[0].indexOf(content);
        processExpression(content, contentStart);
    }

    function processExpression(expr: string, offset: number): void {
        // String literals
        const stringRegex =
            /"([^"\\]*(\\.[^"\\]*)*)"|'([^'\\]*(\\.[^'\\]*)*)'/g;
        let m: RegExpExecArray | null;
        while ((m = stringRegex.exec(expr)) !== null) {
            add("literal", offset + m.index, offset + m.index + m[0].length);
        }

        // Number literals
        const numRegex = /\b(\d+(?:\.\d+)?)\b/g;
        while ((m = numRegex.exec(expr)) !== null) {
            add("literal", offset + m.index, offset + m.index + m[0].length);
        }

        // Filter pipe operator and filter names
        const filterRegex = /\|\s*(\w+)/g;
        while ((m = filterRegex.exec(expr)) !== null) {
            // Highlight the pipe
            add("template-keyword", offset + m.index, offset + m.index + 1);
            // Highlight the filter name
            const filterStart = offset + m.index + m[0].indexOf(m[1]);
            add("function", filterStart, filterStart + m[1].length);
        }

        // Keywords within expressions
        const wordRegex = /\b(\w+)\b/g;
        while ((m = wordRegex.exec(expr)) !== null) {
            const word = m[1];
            const wordStart = offset + m.index;
            const wordEnd = wordStart + word.length;

            // Skip if already decorated
            const alreadyDecorated = decorators.some(
                (d) => wordStart >= d.start && wordEnd <= d.end,
            );
            if (alreadyDecorated) continue;

            if (keywords.includes(word)) {
                add("template-keyword", wordStart, wordEnd);
            } else if (/^\d/.test(word)) {
                // Skip numbers (already handled)
            } else {
                add("identifier", wordStart, wordEnd);
            }
        }
    }

    decorators.sort((a, b) => a.start - b.start);
    return decorators;
}

export default highlightNunjucks;
