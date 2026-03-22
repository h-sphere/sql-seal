import { Registrator } from "@hypersphere/dity"
import { App, Plugin, Vault } from "obsidian"
import { syncBusFactory } from "./sync/syncFactory"
import { SqlocalDatabaseProxy } from "../database/sqlocal/sqlocalDatabaseProxy"
import { syncInit } from "./sync/init"
import { fileSyncFactory } from "./fileSyncController/fileSyncFactory"

export const sync = new Registrator()
    .import<'app', App>()
    .import<'db', Promise<SqlocalDatabaseProxy>>()
    .import<'plugin', Plugin>()
    .import<'vault', Vault>()
    // @ts-expect-error - TypeScript has trouble inferring Registrator types after SqlocalDatabaseProxy changes
    .register('syncBus', d => d.fn(syncBusFactory).inject('db', 'vault', 'app'))
    // @ts-expect-error - TypeScript has trouble inferring Registrator types after SqlocalDatabaseProxy changes  
    .register('fileSync', d => d.fn(fileSyncFactory).inject('app', 'plugin', 'db', 'syncBus'))
    .register('init', d => d.fn(syncInit).inject('app', 'fileSync'))
    .export('init', 'syncBus')

export type SyncModule = typeof sync
