import { App, Plugin, TFile } from "obsidian";
import { AFileSyncTable } from "./abstractFileSyncTable";
import { sanitise } from "../../utils/sanitiseColumn";
import { SqlSealDatabase } from "../../database/database";
import { difference } from "lodash";


export const FILES_TABLE_NAME = 'files'


const extractFrontmatterFromFile = (file: TFile, plugin: Plugin): Record<string, unknown> => {
    const frontmatter = plugin.app.metadataCache.getFileCache(file)?.frontmatter || {}

    return Object.fromEntries(
        Object.entries(frontmatter)
            .map(([v, s]) => ([sanitise(v), s]))
    )
}

function fileData(file: TFile, { ...frontmatter }: Record<string, any>) {
    return {
        ...frontmatter,
        id: file.path,
        path: file.path,
        name: file.basename,
        created_at: (new Date(file.stat.ctime)).toISOString(),
        modified_at: (new Date(file.stat.mtime)).toISOString(),
        file_size: file.stat.size
    }
}

export class FilesFileSyncTable extends AFileSyncTable {
    get tableName() {
        return FILES_TABLE_NAME
    }
    private columns: string[] = []
    shouldPerformBulkInsert = true;
    constructor(db: SqlSealDatabase, app: App, private readonly plugin: Plugin) {
        super(db, app)
    }
    async onFileModify(file: TFile): Promise<void> {
        // we need to update the row
        const frontmatter = extractFrontmatterFromFile(file, this.plugin)
        const frontmatterWithFileData = fileData(file, frontmatter)
        const columns = Object.keys(frontmatterWithFileData)
        await this.updateColumnsIfNeeded(columns)

        await this.db.updateData(FILES_TABLE_NAME, [frontmatterWithFileData])
        await sleep(1000) // TO DELAY OTHER PLUGINS, UGLY BUT WORKS.
    }
    async onFileDelete(path: string): Promise<void> {
        await this.db.deleteData(FILES_TABLE_NAME, [{ id: path }])
    }

    async updateColumnsIfNeeded(newSetOfColumns: string[]) {
        const newColumns = difference(newSetOfColumns, this.columns)
        if (newColumns.length) {
            await this.db.addColumns(FILES_TABLE_NAME, newColumns)
            this.columns = await this.db.getColumns(FILES_TABLE_NAME)
        }
    }

    async onFileCreate(file: TFile): Promise<void> {
        const frontmatter = extractFrontmatterFromFile(file, this.plugin)
        const frontmatterWithFileData = fileData(file, frontmatter)
        const columns = Object.keys(frontmatterWithFileData)
        await this.updateColumnsIfNeeded(columns)
        
        await this.db.insertData(FILES_TABLE_NAME, [frontmatterWithFileData])
    }

    async onFileCreateBulk(files: Array<TFile>) {
        this.columns = await this.db.getColumns(FILES_TABLE_NAME)

        // One by one
        for (const file of files) {
            await this.onFileCreate(file)
        }
    }


    async onInit(): Promise<void> {
        this.db.createTableNoTypes(FILES_TABLE_NAME, ['id', 'name', 'path', 'created_at', 'modified_at', 'file_size'])
        this.columns = await this.db.getColumns(FILES_TABLE_NAME)

        // Indexes
        const toIndex = ['id', 'name', 'path']
        await Promise.all(toIndex.map(column =>
            this.db.createIndex(`files_${column}_idx`, FILES_TABLE_NAME, [column])
        ))
    }
}
