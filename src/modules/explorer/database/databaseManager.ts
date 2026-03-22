import { TFile } from "obsidian";
import { WaSqliteMemoryDatabase } from "./waSqliteMemoryDatabase";

/**
 * DatabaseManager - manages connections to external .db files
 * Using wa-sqlite with MemoryAsyncVFS for in-memory database loading
 */
export class DatabaseManager {
	constructor() {}

	async getDatabaseConnection(file: TFile) {
		const db = new WaSqliteMemoryDatabase(file);
		await db.connect();
		return db;
	}

	getGlobalDatabaseConnection() {
		throw new Error('Global database connection not implemented. Use the main database provider instead.');
	}
}
