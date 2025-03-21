import { App } from "obsidian";

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

export const renderCheckbox = (app: App) => (values: number[] | CheckboxProps) => {

    if (!isCheckboxProp(values)) {
        const el = createEl('input', {
            type: 'checkbox',
            attr: {
                disabled: true
            }
        });
        el.checked = !!values[0]
        return el
    }

    const el = createEl('input', {
        type: 'checkbox',
    })

    if (values && values.checked) {
        el.checked = true
    }

    el.addEventListener('change', async () => {
        try {
            // Values should contain the data we need
            if (!values || !values.path) {
                console.error('Missing required checkbox data')
                return
            }

            const file = app.vault.getFileByPath(values.path)
            if (!file) {
                console.error('File not found:', values.path)
                return
            }

            // Read file content
            const content = await app.vault.read(file)
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
                await app.vault.modify(file, lines.join('\n'))
            }
        } catch (error) {
            console.error('Error updating task:', error)
        }
    })

    return el
}