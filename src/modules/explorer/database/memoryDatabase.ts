import { TFile } from "obsidian";
import { BindParams, Database, ParamsObject } from "sql.js";
import { toObjectArray } from "../../database/worker/database";
import { TableInfo } from "../schemaVisualiser/TableVisualiser";

export class MemoryDatabase {
    private db: Database
    constructor(private sql: initSqlJs.SqlJsStatic, private file: TFile) {

    }

    async connect() {
        const binary = await this.file.vault.readBinary(this.file)
        this.db = new this.sql.Database(Buffer.from(binary))
    }

    query<T = ParamsObject>(query: string, params: BindParams = null): { data: T[], columns: keyof T } {
        const stmt = this.db.prepare(query, params)
        const data = toObjectArray(stmt)
        const columns = stmt.getColumnNames()
        stmt.free()

        return { data: data, columns } as any
    }

    select<T = ParamsObject>(query: string, params: BindParams = null) {
        return this.query<T>(query, params)
    }

    explain() {
        return {}
    }

    allTables() {
        return this.query<{name: string}>(`select name from sqlite_master where type='table'`)
    }

    getColumns(tableName: string) {
		return this.query<{ name: string, type: string }>('select name, type from pragma_table_info(@tableName)', { '@tableName': tableName })
    }

    getDetailedTableInfo(tableName: string) {
        const result = this.query<{
            name: string,
            type: string,
            pk: number,
            dflt_value: any,
            notnull: number
        }>(`
            SELECT name, type, pk, dflt_value, [notnull]
            FROM pragma_table_info(@tableName)
        `, { '@tableName': tableName })
        
        return result.data.map(row => ({
            name: row.name,
            type: row.type,
            isPrimaryKey: row.pk === 1,
            defaultValue: row.dflt_value,
            notNull: row.notnull === 1
        }))
    }

    getForeignKeys(tableName: string) {
        const result = this.query<{
            id: number,
            seq: number,
            table: string,
            from: string,
            to: string,
            on_update: string,
            on_delete: string,
            match: string
        }>(`
            SELECT id, seq, [table], [from], [to], on_update, on_delete, [match]
            FROM pragma_foreign_key_list(@tableName)
        `, { '@tableName': tableName })
        
        return result.data.map(row => ({
            id: row.id,
            seq: row.seq,
            referencedTable: row.table,
            fromColumn: row.from,
            toColumn: row.to,
            onUpdate: row.on_update,
            onDelete: row.on_delete,
            match: row.match
        }))
    }

    getAllTables() {
        const result = this.query<{ name: string }>(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `)
        
        return result.data.map(row => row.name)
    }

    getDetailedSchema() {
        const tables = this.getAllTables()
        return tables.map(tableName => ({
            name: tableName,
            columns: this.getDetailedTableInfo(tableName),
            foreignKeys: this.getForeignKeys(tableName)
        }))
    }

    getSchema(): TableInfo[] {
        const tables = this.allTables().data
        return tables.map(t => {
            const columns = this.getColumns(t.name)
            return {
                name: t.name,
                columns: columns.data
            }
        })
    }
}