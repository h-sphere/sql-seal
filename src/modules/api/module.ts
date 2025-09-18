import { Registrator } from "@hypersphere/dity";
import { apiInit } from "./init";
import { Plugin } from "obsidian";
import { SqlSealDatabase } from "../database/database";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";
import { ModernCellParser } from "../syntaxHighlight/cellParser/ModernCellParser";


export const apiModule = new Registrator()
    .import<'plugin', Plugin>()
    .import<'cellParser', Promise<ModernCellParser>>()
    .import<'db', Promise<SqlSealDatabase>>()
    .import<'rendererRegistry', RendererRegistry>()
    .register('init', db => db.fn(apiInit).inject('plugin', 'cellParser', 'rendererRegistry', 'db'))
    .export('init')
