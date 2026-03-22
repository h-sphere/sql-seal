import { Registrator } from "@hypersphere/dity";
import { apiInit } from "./init";
import { Plugin } from "obsidian";
import { SqlocalDatabaseProxy } from "../database/sqlocal/sqlocalDatabaseProxy";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";
import { ModernCellParser } from "../syntaxHighlight/cellParser/ModernCellParser";


export const apiModule = new Registrator()
    .import<'plugin', Plugin>()
    .import<'cellParser', Promise<ModernCellParser>>()
    .import<'db', Promise<SqlocalDatabaseProxy>>()
    .import<'rendererRegistry', RendererRegistry>()
    .register('init', db => db.fn(apiInit).inject('plugin', 'cellParser', 'rendererRegistry', 'db'))
    .export('init')
