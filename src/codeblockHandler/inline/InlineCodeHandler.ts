import { App, MarkdownPostProcessorContext } from "obsidian";
import { InlineProcessor } from "./InlineProcessor";
import { SqlSealDatabase } from "../../database/database";
import { Sync } from "../../datamodel/sync";
import SqlSealPlugin from "../../main";

export class SqlSealInlineHandler {
    constructor(
        private readonly app: App,
        private readonly db: SqlSealDatabase,
        private readonly plugin: SqlSealPlugin,
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
            this.plugin,
            this.app,
            this.sync
        );

        return processor
    }
}