import * as ohm from 'ohm-js';


const SQLSealGrammar = String.raw`
SQLSealLang {
    Grammar = (TableExpression | RendererExpression | FlagExpression)* SelectStmt*
    SelectStmt = ("WITH" | "SELECT") any+
    FlagExpression = "REFRESH" -- refresh
    | "NO REFRESH" -- norefresh
    | "EXPLAIN" -- explain
    TableExpression = "TABLE" identifier "=" "file(" filename ")"
    identifier = alnum+
    filename  = (alnum | ".")+
    RendererExpression = "GRID" anyObject -- grid
    	| "HTML" -- html
        | "MARKDOWN" --markdown
    anyObject = "{" (~"}" any)*  "}"
}
`

const generateSemantic = (grammar: ohm.Grammar) => {
    const s = grammar.createSemantics()
    s.addOperation<any>('toObject', {
       Grammar: (entries, selectStatement) => {
        console.log('GRAMMAR', entries, selectStatement)
        const res = {
            flags: {
                refresh: true,
                explain: false
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
                console.log(c.ctorName)
                switch (c.ctorName) {
                    case 'TableExpression':
                        res.tables.push(c.toObject())
                        break;
                    case 'RendererExpression':
                        res.renderer = c.toObject()
                        break
                    case 'Flag':
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
       TableExpression: (_table, identifier, _eq, _file, filename, _close) => {
        return { identifier: identifier.sourceString , filename: filename.sourceString, type: 'csv' }
       },
       FlagExpression_refresh: (v) => {
        return { refresh: true }
       },
       FlagExpression_norefresh: (v) => {
        return {refresh: false}
       },
       FlagExpression_explain: (v) => {
        return { explain: true }
       }
    })

    return s
}

export const parse = (query: string) => {
    

    const grammar = ohm.grammar(SQLSealGrammar)
    const match = grammar.match(query)
    if (match.succeeded()) {
        // Converting
        const s = generateSemantic(grammar)(match)
        return s.toObject()
    } else {
        throw new Error(match.message || 'Unknown parsing error')
    }
}