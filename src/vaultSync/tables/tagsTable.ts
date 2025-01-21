import { getAllTags, TFile } from "obsidian";
import { AFileSyncTable } from "./abstractFileSyncTable";

export class TagsFileSyncTable extends AFileSyncTable {
    async onFileModify(file: TFile): Promise<void> {
        await this.onFileDelete(file.path)
        await this.onFileCreate(file)
    }
    async onFileDelete(path: string): Promise<void> {
        await this.db.deleteData('tags', [{ fileId: path }], 'fileId')
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
            fileId: file.path
        }))
    }


    async onInit(): Promise<void> {
        await this.db.createTableNoTypes('tags', ['tag', 'fileId'])
    }
}