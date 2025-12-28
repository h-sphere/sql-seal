import { TFile } from "obsidian";
import { TableInfo } from "../schemaVisualiser/TableVisualiser";
import initSqlJs, { Database } from 'sql.js';
// @ts-ignore - Virtual module from esbuild
import sqlJsWasmUrl from 'virtual:sqljs-wasm-url';

type ParamsObject = Record<string, any>;

/**
 * MemoryDatabase - reads external .db files using sql.js
 * This is used by the SQL Explorer to open and query external SQLite database files
 *
 * Uses sql.js for simple, direct Uint8Array → database loading with bundled WASM
 */
export class MemoryDatabase {
    private db: Database | null = null;

    constructor(private file: TFile) {}

    async connect() {
        console.log('MemoryDatabase: Loading external .db file using sql.js');

        // Read the .db file binary data
        const binary = await this.file.vault.readBinary(this.file);
        const data = new Uint8Array(binary);

        // Validate SQLite database
        const header = new TextDecoder().decode(data.slice(0, 16));
        if (!header.startsWith('SQLite format 3')) {
            throw new Error('Invalid SQLite database file format');
        }

        console.log('MemoryDatabase: Initializing sql.js with bundled WASM');

        // Initialize sql.js (loads bundled WASM for offline use)
        const SQL = await initSqlJs({
            locateFile: () => sqlJsWasmUrl
        });

        console.log('MemoryDatabase: Loading database from Uint8Array');

        // Direct Uint8Array → database (one line!)
        this.db = new SQL.Database(data);

        console.log('MemoryDatabase: External .db file loaded successfully');
    }

    private runQuery<T = ParamsObject>(sql: string, params: any[] = []): { data: T[], columns: string[] } {
        if (!this.db) {
            throw new Error('Database not connected');
        }

        try {
            const results = this.db.exec(sql, params);

            if (results.length === 0) {
                return { data: [], columns: [] };
            }

            const { columns, values } = results[0];
            const data = values.map((row: any[]) => {
                const obj: any = {};
                columns.forEach((col: string, i: number) => {
                    obj[col] = row[i];
                });
                return obj as T;
            });

            return { data, columns };
        } catch (error) {
            console.error('MemoryDatabase: Query execution failed', { sql, params, error });
            throw error;
        }
    }

    query<T = ParamsObject>(query: string, params: Record<string, any> | null = null): { data: T[], columns: string[] } {
        const paramArray = params && typeof params === 'object' && !Array.isArray(params) ? Object.values(params) : [];
        return this.runQuery<T>(query, paramArray);
    }

    async queryAsync<T = ParamsObject>(query: string, params: Record<string, any> | null = null): Promise<{ data: T[], columns: string[] }> {
        const paramArray = params && typeof params === 'object' && !Array.isArray(params) ? Object.values(params) : [];
        return this.runQuery<T>(query, paramArray);
    }

    async select<T = ParamsObject>(query: string, params: Record<string, any> | null = null) {
        return this.queryAsync<T>(query, params);
    }

    explain() {
        return {};
    }

    async allTables() {
        return this.queryAsync<{name: string}>(`SELECT name FROM sqlite_master WHERE type='table'`);
    }

    async getColumns(tableName: string) {
        return this.queryAsync<{ name: string, type: string }>(
            `SELECT name, type FROM pragma_table_info('${tableName}')`,
            null
        );
    }

    async getDetailedTableInfo(tableName: string) {
        const result = await this.queryAsync<{
            name: string,
            type: string,
            pk: number,
            dflt_value: any,
            notnull: number
        }>(`
            SELECT name, type, pk, dflt_value, [notnull]
            FROM pragma_table_info('${tableName}')
        `, null);

        return result.data.map(row => ({
            name: row.name,
            type: row.type,
            isPrimaryKey: row.pk === 1,
            defaultValue: row.dflt_value,
            notNull: row.notnull === 1
        }));
    }

    async getForeignKeys(tableName: string) {
        const result = await this.queryAsync<{
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
            FROM pragma_foreign_key_list('${tableName}')
        `, null);

        return result.data.map(row => ({
            id: row.id,
            seq: row.seq,
            referencedTable: row.table,
            fromColumn: row.from,
            toColumn: row.to,
            onUpdate: row.on_update,
            onDelete: row.on_delete,
            match: row.match
        }));
    }

    async getAllTables() {
        const result = await this.queryAsync<{ name: string }>(`
            SELECT name FROM sqlite_master
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `);

        return result.data.map(row => row.name);
    }

    async getDetailedSchema() {
        const tables = await this.getAllTables();
        const schema = [];

        for (const tableName of tables) {
            schema.push({
                name: tableName,
                columns: await this.getDetailedTableInfo(tableName),
                foreignKeys: await this.getForeignKeys(tableName)
            });
        }

        return schema;
    }

    async getSchema(): Promise<TableInfo[]> {
        const tablesResult = await this.allTables();
        const tables = tablesResult.data;
        const schema: TableInfo[] = [];

        for (const t of tables) {
            const columns = await this.getColumns(t.name);
            schema.push({
                name: t.name,
                columns: columns.data
            });
        }

        return schema;
    }

    async disconnect() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}
