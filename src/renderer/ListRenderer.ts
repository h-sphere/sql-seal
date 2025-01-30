// This is renderer for a very basic List view.
import { App } from "obsidian";
import { CellParser } from "../cellParser";
import { RendererConfig } from "../renderer/rendererRegistry";
import { displayError } from "../utils/ui";

interface ListRendererConfig {
    classNames: string[]
}

export class ListRenderer implements RendererConfig {

    constructor(private readonly app: App, private readonly cellParser: CellParser) { }

    get rendererKey() {
        return 'list'
    }

    validateConfig(config: string): ListRendererConfig {
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

    render(config: ListRendererConfig, el: HTMLElement) {
        return {
            render: ({ columns, data }: any) => {
                el.empty()
                const container = el.createDiv({
                    cls: ['sqlseal-list-container', 'sqlseal-list', ...config.classNames]
                })


                const list = container.createEl("ul", {
                    cls: ['sqlseal-list-main']
                })

                data.forEach((d: any) => {
                    const row = list.createEl("li", { cls: ['sqlseal-list-element']}).createEl('ul')
                    columns.forEach((c: any) => {
                        const el = row.createEl("li", {
                            text: createEl('span', { text: c, cls: 'sqlseal-column-name' }) as any, // FIXME: this should be properly typed
                            cls: ['sqlseal-list-element-single']
                        })
                        const val = this.cellParser.render(d[c])
                        el.append(val)
                        el.dataset.sqlsealColumn = c
                    })
                })
            },
            error: (error: string) => {
                displayError(el, error)
            }
        }
    }
}