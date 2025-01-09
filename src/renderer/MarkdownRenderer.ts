// This is renderer for a very basic Table view.
import { getMarkdownTable } from "markdown-table-ts";
import { App } from "obsidian";
import { RendererConfig } from "src/renderer/rendererRegistry";
import { displayError, parseCell } from "src/utils/ui";

const mapDataFromHeaders = (columns: string[], data: Record<string, any>[]) => {
    return data.map(d => columns.map(c => String(d[c])))
}

export class MarkdownRenderer implements RendererConfig {

    constructor(private readonly app: App) { }

    get rendererKey() {
        return 'markdown'
    }

    validateConfig(config: string) {
        return {}
    }

    render(config: ReturnType<typeof this.validateConfig>, el: HTMLElement) {
        return {
            render: ({ columns, data }: any) => {
                const tab = getMarkdownTable({
                    table: {
                        head: columns,
                        body: mapDataFromHeaders(columns, data)
                    }
                })

                el.empty()
                el.createDiv({ cls: 'sqlseal-markdown-table', text: tab })

            },
            error: (error: string) => {
                displayError(el, error)
            }
        }
    }
}