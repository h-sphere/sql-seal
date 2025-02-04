import * as Comlink from "comlink"
// @ts-ignore
import initSqlJs from '@jlongster/sql.js';
// @ts-ignore
import wasmBinary from '../../../node_modules/@jlongster/sql.js/dist/sql-wasm.wasm'
// @ts-ignore
import { SQLiteFS } from 'absurd-sql';
// @ts-ignore
import IndexedDBBackend from '../../../node_modules/absurd-sql/dist/indexeddb-backend.js';
import type { BindParams, Database, Statement } from "sql.js";
import { sanitise } from "../../utils/sanitiseColumn";
import { uniq } from "lodash";


function toObjectArray(stmt: Statement) {
    const ret = []
    while (stmt.step()) {
        ret.push(stmt.getAsObject())
    }
    return ret
}

function recordToBindParams(record: Record<string, unknown>) {
    const bindParams = Object.fromEntries(Object.entries(record).map(([key, val]) => ([`@${key}`, val]))) as BindParams
    return bindParams
}

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

// Disabling SharedArrayBuffer - otherwise Absurd-SQL doesn't handle properly it.
self.SharedArrayBuffer = undefined as any

export class WorkerDatabase {

    private db: Database

    constructor(private readonly dbName: string) {

    }

    registerCustomFunction(name: string, argsCount = 1) {
        const fn = (...arg: string[]) => {
            const data = {
                type: name,
                values: arg
            }
            return `SQLSEALCUSTOM(${JSON.stringify(data)})`
        }

        // This is such a stupid solution but number of arguments needs to be static so SQLite understands which overload to use.
        if (argsCount >= 1) {
            this.db.create_function(name, (a: string) => fn(a))
        }
        if (argsCount >= 2) {
            this.db.create_function(name, (a: string, b: string) => fn(a, b))
        }
        if (argsCount >= 3) {
            this.db.create_function(name, (a: string, b: string, c: string) => fn(a, b, c))
        }
        if (argsCount >= 4) {
            throw new Error('Too many arguments, only up to 3 arguments are supported at the moment.')
        }
    }

    createTableText(tableName: string, fields: string[]) {
        const fieldsString = fields.map(f => `${f} TEXT`).join(',')
        this.db.exec(`CREATE TABLE IF NOT EXISTS ${tableName} (:fieldsString)`, {
            tableName,
            fieldsString
        })
    }

    async recreateDatabase() {
        this.db.run(`
            PRAGMA writable_schema = 1;
            DELETE FROM sqlite_master;
            PRAGMA writable_schema = 0;
            VACUUM;
            PRAGMA integrity_check;
`)
    }

    run(query: string, params?: BindParams) {
        this.db.run(query, params)
    }

    getColumns(tableName: string) {
        const [data] = this.db.exec('select name from pragma_table_info(@tableName)', { '@tableName': tableName })
        return data.values.map(d => d[0] as unknown as string)
    }

    addColumns(tableName: string, newColumns: string[]) {
        for (const columnName of newColumns) {
            const stmt = `ALTER TABLE ${tableName} ADD COLUMN ${columnName}`
            this.db.run(stmt)
        }
    }

    /* Types are optional in SQLite, we can take advantage of that */
    async createTableNoTypes(tableName: string, columns: string[], noDrop: boolean = false) {
        const fields = uniq(columns.map(f => sanitise(f)))
        if (!noDrop) {
            await this.dropTable(tableName)
        }
        const createStmt = `CREATE TABLE IF NOT EXISTS ${tableName}(${fields.join(',')})`
        this.db.run(createStmt)
    }

    async clearTable(tableName: string) {
        this.db.run(`DELETE FROM ${tableName}`)

    }

    async insertData(tableName: string, data: Record<string, unknown>[]) {
        data.forEach(d => {
            const columns = Object.keys(d).filter(c => c !== '__parsed_extra')
            const insertStatement = this.db.prepare(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${columns.map((key: string) => '@' + key).join(', ')})`);
            insertStatement.run(recordToBindParams(formatData(d)))
            insertStatement.free()
        })
    }

    async dropTable(tableName: string) {
        this.db.run(`DROP TABLE IF EXISTS ${tableName}`)
    }

    async select(query: string, params: Record<string, unknown>) {
        const stmt = this.db.prepare(query, recordToBindParams(params))
        const data = toObjectArray(stmt)
        const columns = stmt.getColumnNames()
        stmt.free()

        return { data: data, columns }
    }

    async updateData(tableName: string, data: Array<Record<string, unknown>>, matchKey: string = 'id') {
        const fields = Object.keys(data.reduce((acc, obj) => ({ ...acc, ...obj }), {}));
        data.forEach((d: Record<string, unknown>) => {
            const stmt = this.db.prepare(`UPDATE ${tableName} SET ${fields.map((key: string) => `${key} = @${key}`).join(', ')} WHERE ${matchKey} = @${matchKey}`)
            stmt.run(recordToBindParams(d))
            stmt.free()
        })
    }

    async deleteData(name: string, data: Array<Record<string, unknown>>, key: string = 'id') {
        data.forEach(d => {
            const stmt = this.db.prepare(`DELETE FROM ${name} WHERE ${key} = @${key}`);
            stmt.run({
                [`@${key}`]: d[key]
            } as BindParams)
            stmt.free()
        })
    }

    async connect() {
        try {
            const SQL = await initSqlJs({
                wasmBinary: wasmBinary
            });

            let sqlFS = new SQLiteFS(SQL.FS, new IndexedDBBackend(() => {
                console.error('unable to write to indexedDb')
            }));
            SQL.register_for_idb(sqlFS);

            SQL.FS.mkdir('/sql');
            SQL.FS.mount(sqlFS, {}, '/sql');

            // Removing old database under the generic name
            indexedDB.deleteDatabase('sqlseal.sqlite')

            const path = `sql/sqlseal___${this.dbName}.sqlite3`

            let stream = SQL.FS.open(path, 'a+');
            await stream.node.contents.readIfFallback();
            SQL.FS.close(stream);

            const db = new SQL.Database(path, { filename: true });

            let cacheSize = 0;
            let pageSize = 4096;

            db.exec(`
                PRAGMA cache_size=-${cacheSize};
                PRAGMA journal_mode=MEMORY;
                PRAGMA page_size=${pageSize};
                VACUUM;
            `);
            this.db = db
            return
        } catch (e) {
            console.error('Error while setting up database', e);
            throw e;
        }
    }

    async explainQuery(query: string, params: Record<string, unknown>) {
        const stmt = this.db.prepare(`EXPLAIN QUERY PLAN ${query}`, recordToBindParams(params))
        const plan = []
        while (stmt.step()) {
            plan.push(stmt.getAsObject())
        }
        stmt.free()
        return plan
    }

    async disconnect() {
        // FIXME: implement.
    }

    async createIndex(indexName: string, tableName: string, columns: string[]) {
        const query = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${columns.join(', ')})`
        this.db.run(query)
    }
}

Comlink.expose(WorkerDatabase);