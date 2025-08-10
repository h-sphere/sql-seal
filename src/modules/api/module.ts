import { asFactory, buildContainer } from "@hypersphere/dity";
import { ApiInit } from "./init";
import { Plugin } from "obsidian";
import { SqlSealDatabase } from "../database/database";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";
import { ModernCellParser } from "../syntaxHighlight/cellParser/ModernCellParser";

export const apiModule = buildContainer(c => c
    .register({
        init: asFactory(ApiInit)
    })
    .exports('init')
    .externals<{
        plugin: Plugin,
        cellParser: ModernCellParser,
        db: SqlSealDatabase,
        rendererRegistry: RendererRegistry
    }>()
)

export type ApiModule = typeof apiModule