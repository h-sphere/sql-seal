import { TFile } from "obsidian";
import { AFileSyncTable } from "./abstractFileSyncTable";

export class LinksFileSyncTable extends AFileSyncTable {
    get tableName() {
        return 'links'
    }
    async onFileModify(file: TFile): Promise<void> {
        await this.onFileDelete(file.path)
        await this.onFileCreate(file)
    }
    async onFileDelete(path: string): Promise<void> {
        await this.db.deleteData(this.tableName, [{ path: path }], 'path')
    }

    async onFileCreate(file: TFile): Promise<void> {
        const links = await this.getFileLinks(file)
        if (!links.length) {
            return
        }
        this.db.insertData(this.tableName, links)
    }

    private async getFileLinks(file: TFile) {
        const cache = this.app.metadataCache.getFileCache(file)
        if (!cache) {
            return []
        }
        const tags = (cache.links || []).concat(cache.frontmatterLinks || []);
        return tags.map((t) => {
            const targetFile = this.app.metadataCache.getFirstLinkpathDest(t.link, file.path)
            let targetExists = false
            let target = t.link
            if (targetFile) {
                target = targetFile.path
                targetExists = true
            }
            let position = t.position;
            if (t.key) {
                position = {
                    frontmatterKey: t.key
                }
            }
            return {
                path: file.path,
                target: target,
                position: position,
                display_text: t.displayText,
                target_exists: targetExists
            }
        })
    }


    async onInit(): Promise<void> {
        await this.db.createTableNoTypes(this.tableName, ['path', 'target', 'position', 'display_text', 'target_exists'])


        // Indexes
        const toIndex = ['path', 'target']
        await Promise.all(toIndex.map(column =>
            this.db.createIndex(`links_${column}_idx`, this.tableName, [column])
        ))
    }
}
