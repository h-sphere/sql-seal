import { Kysely } from "kysely";
import { App } from "obsidian";
import { sanitise } from "../../../utils/sanitiseColumn";

import { initSQLite } from '@subframe7536/sqlite-wasm'
import { useIdbStorage } from '@subframe7536/sqlite-wasm/idb'
// @ts-ignore
import wasmUrl from 'virtual:sqlite-wasm-url';

interface DbMapEntry {
	database: any
	kysely: Kysely<any>
}

// export class DatabaseProvider {
// 	constructor(private app: App) {}
// 	private databases: Map<string, DbMapEntry> = new Map();

// 	private _sqlite3: any = null;
// 	private async sqlite3() {
// 		console.log('sqlite3', sqlite3InitModule)
// 		if (this._sqlite3) {
// 			return this._sqlite3;
// 		}
// 		this._sqlite3 = (await sqlite3InitModule()).oo1;
// 		return this._sqlite3;
// 	}

// 	get prefix() {
// 		const filename =
// 			sanitise(this.app.vault.getName()) + "___" + (this.app as any).appId;
// 		return filename;
// 	}

// 	async get<F extends string | null>(
// 		filename: F,
// 	): Promise<F extends null ? Kysely<DatabaseSchema> : Kysely<unknown>> {
// 		const key = filename ?? "GLOBAL";

// 		console.log('database provider get?', this.databases)

// 		const db = this.databases.get(key);
// 		if (db) {
// 			return db as any; // FIXME: fix typing here
// 		}

// 		const path = this.prefix + "___" + key;

// 		let rawDatabase: Database | null = null

// 		try {
// 			// Create dialect using official SQLite WASM
// 			console.log('trying conect')
// 			const dialect = new OfficialWasmDialect({
// 				database: async () => {
// 					const sqlite3 = await this.sqlite3();
// 					if (!sqlite3) {
// 						throw new Error("Failed to load SQLite WASM");
// 					}
// 					const dbPath = path;

// 					const db = new sqlite3.DB(dbPath, "ct");
// 					rawDatabase = db
// 					console.log('RAW DATABASE', rawDatabase)
// 					return db
// 				},
// 			});

// 			console.log('dialect', dialect)


// 			// Create Kysely instance
// 			const kysely = new Kysely<any>({
// 				dialect,
// 			});

// 			console.log('kyseley', kysely)

// 			this.databases.set(key, {
// 				kysely,
// 				database: rawDatabase
// 			});
// 			return kysely
// 		} catch (error) {
// 			console.error("Error creating SQLite WASM database:", error);
// 			throw error;
// 		}
// 	}

//     async getGlobal() {
//         const db = await this.get(null)
// 		const tables = await db.introspection.getTables()
// 		if (!tables.length) {
// 			// Generating schema

// 		}
//     }

// 	async getRawDatabaseAccess(filename: string | null = null) {
// 		await this.get(filename)
// 		return this.databases.get(filename ?? 'GLOBAL')!.database
// 	}

// 	createGlobalTables(db: Kysely<any>) {
// 		db.schema
// 			.createTable('files')
// 			.addColumn('id', 'text')
// 			.addColumn('name', 'text')
// 			.addColumn('path', 'text')
// 			.addColumn('created_at', 'datetime', c => c.defaultTo('now'))
// 			.addColumn('modified_at', 'datetime')
// 			.addColumn('file_size', 'numeric')
// 	}

// 	async close() {
// 		return Promise.all(
// 			Array.from(this.databases.entries()).map(([_, db]) => db.destroy()),
// 		);
// 	}
// }


export class DatabaseProvider {
	constructor(private app: App) { }

	get prefix() {
		const filename = `sqlseal_1__` +
			sanitise(this.app.vault.getName()) + "___" + (this.app as any).appId;
		return filename;
	}

	async get(x: any) {
		const dbName = this.prefix + '_db.sql'
		console.log(dbName)
		const db = await initSQLite(useIdbStorage(dbName, { url: wasmUrl }))
		console.log('database', db)
		const data = await db.run('SELECT sqlite_version()')
		console.log('DATA', data)
		return db
	}
}
