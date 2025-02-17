import * as ohm from 'ohm-js';

export interface ViewDefinition {
    name: string,
    singleLine: boolean,
    argument: string
}

const viewName = (view: ViewDefinition) => `caseInsensitive<"${view.name}">`



export const SQLSealLangDefinition = (views: ViewDefinition[]) => {
    const viewsDefinitions = views
        .map(view => view.singleLine ?
            `#(${viewName(view)} ${view.argument})`
        : `${viewName(view)} ${view.argument}`)
        .join(' | ')

    return String.raw`
        SQLSealLang {
            Grammar =                  (TableExpression | ViewExpression | FlagExpression | blank)* SelectStmt*
            SelectStmt =               selectKeyword any+
            FlagExpression =           caseInsensitive<"REFRESH">                                               -- refresh
            |                          caseInsensitive<"NO REFRESH">                                            -- norefresh
            |                          caseInsensitive<"EXPLAIN">                                               -- explain
            TableExpression =          tableKeyword identifier "=" TableDefinition          
            TableDefinition =          fileOpening NonemptyListOf<filename, ","> tableDefinitionClosing          -- file
            |                          tableOpening alnum+ tableDefinitionClosing                   -- mdtable
            identifier =               (alnum | "_")+
            filename  =                (alnum | "." | "-" | space | "_" | "/" | "\\" | "$" | "[" | "]" | "\"")+
            fileOpening =              caseInsensitive<"file(">
            tableOpening =             caseInsensitive<"table(">
            tableDefinitionClosing =   ")"
   
            ViewExpression =           ${viewsDefinitions}
            anyObject =                "{"  (~selectKeyword any)*
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

    s.addOperation<any>('toObject', {
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
                        res.flags = {...res.flags, ...c.toObject()}
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
            arguments: args.asIteration().children.map((c: ohm.Node) => c.sourceString.trim()),
            type: 'file'
        }
       },
       TableDefinition_mdtable: (_file, tableIndex, _close) =>  {
        return {

            arguments: [tableIndex.sourceString],
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
       _terminal() {
            return this.sourceString
       }
    })

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

export const parse = (query: string, views: ViewDefinition[]) => {
    const grammar = ohm.grammar(SQLSealLangDefinition(views))
    console.log('GRammar', SQLSealLangDefinition(views))
    const match = grammar.match(query)
    if (match.succeeded()) {
        // Converting
        const s = generateSemantic(grammar)(match)
        return s.toObject() as Partial<ParserResult>
    } else {
        throw new Error(match.message || 'Unknown parsing error')
    }
}


export const parseWithDefaults = (query: string, views: ViewDefinition[], defaultvalues: ParserResult): ParserResult => {
    const parsed = parse(query, views)
    return {
        flags: {...defaultvalues.flags, ...parsed.flags},
        query: parsed.query || defaultvalues.query,
        renderer: {...defaultvalues.renderer, ...parsed.renderer},
        tables: parsed.tables ?? []
    } satisfies ParserResult
}