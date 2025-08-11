import { Kysely } from "kysely";
import { Database } from "./schema";
import { OfficialWasmDialect } from "kysely-wasm";
import sqlite3InitModule from "@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3-bundler-friendly.mjs";
import { App, Vault } from "obsidian";
import { makeInjector } from "@hypersphere/dity";
import { DatabaseModule } from "../module";
import { sanitise } from "../../../utils/sanitiseColumn";

@(makeInjector<DatabaseModule>()(["app"]))
export class DatabaseProvider {
	constructor(private app: App) {}
	private databases: Map<string, Kysely<any>> = new Map();

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
	): Promise<F extends null ? Kysely<Database> : Kysely<unknown>> {
		const key = filename ?? "GLOBAL";

		const db = this.databases.get(key);
		if (db) {
			return db as any; // FIXME: fix typing here
		}

		const path = this.prefix + "___" + key;

		try {
			// Create dialect using official SQLite WASM
			const dialect = new OfficialWasmDialect({
				database: async () => {
					const sqlite3 = await this.sqlite3();
					if (!sqlite3) {
						throw new Error("Failed to load SQLite WASM");
					}
					const dbPath = path;

					return new sqlite3.DB(dbPath, "ct");
				},
			});

			// Create Kysely instance
			const db = new Kysely<Database>({
				dialect,
			});

			this.databases.set(key, db);
			return db as any;
		} catch (error) {
			console.error("Error creating SQLite WASM database:", error);
			throw error;
		}
	}

    async getGlobal() {
        return this.get(null)
    }

	async close() {
		return Promise.all(
			Array.from(this.databases.entries()).map(([_, db]) => db.destroy()),
		);
	}
}
