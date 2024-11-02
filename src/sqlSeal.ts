import { SqlSealDatabase } from "./database";
import { App } from "obsidian";
import { SealObserver } from "./SealObserver";
import { SqlSealCodeblockHandler } from "./SqlSealCodeblockHandler";
import { Logger } from "./logger";
import { TablesManager } from "./dataLoader/collections/tablesManager";
import { QueryManager } from "./dataLoader/collections/queryManager";
import { FilesManager } from "./dataLoader/collections/filesManager";

export class SqlSeal {
    public db: SqlSealDatabase
    public observer: SealObserver
    public codeBlockHandler: SqlSealCodeblockHandler
    public tablesManager: TablesManager
    constructor(private readonly app: App, verbose = false) {
        this.db = new SqlSealDatabase(app, verbose)
        this.observer = new SealObserver(verbose)
        this.observeAllFileChanges()
        const logger = new Logger(verbose)

        const fileManager = new FilesManager(this.app.vault)
        this.tablesManager = new TablesManager(fileManager, this.db)
        const queryManager = new QueryManager(this.tablesManager)

        this.codeBlockHandler = new SqlSealCodeblockHandler(app, this.db, this.observer, logger, this.tablesManager, queryManager)
        // FIXME: handle here changes to files and tags?
    }

    getHandler() {
        return this.codeBlockHandler.getHandler()
    }

    private observeAllFileChanges() {
        // Use fs to observe file changes
        this.app.vault.on('modify', async (file) => {
            this.observer.fireObservers('file:' + file.path)
        })
    }
}
