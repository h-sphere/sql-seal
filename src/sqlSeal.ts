import { SqlSealDatabase } from "./database/database";
import { App } from "obsidian";
import { SqlSealCodeblockHandler } from "./codeblockHandler/SqlSealCodeblockHandler";
import { Logger } from "./utils/logger";
import { RendererRegistry } from "./renderer/rendererRegistry";
import { Sync } from "./datamodel/sync";
import { SqlSealInlineHandler } from "./codeblockHandler/inline/InlineCodeHandler";

export class SqlSeal {
    public db: SqlSealDatabase
    private codeBlockHandler: SqlSealCodeblockHandler
    private inlineCodeBlock: SqlSealInlineHandler
    public sync: Sync
    constructor(private readonly app: App, verbose = false, rendererRegistry: RendererRegistry) {
        this.db = new SqlSealDatabase(app, verbose)
        const logger = new Logger(verbose)

        this.sync = new Sync(this.db, this.app.vault)
        this.sync.init()

        this.codeBlockHandler = new SqlSealCodeblockHandler(app, this.db, this.sync, rendererRegistry)
        this.inlineCodeBlock = new SqlSealInlineHandler(app, this.db, this.sync)
    }

    getHandler() {
        return this.codeBlockHandler.getHandler()
    }

    getInlineHandler() {
        return this.inlineCodeBlock.getHandler()
    }
}
