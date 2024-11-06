import { SqlSealDatabase } from "./database";
import { App } from "obsidian";
import { SqlSealCodeblockHandler } from "./SqlSealCodeblockHandler";
import { Logger } from "./logger";
import { TablesManager } from "./dataLoader/collections/tablesManager";
import { QueryManager } from "./dataLoader/collections/queryManager";
import { FilesManager } from "./dataLoader/collections/filesManager";

export class SqlSeal {
    public db: SqlSealDatabase
    public codeBlockHandler: SqlSealCodeblockHandler
    public tablesManager: TablesManager
    constructor(private readonly app: App, verbose = false) {
        this.db = new SqlSealDatabase(app, verbose)
        const logger = new Logger(verbose)

        const fileManager = new FilesManager(this.app.vault)
        this.tablesManager = new TablesManager(fileManager, this.db)
        this.tablesManager.getTableSignal('files')
        this.tablesManager.getTableSignal('tags')
        const queryManager = new QueryManager(this.tablesManager)

        this.codeBlockHandler = new SqlSealCodeblockHandler(app, this.db, logger, this.tablesManager, queryManager)
        // FIXME: handle here changes to files and tags?
    }

    getHandler() {
        return this.codeBlockHandler.getHandler()
    }
}
