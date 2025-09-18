import { App } from "obsidian";
import { SqlSealDatabase } from "./database";

export const databaseFactory = async (app: App) => {
    const db = new SqlSealDatabase(app)
    await db.connect()
    return db
}