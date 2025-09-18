import { App, MarkdownPostProcessorContext } from "obsidian"
import { RendererRegistry } from "../renderer/rendererRegistry"
import { CodeblockProcessor } from "./CodeblockProcessor"
import { SqlSealDatabase } from "../../database/database"
import { Sync } from "../../sync/sync/sync"
import { Settings } from "../../settings/Settings"
import { ModernCellParser } from "../../syntaxHighlight/cellParser/ModernCellParser"

export class SqlSealCodeblockHandler {
    constructor(
        private readonly app: App,
        private readonly db: SqlSealDatabase,
        private readonly cellParser: ModernCellParser,
        private sync: Sync,
        private rendererRegistry: RendererRegistry,
        private settings: Settings
    ) {
    }

    getHandler() {
        return async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
            const processor = new CodeblockProcessor(
                el,
                source,
                ctx,
                this.rendererRegistry,
                this.db,
                this.cellParser,
                this.settings,
                this.app,
                this.sync
            )
            ctx.addChild(processor)
        }
    }
}