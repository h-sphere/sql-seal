import { TFile } from "obsidian";
import { MemoryDatabase } from "./memoryDatabase";
import wasmBinary from '../../../../node_modules/@jlongster/sql.js/dist/sql-wasm.wasm'
import initSqlJs from '@jlongster/sql.js';

export class DatabaseManager {
	constructor() {}

    private sql: initSqlJs.SqlJsStatic | null = null

	private async getConnection() {
        if (this.sql) {
            return this.sql
        }
		const SQL = await initSqlJs({
			wasmBinary: wasmBinary,
		});
        this.sql = SQL
        return SQL
	}

	async getDatabaseConnection(file: TFile) {
		// FIXME: connecting to database
        const connection = await this.getConnection()

		const db =  new MemoryDatabase(connection, file);
        await db.connect()
        return db
	}

	getGlobalDatabaseConnection() {}
}
