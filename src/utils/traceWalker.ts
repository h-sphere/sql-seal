import * as ohm from 'ohm-js'
import { parse, show, cstVisitor } from 'sql-parser-cst';

interface Trace {
    bindings: Array<{ children: Array<{ matchLength: number }> }>
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
    ['viewClassNames', { terminal: true, type: 'identifier' }],
    ['comment', { terminal: true, type: 'comment' }]
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

            if (trace.displayString === 'SelectStmt') {
                try {
                    parseStatement(trace, results)
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


const parseStatement = (trace: Trace, results: Array<Decorator>) => {
    console.log('SELECT STMT',)
    const cst = parse(trace.input.substring(trace.pos1, trace.pos2), {
        dialect: 'sqlite',
        includeSpaces: true,
        includeComments: true,
        includeNewlines: true,
        includeRange: true,
        acceptUnsupportedGrammar: true,
        paramTypes: ['@name']
    })

    const offset = trace.pos1

    const literal = (x) => {
        results.push({
            type: 'literal',
            start: offset + x.range![0],
            end: offset + x.range![1]
        })
    }

    const visitor = cstVisitor({
        blob_literal: literal,
        date_literal: literal,
        json_literal: literal,
        null_literal: literal,
        time_literal: literal,
        jsonb_literal: literal,
        number_literal: literal,
        string_literal: literal,
        boolean_literal: literal,
        numeric_literal: literal,
        datetime_literal: literal,
        interval_literal: literal,
        timestamp_literal: literal,
        bignumeric_literal: literal,
        identifier: (identifier) => {
            results.push({
                type: 'function',
                start: offset + identifier.range![0],
                end: offset + identifier.range![1]
            })
        },
        keyword: (keyword) => {
            results.push({
                type: 'keyword',
                start: offset + keyword.range![0],
                end: offset + keyword.range![1]
            })
        },
        parameter: (vari) => {
            results.push({
                type: 'parameter',
                start: offset + vari.range![0],
                end: offset + vari.range![1]
            })
        }
    })

    visitor(cst)

}