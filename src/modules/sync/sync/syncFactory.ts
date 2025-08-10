import { App, Vault } from "obsidian";
import { makeInjector } from "@hypersphere/dity";
import { Sync } from "./sync";
import { SyncModule } from "../module";
import { SqlSealDatabase } from "../../database/database";

@(makeInjector<SyncModule>()([
    'db', 'vault', 'app'
]))
export class SyncFactory {
    async make(
        db: SqlSealDatabase,
        vault: Vault,
        app: App) {
        const sync = new Sync(db, vault, app)
        await sync.init()
        return sync
    }
}