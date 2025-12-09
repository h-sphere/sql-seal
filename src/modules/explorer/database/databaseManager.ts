import { TFile } from "obsidian";
import { MemoryDatabase } from "./memoryDatabase";

/**
 * DatabaseManager - manages connections to external .db files
 * Re-implemented using wa-sqlite instead of sql.js
 */
export class DatabaseManager {
	constructor() {}

	async getDatabaseConnection(file: TFile) {
		console.log('DatabaseManager: Creating connection to external .db file:', file.name);

		const db = new MemoryDatabase(file);
		await db.connect();

		console.log('DatabaseManager: Successfully connected to external .db file');
		return db;
	}

	getGlobalDatabaseConnection() {
		throw new Error('Global database connection not implemented. Use the main database provider instead.');
	}
}
