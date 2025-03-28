// This is renderer for a very basic List view.
import { App } from "obsidian";
import { CellParser } from "../cellParser";
import { RendererConfig } from "../renderer/rendererRegistry";
import { displayError } from "../utils/ui";
import { ViewDefinition } from "../grammar/parser";

interface ListRendererConfig {
    classNames: string[]
}

export class TaskListRenderer implements RendererConfig {

    constructor(private readonly app: App, private readonly cellParser: CellParser) { }

    get rendererKey() {
        return 'tasklist'
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

    render(config: ListRendererConfig, el: HTMLElement) {
        return {
            render: ({ columns, data }: any) => {
                el.empty()
				el.className='el-ul';
				el.addClasses(['el-ul', ...config.classNames])

				if (!columns.contains('checkbox') || !columns.contains('task')) {
					displayError(el, 'Data must contain "checkbox" and "task" columns');
					return;
				}

                const list = el.createEl("ul", {
                    cls: ['contains-task-list', 'has-list-bullet']
                })

                data.forEach((d: any) => {
					const row = list.createEl("li", { cls: ['task-list-item'] });
					row.createSpan({ cls: ['list-bullet'] })
					const checkbox = this.cellParser.render(d['checkbox']) as HTMLInputElement;
					checkbox.className = 'task-list-item-checkbox';
					row.append(checkbox);
					row.appendText(d['task']);

					if (checkbox.checked) {
						row.addClass('is-checked');
						row.setAttr('data-task', 'x');
					}
                });
            },
            error: (error: string) => {
                displayError(el, error)
            }
        }
    }
}
