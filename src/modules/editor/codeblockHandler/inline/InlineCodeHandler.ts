import { App, MarkdownPostProcessorContext, Plugin } from "obsidian";
import { InlineProcessor } from "./InlineProcessor";
import { SqlSealDatabase } from "../../../database/database";
import { Sync } from "../../../sync/sync/sync";
import { Settings } from "../../../settings/Settings";


export class SqlSealInlineHandler {
    constructor(
        private readonly app: App,
        private readonly db: SqlSealDatabase,
        private readonly settings: Settings,
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
            this.settings,
            this.app,
            this.sync
        );

        return processor
    }
}