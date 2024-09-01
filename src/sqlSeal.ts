import { SqlSealDatabase } from "./database";
import { App } from "obsidian";
import { SealObserver } from "./SealObserver";
import { SqlSealCodeblockHandler } from "./SqlSealCodeblockHandler";

export class SqlSeal {
    public db: SqlSealDatabase
    public observer: SealObserver
    public codeBlockHandler: SqlSealCodeblockHandler
    constructor(private readonly app: App, verbose = false) {
        this.db = new SqlSealDatabase(app, verbose)
        this.observer = new SealObserver(verbose)
        this.observeAllFileChanges()
        this.codeBlockHandler = new SqlSealCodeblockHandler(app, this.db, this.observer)
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
