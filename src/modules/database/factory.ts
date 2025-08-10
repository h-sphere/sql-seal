import { App } from "obsidian";
import { SqlSealDatabase } from "./database";
import { makeInjector } from "@hypersphere/dity";
import { DbModel } from "./module";


@(makeInjector<DbModel, 'factory'>()([
    'app'
]))
export class DatabaseFactory {
    async make(app: App) {
        const db = new SqlSealDatabase(app)
        await db.connect()
        return db
    }
}