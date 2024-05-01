import { BaseFrom, Parser, Select } from "node-sql-parser"
import { generatePrefix } from "./hash"

const isGlobal = (table: string, globalTables: string[]) => {
    return globalTables.map(t =>
        t.toLowerCase()
    ).includes(table.toLowerCase())
}

const isBaseFrom = (from: From): from is BaseFrom => {
    return !!from['table']
}

export const prefixedIfNotGlobal = (tableName: string, globalTables: string[], prefix: string) => {
    if (isGlobal(tableName, globalTables)) {
        return tableName
    }

    return generatePrefix(prefix, tableName)
}

const updateSelect = (selectAst: Select, globalTables: string[], prefix: string) => {
    if (!selectAst.from) {
        return selectAst
    }
    return {
        ...selectAst,
        from: selectAst.from.map(from => {
            // FIXME: better typing here.
            if(isBaseFrom(from)) {
                return {
                    ...from,
                    table: prefixedIfNotGlobal(from.table, globalTables, prefix)
                }
            }
            return from
        })
    }
}

export const updateTables = (selectStatement: string, globalTables: string[], prefix: string) => {
    const parser = new Parser()
    const { ast } = parser.parse(selectStatement)
    if (!Array.isArray(ast) && ast.type === 'select') {
        const updated = updateSelect(ast!, globalTables, prefix)
        return parser.sqlify(updated)
    } else {
        throw new Error('Invalid Statement. Only single SELECTs are accepted at the moment.')
    }
}