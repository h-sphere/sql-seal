import { App, getAllTags, Plugin, TAbstractFile, TFile } from "obsidian";
import { AFileSyncTable } from "./abstractFileSyncTable";
import { sanitise } from "src/utils/sanitiseColumn";
import { SqlSealDatabase } from "src/database";
import { TablesManager } from "src/dataLoader/collections/tablesManager";
import { predictType } from "src/utils";


const extractFrontmatterFromFile = async (file: TFile, plugin: Plugin) => {
    const frontmatter = plugin.app.metadataCache.getFileCache(file)?.frontmatter || {}

    return Object.fromEntries(
        Object.entries(frontmatter)
            .map(([v, s]) => ([sanitise(v), s]))
    )
}

function fileData(file: TAbstractFile, {tags: _tags, ...frontmatter }: Record<string, any>) {
    return {
        ...frontmatter,
        path: file.path,
        name: file.name.replace(/\.[^/.]+$/, ""),
        id: file.path
    }
}

export class FilesFileSyncTable extends AFileSyncTable {
    private currentSchema: Record<string, ReturnType<typeof predictType>>
    shouldPerformBulkInsert = true;
    constructor(db: SqlSealDatabase, app: App, tableManager: TablesManager, private readonly plugin: Plugin) {
        super(db, app, tableManager)
    }
    async onFileModify(file: TFile): Promise<void> {
        // we need to update the row
        const frontmatter = await extractFrontmatterFromFile(file, this.plugin)
        await this.db.updateData('files', [fileData(file, frontmatter)])
        this.tableManager.getTableSignal('files')(Date.now())
        await sleep(1000) // TO DELAY OTHER PLUGINS, UGLY BUT WORKS.
    }
    async onFileDelete(path: string): Promise<void> {
        await this.db.deleteData('files', [{ id: path }])
        this.tableManager.getTableSignal('files')(Date.now())
    }

    async onFileCreate(file: TFile): Promise<void> {
        // we need to update the row
        const frontmatter = await extractFrontmatterFromFile(file, this.plugin)

        // TODO: Check if there are new columns. If there are, we update the database.

        await this.db.insertData('files', [fileData(file, frontmatter)])
        this.tableManager.getTableSignal('files')(Date.now())

        // FIXME: should we be waiting here?
        await sleep(1000)
    }

    async onFileCreateBulk(files: Array<TFile>) {
        // FIXME: implement this one and replace the other implementation.
        const data = await Promise.all(files.map(async f => fileData(f, await extractFrontmatterFromFile(f, this.plugin))))
        const schema = await this.db.createTableWithData('files', data)
        this.currentSchema = schema
        this.tableManager.getTableSignal('files')(Date.now())
    }


    async onInit(): Promise<void> {
    }
}