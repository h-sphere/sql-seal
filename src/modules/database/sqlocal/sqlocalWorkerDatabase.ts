import * as Comlink from "comlink";
import SQLiteAsyncESMFactory from 'wa-sqlite/dist/wa-sqlite-async.mjs';
import * as SQLite from 'wa-sqlite';
import { IDBBatchAtomicVFS } from 'wa-sqlite/src/examples/IDBBatchAtomicVFS.js';
import { ColumnDefinition } from "../../../utils/types";
import { sanitise } from "../../../utils/sanitiseColumn";

/**
 * Retry an async operation with exponential backoff
 * @param operation - The async operation to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds for exponential backoff (default: 50)
 * @param errorMatcher - Optional function to determine if error should trigger retry
 * @returns The result of the successful operation
 * @throws The last error if all retries fail
 */
async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 50,
    errorMatcher?: (error: Error) => boolean
): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            // If errorMatcher provided, only retry matching errors
            if (errorMatcher && !errorMatcher(error as Error)) {
                throw error;
            }

            // Don't retry on last attempt
            if (attempt === maxRetries) {
                break;
            }

            // Calculate delay with exponential backoff
            const delay = baseDelay * Math.pow(2, attempt - 1);
            if (process.env.NODE_ENV === 'development') {
                console.warn(
                    `SqlocalWorkerDatabase: Retry attempt ${attempt}/${maxRetries} ` +
                    `after error: ${lastError.message}. Waiting ${delay}ms...`
                );
            }

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError!;
}

/**
 * Worker-side database implementation that runs wa-sqlite operations
 * in a Web Worker to avoid blocking the main thread.
 *
 * This class is exposed via Comlink and all methods are called from the main thread.
 */
export class SqlocalWorkerDatabase {
    private connection: number | null = null;
    private sqlite3: any = null;
    private isConnected = false;
    private vfsRegistered = false;
    private isRecreating = false;
    private wasmBinary?: Uint8Array;

    constructor(private readonly dbName: string) {
    }

    /**
     * Format data for SQLite storage (matching old sql.js implementation)
     * - Converts booleans to 0/1
     * - Converts falsy values to null
     * - JSON-stringifies objects and arrays
     */
    private formatData(data: Record<string, any>): Record<string, any> {
        return Object.keys(data).reduce((ret, key) => {
            const value = data[key];

            // Convert booleans to 0/1 for SQLite
            if (typeof value === 'boolean') {
                return { ...ret, [key]: value ? 1 : 0 };
            }

            // Convert falsy values to null, but preserve numeric 0
            if (!value && value !== 0) {
                return { ...ret, [key]: null };
            }

            // JSON-stringify objects and arrays
            if (typeof value === 'object' || Array.isArray(value)) {
                return { ...ret, [key]: JSON.stringify(value) };
            }

            // Pass through other values as-is
            return { ...ret, [key]: value };
        }, {});
    }

    private async initializeSQLite() {
        if (this.sqlite3) {
            return this.sqlite3;
        }

        if (!this.wasmBinary) {
            throw new Error('SqlocalWorkerDatabase: wasmBinary not provided. Call connect() with the WASM binary.');
        }

        try {
            const asyncModule = await SQLiteAsyncESMFactory({ wasmBinary: this.wasmBinary, locateFile: (file: string) => file });

            // Use Factory to get the actual sqlite3 API
            this.sqlite3 = SQLite.Factory(asyncModule);
            return this.sqlite3;
        } catch (error) {
            console.error('SqlocalWorkerDatabase: Failed to initialize wa-sqlite:', error);
            throw error;
        }
    }

    private registerVFS(dbName: string) {
        if (this.vfsRegistered) {
            return;
        }

        try {
            // Register VFS with relaxed durability for performance
            // @ts-ignore - Constructor does accept these parameters despite TypeScript definition
            const vfs = new IDBBatchAtomicVFS(dbName, {
                durability: "relaxed"
            });
            this.sqlite3.vfs_register(vfs);
            this.vfsRegistered = true;
        } catch (error) {
            console.error('SqlocalWorkerDatabase: Failed to register VFS:', error);
            throw error;
        }
    }

    async connect(wasmBinary: Uint8Array) {
        if (this.isConnected) {
            return Promise.resolve();
        }

        this.wasmBinary = wasmBinary;

        try {
            // Initialize SQLite
            await this.initializeSQLite();

            // Register VFS
            this.registerVFS(this.dbName);

            // Open database connection with concurrent read support
            this.connection = await this.sqlite3.open_v2(
                this.dbName,
                SQLite.SQLITE_OPEN_CREATE | SQLite.SQLITE_OPEN_READWRITE
            );

            // Configure for optimal speed (data can be recreated in this project)
            // Using MEMORY journal mode for maximum performance
            await this.sqlite3.exec(this.connection, `
                PRAGMA journal_mode=MEMORY;
                PRAGMA synchronous=OFF;
                PRAGMA cache_size=10000;
                PRAGMA temp_store=MEMORY;
                PRAGMA page_size=4096;
            `);

            this.isConnected = true;
        } catch (error) {
            console.error('SqlocalWorkerDatabase: Failed to connect:', error);
            throw error;
        }
    }

    async disconnect() {
        if (!this.isConnected || !this.connection) {
            return;
        }
        if (this.connection && this.sqlite3) {
            await this.sqlite3.close(this.connection);
            this.connection = null;
            this.isConnected = false;
        }
    }

    registerCustomFunction(name: string, argsCount = 1) {
        if (!this.connection) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('SqlocalWorkerDatabase: Database not connected, cannot register custom function');
            }
            return Promise.resolve();
        }

        // Register different overloads based on argument count using wa-sqlite API
        // The callback signature is (context: number, values: Uint32Array)
        // where values is an array of pointers to sqlite3_value
        try {

            if (argsCount >= 1) {
                this.sqlite3.create_function(
                    this.connection,
                    name,
                    1,
                    this.sqlite3.SQLITE_UTF8,
                    null,
                    (context: number, values: Uint32Array) => {
                        const arg0 = this.sqlite3.value_text(values[0]);
                        const data = { type: name, values: [arg0] };
                        const result = `SQLSEALCUSTOM(${JSON.stringify(data)})`;
                        this.sqlite3.result_text(context, result);
                    }
                );
            }
            if (argsCount >= 2) {
                this.sqlite3.create_function(
                    this.connection,
                    name,
                    2,
                    this.sqlite3.SQLITE_UTF8,
                    null,
                    (context: number, values: Uint32Array) => {
                        const arg0 = this.sqlite3.value_text(values[0]);
                        const arg1 = this.sqlite3.value_text(values[1]);
                        const data = { type: name, values: [arg0, arg1] };
                        const result = `SQLSEALCUSTOM(${JSON.stringify(data)})`;
                        this.sqlite3.result_text(context, result);
                    }
                );
            }
            if (argsCount >= 3) {
                this.sqlite3.create_function(
                    this.connection,
                    name,
                    3,
                    this.sqlite3.SQLITE_UTF8,
                    null,
                    (context: number, values: Uint32Array) => {
                        const arg0 = this.sqlite3.value_text(values[0]);
                        const arg1 = this.sqlite3.value_text(values[1]);
                        const arg2 = this.sqlite3.value_text(values[2]);
                        const data = { type: name, values: [arg0, arg1, arg2] };
                        const result = `SQLSEALCUSTOM(${JSON.stringify(data)})`;
                        this.sqlite3.result_text(context, result);
                    }
                );
            }
            if (argsCount >= 4) {
                throw new Error('Too many arguments, only up to 3 arguments are supported at the moment.');
            }
        } catch (error) {
            console.error(`SqlocalWorkerDatabase: Error registering function '${name}':`, error);
        }

        return Promise.resolve();
    }

    async recreateDatabase() {
        if (!this.connection) throw new Error('Database not connected');
        if (this.isRecreating) {
            return;
        }

        try {
            this.isRecreating = true;

            // Get all table names using wa-sqlite API
            const tables: any[] = [];
            const sql = `
                SELECT name FROM sqlite_master
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
            `;

            const str = this.sqlite3.str_new(this.connection, sql);
            try {
                const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
                if (prepared) {
                    while (await this.sqlite3.step(prepared.stmt) === SQLite.SQLITE_ROW) {
                        tables.push({ name: await this.sqlite3.column(prepared.stmt, 0) });
                    }
                    await this.sqlite3.finalize(prepared.stmt);
                }
            } finally {
                this.sqlite3.str_finish(str);
            }

            // Drop all tables
            for (const table of tables) {
                await this.dropTableInternal(table.name);
            }

            // Run VACUUM to reclaim space and optimize database (matching old sql.js implementation)
            await this.sqlite3.exec(this.connection, 'VACUUM');

            // Run integrity check to verify database health
            await this.sqlite3.exec(this.connection, 'PRAGMA integrity_check');
        } catch (error) {
            console.error('SqlocalWorkerDatabase: Error during recreateDatabase:', error);
            throw error;
        } finally {
            this.isRecreating = false;
        }
    }

    private async dropTableInternal(name: string) {
        const sql = `DROP TABLE IF EXISTS "${name}"`;

        const str = this.sqlite3.str_new(this.connection, sql);
        try {
            const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
            if (prepared) {
                await this.sqlite3.step(prepared.stmt);
                await this.sqlite3.finalize(prepared.stmt);
            }
        } finally {
            this.sqlite3.str_finish(str);
        }
    }

    async updateData(name: string, data: Array<Record<string, unknown>>, key: string = 'id') {
        if (!this.connection) throw new Error('Database not connected');

        if (data.length === 0) {
            return;
        }

        // Format first row to determine columns structure
        const firstFormatted = this.formatData(data[0]);
        const columns = Object.keys(firstFormatted).filter(k => k !== key);
        const setClause = columns.map(col => `"${col}" = ?`).join(', ');
        const sql = `UPDATE "${name}" SET ${setClause} WHERE "${key}" = ?`;

        // PERFORMANCE OPTIMIZATION: Prepare statement once, reuse for all rows
        const str = this.sqlite3.str_new(this.connection, sql);
        const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));

        if (!prepared) {
            this.sqlite3.str_finish(str);
            throw new Error('Failed to prepare update statement');
        }

        try {
            for (const row of data) {
                // Format data before updating
                const formattedRow = this.formatData(row);
                const keyValue = formattedRow[key];
                const values = columns.map(col => formattedRow[col]);

                // Reset statement for reuse instead of preparing again
                await this.sqlite3.reset(prepared.stmt);
                await this.sqlite3.bind_collection(prepared.stmt, [...values, keyValue]);
                await this.sqlite3.step(prepared.stmt);
            }
        } finally {
            // Finalize once at the end
            await this.sqlite3.finalize(prepared.stmt);
            this.sqlite3.str_finish(str);
        }
    }

    async deleteData(name: string, data: Array<Record<string, unknown>>, key: string = 'id') {
        if (!this.connection) throw new Error('Database not connected');

        if (data.length === 0) {
            return;
        }

        const sql = `DELETE FROM "${name}" WHERE "${key}" = ?`;

        // PERFORMANCE OPTIMIZATION: Prepare statement once, reuse for all rows
        const str = this.sqlite3.str_new(this.connection, sql);
        const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));

        if (!prepared) {
            this.sqlite3.str_finish(str);
            throw new Error('Failed to prepare delete statement');
        }

        try {
            for (const row of data) {
                // Format data for consistency (though only key is used)
                const formattedRow = this.formatData(row);
                const keyValue = formattedRow[key];

                // Reset statement for reuse instead of preparing again
                await this.sqlite3.reset(prepared.stmt);
                await this.sqlite3.bind_collection(prepared.stmt, [keyValue]);
                await this.sqlite3.step(prepared.stmt);
            }
        } finally {
            // Finalize once at the end
            await this.sqlite3.finalize(prepared.stmt);
            this.sqlite3.str_finish(str);
        }
    }

    async insertData(name: string, inData: Array<Record<string, unknown>>) {
        if (!this.connection) throw new Error('Database not connected');

        if (inData.length === 0) {
            return;
        }

        // Filter out __parsed_extra column (internal metadata) - matches old sql.js implementation
        const columns = Object.keys(inData[0]).filter(c => c !== '__parsed_extra');
        const placeholders = columns.map(() => '?').join(', ');
        const columnNames = columns.map(col => `"${col}"`).join(', ');

        const sql = `INSERT INTO "${name}" (${columnNames}) VALUES (${placeholders})`;

        // PERFORMANCE OPTIMIZATION: Prepare statement once, reuse for all rows
        const str = this.sqlite3.str_new(this.connection, sql);
        const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));

        if (!prepared) {
            this.sqlite3.str_finish(str);
            throw new Error('Failed to prepare insert statement');
        }

        try {
            for (const row of inData) {
                // Format data (booleans → 0/1, objects → JSON) before inserting
                const formattedRow = this.formatData(row);
                const values = columns.map(col => formattedRow[col]);

                // Reset statement for reuse instead of preparing again
                await this.sqlite3.reset(prepared.stmt);
                await this.sqlite3.bind_collection(prepared.stmt, values);
                await this.sqlite3.step(prepared.stmt);
            }
        } finally {
            // Finalize once at the end
            await this.sqlite3.finalize(prepared.stmt);
            this.sqlite3.str_finish(str);
        }
    }

    async dropTable(name: string) {
        if (!this.connection) throw new Error('Database not connected');

        try {
            await this.dropTableInternal(name);
        } catch (error) {
            console.error(`SqlocalWorkerDatabase: Error dropping table '${name}':`, error);
            throw error;
        }
    }

    async createTableNoTypes(name: string, columns: string[], noDrop?: boolean) {
        if (!this.connection) throw new Error('Database not connected');

        if (!noDrop) {
            await this.dropTableInternal(name);
        }

        const columnDefs = columns.map(col => `"${col}" TEXT`).join(', ');
        const sql = `CREATE TABLE IF NOT EXISTS "${name}" (${columnDefs})`;

        const str = this.sqlite3.str_new(this.connection, sql);
        try {
            const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
            if (prepared) {
                await this.sqlite3.step(prepared.stmt);
                await this.sqlite3.finalize(prepared.stmt);
            }
        } finally {
            this.sqlite3.str_finish(str);
        }
    }

    async createTable(name: string, columns: ColumnDefinition[], noDrop?: boolean) {
        if (!this.connection) throw new Error('Database not connected');

        if (!noDrop) {
            await this.dropTableInternal(name);
        }

        // Map column types - SQLite doesn't have 'auto' type, use TEXT instead
        const columnDefs = columns.map(col => {
            const type = col.type && col.type !== 'auto' ? col.type : 'TEXT';
            return `"${col.name}" ${type}`;
        }).join(', ');
        const sql = `CREATE TABLE IF NOT EXISTS "${name}" (${columnDefs})`;

        const str = this.sqlite3.str_new(this.connection, sql);
        try {
            const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
            if (prepared) {
                await this.sqlite3.step(prepared.stmt);
                await this.sqlite3.finalize(prepared.stmt);
            }
        } finally {
            this.sqlite3.str_finish(str);
        }
    }

    async createIndex(indexName: string, tableName: string, columns: string[]) {
        // Indexes disabled for now
        return;
    }

    async getColumns(name: string) {
        if (!this.connection) throw new Error('Database not connected');

        const columns: string[] = [];
        const sql = `PRAGMA table_info("${name}")`;

        const str = this.sqlite3.str_new(this.connection, sql);
        try {
            const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
            if (prepared) {
                while (await this.sqlite3.step(prepared.stmt) === SQLite.SQLITE_ROW) {
                    columns.push(await this.sqlite3.column(prepared.stmt, 1)); // Column name is at index 1
                }
                await this.sqlite3.finalize(prepared.stmt);
            }
        } finally {
            this.sqlite3.str_finish(str);
        }

        return columns;
    }

    async count(tableName: string) {
        if (!this.connection) throw new Error('Database not connected');

        let count = 0;
        const sql = `SELECT COUNT(*) as count FROM "${tableName}"`;

        const str = this.sqlite3.str_new(this.connection, sql);
        try {
            const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
            if (prepared) {
                if (await this.sqlite3.step(prepared.stmt) === SQLite.SQLITE_ROW) {
                    count = await this.sqlite3.column(prepared.stmt, 0);
                }
                await this.sqlite3.finalize(prepared.stmt);
            }
        } finally {
            this.sqlite3.str_finish(str);
        }

        return count;
    }

    async addColumns(tableName: string, newColumns: string[]) {
        if (!this.connection) throw new Error('Database not connected');

        for (const column of newColumns) {
            const sql = `ALTER TABLE "${tableName}" ADD COLUMN "${column}" TEXT`;

            const str = this.sqlite3.str_new(this.connection, sql);
            try {
                const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
                if (prepared) {
                    await this.sqlite3.step(prepared.stmt);
                    await this.sqlite3.finalize(prepared.stmt);
                }
            } finally {
                this.sqlite3.str_finish(str);
            }
        }
    }

    async select(statement: string, frontmatter: Record<string, unknown>) {
        if (!this.connection) throw new Error('Database not connected');
        if (this.isRecreating) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('SqlocalWorkerDatabase: Database is being recreated, cannot execute select');
            }
            return { data: [], columns: [], executionTime: 0 };
        }

        // Wrap the select operation with retry logic
        return retryWithBackoff(
            async () => {
                try {
                    // Replace frontmatter placeholders in the query
                    let processedStatement = statement;
                    const params: any[] = [];

                    // Support both {{key}} and @key parameter formats for compatibility
                    for (const [key, value] of Object.entries(frontmatter)) {
                        // Handle {{key}} format (used in user queries)
                        const doubleBracePlaceholder = `{{${key}}}`;
                        const doubleBraceRegex = new RegExp(doubleBracePlaceholder.replace(/[{}]/g, '\\$&'), 'g');
                        const doubleBraceMatches = (processedStatement.match(doubleBraceRegex) || []).length;
                        if (doubleBraceMatches > 0) {
                            processedStatement = processedStatement.replace(doubleBraceRegex, '?');
                            for (let i = 0; i < doubleBraceMatches; i++) {
                                params.push(value);
                            }
                        }

                        // Handle @key format (used in repository queries)
                        const atPlaceholder = `@${key}`;
                        const atRegex = new RegExp(`@${key}\\b`, 'g');
                        const atMatches = (processedStatement.match(atRegex) || []).length;
                        if (atMatches > 0) {
                            processedStatement = processedStatement.replace(atRegex, '?');
                            for (let i = 0; i < atMatches; i++) {
                                params.push(value);
                            }
                        }
                    }

                    const startTime = performance.now();
                    const data: any[] = [];
                    let columns: string[] = [];

                    // Create string in WASM memory
                    const str = this.sqlite3.str_new(this.connection, processedStatement);
                    let prepared = null;
                    try {
                        prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));

                        if (prepared && prepared.stmt) {
                            await this.sqlite3.bind_collection(prepared.stmt, params);

                            // Get column names
                            const columnCount = await this.sqlite3.column_count(prepared.stmt);

                            for (let i = 0; i < columnCount; i++) {
                                columns.push(await this.sqlite3.column_name(prepared.stmt, i));
                            }

                            // Fetch all rows
                            let stepResult;
                            while ((stepResult = await this.sqlite3.step(prepared.stmt)) === SQLite.SQLITE_ROW) {
                                const row: any = {};
                                for (let i = 0; i < columnCount; i++) {
                                    const columnName = columns[i];
                                    row[columnName] = await this.sqlite3.column(prepared.stmt, i);
                                }
                                data.push(row);
                            }
                        }
                    } finally {
                        // Finalize statement before finishing string
                        if (prepared && prepared.stmt) {
                            try {
                                await this.sqlite3.finalize(prepared.stmt);
                            } catch (finalizeError) {
                                console.error('SqlocalWorkerDatabase: Error finalizing statement:', finalizeError);
                            }
                        }
                        this.sqlite3.str_finish(str);
                    }

                    const executionTime = performance.now() - startTime;
                    return {
                        data,
                        columns,
                        executionTime
                    };
                } catch (error) {
                    console.error('SqlocalWorkerDatabase: Error executing select:', error);
                    console.error('SqlocalWorkerDatabase: Failed statement:', statement);
                    throw error;
                }
            },
            3, // maxRetries
            50, // baseDelay (50ms, 100ms, 200ms pattern)
            (error: Error) => {
                // Only retry on "no such table" errors
                return error.message.toLowerCase().includes('no such table');
            }
        );
    }

    async explain(statement: string, frontmatter: Record<string, unknown>) {
        if (!this.connection) throw new Error('Database not connected');

        // Replace frontmatter placeholders in the query
        let processedStatement = statement;
        const params: any[] = [];

        // Support both {{key}} and @key parameter formats
        for (const [key, value] of Object.entries(frontmatter)) {
            const doubleBracePlaceholder = `{{${key}}}`;
            const doubleBraceRegex = new RegExp(doubleBracePlaceholder.replace(/[{}]/g, '\\$&'), 'g');
            const doubleBraceMatches = (processedStatement.match(doubleBraceRegex) || []).length;
            if (doubleBraceMatches > 0) {
                processedStatement = processedStatement.replace(doubleBraceRegex, '?');
                for (let i = 0; i < doubleBraceMatches; i++) {
                    params.push(value);
                }
            }

            const atRegex = new RegExp(`@${key}\\b`, 'g');
            const atMatches = (processedStatement.match(atRegex) || []).length;
            if (atMatches > 0) {
                processedStatement = processedStatement.replace(atRegex, '?');
                for (let i = 0; i < atMatches; i++) {
                    params.push(value);
                }
            }
        }

        const explainQuery = `EXPLAIN QUERY PLAN ${processedStatement}`;
        const results: Array<{id: number, parent: number, detail: string}> = [];

        const str = this.sqlite3.str_new(this.connection, explainQuery);
        try {
            const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
            if (prepared && prepared.stmt) {
                await this.sqlite3.bind_collection(prepared.stmt, params);

                // EXPLAIN QUERY PLAN columns: id, parent, notused, detail
                while (await this.sqlite3.step(prepared.stmt) === SQLite.SQLITE_ROW) {
                    const id = await this.sqlite3.column(prepared.stmt, 0);
                    const parent = await this.sqlite3.column(prepared.stmt, 1);
                    const detail = await this.sqlite3.column(prepared.stmt, 3);
                    results.push({ id, parent, detail });
                }
                await this.sqlite3.finalize(prepared.stmt);
            }
        } finally {
            this.sqlite3.str_finish(str);
        }

        // Format results as indented string (matching SqlocalDatabase implementation)
        let strResult = '';
        const map = new Map<number, number>();
        const INDENT_INCREASE = 4;
        map.set(0, -INDENT_INCREASE);

        for (const result of results || []) {
            const parent = parseInt((result.parent as unknown as string) ?? '0', 10);
            const indent = (map.get(parent) || 0) + INDENT_INCREASE;

            for (let i = 0; i < indent; i++) {
                strResult += ' ';
            }

            strResult += result.detail + "\n";
            map.set(result.id as number, indent);
        }

        return strResult;
    }

    async hasTable(tableName: string) {
        if (!this.connection) throw new Error('Database not connected');

        const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name=?`;

        const str = this.sqlite3.str_new(this.connection, sql);
        try {
            const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
            if (prepared) {
                await this.sqlite3.bind_collection(prepared.stmt, [tableName]);
                const hasRow = await this.sqlite3.step(prepared.stmt) === SQLite.SQLITE_ROW;
                await this.sqlite3.finalize(prepared.stmt);
                return hasRow;
            }
        } finally {
            this.sqlite3.str_finish(str);
        }

        return false;
    }
}

// Expose the class via Comlink so it can be used from the main thread
Comlink.expose(SqlocalWorkerDatabase);
