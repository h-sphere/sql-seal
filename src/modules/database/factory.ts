import { App } from "obsidian";
import { DatabaseProvider } from "./sqlocal";

export const databaseFactory = async (app: App, provider: DatabaseProvider) => {
    console.log('#### DATABASE CREATION')

    const db = await provider.get(null)
    await db.connect()

    return db
}