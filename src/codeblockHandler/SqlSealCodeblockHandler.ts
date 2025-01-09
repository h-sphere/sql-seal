import { App, MarkdownPostProcessorContext } from "obsidian"
import { SqlSealDatabase } from "../database/database"
import { RendererRegistry } from "../renderer/rendererRegistry"
import { Sync } from "../datamodel/sync"
import { CodeblockProcessor } from "./CodeblockProcessor"


export class SqlSealCodeblockHandler {
    constructor(
        private readonly app: App,
        private readonly db: SqlSealDatabase,
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
                this.app,
                this.sync
            )
            ctx.addChild(processor)
        }
    }
}