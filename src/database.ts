import Database from "better-sqlite3"
import { App } from "obsidian"
import path from 'path'
import Papa from 'papaparse'
import { prefixedIfNotGlobal } from "./sqlReparseTables"

function isNumeric(str: string) {
	if (typeof str != "string") return false // we only process strings!  
	return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
		   !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }


const toTypeStatements = (header: Array<string>, data: Array<Record<string, string>>) => {
	let d: Array<Record<string, string|number>> = data
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
    constructor(private readonly app: App, verbose = false) {
        //@ts-ignore
        const defaultDbPath = path.resolve(app.vault.adapter.basePath,app.vault.configDir, "obsidian.db")
    	this.db = new Database(defaultDbPath, {  verbose: verbose ? console.log : undefined })
    }

    async createTableWithData(name: string, data: Array<Record<string, unknown>>) {
        const schema = await this.getSchema(data)
        await this.createTable(name, schema)
        await this.insertData(name, data)

        return schema
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

    async createTable(name: string, fields: Record<string, 'TEXT'|'INTEGER'|'REAL'>) {
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

    async defineDatabaseFromUrl(unprefixedName: string, url: string, prefix: string) {
        const name = prefixedIfNotGlobal(unprefixedName, [], prefix)
        if (this.savedDatabases[name]) {
            console.log('Database Exists', name)
            return
        }
        const file = this.app.vault.getFileByPath(url)
            if (!file) {
                console.log('File not found')
                return
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
}