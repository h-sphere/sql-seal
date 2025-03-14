// This is renderer for a very basic List view.
import { App } from "obsidian";
import { CellParser } from "../cellParser";
import { RendererConfig } from "./rendererRegistry";
import { displayError } from "../utils/ui";
import { ViewDefinition } from "../grammar/parser";
import Handlebars from "handlebars";

interface TemplateRendererConfig {
    template: HandlebarsTemplateDelegate
}

export class TemplateRenderer implements RendererConfig {

    constructor(private readonly app: App, private readonly cellParser: CellParser) { }

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
            render: ({ columns, data }: any) => {
                el.empty()
                
                // Seems to be the only way to render handlebars into DOM. Don't like it but what can we do.
                el.innerHTML = config.template({ data, columns })
            },
            error: (error: string) => {
                displayError(el, error)
            }
        }
    }
}