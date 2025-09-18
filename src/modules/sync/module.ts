import { Registrator } from "@hypersphere/dity"
import { App, Plugin, Vault } from "obsidian"
import { syncBusFactory } from "./sync/syncFactory"
import { SqlSealDatabase } from "../database/database"
import { syncInit } from "./sync/init"
import { fileSyncFactory } from "./fileSyncController/fileSyncFactory"

export const sync = new Registrator()
    .import<'app', App>()
    .import<'plugin', Plugin>()
    .import<'db', Promise<SqlSealDatabase>>()
    .import<'vault', Vault>()
    .register('syncBus', d => d.fn(syncBusFactory).inject('db', 'vault', 'app'))
    .register('fileSync', d => d.fn(fileSyncFactory).inject('app', 'plugin', 'db', 'syncBus'))
    .register('init', d => d.fn(syncInit).inject('app', 'fileSync'))
    .export('init', 'syncBus')
