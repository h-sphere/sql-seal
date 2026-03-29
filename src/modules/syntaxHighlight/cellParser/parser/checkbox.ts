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
    task: string,
    status?: string
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
                checked: !!(values && values.checked) ? true : null,
                'data-task': values.status || ' '
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
                            // Get current status
                            const currentStatus = values.status || (values.checked ? 'x' : ' ')

                            // Escape special regex characters
                            const escapedStatus = currentStatus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

                            // Update the task status
                            if (el.checked) {
                                // Mark as completed
                                lines[lineIndex] = lines[lineIndex].replace(
                                    new RegExp(`- \\[${escapedStatus}\\]`),
                                    '- [x]'
                                )
                            } else {
                                // Restore original status
                                const originalStatus = currentStatus === 'x' ? ' ' : currentStatus
                                lines[lineIndex] = lines[lineIndex].replace(
                                    '- [x]',
                                    `- [${originalStatus}]`
                                )
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

    renderAsString(values: Args): string {
        if (!isCheckboxProp(values)) {
            if (values[0]) {
                return '[x]'
            }
            return '[ ]'
        } else {
            // Use status if available
            if (values.status) {
                return `[${values.status}]`
            }
            // Fall back to checked boolean
            if (values.checked) {
                return '[x]'
            } else {
                return '[ ]'
            }
        }
    }
}