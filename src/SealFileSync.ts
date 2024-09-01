import { App, EventRef, Plugin, TAbstractFile, TFile } from "obsidian";
import { SqlSeal } from "./sqlSeal";
import { FieldTypes } from "./utils";

function fileData(file: TAbstractFile, frontmatter: Record<string, any>) {
    return {
        ...frontmatter,
        path: file.path,
        name: file.name.replace(/\.[^/.]+$/, ""),
        id: file.path
    }
}

const extractFrontmatterFromFile = async (file: TFile, plugin: Plugin) => {
    return plugin.app.metadataCache.getFileCache(file)?.frontmatter || {}
}

export class SealFileSync {
    private currentSchema: Record<string, FieldTypes> = {}
    constructor(public readonly app: App, private readonly sqlSeal: SqlSeal, private readonly plugin: Plugin) {
        plugin.registerEvent(this.app.vault.on('modify', async (file) => {
            if (!(file instanceof TFile)) {
                return
            }
            const frontmatter = extractFrontmatterFromFile(file, plugin)

            if (this.hasNewColumns(frontmatter)) {
                await sleep(1000)
                await this.init()

                return
            }
            // we need to update the row
            await this.sqlSeal.db.updateData('files', [fileData(file, frontmatter)])
            await this.sqlSeal.db.deleteData('tags', [{ fileId: file.path }], 'fileId')

            this.sqlSeal.observer.fireObservers('table:files')


            // Wait 1 second before updating tags table
            await sleep(1000)
            await this.sqlSeal.db.insertData('tags', await this.getFileTags(file))
            this.sqlSeal.observer.fireObservers('table:tags')
        }))

        plugin.registerEvent(this.app.vault.on('create', async (file) => {
            if (!(file instanceof TFile)) {
                return
            }
            const frontmatter = await extractFrontmatterFromFile(file, plugin)


            if (this.hasNewColumns(frontmatter)) {
                await sleep(1000)
                await this.init()

                return
            }


            // we need to update the row
            await this.sqlSeal.db.insertData('files', [fileData(file, frontmatter)])
            this.sqlSeal.observer.fireObservers('table:files')

            // Wait 1 second before updating tags table
            await sleep(1000)
            await this.sqlSeal.db.insertData('tags', await this.getFileTags(file))
            this.sqlSeal.observer.fireObservers('table:tags')
        }))
        
        plugin.registerEvent(this.app.vault.on('delete', async (file) => {
            if (!(file instanceof TFile)) {
                return
            }

            await this.sqlSeal.db.deleteData('files', [{ id: file.path }])
            this.sqlSeal.observer.fireObservers('table:files')

            await this.sqlSeal.db.deleteData('tags', [{ fileId: file.path }], 'fileId')
            this.sqlSeal.observer.fireObservers('table:tags')
        }))

        plugin.registerEvent(this.app.vault.on('rename', async (file, oldPath) => {
            if (!(file instanceof TFile)) {
                return
            }

            // deleting old one and adding new one
            await this.sqlSeal.db.deleteData('files', [{ id: oldPath }])

            // delete old tags
            await this.sqlSeal.db.deleteData('tags', [{ fileId: oldPath }], 'fileId')

            await this.sqlSeal.db.insertData('files', [fileData(file, await extractFrontmatterFromFile(file, this.plugin))])
            this.sqlSeal.observer.fireObservers('table:files')

            // Wait 1 second before updating tags table
            await sleep(1000)
            await this.sqlSeal.db.insertData('tags', await this.getFileTags(file))
            this.sqlSeal.observer.fireObservers('table:tags')

        }))

        // add Obsidian command to reload SQLSeal file database
        this.plugin.addCommand({
            id: 'reload-sqlseal',
            name: 'Reload vault database',
            callback: async () => {
                await this.init()
            }
        })
    }

    async getFileTags(file: TFile) {
        return (this.app.metadataCache.getFileCache(file)?.tags || [])
            .map(t => t.tag)
            .map(t => ({ tag: t, fileId: file.path }))
    }

    async init() {
        const files = this.app.vault.getMarkdownFiles();

        const data = []
        const tags: Array<{fileId: string, tag: string }> = []

        for (const file of files) {
            const frontmatter = await extractFrontmatterFromFile(file, this.plugin)
            tags.push(...await this.getFileTags(file))
            data.push(fileData(file, frontmatter))
        }

        const schema = await this.sqlSeal.db.createTableWithData('files', data)
        this.currentSchema = schema
        if (tags && tags.length) {
            await this.sqlSeal.db.createTableWithData('tags', tags)
        } else {
            await this.sqlSeal.db.createTable('tags', {
                'tag': 'TEXT',
                'fileId': 'TEXT'
            })
        }
        this.sqlSeal.observer.fireObservers('table:files')
        this.sqlSeal.observer.fireObservers('table:tags')
    }

    hasNewColumns(newFrontmatter: Record<string, any>) {
        const currentFields = Object.keys(this.currentSchema)
        const newFields = Object.keys(newFrontmatter).filter(f => !currentFields.includes(f))

        return newFields.length > 0
    }
}