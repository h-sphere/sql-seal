import { SqlSealDatabase } from "./database";
import { App } from "obsidian";
import { SqlSealCodeblockHandler } from "./SqlSealCodeblockHandler";
import { Logger } from "./logger";
import { RendererRegistry } from "./rendererRegistry";
import { Sync } from "./datamodel/sync";

export class SqlSeal {
    public db: SqlSealDatabase
    public codeBlockHandler: SqlSealCodeblockHandler
    constructor(private readonly app: App, verbose = false, rendererRegistry: RendererRegistry) {
        this.db = new SqlSealDatabase(app, verbose)
        const logger = new Logger(verbose)

        const sync = new Sync(this.db, this.app.vault)
        sync.init()

        this.codeBlockHandler = new SqlSealCodeblockHandler(app, this.db, sync, rendererRegistry)
    }

    getHandler() {
        return this.codeBlockHandler.getHandler()
    }
}
