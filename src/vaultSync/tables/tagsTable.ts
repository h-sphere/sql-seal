import { getAllTags, TFile } from "obsidian";
import { AFileSyncTable } from "./abstractFileSyncTable";

export class TagsFileSyncTable extends AFileSyncTable {
    get tableName() {
        return 'tags'
    }
    async onFileModify(file: TFile): Promise<void> {
        await this.onFileDelete(file.path)
        await this.onFileCreate(file)
    }
    async onFileDelete(path: string): Promise<void> {
        await this.db.deleteData('tags', [{ path }], 'path')
    }

    async onFileCreate(file: TFile): Promise<void> {
        const tags = await this.getFileTags(file)
        this.db.insertData('tags', tags)
    }

    private async getFileTags(file: TFile) {
        const cache = this.app.metadataCache.getFileCache(file)
        if (!cache) {
            return []
        }
        const tags = getAllTags(cache)
        if (!tags) {
            return []
        }
        return tags.map((t) => ({
            tag: t,
            fileId: file.path,
            path: file.path
        }))
    }


    async onInit(): Promise<void> {
        await this.db.createTableNoTypes('tags', ['tag', 'fileId', 'path'])
         // Indexes
         const toIndex = ['tag', 'fileId', 'path']
         await Promise.all(toIndex.map(column =>
             this.db.createIndex(`tags_${column}_idx`, this.tableName, [column])
         ))
    }
}