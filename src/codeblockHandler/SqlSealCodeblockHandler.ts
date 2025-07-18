import { App, MarkdownPostProcessorContext } from "obsidian"
import { RendererRegistry } from "../renderer/rendererRegistry"
import { Sync } from "../modules/sync/sync/sync"
import { CodeblockProcessor } from "./CodeblockProcessor"
import { makeInjector } from "@hypersphere/dity"
import { ModernCellParser } from "../cellParser/ModernCellParser"
import { EditorModule } from "../modules/editor/module"
import { SqlSealDatabase } from "../modules/database/database"

@(makeInjector<EditorModule>()(
    ['app', 'db', 'cellParser', 'sync', 'rendererRegistry']
))
export class SqlSealCodeblockHandler {
    constructor(
        private readonly app: App,
        private readonly db: SqlSealDatabase,
        private readonly cellParser: ModernCellParser,
        private sync: Sync,
        private rendererRegistry: RendererRegistry
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
                this.app,
                this.sync
            )
            ctx.addChild(processor)
        }
    }
}