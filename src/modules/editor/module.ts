import { asClass, asFactory, buildContainer } from "@hypersphere/dity"
import { App, Plugin } from "obsidian"
import { SqlSealDatabase } from "../database/database"
import { Sync } from "../sync/sync/sync"
import { SqlSealCodeblockHandler } from "../../codeblockHandler/SqlSealCodeblockHandler"
import { SqlSealInlineHandler } from "../../codeblockHandler/inline/InlineCodeHandler"
import { RendererRegistry } from "../../renderer/rendererRegistry"
import { EditorInit } from "./init"
import { ModernCellParser } from "../../cellParser/ModernCellParser"

export const editor = buildContainer(c => c
    .register({
        blockHandler: asClass(SqlSealCodeblockHandler),
        inlineHandler: asClass(SqlSealInlineHandler),
        rendererRegistry: asClass(RendererRegistry),
        init: asFactory(EditorInit)
    })
    .externals<{
        app: App,
        db: SqlSealDatabase,
        plugin: Plugin,
        sync: Sync,
        cellParser: ModernCellParser
    }>()
)

export type EditorModule = typeof editor
