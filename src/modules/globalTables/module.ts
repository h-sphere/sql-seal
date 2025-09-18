import { Registrator } from "@hypersphere/dity";
import { globalTablesInit } from "./InitFactory";
import { App, Plugin } from "obsidian";
import { globalTablesViewRendererFactory } from "./GlobalTablesViewRegister";
import { Sync } from "../sync/sync/sync";

export const globalTables = new Registrator()
    .import<'app', App>()
    .import<'plugin', Plugin>()
    .import<'sync', Promise<Sync>>()
    .register('globalTablesViewRegister', d => d.fn(globalTablesViewRendererFactory).inject('plugin', 'app', 'sync'))
    .register('init', d => d.fn(globalTablesInit).inject('globalTablesViewRegister'))
    .export('init')
