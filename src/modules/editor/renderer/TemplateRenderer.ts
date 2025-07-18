// This is renderer for a very basic List view.
import { App } from "obsidian";
import { RendererConfig, RendererContext } from "./rendererRegistry";
import { displayError } from "../../../utils/ui";
import Handlebars from "handlebars";
import { ParseResults } from "../../../cellParser/parseResults";
import { ViewDefinition } from "../parser";

interface TemplateRendererConfig {
    template: HandlebarsTemplateDelegate
}

export class TemplateRenderer implements RendererConfig {
    constructor(private readonly app: App) {
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

    render(config: TemplateRendererConfig, el: HTMLElement, { cellParser }: RendererContext) {
        return {
            render: ({ columns, data, frontmatter }: any) => {
                el.empty()
                
                const parser = new ParseResults(cellParser!, (el) => new Handlebars.SafeString(el.outerHTML))

                // Seems to be the only way to render handlebars into DOM. Don't like it but what can we do.
                el.innerHTML = config.template({
                    data: parser.parse(data, columns),
                    columns,
                    properties: frontmatter
                })
                parser.initialise(el)
            },
            error: (error: string) => {
                displayError(el, error)
            }
        }
    }
}