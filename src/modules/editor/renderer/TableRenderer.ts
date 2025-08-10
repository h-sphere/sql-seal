// This is renderer for a very basic Table view.
import { App } from "obsidian";
import { RendererConfig, RendererContext } from "./rendererRegistry";
import { displayError } from "../../../utils/ui";
import { ViewDefinition } from "../parser";

interface HTMLRendererConfig {
    classNames: string[]
}

export class TableRenderer implements RendererConfig {

    constructor(private readonly app: App) { }

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

    render(config: HTMLRendererConfig, el: HTMLElement, { cellParser }: RendererContext) {
        return {
            render: ({ columns, data }: any) => {
                el.empty()

                let tableClasses = ['sqlseal']

                let adjustLayout = false
                let classNames = [...config.classNames]

                // To make sure templates like minimal work properly
                if (classNames.contains('dataview')) {
                    tableClasses.push('dataview', 'table-view-table')
                    adjustLayout = true
                    classNames = classNames.filter(c => c !== 'dataview')
                }

                const container = el.createDiv({
                    cls: ['sqlseal-table-container', ...classNames]
                })

                const table = container.createEl("table", {
                    cls: tableClasses
                })

                // HEADER
                const header = table.createEl("thead", {
                    cls: adjustLayout ? ['table-view-thead'] : []
                }).createEl("tr")
                columns.forEach((c: string) => {
                    header.createEl("th", { text: c })
                })

                const body = table.createEl("tbody", { cls: adjustLayout ? ['table-view-tbody'] : [] })
                data.forEach((d: any) => {
                    const row = body.createEl("tr")
                    columns.forEach((c: any) => {
                        const parsed = cellParser!.render(d[c]) as string
                        if (adjustLayout) {
                            const td = row.createEl("td")
                            td.createSpan({ text: parsed })
                        } else {
                            row.createEl("td", { text: parsed })
                        }
                    })
                })
            },
            error: (error: string) => {
                displayError(el, error)
            }
        }
    }
}