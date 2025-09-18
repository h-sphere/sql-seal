import { Registrator } from "@hypersphere/dity"
import { App, Plugin } from "obsidian"
import { SqlSealDatabase } from "../database/database"
import { Sync } from "../sync/sync/sync"
import { RendererRegistry } from "./renderer/rendererRegistry"
import { editorInit } from "./init"
import { SqlSealCodeblockHandler } from "./codeblockHandler/SqlSealCodeblockHandler"
import { SqlSealInlineHandler } from "./codeblockHandler/inline/InlineCodeHandler"
import { Settings } from "../settings/Settings"
import { ModernCellParser } from "../syntaxHighlight/cellParser/ModernCellParser"

export const editor = new Registrator()
    .import<'app', App>()
    .import<'db', Promise<SqlSealDatabase>>()
    .import<'plugin', Plugin>()
    .import<'sync', Promise<Sync>>()
    .import<'cellParser', Promise<ModernCellParser>>()
    .import<'settings', Promise<Settings>>()
    .register('inlineRenderer', d => d.cls(SqlSealInlineHandler).inject('app', 'db', 'settings', 'sync'))
    .register('rendererRegistry', d => d.cls(RendererRegistry).inject())
    .register('blockHandler', d => d.cls(SqlSealCodeblockHandler).inject('app', 'db', 'cellParser', 'sync', 'rendererRegistry', 'settings'))
    .register('init', d => d.fn(editorInit).inject('app', 'db', 'plugin', 'sync', 'inlineRenderer', 'blockHandler', 'rendererRegistry', 'settings'))
    .export('rendererRegistry', 'init')

export type EditorModule = typeof editor
