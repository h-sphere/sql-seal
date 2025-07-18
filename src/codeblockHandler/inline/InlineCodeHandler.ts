import { App, MarkdownPostProcessorContext, Plugin } from "obsidian";
import { InlineProcessor } from "./InlineProcessor";
import { Sync } from "../../modules/sync/sync/sync";
import SqlSealPlugin from "../../main";
import { makeInjector } from "@hypersphere/dity";
import { SqlSealDatabase } from "../../modules/database/database";
import { EditorModule } from "../../modules/editor/module";


@(makeInjector<EditorModule>()(
    ['app', 'db', 'plugin', 'sync', 'rendererRegistry']
))
export class SqlSealInlineHandler {
    constructor(
        private readonly app: App,
        private readonly db: SqlSealDatabase,
        private readonly plugin: Plugin,
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