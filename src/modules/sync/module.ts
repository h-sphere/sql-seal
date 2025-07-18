import { asFactory, buildContainer } from "@hypersphere/dity"
import { FileSyncFactory } from "./fileSyncController/fileSyncFactory"
import { App, Plugin, Vault } from "obsidian"
import { SyncFactory } from "./sync/syncFactory"
import { SqlSealDatabase } from "../database/database"
import { SyncInit } from "./sync/init"

export const sync = buildContainer(c => c
    .register({
        fileSync: asFactory(FileSyncFactory),
        syncBus: asFactory(SyncFactory),
        init: asFactory(SyncInit)
    })
    .externals<{
        app: App,
        plugin: Plugin,
        db: SqlSealDatabase,
        vault: Vault
    }>()
)
export type SyncModule = typeof sync