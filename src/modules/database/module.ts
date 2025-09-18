import { Registrator } from "@hypersphere/dity";
import { App } from "obsidian";
import { databaseFactory } from "./factory";

export const db = new Registrator()
.import<'app', App>()
.register('db', d => d.fn(databaseFactory).inject('app'))
.export('db')