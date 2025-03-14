import * as ohm from 'ohm-js';
import { cstVisitor, Literal, parse } from 'sql-parser-cst';
import highlightHandlebars from './highlighter/handlebarsHighlighter';
import { highlightJavaScript } from './highlighter/jsHighlighter';

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
    ['selectKeyword', { terminal: false, type: 'keyword' }],
    ['viewClassNames', { terminal: true, type: 'identifier' }],
    ['comment', { terminal: true, type: 'comment' }]
])

const computeNodeHighlight = (node: ohm.Node) => {
    const results = []
    if (nodes.has(node.ctorName)) {
        results.push({
            type: nodes.get(node.ctorName)!.type,
            start: node._baseInterval.startIdx,
            end: node._baseInterval.endIdx
        })
    }

    if (node.ctorName === 'ViewExpression') {
        const { childOffsets } = node._node
        if (childOffsets.length > 1) {
            results.push({
                type: 'keyword',
                start: node._baseInterval.startIdx,
                end: node._baseInterval.startIdx + childOffsets[1]
            })
        } else {
            results.push({
                type: 'keyword',
                start: node._baseInterval.startIdx,
                end: node._baseInterval.startIdx + node._node.matchLength
            })
        }
    }
    return results
}


export const highlighterOperation = (grammar: ohm.Grammar) => {
    const s = grammar.createSemantics()

    s.addOperation<any>('highlight', {
        _terminal() {
            return computeNodeHighlight(this)
        },
        _nonterminal() {
            return [
                ...computeNodeHighlight(this),
                ...this.children.map(c => c.highlight()).flat()
            ]
        },
        _iter(...children) {
            return children.map(c => c.highlight()).flat()
        },
        SelectStmt(_a, _b) {
            let results: Decorator[] = []
            try {
                results = parseStatement(this)
            } catch (e) {

            }
            return [...computeNodeHighlight(this), ...results]
        },
        errorLine: (node, _nl) => {
            return [{
                type: 'error',
                start: node.source.startIdx,
                end: node.source.endIdx
            }]
        },
        handlebarsTemplate(_node) {
            try {
                const template = this.source.contents
                const sections = highlightHandlebars(template)
                const offset = this.source.startIdx
                return sections.map(s => ({
                    ...s,
                    start: s.start + offset,
                    end: s.end + offset
                }))
            } catch (e) {
                return []
            }
        },
        javascriptTemplate(_node) {
            let prefix = `async function x () {
            `
            let sufix = ' }'


            if (this.source.contents.trim()[0] === '{') {
                // we are parsing simple object, we need to adjust it
                prefix = `const data = `
                sufix = ';'
            }

            const source = prefix + this.source.contents + sufix
            const offset = this.source.startIdx
            try {
                const decorators = highlightJavaScript(source)
                return decorators.map(d => ({
                    type: d.type === 'keyword' ? 'template-keyword' : d.type,
                    start: d.start - prefix.length + offset,
                    end: d.end - prefix.length + offset
                })).filter(x => x.start >= offset)
              } catch (error) {
                return [{ type: 'error', start: this.source.startIdx, end: this.source.endIdx }]
              }
        }
    })

    return s
}


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

export interface Decorator {
    type: string // FIXME: maybe take types from object from syntax highlight
    start: number
    end: number
}

const parseStatement = (node: ohm.Node) => {
    const results: Decorator[] = []
    const cst = parse(node.source.contents, {
        dialect: 'sqlite',
        includeSpaces: true,
        includeComments: true,
        includeNewlines: true,
        includeRange: true,
        acceptUnsupportedGrammar: true,
        paramTypes: ['@name']
    })

    const offset = node.source.startIdx

    const literal = (x: Literal) => {
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
    return results

}