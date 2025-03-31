// This is renderer for a very basic Table view.
import { App } from "obsidian";
import { RendererConfig } from "../renderer/rendererRegistry";
import { displayError } from "../utils/ui";
import { ViewDefinition } from "../grammar/parser";
import { ModernCellParser } from "../cellParser/ModernCellParser";

interface HTMLRendererConfig {
    classNames: string[]
}

export class TableRenderer implements RendererConfig {

    constructor(private readonly app: App, private cellParser: ModernCellParser) { }

    get rendererKey() {
        return 'html'
    }
    get viewDefinition(): ViewDefinition {
            return {
                name: this.rendererKey,
                argument: 'viewClassNames?',
                singleLine: true
            }
        }

    validateConfig(config: string): HTMLRendererConfig {
        if (!config) {
            return {
                classNames: []
            }
        }
        const classNames = config.split('.').filter(x => !!x).map(t => t.trim())
        return {
            classNames
        }
    }

    render(config: HTMLRendererConfig, el: HTMLElement) {
        return {
            render: ({ columns, data }: any) => {
                el.empty()
                const container = el.createDiv({
                    cls: ['sqlseal-table-container', ...config.classNames]
                })

                let tableClasses = ['sqlseal']

                const table = container.createEl("table", {
                    cls: tableClasses
                })

                // HEADER
                const header = table.createEl("thead").createEl("tr")
                columns.forEach((c: string) => {
                    header.createEl("th", { text: c })
                })

                const body = table.createEl("tbody")
                data.forEach((d: any) => {
                    const row = body.createEl("tr")
                    columns.forEach((c: any) => {
                        row.createEl("td", { text: this.cellParser.render(d[c]) as string })                        

                    })
                })
            },
            error: (error: string) => {
                displayError(el, error)
            }
        }
    }
}