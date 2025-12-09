import { TFile } from "obsidian";
import { TableInfo } from "../schemaVisualiser/TableVisualiser";
import * as SQLite from 'wa-sqlite';
import SQLiteAsyncESMFactory from 'wa-sqlite/dist/wa-sqlite-async.mjs';
import wasmUrl from 'virtual:wa-sqlite-wasm-url';
import { IDBBatchAtomicVFS } from 'wa-sqlite/src/examples/IDBBatchAtomicVFS.js';

type ParamsObject = Record<string, any>;

/**
 * MemoryDatabase - reads external .db files using wa-sqlite
 * This is used by the SQL Explorer to open and query external SQLite database files
 */
export class MemoryDatabase {
    private sqlite3: any;
    private connection: number | null = null;
    private dbName: string;

    constructor(private file: TFile) {
        // Use a unique name for this temporary database
        this.dbName = `external_${file.name}_${Date.now()}`;
    }

    async connect() {
        console.log('MemoryDatabase: Initializing wa-sqlite for external .db file');

        // Initialize wa-sqlite
        const asyncModule = await SQLiteAsyncESMFactory({
            locateFile: () => wasmUrl
        });
        this.sqlite3 = SQLite.Factory(asyncModule);

        // Register VFS (using default for in-memory with imported data)
        this.sqlite3.vfs_register(
            new IDBBatchAtomicVFS(`external-db-vfs`, { durability: 'relaxed' })
        );

        // Open connection
        this.connection = await this.sqlite3.open_v2(
            this.dbName,
            SQLite.SQLITE_OPEN_CREATE | SQLite.SQLITE_OPEN_READWRITE
        );

        console.log('MemoryDatabase: Loading external .db file data');

        // Read the .db file binary data
        const binary = await this.file.vault.readBinary(this.file);
        const uint8Array = new Uint8Array(binary);

        // Import the database data
        // We need to deserialize the SQLite database into our wa-sqlite instance
        // The approach: read page by page and insert
        await this.deserializeDatabase(uint8Array);

        console.log('MemoryDatabase: External .db file loaded successfully');
    }

    private async deserializeDatabase(data: Uint8Array) {
        // For now, use a simpler approach: write to a temporary file in VFS
        // and let SQLite read it natively

        // Create a file in the VFS
        const vfs = this.sqlite3.vfs_find(null);
        const path = `/${this.dbName}.db`;

        // Open file for writing
        const fileId = {
            path,
            flags: SQLite.SQLITE_OPEN_CREATE | SQLite.SQLITE_OPEN_READWRITE | SQLite.SQLITE_OPEN_MAIN_DB
        };

        await this.sqlite3.vfs_open(vfs, path, fileId,
            SQLite.SQLITE_OPEN_CREATE | SQLite.SQLITE_OPEN_READWRITE | SQLite.SQLITE_OPEN_MAIN_DB,
            {} // out flags
        );

        // Write data in chunks
        const CHUNK_SIZE = 65536; // 64KB chunks
        let offset = 0;
        while (offset < data.length) {
            const chunk = data.slice(offset, Math.min(offset + CHUNK_SIZE, data.length));
            await this.sqlite3.vfs_write(vfs, fileId, chunk, offset);
            offset += chunk.length;
        }

        await this.sqlite3.vfs_close(vfs, fileId);

        // Close current connection and reopen with the imported file
        if (this.connection) {
            await this.sqlite3.close(this.connection);
        }

        this.connection = await this.sqlite3.open_v2(
            path,
            SQLite.SQLITE_OPEN_READONLY
        );
    }

    private async runQuery<T = ParamsObject>(sql: string, params: any[] = []): Promise<{ data: T[], columns: string[] }> {
        if (!this.connection) {
            throw new Error('Database not connected');
        }

        const results: T[] = [];
        let columns: string[] = [];

        const str = this.sqlite3.str_new(this.connection, sql);
        try {
            const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
            if (prepared && prepared.stmt) {
                // Bind parameters if provided
                if (params && params.length > 0) {
                    await this.sqlite3.bind_collection(prepared.stmt, params);
                }

                // Get column names
                const columnCount = await this.sqlite3.column_count(prepared.stmt);
                for (let i = 0; i < columnCount; i++) {
                    columns.push(await this.sqlite3.column_name(prepared.stmt, i));
                }

                // Fetch rows
                while (await this.sqlite3.step(prepared.stmt) === SQLite.SQLITE_ROW) {
                    const row: any = {};
                    for (let i = 0; i < columnCount; i++) {
                        const columnName = columns[i];
                        row[columnName] = await this.sqlite3.column(prepared.stmt, i);
                    }
                    results.push(row);
                }

                await this.sqlite3.finalize(prepared.stmt);
            }
        } finally {
            this.sqlite3.str_finish(str);
        }

        return { data: results, columns };
    }

    query<T = ParamsObject>(query: string, params: Record<string, any> | null = null): { data: T[], columns: string[] } {
        // Convert named parameters to positional if needed
        const paramArray = params ? Object.values(params) : [];

        // We need to make this synchronous for compatibility
        // Use a promise wrapper that we'll await
        throw new Error('Synchronous query not supported. Use async methods instead.');
    }

    async queryAsync<T = ParamsObject>(query: string, params: Record<string, any> | null = null): Promise<{ data: T[], columns: string[] }> {
        const paramArray = params ? Object.values(params) : [];
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
            'SELECT name, type FROM pragma_table_info(?)',
            { tableName }
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
            FROM pragma_table_info(?)
        `, { tableName });

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
            FROM pragma_foreign_key_list(?)
        `, { tableName });

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
        if (this.connection) {
            await this.sqlite3.close(this.connection);
            this.connection = null;
        }
    }
}
