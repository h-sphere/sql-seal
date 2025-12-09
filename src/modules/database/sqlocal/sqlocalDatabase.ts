import { App } from "obsidian";
import { ColumnDefinition } from "../../../utils/types";
import * as SQLite from 'wa-sqlite';

interface SQLiteConnection {
    connection: number;
    sqlite3: any;
}

export class SqlocalDatabase {
    private connection: number;
    private sqlite3: any;
    private isConnected = true;
    private operationLock: Promise<void> = Promise.resolve();

    constructor(app: App, { connection, sqlite3 }: SQLiteConnection) {
        console.log('SqlocalDatabase: Constructor called with connection:', !!connection);
        this.connection = connection;
        this.sqlite3 = sqlite3;
        console.log('SqlocalDatabase: Constructor completed');
    }

    private async acquireLock(): Promise<() => void> {
        const previousLock = this.operationLock;
        let releaseLock: () => void;

        this.operationLock = new Promise((resolve) => {
            releaseLock = resolve;
        });

        await previousLock;
        return releaseLock!;
    }

    registerCustomFunction(name: string, argsCount = 1) {
        console.log(`SqlocalDatabase: Registering custom function '${name}' with ${argsCount} args`);

        if (!this.connection) {
            console.warn('SqlocalDatabase: Database not connected, cannot register custom function');
            return Promise.resolve();
        }

        // Register different overloads based on argument count using wa-sqlite API
        // The callback signature is (context: number, values: Uint32Array)
        // where values is an array of pointers to sqlite3_value
        try {
            console.log(`SqlocalDatabase: Attempting to register function overloads for '${name}'`);

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

            console.log(`SqlocalDatabase: Successfully registered custom function '${name}'`);
            return Promise.resolve();
        } catch (error) {
            console.error(`SqlocalDatabase: Failed to register custom function '${name}':`, error);
            return Promise.reject(error);
        }
    }

    async connect() {
        // Database is already connected via constructor
        return Promise.resolve();
    }

    async disconect() {
        if (!this.isConnected) {
            return;
        }
        if (this.connection && this.sqlite3) {
            await this.sqlite3.close(this.connection);
        }
        this.isConnected = false;
    }

    isRecreating = false
    async recreateDatabase() {
        console.log('SqlocalDatabase: Starting recreateDatabase');

        if (!this.connection) throw new Error('Database not connected');
        if (this.isRecreating) {
            console.log('already recreating')
            return
        }

        const releaseLock = await this.acquireLock();
        try {
            this.isRecreating = true
            console.log('SqlocalDatabase: Getting table names');

            // Get all table names using wa-sqlite API
            const tables: any[] = [];
            const sql = `
                SELECT name FROM sqlite_master
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
            `;

            // Use prepare_v2 pattern for consistency
            const str = this.sqlite3.str_new(this.connection, sql);
            try {
                const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
                if (prepared) {
                    while (await this.sqlite3.step(prepared.stmt) === SQLite.SQLITE_ROW) {
                        const tableName = await this.sqlite3.column(prepared.stmt, 0);
                        tables.push({ name: tableName });
                    }
                    await this.sqlite3.finalize(prepared.stmt);
                }
            } finally {
                this.sqlite3.str_finish(str);
            }

            console.log('SqlocalDatabase: Found tables:', tables.map(t => t.name));

            // Drop all tables
            for (const table of tables) {
                console.log(`SqlocalDatabase: Dropping table '${table.name}'`);
                await this.dropTableInternal(table.name);
            }

            console.log('SqlocalDatabase: Successfully recreated database');
        } catch (error) {
            console.error('SqlocalDatabase: Error during recreateDatabase:', error);
            throw error;
        } finally {
            this.isRecreating = false;
            releaseLock();
        }
    }

    async updateData(name: string, data: Array<Record<string, unknown>>, key: string = 'id') {
        if (!this.connection) throw new Error('Database not connected');

        const releaseLock = await this.acquireLock();
        try {
            for (const row of data) {
                const keyValue = row[key];
                const columns = Object.keys(row).filter(k => k !== key);
                const setClause = columns.map(col => `"${col}" = ?`).join(', ');
                const values = columns.map(col => row[col]);
                const sql = `UPDATE "${name}" SET ${setClause} WHERE "${key}" = ?`;

                // Create string in WASM memory
                const str = this.sqlite3.str_new(this.connection, sql);
                try {
                    const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
                    if (prepared) {
                        await this.sqlite3.bind_collection(prepared.stmt, [...values, keyValue]);
                        await this.sqlite3.step(prepared.stmt);
                        await this.sqlite3.finalize(prepared.stmt);
                    }
                } finally {
                    this.sqlite3.str_finish(str);
                }
            }
        } finally {
            releaseLock();
        }
    }

    async deleteData(name: string, data: Array<Record<string, unknown>>, key: string = 'id') {
        if (!this.connection) throw new Error('Database not connected');

        const releaseLock = await this.acquireLock();
        try {
            for (const row of data) {
                const keyValue = row[key];
                const sql = `DELETE FROM "${name}" WHERE "${key}" = ?`;

                // Create string in WASM memory
                const str = this.sqlite3.str_new(this.connection, sql);
                try {
                    const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
                    if (prepared) {
                        await this.sqlite3.bind_collection(prepared.stmt, [keyValue]);
                        await this.sqlite3.step(prepared.stmt);
                        await this.sqlite3.finalize(prepared.stmt);
                    }
                } finally {
                    this.sqlite3.str_finish(str);
                }
            }
        } finally {
            releaseLock();
        }
    }

    async insertData(name: string, inData: Array<Record<string, unknown>>) {
        console.log(`SqlocalDatabase: Inserting ${inData.length} rows into table '${name}'`);

        if (!this.connection) throw new Error('Database not connected');

        if (inData.length === 0) {
            console.log('SqlocalDatabase: No data to insert, returning');
            return;
        }

        const releaseLock = await this.acquireLock();
        try {
            const columns = Object.keys(inData[0]);
            const placeholders = columns.map(() => '?').join(', ');
            const columnNames = columns.map(col => `"${col}"`).join(', ');

            const sql = `INSERT INTO "${name}" (${columnNames}) VALUES (${placeholders})`;
            console.log(`SqlocalDatabase: Insert SQL: ${sql}`);

            // Create string in WASM memory
            const str = this.sqlite3.str_new(this.connection, sql);
            try {
                const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
                if (prepared) {
                    for (let i = 0; i < inData.length; i++) {
                        const row = inData[i];
                        const values = columns.map(col => row[col]);
                        console.log(`SqlocalDatabase: Inserting row ${i + 1}/${inData.length}`);

                        await this.sqlite3.reset(prepared.stmt);
                        await this.sqlite3.bind_collection(prepared.stmt, values);
                        await this.sqlite3.step(prepared.stmt);
                    }

                    await this.sqlite3.finalize(prepared.stmt);
                }
            } finally {
                this.sqlite3.str_finish(str);
            }
            console.log(`SqlocalDatabase: Successfully inserted ${inData.length} rows into '${name}'`);
        } catch (error) {
            console.error(`SqlocalDatabase: Error inserting data into table '${name}':`, error);
            throw error;
        } finally {
            releaseLock();
        }
    }

    private async dropTableInternal(name: string) {
        const sql = `DROP TABLE IF EXISTS "${name}"`;
        console.log(`SqlocalDatabase: Executing SQL: ${sql}`);

        // Use prepare_v2 pattern for consistency
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

        console.log(`SqlocalDatabase: Successfully dropped table '${name}'`);
    }

    async dropTable(name: string) {
        console.log(`SqlocalDatabase: Dropping table '${name}'`);

        if (!this.connection) throw new Error('Database not connected');

        const releaseLock = await this.acquireLock();
        try {
            await this.dropTableInternal(name);
        } catch (error) {
            console.error(`SqlocalDatabase: Error dropping table '${name}':`, error);
            throw error;
        } finally {
            releaseLock();
        }
    }

    async createTableNoTypes(name: string, columns: string[], noDrop?: boolean) {
        console.log(`SqlocalDatabase: Creating table '${name}' with columns:`, columns);

        if (!this.connection) throw new Error('Database not connected');

        const releaseLock = await this.acquireLock();
        try {
            if (!noDrop) {
                console.log(`SqlocalDatabase: Dropping table '${name}' first`);
                await this.dropTableInternal(name);
            }

            const columnDefs = columns.map(col => `"${col}" TEXT`).join(', ');
            const sql = `CREATE TABLE IF NOT EXISTS "${name}" (${columnDefs})`;
            console.log(`SqlocalDatabase: Executing SQL: ${sql}`);

            // Use prepare_v2 pattern for consistency
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

            console.log(`SqlocalDatabase: Successfully created table '${name}'`);
        } catch (error) {
            console.error(`SqlocalDatabase: Error creating table '${name}':`, error);
            throw error;
        } finally {
            releaseLock();
        }
    }

    async createTable(name: string, columns: ColumnDefinition[], noDrop?: boolean) {
        console.log(`SqlocalDatabase: Creating typed table '${name}' with columns:`, columns);

        if (!this.connection) throw new Error('Database not connected');

        const releaseLock = await this.acquireLock();
        try {
            if (!noDrop) {
                console.log(`SqlocalDatabase: Dropping table '${name}' first`);
                await this.dropTableInternal(name);
            }

            // Map column types - SQLite doesn't have 'auto' type, use TEXT instead
            const columnDefs = columns.map(col => {
                const type = col.type && col.type !== 'auto' ? col.type : 'TEXT';
                return `"${col.name}" ${type}`;
            }).join(', ');
            const sql = `CREATE TABLE IF NOT EXISTS "${name}" (${columnDefs})`;
            console.log(`SqlocalDatabase: Executing SQL: ${sql}`);

            // Use prepare_v2 pattern for consistency
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

            console.log(`SqlocalDatabase: Successfully created typed table '${name}'`);
        } catch (error) {
            console.error(`SqlocalDatabase: Error creating typed table '${name}':`, error);
            throw error;
        } finally {
            releaseLock();
        }
    }

    async createIndex(indexName: string, tableName: string, columns: string[]) {
        return
        if (!this.connection) throw new Error('Database not connected');

        const columnList = columns.map(col => `"${col}"`).join(', ');
        const sql = `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" (${columnList})`;

        console.log(`SqlocalDatabase: Creating index '${indexName}' on table '${tableName}' with columns: [${columns.join(', ')}]`);
        console.log(`SqlocalDatabase: Index SQL: ${sql}`);

        try {
            // First check if table exists
            const tableExists = await this.tableExists(tableName);
            if (!tableExists) {
                console.warn(`SqlocalDatabase: Table '${tableName}' does not exist, skipping index creation`);
                return;
            }

            // Use prepare_v2 pattern for consistency
            const str = this.sqlite3.str_new(this.connection, sql);
            try {
                const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
                if (prepared) {
                    await this.sqlite3.step(prepared.stmt);
                    await this.sqlite3.finalize(prepared.stmt);
                    console.log(`SqlocalDatabase: Successfully created index '${indexName}'`);
                }
            } finally {
                this.sqlite3.str_finish(str);
            }
        } catch (error) {
            console.error(`SqlocalDatabase: Error creating index '${indexName}':`, error);
            console.error(`SqlocalDatabase: Failed SQL: ${sql}`);
            throw error;
        }
    }

    async getColumns(tableName: string) {
        if (!this.connection) throw new Error('Database not connected');

        const columns: string[] = [];
        const sql = `PRAGMA table_info("${tableName}")`;

        // Use prepare_v2 pattern for consistency
        const str = this.sqlite3.str_new(this.connection, sql);
        try {
            const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
            if (prepared) {
                // Fetch all rows
                while (await this.sqlite3.step(prepared.stmt) === SQLite.SQLITE_ROW) {
                    const columnName = await this.sqlite3.column(prepared.stmt, 1); // column name is at index 1
                    columns.push(columnName);
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

        // Use prepare_v2 pattern for consistency
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

            // Use prepare_v2 pattern for consistency
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
        console.log('SqlocalDatabase: Executing select with statement:', statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));

        if (!this.connection) throw new Error('Database not connected');
        if (this.isRecreating) {
            console.warn('SqlocalDatabase: Database is being recreated, cannot execute select');
            return { data: [], columns: [], executionTime: 0 };
        }

        const releaseLock = await this.acquireLock();
        try {
            // Validate connection is still valid
            if (!this.connection || !this.sqlite3) {
                console.error('SqlocalDatabase: Invalid connection state');
                return { data: [], columns: [], executionTime: 0 };
            }

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
                    // Push the value once for each occurrence
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
                    // Push the value once for each occurrence
                    for (let i = 0; i < atMatches; i++) {
                        params.push(value);
                    }
                }
            }

            console.log('SqlocalDatabase: Processed statement:', processedStatement.substring(0, 200) + (processedStatement.length > 200 ? '...' : ''));
            console.log('SqlocalDatabase: Parameters:', params);
            console.log('SqlocalDatabase: Full processed statement:', processedStatement);

            const startTime = performance.now();
            const data: any[] = [];
            let columns: string[] = [];

            // Create string in WASM memory
            const str = this.sqlite3.str_new(this.connection, processedStatement);
            let prepared = null;
            try {
                prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
                console.log('SqlocalDatabase: Prepared statement result:', !!prepared);

                if (prepared && prepared.stmt) {
                    console.log('SqlocalDatabase: Binding parameters...');
                    await this.sqlite3.bind_collection(prepared.stmt, params);

                    // Get column names
                    const columnCount = await this.sqlite3.column_count(prepared.stmt);
                    console.log('SqlocalDatabase: Column count:', columnCount);

                    for (let i = 0; i < columnCount; i++) {
                        columns.push(await this.sqlite3.column_name(prepared.stmt, i));
                    }
                    console.log('SqlocalDatabase: Column names:', columns);

                    // Fetch all rows
                    let rowCount = 0;
                    console.log('SqlocalDatabase: SQLITE_ROW constant value from SQLite module:', SQLite.SQLITE_ROW);
                    console.log('SqlocalDatabase: SQLITE_ROW constant value from sqlite3 instance:', this.sqlite3.SQLITE_ROW);

                    let stepResult;
                    while ((stepResult = await this.sqlite3.step(prepared.stmt)) === SQLite.SQLITE_ROW) {
                        console.log('SqlocalDatabase: Step result:', stepResult, 'Expected:', SQLite.SQLITE_ROW);
                        const row: any = {};
                        for (let i = 0; i < columnCount; i++) {
                            const columnName = columns[i];
                            row[columnName] = await this.sqlite3.column(prepared.stmt, i);
                        }
                        data.push(row);
                        rowCount++;
                        if (rowCount <= 3) { // Log first few rows for debugging
                            console.log(`SqlocalDatabase: Row ${rowCount}:`, row);
                        }
                    }
                    console.log('SqlocalDatabase: Final step result:', stepResult);
                    console.log('SqlocalDatabase: Total rows fetched in loop:', rowCount);
                } else {
                    console.error('SqlocalDatabase: prepare_v2 returned null/undefined');
                }
            } catch (stmtError) {
                console.error('SqlocalDatabase: Error during statement execution:', stmtError);
                console.error('SqlocalDatabase: Error type:', stmtError instanceof Error ? stmtError.name : typeof stmtError);
                console.error('SqlocalDatabase: Error message:', stmtError instanceof Error ? stmtError.message : String(stmtError));

                // If it's a WASM memory error, return empty results instead of crashing
                if (stmtError instanceof Error && stmtError.message.includes('memory access out of bounds')) {
                    console.warn('SqlocalDatabase: WASM memory error detected, returning empty results');
                    return { data: [], columns: [], executionTime: 0 };
                }

                throw stmtError;
            } finally {
                // Finalize statement before finishing string
                if (prepared && prepared.stmt) {
                    try {
                        await this.sqlite3.finalize(prepared.stmt);
                    } catch (finalizeError) {
                        console.error('SqlocalDatabase: Error finalizing statement:', finalizeError);
                    }
                }
                // Finish the string
                try {
                    this.sqlite3.str_finish(str);
                } catch (strError) {
                    console.error('SqlocalDatabase: Error finishing string:', strError);
                }
            }
            const executionTime = performance.now() - startTime;

            console.log('SqlocalDatabase: Query executed successfully, rows returned:', data.length);

            return {
                data,
                columns,
                executionTime
            };
        } catch (error) {
            console.error('SqlocalDatabase: Error executing select:', error);
            console.error('SqlocalDatabase: Failed statement:', statement);
            throw error;
        } finally {
            releaseLock();
        }
    }

    async explain(statement: string, frontmatter: Record<string, unknown>) {
        if (!this.connection) throw new Error('Database not connected');

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
                // Push the value once for each occurrence
                for (let i = 0; i < doubleBraceMatches; i++) {
                    params.push(value);
                }
            }

            // Handle @key format (used in repository queries)
            const atRegex = new RegExp(`@${key}\\b`, 'g');
            const atMatches = (processedStatement.match(atRegex) || []).length;
            if (atMatches > 0) {
                processedStatement = processedStatement.replace(atRegex, '?');
                // Push the value once for each occurrence
                for (let i = 0; i < atMatches; i++) {
                    params.push(value);
                }
            }
        }

        const explainResults: any[] = [];
        const explainSql = `EXPLAIN QUERY PLAN ${processedStatement}`;

        // Create string in WASM memory
        const str = this.sqlite3.str_new(this.connection, explainSql);
        try {
            const prepared = await this.sqlite3.prepare_v2(this.connection, this.sqlite3.str_value(str));
            if (prepared) {
                await this.sqlite3.bind_collection(prepared.stmt, params);

                // Fetch explain results
                while (await this.sqlite3.step(prepared.stmt) === SQLite.SQLITE_ROW) {
                    explainResults.push({
                        id: await this.sqlite3.column(prepared.stmt, 0),
                        parent: await this.sqlite3.column(prepared.stmt, 1),
                        detail: await this.sqlite3.column(prepared.stmt, 3)
                    });
                }

                await this.sqlite3.finalize(prepared.stmt);
            }
        } finally {
            this.sqlite3.str_finish(str);
        }

        let strResult = '';
        const map = new Map<number, number>();
        const INDENT_INCREASE = 4;
        map.set(0, -INDENT_INCREASE);

        for (const result of explainResults || []) {
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

    private async tableExists(tableName: string): Promise<boolean> {
        if (!this.connection) return false;

        try {
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
                return false;
            } finally {
                this.sqlite3.str_finish(str);
            }
        } catch (error) {
            console.error(`SqlocalDatabase: Error checking if table '${tableName}' exists:`, error);
            return false;
        }
    }
}