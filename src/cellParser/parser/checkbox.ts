import { CellFunction } from "../CellFunction";
import { CellParserResult } from "../ModernCellParser";
import { App } from "obsidian";

type Args = number[] | CheckboxProps

interface CheckboxProps {
    checked: boolean,
    path: string,
    position: {
        line: number,
        lineContent: string
    },
    task: string
}

const isCheckboxProp = (arg: any): arg is CheckboxProps => {
    return arg && arg['position'] && arg['path']
}

export class CheckboxParser implements CellFunction<Args> {

    constructor(private readonly app: App, private readonly create = createEl) { }

    get name(): string {
        return 'checkbox'
    }

    get sqlFunctionArgumentsCount() {
        return 1
    }

    prepare(values: Args): CellParserResult {
        if (!isCheckboxProp(values)) {
            const el = createEl('input', {
                type: 'checkbox',
                attr: {
                    disabled: true,
                    checked: !!values[0] ? true : null
                }
            });
            return el
        }

        const el = createEl('input', {
            type: 'checkbox',
            attr: {
                checked: !!(values && values.checked) ? true : null
            }
        })

        return {
            element: el,
            onRunCallback: (el: HTMLInputElement) => {
                el.addEventListener('change', async () => {
                    try {
                        // Values should contain the data we need
                        if (!values || !values.path) {
                            console.error('Missing required checkbox data')
                            return
                        }

                        const file = this.app.vault.getFileByPath(values.path)
                        if (!file) {
                            console.error('File not found:', values.path)
                            return
                        }

                        // Read file content
                        const content = await this.app.vault.read(file)
                        const lines = content.split('\n')

                        // Get the line containing the task
                        const lineIndex = values.position?.line
                        if (lineIndex >= 0 && lineIndex < lines.length) {
                            // Update the task status
                            if (el.checked) {
                                lines[lineIndex] = lines[lineIndex].replace('- [ ]', '- [x]')
                            } else {
                                lines[lineIndex] = lines[lineIndex].replace('- [x]', '- [ ]')
                            }

                            // Write back to the file
                            await this.app.vault.modify(file, lines.join('\n'))
                        }
                    } catch (error) {
                        console.error('Error updating task:', error)
                    }
                })
            }
        }
    }
}