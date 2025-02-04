import { assign } from "lodash"

export interface IntermediateContent {
    flags: {
        refresh: boolean,
        explain: boolean
    },
    renderer: string
    rendererArguments: string
}

const defaultContent = () => ({
    flags: {
        refresh: true,
        explain: false
    },
    renderer: 'GRID',
    rendererArguments: ''
} satisfies IntermediateContent)

const FLAGS = {
    'REFRESH': (content: IntermediateContent) => {
        content.flags.refresh = true
    },
    'NO REFRESH': (content: IntermediateContent) => {
        content.flags.refresh = false
    },
    'EXPLAIN': (content: IntermediateContent) => {
        content.flags.explain = true
    }
} as Record<string, any>

export const parseIntermediateContent = (content: string, initialConfig: Partial<IntermediateContent>) => {
    const config = assign(defaultContent(), initialConfig)
    let processingFlags = true
    const rendererArguments = []
    for (const row of content.split('\n')) {
        const trimmedRow = row.trim().toUpperCase()
        if (!trimmedRow) {
            continue // empty row
        }
        if (processingFlags) {
            if (!FLAGS[trimmedRow]) {
                processingFlags = false
                const [renderer, ...rest ] = trimmedRow.split(' ')
                config.renderer = renderer.toUpperCase()
                rendererArguments.push(rest.join(' '))
            } else {
                const fn = FLAGS[trimmedRow]
                fn(config)
            }
        } else {
            rendererArguments.push(trimmedRow)
        }
    }
    config.rendererArguments = rendererArguments.join('\n')
    return config
}