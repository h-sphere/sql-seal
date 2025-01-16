import { App, MarkdownPostProcessorContext } from "obsidian";
import { InlineProcessor } from "./InlineProcessor";
import { SqlSealDatabase } from "src/database/database";
import { Sync } from "src/datamodel/sync";

export class SqlSealInlineHandler {
    constructor(
        private readonly app: App,
        private readonly db: SqlSealDatabase,
        private sync: Sync
    ) { }

    getHandler() {
        return async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
            ctx.addChild(this.instantiateProcessor(source, el, ctx.sourcePath));
        };
    }

    instantiateProcessor(source: string, el: HTMLElement, sourcePath: string) {
        const query = source.replace(/^S>\s*/, "").trim();
        const processor = new InlineProcessor(
            el,
            query,
            sourcePath,
            this.db,
            this.app,
            this.sync
        );

        return processor
    }
}