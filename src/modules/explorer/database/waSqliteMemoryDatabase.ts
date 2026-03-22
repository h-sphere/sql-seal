import { TFile } from "obsidian";
import { TableInfo } from "../schemaVisualiser/TableVisualiser";
import SQLiteAsyncESMFactory from 'wa-sqlite/dist/wa-sqlite-async.mjs';
import * as SQLite from 'wa-sqlite';
import { MemoryAsyncVFS } from 'wa-sqlite/src/examples/MemoryAsyncVFS.js';
// @ts-ignore - Virtual module from esbuild
import wasmUrl from 'virtual:wa-sqlite-wasm-url';

type ParamsObject = Record<string, any>;

/**
 * WaSqliteMemoryDatabase - reads external .db files using wa-sqlite
 * This is used by the SQL Explorer to open and query external SQLite database files
 *
 * Uses wa-sqlite with MemoryAsyncVFS for simple, direct Uint8Array → database loading
 */
export class WaSqliteMemoryDatabase {
    private connection: number | null = null;
    private sqlite3: any = null;
    private vfs: MemoryAsyncVFS | null = null;
    private readonly dbName = 'external.db';

    constructor(private file: TFile) {}

    async connect() {
        // Read the .db file binary data
        const binary = await this.file.vault.readBinary(this.file);
        const data = new Uint8Array(binary);

        // Validate SQLite database
        const header = new TextDecoder().decode(data.slice(0, 16));
        if (!header.startsWith('SQLite format 3')) {
            throw new Error('Invalid SQLite database file format');
        }

        // Initialize wa-sqlite
        const asyncModule = await SQLiteAsyncESMFactory({
            locateFile: (file: string) => {
                if (file.endsWith('.wasm')) {
                    return wasmUrl;
                }
                return file;
            }
        });

        this.sqlite3 = SQLite.Factory(asyncModule);

        // Create and register MemoryAsyncVFS
        this.vfs = new MemoryAsyncVFS();
        this.sqlite3.vfs_register(this.vfs, true); // true = make it the default VFS

        // Pre-populate the VFS with the database file data
        // The MemoryVFS stores files in a Map keyed by filename
        this.vfs.mapNameToFile.set(this.dbName, {
            name: this.dbName,
            flags: 0,
            size: data.byteLength,
            data: data.buffer // Use the ArrayBuffer from the Uint8Array
        });

        // Open the database connection
        this.connection = await this.sqlite3.open_v2(
            this.dbName,
            SQLite.SQLITE_OPEN_READONLY // Open as read-only since we're just querying
        );
    }

    private async runQuery<T = ParamsObject>(sql: string, params: any[] = []): Promise<{ data: T[], columns: string[] }> {
        if (!this.connection || !this.sqlite3) {
            throw new Error('Database not connected');
        }

        try {
            const data: T[] = [];
            let columns: string[] = [];

            // Create string in WASM memory
            const str = this.sqlite3.str_new(this.connection, sql);
            try {
                const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
                if (prepared && prepared.stmt) {
                    // Bind parameters if any
                    if (params.length > 0) {
                        await this.sqlite3.bind_collection(prepared.stmt, params);
                    }

                    // Get column names
                    const columnCount = await this.sqlite3.column_count(prepared.stmt);
                    for (let i = 0; i < columnCount; i++) {
                        columns.push(await this.sqlite3.column_name(prepared.stmt, i));
                    }

                    // Fetch all rows
                    while (await this.sqlite3.step(prepared.stmt) === SQLite.SQLITE_ROW) {
                        const row: any = {};
                        for (let i = 0; i < columnCount; i++) {
                            row[columns[i]] = await this.sqlite3.column(prepared.stmt, i);
                        }
                        data.push(row as T);
                    }

                    await this.sqlite3.finalize(prepared.stmt);
                }
            } finally {
                this.sqlite3.str_finish(str);
            }

            return { data, columns };
        } catch (error) {
            console.error('WaSqliteMemoryDatabase: Query execution failed', { sql, params, error });
            throw error;
        }
    }

    query<T = ParamsObject>(query: string, params: Record<string, any> | null = null): { data: T[], columns: string[] } {
        // Convert params object to array for wa-sqlite
        const paramArray = params && typeof params === 'object' && !Array.isArray(params) ? Object.values(params) : [];
        // This is a sync method in the original API, but we need async for wa-sqlite
        // We'll need to make this async-compatible
        throw new Error('Synchronous query() not supported in wa-sqlite implementation. Use queryAsync() instead.');
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
        if (this.connection && this.sqlite3) {
            await this.sqlite3.close(this.connection);
            this.connection = null;
        }

        // VFS cleanup is automatic when connection closes
        this.vfs = null;
        this.sqlite3 = null;
    }
}
