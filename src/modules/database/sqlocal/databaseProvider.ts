import { Kysely } from "kysely";
import { DatabaseSchema } from "./schema";
import { OfficialWasmDialect } from "kysely-wasm";
import sqlite3InitModule from "@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3-bundler-friendly.mjs";
import {  Database} from '@sqlite.org/sqlite-wasm'
import { App, Vault } from "obsidian";
import { makeInjector } from "@hypersphere/dity";
import { DatabaseModule } from "../module";
import { sanitise } from "../../../utils/sanitiseColumn";

interface DbMapEntry {
	database: any
	kysely: Kysely<any>
}

@(makeInjector<DatabaseModule>()(["app"]))
export class DatabaseProvider {
	constructor(private app: App) {}
	private databases: Map<string, DbMapEntry> = new Map();

	private _sqlite3: any = null;
	private async sqlite3() {
		if (this._sqlite3) {
			return this._sqlite3;
		}
		this._sqlite3 = (await sqlite3InitModule()).oo1;
		return this._sqlite3;
	}

	get prefix() {
		const filename =
			sanitise(this.app.vault.getName()) + "___" + (this.app as any).appId;
		return filename;
	}

	async get<F extends string | null>(
		filename: F,
	): Promise<F extends null ? Kysely<DatabaseSchema> : Kysely<unknown>> {
		const key = filename ?? "GLOBAL";

		const db = this.databases.get(key);
		if (db) {
			return db as any; // FIXME: fix typing here
		}

		const path = this.prefix + "___" + key;

		let rawDatabase: Database | null = null

		try {
			// Create dialect using official SQLite WASM
			const dialect = new OfficialWasmDialect({
				database: async () => {
					const sqlite3 = await this.sqlite3();
					if (!sqlite3) {
						throw new Error("Failed to load SQLite WASM");
					}
					const dbPath = path;

					const db = new sqlite3.DB(dbPath, "ct");
					rawDatabase = db
					return db
				},
			});


			// Create Kysely instance
			const kysely = new Kysely<any>({
				dialect,
			});

			this.databases.set(key, {
				kysely,
				database: rawDatabase
			});
			return db as any;
		} catch (error) {
			console.error("Error creating SQLite WASM database:", error);
			throw error;
		}
	}

    async getGlobal() {
        const db = await this.get(null)
		const tables = await db.introspection.getTables()
		if (!tables.length) {
			// Generating schema

		}
    }

	async getRawDatabaseAccess(filename: string | null = null) {
		await this.get(filename)
		return this.databases.get(filename ?? 'GLOBAL')!.database
	}

	createGlobalTables(db: Kysely<any>) {
		db.schema
			.createTable('files')
			.addColumn('id', 'text')
			.addColumn('name', 'text')
			.addColumn('path', 'text')
			.addColumn('created_at', 'datetime', c => c.defaultTo('now'))
			.addColumn('modified_at', 'datetime')
			.addColumn('file_size', 'numeric')
	}

	async close() {
		return Promise.all(
			Array.from(this.databases.entries()).map(([_, db]) => db.destroy()),
		);
	}
}
