// This is renderer for a very basic List view.
import { App } from "obsidian";
import { RendererConfig } from "./rendererRegistry";
import { displayError } from "../utils/ui";
import { ViewDefinition } from "../grammar/parser";
import Handlebars from "handlebars";
import { ParseResults } from "src/cellParser/parseResults";
import { ModernCellParser } from "src/cellParser/ModernCellParser";

interface TemplateRendererConfig {
    template: HandlebarsTemplateDelegate
}

export class TemplateRenderer implements RendererConfig {

    parseResult: ParseResults;

    constructor(private readonly app: App, private readonly cellParser: ModernCellParser) {
        this.parseResult = new ParseResults(cellParser, (el) => new Handlebars.SafeString(el.outerHTML))
    }

    get rendererKey() {
        return 'template'
    }

    get viewDefinition(): ViewDefinition {
        return {
            name: this.rendererKey,
            argument: 'handlebarsTemplate?',
            singleLine: false
        }
    }

    validateConfig(config: string): TemplateRendererConfig {
        if (!config) {
            return {
                template: Handlebars.compile('No template Provided')
            }
        }
        return {
            template: Handlebars.compile(config)
        }
    }

    render(config: TemplateRendererConfig, el: HTMLElement) {
        return {
            render: ({ columns, data, frontmatter }: any) => {
                el.empty()
                
                // Seems to be the only way to render handlebars into DOM. Don't like it but what can we do.
                el.innerHTML = config.template({
                    data: this.parseResult.parse(data, columns),
                    columns,
                    properties: frontmatter
                })
                this.parseResult.initialise(el)
            },
            error: (error: string) => {
                displayError(el, error)
            }
        }
    }
}