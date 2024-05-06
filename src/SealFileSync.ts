import { App, EventRef, Plugin, TAbstractFile, TFile } from "obsidian";
import GrayMatter from "gray-matter";
import { SqlSeal } from "./sqlSeal";
import { delay } from "./utils";



async function extractFrontmatterFromFile(file: TAbstractFile) {
    const content = await this.app.vault.read(file);
    const gm = GrayMatter(content)

    return gm.data
}

function fileData(file: TAbstractFile, frontmatter: Record<string, any>) {
    return {
        ...frontmatter,
        path: file.path,
        name: file.name.replace(/\.[^/.]+$/, ""),
        id: file.path
    }
}

export class SealFileSync {
    private currentSchema: Record<string, 'TEXT' | 'INTEGER' | 'REAL'> = {}
    private refs: Array<EventRef> = []
    constructor(public readonly app: App, private readonly sqlSeal: SqlSeal, private readonly plugin: Plugin) {
        this.refs.push(this.app.vault.on('modify', async (file) => {
            if (!(file instanceof TFile)) {
                return
            }
            console.log('Modified', file)
            const frontmatter = await extractFrontmatterFromFile(file)

            if (this.hasNewColumns(frontmatter)) {
                await delay(1000)
                await this.init()

                return
            }
            // we need to update the row
            await this.sqlSeal.db.updateData('files', [fileData(file, frontmatter)])
            await this.sqlSeal.db.deleteData('tags', [{ fileId: file.path }], 'fileId')

            this.sqlSeal.observer.fireObservers('table:files')


            // Wait 1 second before updating tags table
            await delay(1000)
            await this.sqlSeal.db.insertData('tags', await this.getFileTags(file))
            this.sqlSeal.observer.fireObservers('table:tags')
        }))

        this.refs.push(this.app.vault.on('create', async (file) => {
            if (!(file instanceof TFile)) {
                return
            }
            console.log('File created', file.path)
            const frontmatter = await extractFrontmatterFromFile(file)


            if (this.hasNewColumns(frontmatter)) {
                await delay(1000)
                await this.init()

                return
            }


            // we need to update the row
            await this.sqlSeal.db.insertData('files', [fileData(file, frontmatter)])
            this.sqlSeal.observer.fireObservers('table:files')

            // Wait 1 second before updating tags table
            await delay(1000)
            await this.sqlSeal.db.insertData('tags', await this.getFileTags(file))
            this.sqlSeal.observer.fireObservers('table:tags')
        }))
        
        this.refs.push(this.app.vault.on('delete', async (file) => {
            if (!(file instanceof TFile)) {
                return
            }

            console.log('File deleted', file.path)
            await this.sqlSeal.db.deleteData('files', [{ id: file.path }])
            this.sqlSeal.observer.fireObservers('table:files')

            await this.sqlSeal.db.deleteData('tags', [{ fileId: file.path }], 'fileId')
            this.sqlSeal.observer.fireObservers('table:tags')
        }))

        this.refs.push(this.app.vault.on('rename', async (file, oldPath) => {
            if (!(file instanceof TFile)) {
                return
            }

            console.log('File renamed', file.path)
            // deleting old one and adding new one
            await this.sqlSeal.db.deleteData('files', [{ id: oldPath }])

            // delete old tags
            await this.sqlSeal.db.deleteData('tags', [{ fileId: oldPath }], 'fileId')

            await this.sqlSeal.db.insertData('files', [fileData(file, await extractFrontmatterFromFile(file))])
            this.sqlSeal.observer.fireObservers('table:files')

            // Wait 1 second before updating tags table
            await delay(1000)
            await this.sqlSeal.db.insertData('tags', await this.getFileTags(file))
            this.sqlSeal.observer.fireObservers('table:tags')

        }))

        // add Obsidian command to reload SQLSeal file database
        this.plugin.addCommand({
            id: 'reload-sqlseal',
            name: 'Reload Vault Database',
            callback: async () => {
                await this.init()
            }
        })
    }

    destroy() {
        this.refs.forEach(ref => this.app.vault.offref(ref))
    }

    async getFileTags(file: TFile) {

        // Get fresh tag
        console.log('FILE', file)


        return (this.app.metadataCache.getFileCache(file)?.tags || [])
            .map(t => t.tag)
            .map(t => ({ tag: t, fileId: file.path }))
    }

    async init() {
        const files = this.app.vault.getMarkdownFiles();

        const data = []
        const tags: Array<{fileId: string, tag: string }> = []

        for (const file of files) {
            const frontmatter = await extractFrontmatterFromFile(file)
            tags.push(...await this.getFileTags(file))
            data.push(fileData(file, frontmatter))
        }

        const schema = await this.sqlSeal.db.createTableWithData('files', data)
        this.currentSchema = schema
        await this.sqlSeal.db.createTableWithData('tags', tags)
        this.sqlSeal.observer.fireObservers('table:files')
        this.sqlSeal.observer.fireObservers('table:tags')
    }

    hasNewColumns(newFrontmatter: Record<string, any>) {
        const currentFields = Object.keys(this.currentSchema)
        const newFields = Object.keys(newFrontmatter).filter(f => !currentFields.includes(f))

        console.log('current fields', currentFields, Object.keys(newFrontmatter))
        return newFields.length > 0
    }
}