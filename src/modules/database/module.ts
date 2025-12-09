import { App } from "obsidian";
import { DatabaseProvider } from "./sqlocal/databaseProvider";
import { Registrator } from "@hypersphere/dity";
import { databaseFactory } from "./factory";


export type DatabaseModule = typeof db

export const db = new Registrator()
.import<'app', App>()
.register('provider', d => d.cls(DatabaseProvider).inject('app'))
.register('db', d => d.fn(databaseFactory).inject('app', 'provider'))
.export('db', 'provider')
