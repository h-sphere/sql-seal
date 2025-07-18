import * as ohm from 'ohm-js';
import { Flag } from './renderer/rendererRegistry';

export interface ViewDefinition {
    name: string,
    singleLine: boolean,
    argument: string
}

const viewName = (view: ViewDefinition) => `caseInsensitive<"${view.name}">`



export const SQLSealLangDefinition = (views: ViewDefinition[], flags: readonly Flag[] = [], enableErrors: boolean = false) => {
    const viewsDefinitions = views
        .map(view => view.singleLine ?
            `#(${viewName(view)} ${view.argument})`
            : `${viewName(view)} ${view.argument}`)
        .join(' | ')


    const flagsDefinitions = flags.map(flag => {
        return `caseInsensitive<"${flag.name}"> -- ${flag.key}`
    }).join(' \n| ')



    return String.raw`
        SQLSealLang {
            Grammar =                  (TableExpression | ViewExpression | FlagExpression | blank ${enableErrors ? '| errorLine' : ''})* SelectStmt*
            SelectStmt =               selectKeyword any+
            FlagExpression =           caseInsensitive<"REFRESH">                                               -- refresh
            |                          caseInsensitive<"NO REFRESH">                                            -- norefresh
            |                          caseInsensitive<"EXPLAIN">                                               -- explain
            ${flags.length ? '| ExtraFlags -- extraFlags' : ''}
            TableExpression =          tableKeyword identifier "=" TableDefinition          
            TableDefinition =          fileOpening TableFileExpressionArgs tableDefinitionClosing      -- file
            |                          tableOpening NonemptyListOf<listElement, ","> tableDefinitionClosing      -- mdtable
            TableFileExpressionArgs =  filename ("," NonemptyListOf<listElement, ",">)?
            identifier =               (alnum | "_")+
            filename  =                ~("\"") (alnum | "." | "-" | space | "_" | "/" | "\\" | "$" | "[" | "]" | "\"")+ ~("\"") -- unquoted
            |                          "\"" (alnum | "." | "-" | space | "_" | "/" | "\\" | "$" | "[" | "]" | ",")+ "\"" -- quoted
            fileOpening =              caseInsensitive<"file(">
            tableOpening =             caseInsensitive<"table(">
            tableDefinitionClosing =   ")"
            errorLine =                (~(nl|selectKeyword) any)* nl
   
            listElement =              "\"" (~"\"" any)+ "\""                                                   -- quoted
            |                          (~ ("," | ")") any)+                                                     -- unquoted

            ViewExpression =           ${viewsDefinitions}
            ExtraFlags =               ${flagsDefinitions}
            anyObject =                "{"  (~selectKeyword any)*
            handlebarsTemplate =       (~selectKeyword any)*
            javascriptTemplate =       (~selectKeyword any)*
            selectKeyword =            caseInsensitive<"WITH"> | caseInsensitive<"SELECT">
            tableKeyword =             caseInsensitive<"TABLE">
            nl =                       "\n"
            character =                (alnum | "." | "-" | space | "_")
            viewClassNames =           restLine
            restLine =                 " " (~nl character)* nl
            blank = space* nl
            comment =                  "/*" (~"*/" any)* "*/" -- multiline
            |                          #("--" (~nl any)*) nl  -- singleline
            space += comment
        }
`
}

const generateSemantic = (grammar: ohm.Grammar) => {
    const s = grammar.createSemantics()

    const operations: ohm.ActionDict<any> = {
        Grammar: (entries, selectStatement) => {
            const res = {
                flags: {
                },
                renderer: {
                    name: 'GRID',
                    options: ''
                },
                tables: [] as any[],
                query: ''
            }
            if (entries.children.length) {
                entries.children.forEach(c => {
                    switch (c.ctorName) {
                        case 'TableExpression':
                            res.tables.push(c.toObject())
                            break;
                        case 'ViewExpression':
                            res.renderer = c.toObject()
                            break
                        case 'FlagExpression':
                            res.flags = { ...res.flags, ...c.toObject() }
                            break
                    }
                })
            }
            if (selectStatement) {
                res.query = selectStatement.sourceString
            }

        return res
       },
       TableExpression: (_table, identifier, _eq, tableDef) => {
        return {
            tableAlias: identifier.sourceString ,
            ...tableDef.toObject()
        }
       },
       TableDefinition_file: (_file, args, _close) => {
        return {
            arguments: args.toObject(),
            type: 'file'
        }
       },
       TableFileExpressionArgs: (filename, _sep, rest) => {
        // ...rest.asIteration().children.map((c: ohm.Node) => c.toObject().trim())
        let remaining = []
        if (rest.children.length) {
            remaining = rest.children[0].asIteration().children.map((c: ohm.Node) => c.toObject().trim())
        }
        return [filename.toObject(), ...remaining]
       },
       TableDefinition_mdtable: (_file, args, _close) =>  {
        return {
            arguments: args.asIteration().children.map((c: ohm.Node) => c.toObject().trim()),
            type: 'table'
        }
       },
       FlagExpression_refresh: (v) => {
        return { refresh: true }
       },
       FlagExpression_norefresh: (v) => {
        return {refresh: false}
       },
       FlagExpression_explain: (v) => {
        return { explain: true }
       },
       ViewExpression: (view, options) => {
        return {
            type: view.toObject().toUpperCase(),
            options: (options.sourceString ?? '').trim()
        }
       },
       listElement_quoted: (_q, value, _q2) => value.sourceString,
       listElement_unquoted: (v) => v.sourceString,
       filename: (v) => {
        const f = v.sourceString
        if (f.length && f[0] === '"' && f[f.length - 1] === '"') {
            return f.substring(1, f.length - 1)
        }
        return v.sourceString.trim()
       },
       _terminal() {
            return this.sourceString
        }
    }
    if ((grammar.rules['ExtraFlags'].body as any).ruleName) {
        operations.ExtraFlags = (flag) => {
            const key = flag.ctorName.substring('ExtraFlags_'.length)
            return { [key]: true }
        }
    }

    s.addOperation<any>('toObject', operations)

    return s
}

export interface TableDefinition {
    type: string,
    tableAlias: string,
    arguments: [string]
}

export interface ParserResult {
    flags: {
        explain: boolean,
        refresh: boolean
    },
    renderer: {
        type: string,
        options: string
    },
    query: string,
    tables: Array<TableDefinition>
}

export const parse = (query: string, views: ViewDefinition[], flags: readonly Flag[] = []) => {
    const grammar = ohm.grammar(SQLSealLangDefinition(views, flags))
    const match = grammar.match(query)
    if (match.succeeded()) {
        // Converting
        const s = generateSemantic(grammar)(match)
        return s.toObject() as Partial<ParserResult>
    } else {
        throw new Error(match.message || 'Unknown parsing error')
    }
}


export const parseWithDefaults = (query: string, views: ViewDefinition[], defaultvalues: ParserResult, flags: readonly Flag[] = []): ParserResult => {
    const parsed = parse(query, views, flags)
    return {
        flags: { ...defaultvalues.flags, ...parsed.flags },
        query: parsed.query || defaultvalues.query,
        renderer: { ...defaultvalues.renderer, ...parsed.renderer },
        tables: parsed.tables ?? []
    } satisfies ParserResult
}