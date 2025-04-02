// This is renderer for a very basic Table view.
import { getMarkdownTable } from "markdown-table-ts";
import { App } from "obsidian";
import { RendererConfig } from "../renderer/rendererRegistry";
import { displayError } from "../utils/ui";
import { ViewDefinition } from "../grammar/parser";
import { ParseResults } from "../cellParser/parseResults";
import { ModernCellParser } from "../cellParser/ModernCellParser";

const mapDataFromHeaders = (columns: string[], data: Record<string, any>[]) => {
    return data.map(d => columns.map(c => String(d[c])))
}

export class MarkdownRenderer implements RendererConfig {

    parseResult: ParseResults;

    constructor(private readonly app: App, private readonly cellParser: ModernCellParser) {
        this.parseResult = new ParseResults(cellParser)

    }

    get rendererKey() {
        return 'markdown'
    }

    validateConfig(config: string) {
        return {}
    }
    get viewDefinition(): ViewDefinition {
        return {
            name: this.rendererKey,
            argument: 'restLine?',
            singleLine: true
        }
    }

    render(config: ReturnType<typeof this.validateConfig>, el: HTMLElement) {
        return {
            render: ({ columns, data }: any) => {
                const tab = getMarkdownTable({
                    table: {
                        head: columns,
                        body: mapDataFromHeaders(columns, this.parseResult.renderAsString(data, columns))
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