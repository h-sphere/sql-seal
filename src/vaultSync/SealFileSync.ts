import { App, Plugin, TFile } from "obsidian";
import { sanitise } from "../utils/sanitiseColumn";
import { AFileSyncTable } from "./tables/abstractFileSyncTable";

const extractFrontmatterFromFile = async (file: TFile, plugin: Plugin) => {
    const frontmatter = plugin.app.metadataCache.getFileCache(file)?.frontmatter || {}

    return Object.fromEntries(
        Object.entries(frontmatter)
            .map(([v, s]) => ([sanitise(v), s]))
    )
}

export class SealFileSync {
    private tablePlugins: Array<AFileSyncTable> = []
    constructor(
        public readonly app: App,
        private readonly plugin: Plugin,
    ) {
        plugin.registerEvent(this.app.vault.on('modify', async (file) => {
            if (!(file instanceof TFile)) {
                return
            }
            await sleep(100) // FIXME: check if this is actually needed.

            await Promise.all(this.tablePlugins.map(p => p.onFileModify(file)))

        }))

        plugin.registerEvent(this.app.vault.on('create', async (file) => {
            if (!(file instanceof TFile)) {
                return
            }
            await Promise.all(this.tablePlugins.map(p => p.onFileCreate(file)))

        }))
        
        plugin.registerEvent(this.app.vault.on('delete', async (file) => {
            if (!(file instanceof TFile)) {
                return
            }

            await Promise.all(this.tablePlugins.map(p => p.onFileDelete(file.path)))
        }))

        plugin.registerEvent(this.app.vault.on('rename', async (file, oldPath) => {
            if (!(file instanceof TFile)) {
                return
            }

            await Promise.all(this.tablePlugins.map(p => p.onFileDelete(oldPath)))

            await sleep(1000)
            await Promise.all(this.tablePlugins.map(p => p.onFileCreate(file)))
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

    addTablePlugin(tp: AFileSyncTable) {
        this.tablePlugins.push(tp);
    }

    async init() {
        const files = this.app.vault.getMarkdownFiles();

        await Promise.all(this.tablePlugins.map(p => p.onInit()))

        const bulkPlugins = this.tablePlugins.filter(p => p.shouldPerformBulkInsert)
        const nonBulkPlugins = this.tablePlugins.filter(p => !p.shouldPerformBulkInsert)

        // Think of adding PLIMIT HERE.
        await Promise.all(bulkPlugins.map(p => p.onFileCreateBulk(files)))
        await Promise.all(files.map(file =>
            Promise.all(nonBulkPlugins.map(p => p.onFileCreate(file))))
        )

    }
}