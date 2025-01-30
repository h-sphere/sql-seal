import { SqlSealDatabase } from "./database/database";
import { App, Plugin } from "obsidian";
import { SqlSealCodeblockHandler } from "./codeblockHandler/SqlSealCodeblockHandler";
import { Logger } from "./utils/logger";
import { RendererRegistry } from "./renderer/rendererRegistry";
import { Sync } from "./datamodel/sync";
import { SqlSealInlineHandler } from "./codeblockHandler/inline/InlineCodeHandler";
import { SealFileSync } from "./vaultSync/SealFileSync";
import { FilesFileSyncTable } from "./vaultSync/tables/filesTable";
import { TagsFileSyncTable } from "./vaultSync/tables/tagsTable";
import { TasksFileSyncTable } from "./vaultSync/tables/tasksTable";
import { LinksFileSyncTable } from "./vaultSync/tables/linksTable";
import SqlSealPlugin from "./main";

export class SqlSeal {
    public db: SqlSealDatabase
    private codeBlockHandler: SqlSealCodeblockHandler
    private inlineCodeBlock: SqlSealInlineHandler
    public sync: Sync
    public fileSync: SealFileSync
    constructor(private readonly app: App, verbose = false, rendererRegistry: RendererRegistry, plugin: SqlSealPlugin) {
        this.db = new SqlSealDatabase(app, verbose)
        const logger = new Logger(verbose)

        this.sync = new Sync(this.db, this.app.vault, this.app)
        this.sync.init()

        this.codeBlockHandler = new SqlSealCodeblockHandler(app, this.db, plugin, this.sync, rendererRegistry)
        this.inlineCodeBlock = new SqlSealInlineHandler(app, this.db, plugin, this.sync)
    }

    getHandler() {
        return this.codeBlockHandler.getHandler()
    }

    getInlineHandler() {
        return this.inlineCodeBlock.getHandler()
    }

    async startFileSync(plugin: Plugin) {
        this.fileSync = new SealFileSync(this.app, plugin, (name) => this.sync.triggerGlobalTableChange(name))

        this.fileSync.addTablePlugin(new FilesFileSyncTable(this.db, this.app, plugin))
        this.fileSync.addTablePlugin(new TagsFileSyncTable(this.db, this.app))
        this.fileSync.addTablePlugin(new TasksFileSyncTable(this.db, this.app))
        this.fileSync.addTablePlugin(new LinksFileSyncTable(this.db, this.app))

        await this.fileSync.init()
    }
}
