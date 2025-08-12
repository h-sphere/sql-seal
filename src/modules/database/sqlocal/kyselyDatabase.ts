import { Kysely, sql, RawBuilder } from "kysely";
import { uniq, uniqBy } from "lodash";
import { ColumnDefinition } from "../../../utils/types";
import { sanitise } from "../../../utils/sanitiseColumn";

const formatData = (data: Record<string, any>) => {
    return Object.keys(data).reduce((ret, key) => {
        if (typeof data[key] === 'boolean') {
            return {
                ...ret,
                [key]: data[key] ? 1 : 0
            }
        }
        if (!data[key]) {
            return {
                ...ret,
                [key]: null
            }
        }
        if (typeof data[key] === 'object' || Array.isArray(data[key])) {
            return {
                ...ret,
                [key]: JSON.stringify(data[key])
            }
        }
        return {
            ...ret,
            [key]: data[key]
        }
    }, {})
}

export class KyselyDatabase {
    constructor(private readonly db: Kysely<any>) {}

    registerCustomFunction(name: string, argsCount = 1): void {
        const fn = (...arg: string[]) => {
            const data = {
                type: name,
                values: arg
            }
            return `SQLSEALCUSTOM(${JSON.stringify(data)})`
        }

        // Note: Kysely doesn't have direct function registration like sql.js
        // This would need to be handled at the dialect level or through raw SQL
        console.warn(`registerCustomFunction not fully implemented for Kysely: ${name}`);
    }

    async createTableText(tableName: string, fields: string[]): Promise<void> {
        const fieldsString = fields.map(f => `${f} TEXT`).join(',')
        await sql`CREATE TABLE IF NOT EXISTS ${sql.table(tableName)} (${sql.raw(fieldsString)})`.execute(this.db)
    }

    async recreateDatabase() {
        await sql`
            PRAGMA writable_schema = 1;
            DELETE FROM sqlite_master;
            PRAGMA writable_schema = 0;
            VACUUM;
            PRAGMA integrity_check;
        `.execute(this.db)
    }

    async run(query: string, params?: Record<string, unknown>): Promise<void> {
        if (params && Object.keys(params).length > 0) {
            // Convert query to use ? placeholders and extract values in order
            const paramKeys = Object.keys(params).sort() // Sort for consistent ordering
            let processedQuery = query
            const values: unknown[] = []
            
            paramKeys.forEach(key => {
                processedQuery = processedQuery.replace(new RegExp(`@${key}\\b`, 'g'), '?')
                values.push(params[key])
            })
            
            await sql.raw(processedQuery, values).execute(this.db)
        } else {
            await sql.raw(query).execute(this.db)
        }
    }

    async getColumns(tableName: string): Promise<string[]> {
        const result = await sql`select name from pragma_table_info(${tableName})`.execute(this.db)
        return result.map((row: any) => row.name as string)
    }

    async addColumns(tableName: string, newColumns: string[]): Promise<void> {
        for (const columnName of newColumns) {
            await sql`ALTER TABLE ${sql.table(tableName)} ADD COLUMN ${sql.raw(columnName)}`.execute(this.db)
        }
    }

    async createTableNoTypes(tableName: string, columns: string[], noDrop: boolean = false): Promise<void> {
        const fields = uniq(columns.map(f => sanitise(f)))
        if (!noDrop) {
            await this.dropTable(tableName)
        }
        const fieldList = fields.join(',')
        await sql`CREATE TABLE IF NOT EXISTS ${sql.table(tableName)}(${sql.raw(fieldList)})`.execute(this.db)
    }

    async createTable(tableName: string, columns: ColumnDefinition[], noDrop: boolean = false): Promise<void> {
        const fields = uniqBy(columns.map(c => ({
            ...c,
            name: sanitise(c.name)
        })), 'name')

        if (!noDrop) {
            await this.dropTable(tableName)
        }

        const fieldDefinitions = fields.map(c => c.name)
        const fieldList = fieldDefinitions.join(', ')
        await sql`CREATE TABLE IF NOT EXISTS ${sql.table(tableName)}(${sql.raw(fieldList)})`.execute(this.db)
    }

    async clearTable(tableName: string): Promise<void> {
        await sql`DELETE FROM ${sql.table(tableName)}`.execute(this.db)
    }

    async insertData(tableName: string, data: Record<string, unknown>[]): Promise<void> {
        if (data.length === 0) return

        for (const d of data) {
            const formattedData = formatData(d)
            const columns = Object.keys(formattedData).filter(c => c !== '__parsed_extra')
            
            if (columns.length === 0) continue

            // Use raw SQL for dynamic table names and columns
            const columnNames = columns.join(', ')
            const placeholders = columns.map(() => '?').join(', ')
            const values = columns.map(col => formattedData[col])
            
            await sql.raw(
                `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`,
                values
            ).execute(this.db)
        }
    }

    async dropTable(tableName: string): Promise<void> {
        await sql`DROP TABLE IF EXISTS ${sql.table(tableName)}`.execute(this.db)
    }

    async select(query: string, params: Record<string, unknown>): Promise<{ data: any[], columns: string[] }> {
        // Convert query to use ? placeholders and extract values in order
        const paramKeys = Object.keys(params).sort() // Sort for consistent ordering
        let processedQuery = query
        const values: unknown[] = []
        
        paramKeys.forEach(key => {
            processedQuery = processedQuery.replace(new RegExp(`@${key}\\b`, 'g'), '?')
            values.push(params[key])
        })
        
        const result = await sql.raw(processedQuery, values).execute(this.db)
        const data = result.rows || result
        
        // Extract column names from the first row if available
        const columns = Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : []
        
        return { data: Array.isArray(data) ? data : [], columns }
    }

    async updateData(tableName: string, data: Array<Record<string, unknown>>, matchKey: string = 'id'): Promise<void> {
        const fields = Object.keys(data.reduce((acc, obj) => ({ ...acc, ...obj }), {}))
        
        for (const d of data) {
            const formattedData = formatData(d)
            const matchValue = formattedData[matchKey]
            const updateData = { ...formattedData }
            delete updateData[matchKey]

            if (Object.keys(updateData).length === 0) continue

            // Use raw SQL for dynamic updates
            const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ')
            const values = [...Object.values(updateData), matchValue]
            
            await sql.raw(
                `UPDATE ${tableName} SET ${setClause} WHERE ${matchKey} = ?`,
                values
            ).execute(this.db)
        }
    }

    async deleteData(name: string, data: Array<Record<string, unknown>>, key: string = 'id'): Promise<void> {
        for (const d of data) {
            await sql.raw(
                `DELETE FROM ${name} WHERE ${key} = ?`,
                [d[key]]
            ).execute(this.db)
        }
    }

    async connect(): Promise<void> {
        // Connection is handled by the DatabaseProvider, no-op here
        return Promise.resolve()
    }

    async explainQuery(query: string, params: Record<string, unknown>): Promise<any[]> {
        // Convert query to use ? placeholders and extract values in order
        const paramKeys = Object.keys(params).sort() // Sort for consistent ordering
        let processedQuery = query
        const values: unknown[] = []
        
        paramKeys.forEach(key => {
            processedQuery = processedQuery.replace(new RegExp(`@${key}\\b`, 'g'), '?')
            values.push(params[key])
        })
        
        const result = await sql.raw(`EXPLAIN QUERY PLAN ${processedQuery}`, values).execute(this.db)
        return Array.isArray(result.rows) ? result.rows : Array.isArray(result) ? result : []
    }

    async disconnect(): Promise<void> {
        // Disconnection is handled by the DatabaseProvider, no-op here
        return Promise.resolve()
    }

    async createIndex(indexName: string, tableName: string, columns: string[]): Promise<void> {
        const columnList = columns.join(', ')
        await sql`CREATE INDEX IF NOT EXISTS ${sql.raw(indexName)} ON ${sql.table(tableName)} (${sql.raw(columnList)})`.execute(this.db)
    }
}