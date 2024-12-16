import { App } from "obsidian"
import path from 'path'
import Papa from 'papaparse'
import { prefixedIfNotGlobal } from "./sqlReparseTables"
import { camelCase } from 'lodash'
import { dataToCamelCase, fetchBlobData, FieldTypes, predictJson, predictType, toTypeStatements } from "./utils"
import os from 'os'
import fs from 'fs'
import { sanitise } from "./utils/sanitiseColumn"
import initSqlJs, { BindParams, Database, Statement } from 'sql.js'
import wasmBinary from '../node_modules/sql.js/dist/sql-wasm.wasm'
import * as Comlink from 'comlink'
import workerCode from 'virtual:worker-code';

export interface FieldDefinition {
    name: string;
    type: FieldTypes
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

export class SqlSealDatabase {
    private savedDatabases: Record<string, any> = {}
    db: Database
    private SQL: initSqlJs.SqlJsStatic
    private isConnected = false
    private connectingPromise: Promise<void>;
    private connectingPromiseResolve: (value: void | PromiseLike<void>) => void
    constructor(private readonly app: App, private readonly verbose = false) {

    }

    async connect() {
        if (this.isConnected) {
            return Promise.resolve()
        }

        if (this.connectingPromise) {
            return this.connectingPromise
        }
        const blob = new Blob([workerCode], { type: 'text/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        
        const worker = new Worker(workerUrl, {
            name: 'SQLSeal Database'
        });
        const DatabaseWrap = Comlink.wrap(worker)

        const instance = await new DatabaseWrap()

        console.log('wrap', instance)
        // console.log('wrap result', await instance.connect())

        const database = await instance.connect()

        console.log('DATABASE', database)

        this.connectingPromise = new Promise((resolve) => {
            this.connectingPromiseResolve = resolve
        })

        try {
            this.SQL = await initSqlJs({
                wasmBinary: wasmBinary
            })
            
            this.db = new this.SQL.Database()
            await this.defineCustomFunctions()
            
            this.isConnected = true
            this.connectingPromiseResolve()
        } catch (e) {
            console.error('Error initializing SQLite database:', e)
        }
    }

    private async defineCustomFunctions() {
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

    async disconect() {
        if (!this.isConnected) {
            return
        }
        this.db.close()
        this.isConnected = false
    }

    async createTableWithData(name: string, data: Array<Record<string, unknown>>) {
        const schema = await this.getSchema(data)
        await this.createTable(name, schema)
        await this.insertData(name, data)

        return schema
    }

    async addNewColumns(name: string, data: Array<Record<string, unknown>>) {
        const schema = await this.getSchema(data)
        const currentSchema = this.toObjectsArray(this.db.prepare(`PRAGMA table_info(${name})`))
        const currentFields = currentSchema.map((f: any) => f.name)
        const newFields = Object.keys(schema).filter(f => !currentFields.includes(f))

        if (newFields.length === 0) {
            return
        }

        const alter = this.db.prepare(`ALTER TABLE ${name} ADD 
            COLUMN ${newFields.map(f => `${f} ${schema[f]}`).join(', ')}`)
        alter.run()
    }

    private toObjectsArray(stmt: Statement) {
        const ret = []
        while(stmt.step()) {
            ret.push(stmt.getAsObject())
        }
        return ret
    }

    private recordToBindParams(record: Record<string, unknown>) {
        const bindParams = Object.fromEntries(Object.entries(record).map(([key, val]) => ([`@${key}`, val]))) as BindParams
        return bindParams
    }

    updateData(name: string, data: Array<Record<string, unknown>>) {
        const fields = Object.keys(data.reduce((acc, obj) => ({ ...acc, ...obj }), {}));
        const update = this.db.prepare(`UPDATE ${name} SET ${fields.map((key: string) => `${key} = @${key}`).join(', ')} WHERE id = @id`);
        data.forEach((d: Record<string, unknown>) => {
            const stmt = this.db.prepare(`UPDATE ${name} SET ${fields.map((key: string) => `${key} = @${key}`).join(', ')} WHERE id = @id`)
            stmt.run(this.recordToBindParams(d))
        })
    }

    deleteData(name: string, data: Array<Record<string, unknown>>, key: string = 'id') {
        data.forEach(d => {
            const stmt = this.db.prepare(`DELETE FROM ${name} WHERE ${key} = @${key}`);
            stmt.run({
                [`@${key}`]: d[key]
            } as BindParams)
        })
    }

    async insertData(name: string, inData: Array<Record<string, unknown>>) {
        inData.forEach(d => {
            const columns = Object.keys(d)
            const insertStatement = this.db.prepare(`INSERT INTO ${name} (${columns.join(', ')}) VALUES (${columns.map((key: string) => '@' + key).join(', ')})`);
            insertStatement.run(this.recordToBindParams(formatData(d)))
        })
    }

    dropTable(name: string) {
        this.db.prepare(`DROP TABLE IF EXISTS ${name}`).run()
        this.savedDatabases[name] = false
    }

    createTableClean(name: string, fields: Array<FieldDefinition>) {
        const sqlFields = fields.map(({ name, type }) => `${name} ${type}`).join(', ')
        const createSql = `CREATE TABLE IF NOT EXISTS ${name} (${sqlFields})`
        this.db.prepare(createSql).run()
        this.savedDatabases[name] = true
    }

    async createTable(name: string, fields: Record<string, FieldTypes>) {
        const transformedFiels = Object.entries(fields).map(([key, type]) => [sanitise(key), type])
        const uniqueFields = [...new Map(transformedFiels.map(item =>
            [item[0], item])).values()]
        const sqlFields = uniqueFields.map(([key, type]) => `${key} ${type}`)
        // FIXME: probably use schema generator, for now create with hardcoded fields
        this.db.prepare(`DROP TABLE IF EXISTS ${name}`).run()
        const createSQL = `CREATE TABLE IF NOT EXISTS ${name} (
            ${sqlFields.join(', ')}
        );`

        this.db.prepare(createSQL).run()
        this.savedDatabases[name] = true

        // Dropping data.
        this.db.prepare(`DELETE FROM ${name}`).run()
    }
    async getSchema(data: Array<Record<string, unknown>>) {
        const fields = Object.keys(data.reduce((acc, obj) => ({ ...acc, ...obj }), {}));
        const { types } = toTypeStatements(fields, data as Array<Record<string, string>>); // Call the toTypeStatements function with the correct arguments
        return types;
    }

    select(statement: string, frontmatter: Record<string, unknown>) {
        const stmt = this.db.prepare(statement)
        stmt.bind(this.recordToBindParams(frontmatter ?? {}))
        return {
            data: this.toObjectsArray(stmt) as Record<string, any>[],
            columns: stmt.getColumnNames()
        }
    }
}