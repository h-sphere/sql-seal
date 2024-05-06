import GrayMatter from "gray-matter";
import { SqlSealDatabase } from "./database";
import { displayData, displayError, displayInfo, displayLoader } from "./ui";
import { App, MarkdownPostProcessorContext } from "obsidian";
import { updateTables } from "./sqlReparseTables";
import { hashString } from "./hash";
import { SealObserver } from "./SealObserver";
import { delay } from "./utils";

export class SqlSeal {
    public db: SqlSealDatabase
    private observer: SealObserver
    constructor(private readonly app: App, verbose = false) {
        this.db = new SqlSealDatabase(app, verbose)
        this.observer = new SealObserver(verbose)
        this.observeAllFileChanges()
    }

    async connect() {
        await this.db.connect()
    }

    async resolveFrontmatter(ctx: MarkdownPostProcessorContext) {
        if (ctx.frontmatter && Object.keys(ctx.frontmatter).length > 0) {
            return ctx.frontmatter as Record<string, any>
        }
        const file = this.app.vault.getFileByPath(ctx.sourcePath)
        if (!file) {
            return null
        }
        const data = await this.app.vault.cachedRead(file)

        const gm = GrayMatter(data)
        const frontmatter = gm.data
        return frontmatter
    }


    private observeAllFileChanges() {
        // Use fs to observe file changes
        this.app.vault.on('modify', async (file) => {
            console.log('Firing observers for file:', file.path)
            this.observer.fireObservers('file:' + file.path)
        })
    }

    getHandler() {
        return async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {

            displayLoader(el)
            await this.connect()

            const frontmatter = await this.resolveFrontmatter(ctx)
            const prefix = hashString(ctx.sourcePath)
    const regex = /TABLE\s+(.+)\s+=\s+file\(([^)]+)\)/g;
    let match
    while ((match = regex.exec(source)) !== null) {
        const name = match[1];
        const url = match[2];
        const prefixedName = await this.db.defineDatabaseFromUrl(name, url, prefix)
        this.observer.registerObserver(`file:${url}`, async () => {
            console.log('File was changes and we need to update related table: ', name)
            // Update table
            await this.db.defineDatabaseFromUrl(name, url, prefix, true)

            // Fire observers for the table
            this.observer.fireObservers(`table:${prefixedName}`)
        }, ctx.docId)
    }

    const selectRegexp = /SELECT\s+(.*)/g;
    const selectMatch = selectRegexp.exec(source)
    if (selectMatch) {
        try {
            const selectStatement = selectMatch[0]
            const { statement, tables } = updateTables(selectStatement, ['files'], prefix)


            const renderSelect = async () => {
                const stmt = await this.db.db.prepare(statement)
                const columns = await stmt.columns().map(column => column.name);
                const data = await stmt.all(frontmatter)
                displayData(el, columns, data)
            }

            // Register observer for each table
            tables.forEach(table => {
                const observer = async () => {
                    console.log('Table was changes and we need to update related select: ', table)

                    // FIXME: check if element is still in the DOM.
                    console.log(el, el.isShown(), el.isConnected)

                    if (!el.isConnected) {
                        // Unregistering using the context id
                        this.observer.unregisterObserversByTag(ctx.docId)
                    }


                    displayLoader(el)
                    // await delay(1000)

                    await renderSelect()
                }
                this.observer.registerObserver(`table:${table}`, observer, ctx.docId)
            })

            await renderSelect()

        } catch (e) {
            if (e instanceof RangeError && Object.keys(ctx.frontmatter).length === 0) {
                displayInfo(el, 'Cannot access frontmatter properties in Live Preview Mode. Switch to Reading Mode to see the results.')
            } else {
                displayError(el, e)
                console.log(e)
            }
        }
    }
        }
    }
}
