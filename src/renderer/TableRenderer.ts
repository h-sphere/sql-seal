// This is renderer for a very basic Table view.
import { App } from "obsidian";
import { RendererConfig } from "src/renderer/rendererRegistry";
import { displayError, parseCell } from "src/utils/ui";

export class TableRenderer implements RendererConfig {

    constructor(private readonly app: App) { }

    get rendererKey() {
        return 'html'
    }

    validateConfig(config: string) {
        return {}
    }

    render(config: Record<string, any>, el: HTMLElement) {
        return {
            render: ({ columns, data }: any) => {
                el.empty()
                const container = el.createDiv({
                    cls: 'sqlseal-table-container'
                })
                const table = container.createEl("table")

                // HEADER
                const header = table.createEl("thead").createEl("tr")
                columns.forEach(c => {
                    header.createEl("th", { text: c })
                })

                const body = table.createEl("tbody")
                data.forEach((d: any) => {
                    const row = body.createEl("tr")
                    columns.forEach((c: any) => {
                        row.createEl("td", { text: parseCell(d[c], this.app) })                        

                    })
                })
            },
            error: (error: string) => {
                displayError(el, error)
            }
        }
    }
}