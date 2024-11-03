import Database from "better-sqlite3"
import { App } from "obsidian"
import path from 'path'
import Papa from 'papaparse'
import { prefixedIfNotGlobal } from "./sqlReparseTables"
import { camelCase } from 'lodash'
import { dataToCamelCase, fetchBlobData, FieldTypes, predictJson, predictType, toTypeStatements } from "./utils"
import os from 'os'
import fs from 'fs'
import { sanitise } from "./utils/sanitiseColumn"

export interface FieldDefinition {
    name: string;
    type: FieldTypes
}

export class SqlSealDatabase {
    private savedDatabases: Record<string, any> = {}
    db: Database.Database
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

        this.connectingPromise = new Promise((resolve) => {
            this.connectingPromiseResolve = resolve
        })
        //@ts-ignore
        // const dbPath = normalizePath(this.app.vault.adapter.basePath + '/' + this.app.vault.configDir + '/sqlseal.db')

        const arch = os.arch()
        const platform = os.platform()
        const better_sql_version = 'v11.2.1'

        const dbNodeFilePath = path.resolve(this.app.vault.adapter.basePath, this.app.vault.configDir, `plugins/sqlseal/better_sqlite3-${platform}-${arch}.node`)
        // check if file "better_sqlite3.node" exists in the plugin folder, if not, download it from better sqlite release.
        try {
            if (!fs.existsSync(dbNodeFilePath)) {
                const url = `https://github.com/h-sphere/bettersql3-builds/releases/download/processed-${better_sql_version}/better-sqlite3-${better_sql_version}-electron-v${process.versions.modules}-${platform}-${arch}.node`

                await fetchBlobData(url, dbNodeFilePath)
            }

            await sleep(500)


            const dbPath = path.resolve(this.app.vault.adapter.basePath, this.app.vault.configDir, `plugins/sqlseal/database.sqlite`)

            this.db = new Database(dbPath, { verbose: this.verbose ? console.log : undefined })
            await this.defineCustomFunctions()


            this.isConnected = true
            this.connectingPromiseResolve()

        } catch (e) {
            console.error(`Error while loading SQLSeal. Please reload Obsiidan. If it repeats, please create new issue on GitHub: https://github.com/h-sphere/sql-seal/issues . Please quote following parameters:
                Architecture: ${arch}
                Platform: ${platform}
                Electron Version: ${process.versions.modules}
                BetterSQLite Version: ${better_sql_version}
                Error: ${e}
                `, e)
        }
    }

    private async defineCustomFunctions() {
        this.db.function('a', (href: string, name: string) => {
            const linkObject = {
              type: 'link',
              href: href,
              name: name || href
            };
            return `SQLSEALCUSTOM(${JSON.stringify(linkObject)})`;
          });

        this.db.function('a', (href: string) => {
        const linkObject = {
            type: 'link',
            href: href,
            name: href
        };
        return `SQLSEALCUSTOM(${JSON.stringify(linkObject)})`;
        });

        this.db.function('img', (href: string) => {
            const imgObject = {
                type: 'img',
                href: href
            }
            return `SQLSEALCUSTOM(${JSON.stringify(imgObject)})`
        })

        this.db.function('img', (href: string, path: string) => {
            const imgObject = {
                type: 'img',
                path,
                href
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
        const currentSchema = this.db.prepare(`PRAGMA table_info(${name})`).all()
        const currentFields = currentSchema.map((f: any) => f.name)
        const newFields = Object.keys(schema).filter(f => !currentFields.includes(f))

        if (newFields.length === 0) {
            return
        }

        const alter = this.db.prepare(`ALTER TABLE ${name} ADD 
            COLUMN ${newFields.map(f => `${f} ${schema[f]}`).join(', ')}`)
        alter.run()
    }

    updateData(name: string, data: Array<Record<string, unknown>>) {
        const fields = Object.keys(data.reduce((acc, obj) => ({ ...acc, ...obj }), {}));
        const update = this.db.prepare(`UPDATE ${name} SET ${fields.map((key: string) => `${key} = @${key}`).join(', ')} WHERE id = @id`);
        const updateMany = this.db.transaction((pData: Array<Record<string, any>>) => {
            pData.forEach(data => {
                try {
                    update.run(data)
                } catch (e) {
                    console.error(e)
                }
            })
        })

        return updateMany(data)
    }

    deleteData(name: string, data: Array<Record<string, unknown>>, key: string = 'id') {

        const deleteStmt = this.db.prepare(`DELETE FROM ${name} WHERE ${key} = @${key}`);
        const deleteMany = this.db.transaction((pData: Array<Record<string, any>>) => {
            pData.forEach(data => {
                try {
                    deleteStmt.run(data)
                } catch (e) {
                    console.error(e)
                }
            })
        })

        return deleteMany(data)
    }

    async insertData(name: string, inData: Array<Record<string, unknown>>) {
        const insertMany = this.db.transaction((pData: Array<Record<string, any>>) => {
            // FIXME: should we do this as a transaction or not?
            pData.forEach(data => {
                const columns = Object.keys(data)
                const insert = this.db.prepare(`INSERT INTO ${name} (${columns.join(', ')}) VALUES (${columns.map((key: string) => '@' + key).join(', ')})`);
                const d = Object.keys(data).reduce((ret, key) => {
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
                insert.run(d)
            })
        })

        insertMany(inData)
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

    async loadDataForDatabaseFromUrl(name: string, url: string, reloadData: boolean = false) {
        const file = this.app.vault.getFileByPath(url)

        if (!file) {
            return
        }
        const data = await this.app.vault.cachedRead(file)

        const parsed = Papa.parse<Record<string, string>>(data, {
            header: true,
            dynamicTyping: false,
            skipEmptyLines: true
        })

        const processedData = dataToCamelCase(parsed.data)
        const processedWithJsonParsed = predictJson(processedData)
        const fields = parsed.meta.fields?.map((f: string) => camelCase(f))!

        const { data: parsedData, types } = toTypeStatements(fields, processedWithJsonParsed)

        try {
            // Purge the database
            await this.db.prepare(`DELETE FROM ${name}`).run()
        } catch (e) {
            // FIXME: check if error is actually that the table does not exist
            await this.createTable(name, types)
        }
        await this.insertData(name, parsedData)
        return name
    }

    /**
     * @deprecated
     * @param unprefixedName 
     * @param url 
     * @param prefix 
     * @param reloadData 
     * @returns 
     */
    async defineDatabaseFromUrl(unprefixedName: string, url: string, prefix: string, reloadData: boolean = false) {
        // FIXME: why do we repeat this code?
        const name = prefixedIfNotGlobal(unprefixedName, [], prefix) // FIXME: should we pass global tables here too?
        if (this.savedDatabases[name]) {
            if (reloadData) {
                await this.loadDataForDatabaseFromUrl(name, url)
            }
            return name
        }
        const file = this.app.vault.getFileByPath(url)

        if (!file) {
            return name
        }
        const data = await this.app.vault.cachedRead(file)

        const parsed = Papa.parse<Record<string, string>>(data, {
            header: true,
            dynamicTyping: false,
            skipEmptyLines: true
        })
        const fields = parsed.meta.fields!
        const { data: parsedData, types } = toTypeStatements(fields, parsed.data)

        await this.createTable(name, types)
        this.savedDatabases[name] = url
        await this.loadDataForDatabaseFromUrl(name, url)


        return name
    }
}