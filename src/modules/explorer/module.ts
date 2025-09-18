import { Registrator } from "@hypersphere/dity";
import { explorerInit } from "./InitFactory";
import { App, Plugin } from "obsidian";
import { ModernCellParser } from "../syntaxHighlight/cellParser/ModernCellParser";
import { SqlSealDatabase } from "../database/database";
import { Settings } from "../settings/Settings";
import { Sync } from "../sync/sync/sync";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";
import { ViewPlugin } from "@codemirror/view";
import { ViewPluginGeneratorType } from "../syntaxHighlight/viewPluginGenerator";
import { DatabaseManager } from "./database/databaseManager";

export const explorer = new Registrator()
    .import<'app', App>()
    .import<'cellParser', Promise<ModernCellParser>>()
    .import<'db', Promise<SqlSealDatabase>>()
    .import<'settings', Promise<Settings>>()
    .import<'sync', Promise<Sync>>()
    .import<'rendererRegistry', RendererRegistry>()
    .import<'plugin', Plugin>()
    .import<'viewPluginGenerator', ViewPluginGeneratorType>()
    .register('dbManager', d => d.cls(DatabaseManager).inject())
    .register('init', d => d.fn(explorerInit).inject('plugin', 'app', 'db', 'cellParser', 'rendererRegistry', 'sync', 'settings', 'viewPluginGenerator', 'dbManager'))
    .export('init')
