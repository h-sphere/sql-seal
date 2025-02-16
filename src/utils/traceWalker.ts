import * as ohm from 'ohm-js'

interface Trace {
    bindings: Array<{ children: Array<{matchLength: number}>}>
    children: Array<Trace>
    expr: ohm.Seq
    input: string
    pos: number
    pos1: number
    pos2: number
    result: ohm.MatchResult
    source: ohm.Interval
    terminatingLREntry: null | string // FIXME: to check
    _flags: number
    displayString: string
    isHeadOfLeftRecursion: boolean
    isImplicitSpaces: boolean
    isMemoized: boolean
    isRootNode: boolean
    succeeded: boolean
    terminatesLR: boolean
}

const nodes = new Map([
    ['FlagExpression', { terminal: true, type: 'blockFlag' }],
    ['TableExpression', { terminal: false, type: 'blockTable' }],
    ['SelectStmt', { terminal: false, type: 'blockQuery' }],
    ['ViewExpression', { terminal: false, type: 'blockView' }],
    ['tableKeyword', { terminal: true, type: 'keyword' }],
    ['fileOpening', { terminal: true, type: 'function' }],
    ['tableOpening', { terminal: true, type: 'function' }],
    ['filename', { terminal: true, type: 'identifier' }],
    ['digit', { terminal: true, type: 'identifier' }],
    ['tableDefinitionClosing', { terminal: true, type: 'function' }],
    ['selectKeyword', { terminal: true, type: 'keyword' }],
    ['viewClassNames', { terminal: true, type: 'identifier' }]
])

interface Decorator {
    type: string // FIXME: maybe take types from object from syntax highlight
    start: number
    end: number
}

export const traceWalker = (trace: Trace, depth: number = 0): Decorator[] => {
    const results: Array<Decorator> = []
    if (trace.succeeded && trace.pos1 !== trace.pos2) {
        if (nodes.has(trace.displayString)) {
            const node = nodes.get(trace.displayString)!
            if (node.type) {
                results.push({
                    type: node.type,
                    start: trace.pos1,
                    end: trace.pos2
                })
            }

            if (trace.displayString === 'ViewExpression') {
                // Small hack, highlighting first word
                console.log('trtrtr', trace)
                try {
                    const len = trace.bindings[0].children[0].matchLength
                    results.push({
                        type: 'keyword',
                        start: trace.pos1,
                        end: trace.pos1 + len
                    })
                } catch (e) { }
                
            }

            if (node.terminal) {
                return results
            }
        }
    }
    results.push(...trace.children.map(c => traceWalker(c, depth + 1)).flat())
    return results
}