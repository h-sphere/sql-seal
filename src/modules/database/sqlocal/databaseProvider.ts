import { App } from "obsidian";
import { sanitise } from "../../../utils/sanitiseColumn";
import { SqlocalDatabaseProxy } from "./sqlocalDatabaseProxy";

export class DatabaseProvider {
	private databases: Map<string, SqlocalDatabaseProxy> = new Map();

	constructor(private app: App) { }

	get prefix() {
		const filename = `sqlseal_1__` +
			sanitise(this.app.vault.getName()) + "___" + (this.app as any).appId;
		return filename;
	}

	async get(filename: string | null = null): Promise<SqlocalDatabaseProxy> {
		const key = filename ?? "GLOBAL";

		// Return cached instance if it exists
		const existing = this.databases.get(key);
		if (existing) {
			return existing;
		}

		// Create new instance with error handling
		const dbName = filename ? `${this.prefix}_${filename}` : `${this.prefix}_db`;

		try {
			// Create the proxy which will handle worker creation and communication
			const sqlocalDb = new SqlocalDatabaseProxy(this.app, dbName);

			// Connect to initialize the worker
			await sqlocalDb.connect();

			// Cache the instance
			this.databases.set(key, sqlocalDb);

			return sqlocalDb;
		} catch (error) {
			console.error('DatabaseProvider: Failed to initialize database:', dbName, error);
			// If there's a cached instance that failed, remove it
			this.databases.delete(key);
			throw error;
		}
	}

	async close() {
		const promises = Array.from(this.databases.values()).map(db => db.disconnect());
		await Promise.all(promises);
		this.databases.clear();
	}
}
