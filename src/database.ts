import Database from "better-sqlite3"
import { App } from "obsidian"
import path from 'path'
import Papa from 'papaparse'
import { prefixedIfNotGlobal } from "./sqlReparseTables"
import fs from 'fs'
import { delay, fetchBlobData } from "./utils"

function isNumeric(str: string) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}


const toTypeStatements = (header: Array<string>, data: Array<Record<string, string>>) => {
    let d: Array<Record<string, string | number>> = data
    const types: Record<string, ReturnType<typeof predictType>> = {}
    header.forEach(key => {
        const type = predictType(key, data)
        if (type === 'REAL' || type === 'INTEGER') {
            // converting all data here to text
            d = d.map(record => ({
                ...record,
                [key]: type === 'REAL'
                    ? parseFloat(record[key] as string)
                    : parseInt(record[key] as string)
            }))
        }

        types[key] = type
    })

    return {
        data: d,
        types
    }
}

const predictType = (field: string, data: Array<Record<string, string>>) => {

    if (field === 'id') {
        return 'TEXT'
    }

    const canBeNumber = data.reduce((acc, d) => acc && isNumeric(d[field]), true)
    if (canBeNumber) {

        // Check if Integer or Float
        const canBeInteger = data.reduce((acc, d) => acc && parseFloat(d[field]) === parseInt(d[field]), true)
        if (canBeInteger) {
            return 'INTEGER'
        }

        return 'REAL'
    }
    return 'TEXT'
}

export class SqlSealDatabase {
    private savedDatabases: Record<string, any> = {}
    db: typeof Database
    private isConnected = false
    private connectingPromise;
    private connectingPromiseResolve;
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
        const dbPath = path.resolve(this.app.vault.adapter.basePath, this.app.vault.configDir, "plugins/sqlseal/better_sqlite3.node")
        // check if file "better_sqlite3.node" exists in the plugin folder, if not, download it from github release
        if (!fs.existsSync(dbPath)) {
            console.log('BETTER SQL DOES NOT EXIST, DOWNLOADING FROM GITHUB RELEASE')
            const url = 'https://github.com/kulak-at/tag-test/releases/download/0.1/better_sqlite3.node' // my github release url

            // use node native request to fetch data
            console.log('PATH TO WRITE', dbPath)

            await fetchBlobData(url, dbPath)
        }
        console.log('FETCHED')

        await delay(1000) // Making sure everything is in order: ;

        //@ts-ignore
        const defaultDbPath = path.resolve(this.app.vault.adapter.basePath, this.app.vault.configDir, "obsidian.db")
        this.db = new Database(defaultDbPath, { verbose: this.verbose ? console.log : undefined })

        console.log('Connected to database', this.db)
        this.isConnected = true
        this.connectingPromiseResolve()
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

        const alter = this.db.prepare(`ALTER TABLE ${name} ADD COLUMN ${newFields.map(f => `${f} ${schema[f]}`).join(', ')}`)
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
                    console.log(e)
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
                    console.log(e)
                }
            })
        })

        return deleteMany(data)
    }

    insertData(name: string, data: Array<Record<string, unknown>>) {
        const fields = Object.keys(data.reduce((acc, obj) => ({ ...acc, ...obj }), {}));
        const insert = this.db.prepare(`INSERT INTO ${name} (${fields.join(', ')}) VALUES (${fields.map((key: string) => '@' + key).join(', ')})`);
        const insertMany = this.db.transaction((pData: Array<Record<string, any>>) => {
            pData.forEach(data => {
                try {
                    // update data so all missing fields are set to null
                    fields.forEach(field => {
                        if (!data[field]) {
                            data[field] = null
                        }
                    })
                    insert.run(data)
                } catch (e) {
                    console.log(e)
                }
            })
        })

        return insertMany(data)
    }

    async createTable(name: string, fields: Record<string, 'TEXT' | 'INTEGER' | 'REAL'>) {
        const sqlFields = Object.entries(fields).map(([key, type]) => `${key} ${type}`)
        // FIXME: probably use schema generator, for now create with hardcoded fields
        await this.db.prepare(`DROP TABLE IF EXISTS ${name}`).run()
        const createSQL = `CREATE TABLE IF NOT EXISTS ${name} (
            ${sqlFields.join(', ')}
        );`

        await this.db.prepare(createSQL).run()
        this.savedDatabases[name] = true

        // Dropping data.
        await this.db.prepare(`DELETE FROM ${name}`).run()
    }
    async getSchema(data: Array<Record<string, unknown>>) {
        const fields = Object.keys(data.reduce((acc, obj) => ({ ...acc, ...obj }), {}));
        const { types } = toTypeStatements(fields, data as Array<Record<string, string>>); // Call the toTypeStatements function with the correct arguments
        return types;
    }

    async loadDataForDatabaseFromUrl(name: string, url: string) {
        const file = this.app.vault.getFileByPath(url)
        const data = await this.app.vault.cachedRead(file)

        const parsed = Papa.parse(data, {
            header: true,
            dynamicTyping: false,
            skipEmptyLines: true
        })
        const fields = parsed.meta.fields
        const { data: parsedData, types } = toTypeStatements(fields, parsed.data)

        // Purge the database
        await this.db.prepare(`DELETE FROM ${name}`).run()

        const insert = this.db.prepare(`INSERT INTO ${name} (${fields.join(', ')}) VALUES (${fields.map((key: string) => '@' + key).join(', ')})`);
        const insertMany = this.db.transaction((pData: Array<Record<string, any>>) => {
            pData.forEach(data => {
                try {
                    insert.run(data)
                } catch (e) {
                    console.log(e)
                }
            })
        })

        await insertMany(parsedData)
    }

    async defineDatabaseFromUrl(unprefixedName: string, url: string, prefix: string, reloadData: boolean = false) {
        const name = prefixedIfNotGlobal(unprefixedName, [], prefix) // FIXME: should we pass global tables here too?
        if (this.savedDatabases[name]) {
            console.log('Database Exists', name)
            if (reloadData) {
                await this.loadDataForDatabaseFromUrl(name, url)
            }
            return name
        }
        const file = this.app.vault.getFileByPath(url)
        if (!file) {
            console.log('File not found')
            return name
        }
        const data = await this.app.vault.cachedRead(file)

        const parsed = Papa.parse(data, {
            header: true,
            dynamicTyping: false,
            skipEmptyLines: true
        })
        const fields = parsed.meta.fields
        const { data: parsedData, types } = toTypeStatements(fields, parsed.data)

        await this.createTable(name, types)
        // this.savedDatabases[name] = url
        await this.loadDataForDatabaseFromUrl(name, url)

        
        return name
    }
}