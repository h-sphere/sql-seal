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
	let types: Record<string, ReturnType<typeof predictType>> = {}
	header.forEach(key => {
		const type = predictType(key, data)
		console.log('TYPE:', key, type)
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

    async defineDatabaseFromUrl(unprefixedName: string, url: string, prefix: string) {
        const name = prefixedIfNotGlobal(unprefixedName, [], prefix)
        console.log('define db from url', name, url)
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
            console.log('TABLE CREATE', parsedData)

            const sqlFields = Object.entries(types).map(([key, type]) => `${key} ${type}`).join(',\n')
            // FIXME: probably use schema generator, for now create with hardcoded fields
            await this.db.prepare(`DROP TABLE IF EXISTS ${name}`).run()
            const createSQL = `CREATE TABLE IF NOT EXISTS ${name} (
                ${sqlFields}
            );`
    
            await this.db.prepare(createSQL).run()
            this.savedDatabases[name] = url
    
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