import { App } from "obsidian";
import { DatabaseProvider } from "./sqlocal/databaseProvider";
import { Registrator } from "@hypersphere/dity";
import { databaseFactory } from "./factory";


export type DatabaseModule = typeof db

export const db = new Registrator()
.import<'app', App>()
.register('db', d => d.fn(databaseFactory).inject('app'))
.register('provider', d => d.cls(DatabaseProvider).inject('app'))
.export('db', 'provider')
