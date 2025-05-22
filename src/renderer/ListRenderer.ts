// This is renderer for a very basic List view.
import { App } from "obsidian";
import { RendererConfig, RendererContext } from "../renderer/rendererRegistry";
import { displayError } from "../utils/ui";
import { ViewDefinition } from "../grammar/parser";

interface ListRendererConfig {
    classNames: string[]
}

export class ListRenderer implements RendererConfig {

    constructor(private readonly app: App) { }

    get rendererKey() {
        return 'list'
    }

    get viewDefinition(): ViewDefinition {
        return {
            name: this.rendererKey,
            argument: 'viewClassNames?',
            singleLine: true
        }
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

    render(config: ListRendererConfig, el: HTMLElement, { cellParser }: RendererContext) {
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
					const singleCol = columns.length == 1; // Only one column, do not nest lists
                    const row = singleCol ? list : list.createEl("li", { cls: ['sqlseal-list-element'] }).createEl('ul')
                    columns.forEach((c: any) => {
                        const el = row.createEl("li", {
                            text: createEl('span', { text: c, cls: 'sqlseal-column-name' }) as any, // FIXME: this should be properly typed
                            cls: singleCol ? ['sqlseal-list-element', 'sqlseal-list-element-single'] : ['sqlseal-list-element-single']
                        })
                        const val: any = cellParser!.render(d[c])
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
