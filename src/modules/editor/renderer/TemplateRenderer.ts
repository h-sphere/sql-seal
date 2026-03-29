import { App } from "obsidian";
import { RendererConfig, RendererContext } from "./rendererRegistry";
import { displayError } from "../../../utils/ui";
import nunjucks from "nunjucks";
import { ViewDefinition } from "../parser";
import { ParseResults } from "../../syntaxHighlight/cellParser/parseResults";

const env = new nunjucks.Environment(null, { autoescape: false });

// Register custom filters
env.addFilter("groupby", (arr: any[], key: string) => {
    const groups: Record<string, any[]> = {};
    for (const item of arr) {
        const groupKey = String(item[key] ?? "");
        groups[groupKey] ??= [];
        groups[groupKey].push(item);
    }
    return Object.entries(groups).map(([k, items]) => ({
        grouper: k,
        list: items,
    }));
});

env.addFilter("unique", (arr: any[], key?: string) => {
    if (!key) return [...new Set(arr)];
    const seen = new Set<string>();
    return arr.filter((item) => {
        const val = String(item[key] ?? "");
        if (seen.has(val)) return false;
        seen.add(val);
        return true;
    });
});

interface TemplateRendererConfig {
    template: nunjucks.Template;
}

export class TemplateRenderer implements RendererConfig {
    constructor(private readonly app: App) {}

    get rendererKey() {
        return "template";
    }

    get viewDefinition(): ViewDefinition {
        return {
            name: this.rendererKey,
            argument: "nunjucksTemplate?",
            singleLine: false,
        };
    }

    validateConfig(config: string): TemplateRendererConfig {
        if (!config) {
            return {
                template: nunjucks.compile("No template provided", env),
            };
        }
        return {
            template: nunjucks.compile(config, env),
        };
    }

    render(
        config: TemplateRendererConfig,
        el: HTMLElement,
        { cellParser }: RendererContext,
    ) {
        return {
            render: ({ columns, data, frontmatter }: any) => {
                el.empty();

                const parser = new ParseResults(
                    cellParser!,
                    (el) => new nunjucks.runtime.SafeString(el.outerHTML),
                );

                el.innerHTML = config.template.render({
                    data: parser.parse(data, columns),
                    columns,
                    properties: frontmatter,
                });
                parser.initialise(el);
            },
            error: (error: string) => {
                displayError(el, error);
            },
        };
    }
}
