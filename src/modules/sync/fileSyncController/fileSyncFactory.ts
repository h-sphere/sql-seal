import { App, Plugin } from "obsidian"
import { SealFileSync } from "./FileSync"
import { FilesFileSyncTable } from "../../../vaultSync/tables/filesTable"
import { TagsFileSyncTable } from "../../../vaultSync/tables/tagsTable"
import { TasksFileSyncTable } from "../../../vaultSync/tables/tasksTable"
import { LinksFileSyncTable } from "../../../vaultSync/tables/linksTable"
import { Sync } from "../sync/sync"
import { makeInjector } from "@hypersphere/dity"
import { SyncModule } from "../module"
import { SqlSealDatabase } from "../../database/database"

@(makeInjector<SyncModule>()([
    'app', 'plugin', 'db', 'syncBus'
]))
export class FileSyncFactory {
    async make(app: App, plugin: Plugin, db: SqlSealDatabase, sync: Sync) {
        return async () => {
            const fileSync = new SealFileSync(app, plugin, (name) => sync.triggerGlobalTableChange(name))
            
            fileSync.addTablePlugin(new FilesFileSyncTable(db, app, plugin))
            fileSync.addTablePlugin(new TagsFileSyncTable(db, app))
            fileSync.addTablePlugin(new TasksFileSyncTable(db, app))
            fileSync.addTablePlugin(new LinksFileSyncTable(db, app))

            await fileSync.init()
            return fileSync
        }
    }
}