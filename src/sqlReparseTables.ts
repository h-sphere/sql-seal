import { BaseFrom, From, Parser, Select, With } from "node-sql-parser"
import { generatePrefix } from "./hash"

const isGlobal = (table: string, globalTables: string[]) => {
    return globalTables.map(t =>
        t.toLowerCase()
    ).includes(table.toLowerCase())
}

const isBaseFrom = (from: From): from is BaseFrom => {
    return Object.keys(from).includes('table')
}

export const prefixedIfNotGlobal = (tableName: string, globalTables: string[], prefix: string) => {
    if (isGlobal(tableName, globalTables)) {
        return tableName
    }

    return generatePrefix(prefix, tableName)
}

const updateSelect = (selectAst: Select, globalTables: string[], prefix: string): { selectAst: Select, tables: string[] } => {

    let cteGlobals: string[] = []
    let withs = selectAst.with
    let extraTables: string[] = []
    if (selectAst.with) {
        cteGlobals = selectAst.with.map(w => w.name.value)
        const updatedWiths = selectAst.with.map(w => {
            const { selectAst, tables } = updateSelect(w.stmt.ast, [...cteGlobals, ...globalTables], prefix)
            extraTables.push(...tables)
            return {
                ...w,
                stmt: {
                    ...w.stmt,
                    ast: selectAst
                }
            } satisfies With
        })
        withs = updatedWiths
    }

    if (!selectAst.from) {
        return { selectAst: selectAst, tables: [] }
    }

    const tables: Array<string> = []

    const updatedFrom = selectAst.from.map(from => {
        if(isBaseFrom(from)) {
            const t = prefixedIfNotGlobal(from.table, [...cteGlobals, ...globalTables], prefix)
            tables.push(t)
            return {
                ...from,
                table: t,
            }
        }
        return from
    })

    return {
        selectAst: {
            ...selectAst,
            from: updatedFrom,
            with: withs
        },
        tables: [...tables, ...extraTables]
    }
}

export const updateTables = (selectStatement: string, globalTables: string[], prefix: string) => {
    const parser = new Parser()
    const { ast } = parser.parse(selectStatement)
    if (!Array.isArray(ast) && ast.type === 'select') {
        const { selectAst, tables } = updateSelect(ast!, globalTables, prefix)
        return { statement: parser.sqlify(selectAst), tables }
    } else {
        throw new Error('Invalid Statement. Only single SELECTs are accepted at the moment.')
    }
}