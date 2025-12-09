import * as Comlink from "comlink";
import SQLiteAsyncESMFactory from 'wa-sqlite/dist/wa-sqlite-async.mjs';
import * as SQLite from 'wa-sqlite';
import { IDBBatchAtomicVFS } from 'wa-sqlite/src/examples/IDBBatchAtomicVFS.js';
import { ColumnDefinition } from "../../../utils/types";
import { sanitise } from "../../../utils/sanitiseColumn";

// Get the WASM URL from the virtual module
// @ts-ignore
import wasmUrl from 'virtual:wa-sqlite-wasm-url';

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

    constructor(private readonly dbName: string) {
        console.log('SqlocalWorkerDatabase: Constructor called with dbName:', dbName);
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

            // Convert falsy values to null
            if (!value) {
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

        try {
            console.log('SqlocalWorkerDatabase: Initializing wa-sqlite with bundled WASM');
            console.log('SqlocalWorkerDatabase: WASM URL:', wasmUrl);

            // Initialize the module with bundled WASM
            const asyncModule = await SQLiteAsyncESMFactory({
                locateFile: (file: string) => {
                    console.log('SqlocalWorkerDatabase: SQLite requesting file:', file);
                    if (file.endsWith('.wasm')) {
                        return wasmUrl;
                    }
                    return file;
                }
            });

            // Use Factory to get the actual sqlite3 API
            this.sqlite3 = SQLite.Factory(asyncModule);
            console.log('SqlocalWorkerDatabase: wa-sqlite initialized successfully');
            console.log('SqlocalWorkerDatabase: sqlite3 type:', typeof this.sqlite3);
            console.log('SqlocalWorkerDatabase: vfs_register exists:', typeof this.sqlite3.vfs_register);
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
            console.log('SqlocalWorkerDatabase: Registering IDBBatchAtomicVFS for', dbName);
            // Register VFS with relaxed durability for performance
            // @ts-ignore - Constructor does accept these parameters despite TypeScript definition
            const vfs = new IDBBatchAtomicVFS(dbName, {
                durability: "relaxed"
            });
            this.sqlite3.vfs_register(vfs);
            this.vfsRegistered = true;
            console.log('SqlocalWorkerDatabase: IDBBatchAtomicVFS registered successfully');
        } catch (error) {
            console.error('SqlocalWorkerDatabase: Failed to register VFS:', error);
            throw error;
        }
    }

    async connect() {
        if (this.isConnected) {
            return Promise.resolve();
        }

        try {
            console.log('SqlocalWorkerDatabase: Connecting to database');

            // Initialize SQLite
            await this.initializeSQLite();

            // Register VFS
            this.registerVFS(this.dbName);

            console.log('SqlocalWorkerDatabase: Opening database connection for', this.dbName);

            // Open database connection with concurrent read support
            this.connection = await this.sqlite3.open_v2(
                this.dbName,
                SQLite.SQLITE_OPEN_CREATE | SQLite.SQLITE_OPEN_READWRITE
            );

            console.log('SqlocalWorkerDatabase: Database connection opened successfully');

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
            console.log('SqlocalWorkerDatabase: Connected successfully');
        } catch (error) {
            console.error('SqlocalWorkerDatabase: Failed to connect:', error);
            throw error;
        }
    }

    async disconect() {
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
        console.log(`SqlocalWorkerDatabase: Registering custom function '${name}' with ${argsCount} args`);

        if (!this.connection) {
            console.warn('SqlocalWorkerDatabase: Database not connected, cannot register custom function');
            return Promise.resolve();
        }

        // Register different overloads based on argument count using wa-sqlite API
        // The callback signature is (context: number, values: Uint32Array)
        // where values is an array of pointers to sqlite3_value
        try {
            console.log(`SqlocalWorkerDatabase: Attempting to register function overloads for '${name}'`);

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

            console.log(`SqlocalWorkerDatabase: Successfully registered custom function '${name}'`);
        } catch (error) {
            console.error(`SqlocalWorkerDatabase: Error registering function '${name}':`, error);
        }

        return Promise.resolve();
    }

    async recreateDatabase() {
        console.log('SqlocalWorkerDatabase: Starting recreateDatabase');

        if (!this.connection) throw new Error('Database not connected');
        if (this.isRecreating) {
            console.log('already recreating');
            return;
        }

        try {
            this.isRecreating = true;
            console.log('SqlocalWorkerDatabase: Getting table names');

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

            console.log('SqlocalWorkerDatabase: Found tables:', tables.map(t => t.name));

            // Drop all tables
            for (const table of tables) {
                console.log(`SqlocalWorkerDatabase: Dropping table '${table.name}'`);
                await this.dropTableInternal(table.name);
            }

            // Run VACUUM to reclaim space and optimize database (matching old sql.js implementation)
            console.log('SqlocalWorkerDatabase: Running VACUUM to optimize database');
            await this.sqlite3.exec(this.connection, 'VACUUM');

            // Run integrity check to verify database health
            console.log('SqlocalWorkerDatabase: Running integrity check');
            await this.sqlite3.exec(this.connection, 'PRAGMA integrity_check');

            console.log('SqlocalWorkerDatabase: Successfully recreated database');
        } catch (error) {
            console.error('SqlocalWorkerDatabase: Error during recreateDatabase:', error);
            throw error;
        } finally {
            this.isRecreating = false;
        }
    }

    private async dropTableInternal(name: string) {
        const sql = `DROP TABLE IF EXISTS "${name}"`;
        console.log(`SqlocalWorkerDatabase: Executing SQL: ${sql}`);

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

        console.log(`SqlocalWorkerDatabase: Successfully dropped table '${name}'`);
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
        console.log(`SqlocalWorkerDatabase: Inserting ${inData.length} rows into table '${name}'`);

        if (!this.connection) throw new Error('Database not connected');

        if (inData.length === 0) {
            console.log('SqlocalWorkerDatabase: No data to insert, returning');
            return;
        }

        // Filter out __parsed_extra column (internal metadata) - matches old sql.js implementation
        const columns = Object.keys(inData[0]).filter(c => c !== '__parsed_extra');
        const placeholders = columns.map(() => '?').join(', ');
        const columnNames = columns.map(col => `"${col}"`).join(', ');

        const sql = `INSERT INTO "${name}" (${columnNames}) VALUES (${placeholders})`;
        console.log(`SqlocalWorkerDatabase: Insert SQL: ${sql}`);

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
        console.log(`SqlocalWorkerDatabase: Successfully inserted ${inData.length} rows into '${name}'`);
    }

    async dropTable(name: string) {
        console.log(`SqlocalWorkerDatabase: Dropping table '${name}'`);

        if (!this.connection) throw new Error('Database not connected');

        try {
            await this.dropTableInternal(name);
        } catch (error) {
            console.error(`SqlocalWorkerDatabase: Error dropping table '${name}':`, error);
            throw error;
        }
    }

    async createTableNoTypes(name: string, columns: string[], noDrop?: boolean) {
        console.log(`SqlocalWorkerDatabase: Creating table '${name}' with columns:`, columns);

        if (!this.connection) throw new Error('Database not connected');

        if (!noDrop) {
            console.log(`SqlocalWorkerDatabase: Dropping table '${name}' first`);
            await this.dropTableInternal(name);
        }

        const columnDefs = columns.map(col => `"${col}" TEXT`).join(', ');
        const sql = `CREATE TABLE IF NOT EXISTS "${name}" (${columnDefs})`;
        console.log(`SqlocalWorkerDatabase: Executing SQL: ${sql}`);

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

        console.log(`SqlocalWorkerDatabase: Successfully created table '${name}'`);
    }

    async createTable(name: string, columns: ColumnDefinition[], noDrop?: boolean) {
        console.log(`SqlocalWorkerDatabase: Creating typed table '${name}' with columns:`, columns);

        if (!this.connection) throw new Error('Database not connected');

        if (!noDrop) {
            console.log(`SqlocalWorkerDatabase: Dropping table '${name}' first`);
            await this.dropTableInternal(name);
        }

        // Map column types - SQLite doesn't have 'auto' type, use TEXT instead
        const columnDefs = columns.map(col => {
            const type = col.type && col.type !== 'auto' ? col.type : 'TEXT';
            return `"${col.name}" ${type}`;
        }).join(', ');
        const sql = `CREATE TABLE IF NOT EXISTS "${name}" (${columnDefs})`;
        console.log(`SqlocalWorkerDatabase: Executing SQL: ${sql}`);

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

        console.log(`SqlocalWorkerDatabase: Successfully created typed table '${name}'`);
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
        console.log('SqlocalWorkerDatabase: Executing select with statement:', statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));

        if (!this.connection) throw new Error('Database not connected');
        if (this.isRecreating) {
            console.warn('SqlocalWorkerDatabase: Database is being recreated, cannot execute select');
            return { data: [], columns: [], executionTime: 0 };
        }

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

        // Return array of objects matching old sql.js implementation
        return results;
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
