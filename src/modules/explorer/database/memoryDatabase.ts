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