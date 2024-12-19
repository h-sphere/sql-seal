import * as Comlink from "comlink"
import initSqlJs from '@jlongster/sql.js';
import wasmBinary from '../node_modules/@jlongster/sql.js/dist/sql-wasm.wasm'
import { SQLiteFS } from 'absurd-sql';
import IndexedDBBackend from '../node_modules/absurd-sql/dist/indexeddb-backend.js';
import type { BindParams, Database, Statement } from "sql.js";
import { sanitise } from "./utils/sanitiseColumn";
import { FieldTypes } from "./utils";


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

    constructor() {

    }

    defineCustomFunctions() {
        this.db.create_function('a', (href: string, name: string) => {
            const linkObject = {
                type: 'link',
                href: href,
                name: name || href
            };
            return `SQLSEALCUSTOM(${JSON.stringify(linkObject)})`;
        });

        this.db.create_function('a', (href: string) => {
            const linkObject = {
                type: 'link',
                href: href,
                name: href
            };
            return `SQLSEALCUSTOM(${JSON.stringify(linkObject)})`;
        });

        this.db.create_function('img', (href: string) => {
            const imgObject = {
                type: 'img',
                href: href
            }
            return `SQLSEALCUSTOM(${JSON.stringify(imgObject)})`
        })

        this.db.create_function('img', (href: string, path: string) => {
            const imgObject = {
                type: 'img',
                path,
                href
            }
            return `SQLSEALCUSTOM(${JSON.stringify(imgObject)})`
        })

        this.db.create_function('checkbox', (val: string) => {
            const imgObject = {
                type: 'checkbox',
                value: val
            }
            return `SQLSEALCUSTOM(${JSON.stringify(imgObject)})`
        })
    }

    createTableText(tableName: string, fields: string[]) {
        const fieldsString = fields.map(f => `${f} TEXT`).join(',')
        this.db.exec(`CREATE TABLE IF NOT EXISTS ${tableName} (:fieldsString)`, {
            tableName,
            fieldsString
        })
    }

    async createTable(tableName: string, fields:  Record<string, FieldTypes>) {
        const transformedFiels = Object.entries(fields).map(([key, type]) => [sanitise(key), type])
        const uniqueFields = [...new Map(transformedFiels.map(item =>
            [item[0], item])).values()]
        const sqlFields = uniqueFields.map(([key, type]) => `${key} ${type}`)
        // FIXME: probably use schema generator, for now create with hardcoded fields
        await this.dropTable(tableName)
        const createSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (
                    ${sqlFields.join(', ')}
                );`

        this.db.prepare(createSQL).run()
        await this.clearTable(tableName)

        // Dropping data.
    }

    async clearTable(tableName: string) {
        this.db.prepare(`DELETE FROM ${tableName}`).run()

    }

    async insertData(tableName: string, data: Record<string, unknown>[]) {
        data.forEach(d => {
            const columns = Object.keys(d)
            const insertStatement = this.db.prepare(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${columns.map((key: string) => '@' + key).join(', ')})`);
            insertStatement.run(recordToBindParams(formatData(d)))
        })
    }

    async dropTable(tableName: string) {
        this.db.run(`DROP TABLE IF EXISTS ${tableName}`)
    }

    async select(query: string, params: Record<string, unknown>) {
        const stmt = this.db.prepare(query, recordToBindParams(params))
        return {
            data: toObjectArray(stmt),
            columns: stmt.getColumnNames()
        }
    }

    async updateData(tableName: string, data: Array<Record<string, unknown>>) {
        const fields = Object.keys(data.reduce((acc, obj) => ({ ...acc, ...obj }), {}));
        data.forEach((d: Record<string, unknown>) => {
            const stmt = this.db.prepare(`UPDATE ${tableName} SET ${fields.map((key: string) => `${key} = @${key}`).join(', ')} WHERE id = @id`)
            stmt.run(recordToBindParams(d))
        })
    }

    async deleteData(name: string, data: Array<Record<string, unknown>>, key: string = 'id') {
        data.forEach(d => {
            const stmt = this.db.prepare(`DELETE FROM ${name} WHERE ${key} = @${key}`);
            stmt.run({
                [`@${key}`]: d[key]
            } as BindParams)
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

            const path = 'sql/sqlseal.sqlite';

            let stream = SQL.FS.open(path, 'a+');
            await stream.node.contents.readIfFallback();
            SQL.FS.close(stream);

            const db = new SQL.Database('sql/sqlseal.sqlite', { filename: true });

            let cacheSize = 0;
            let pageSize = 4096;

            db.exec(`
                PRAGMA cache_size=-${cacheSize};
                PRAGMA journal_mode=MEMORY;
                PRAGMA page_size=${pageSize};
                VACUUM;
            `);
            this.db = db
            this.defineCustomFunctions()
            return
        } catch (e) {
            console.error('Error while setting up database', e);
            throw e;
        }
    }

    async disconnect() {
        // FIXME: implement.
    }
}

Comlink.expose(WorkerDatabase);