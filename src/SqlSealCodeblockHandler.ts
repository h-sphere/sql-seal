import { App, MarkdownPostProcessorContext } from "obsidian"
import { displayData, displayError, displayInfo, displayLoader } from "./ui"
import { resolveFrontmatter } from "./frontmatter"
import { hashString } from "./hash"
import { prefixedIfNotGlobal, updateTables } from "./sqlReparseTables"
import { SealObserver } from "./SealObserver"
import { SqlSealDatabase } from "./database"
import { Logger } from "./logger"

export class SqlSealCodeblockHandler {
    get globalTables() {
        return ['files', 'tags']
    }
    constructor(private readonly app: App, private readonly db: SqlSealDatabase,private readonly observer: SealObserver, private logger: Logger) { }

    tablesConfig: Record<string, string> = {}

    getHandler() {
        return async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {

            displayLoader(el)
            await this.db.connect()
            this.observer.unregisterObserversByTag(ctx.docId) // Unregister all previous observers.

            const frontmatter = await resolveFrontmatter(ctx, this.app)
            const prefix = hashString(ctx.sourcePath)
    const regex = /TABLE\s+(.+)\s+=\s+file\(([^)]+)\)/g;
    let match
    while ((match = regex.exec(source)) !== null) {
        const name = match[1];
        const url = match[2];
        this.logger.log('CodedblockHandler. table', name, url)
        // UPDATING TABLES IF THEY CHANGED SINCE LAST REGISTER
        const prefixedName = prefixedIfNotGlobal(name, this.globalTables, prefix)
        if (this.tablesConfig[prefixedName] === url) {
            // We do not need to rework it. Also, it should be watched, right?
            // continue
        }

        if (!!this.tablesConfig[prefixedName]) {
            // We need to remove old database as it's pointing to the wrong collection (probably).
        }
        

        // FIXME: do not register observer when it's already been registed for this ctx.
        this.observer.registerObserver(`file:${url}`, async () => {
            // Update table
            await this.db.loadDataForDatabaseFromUrl(prefixedName, url, true)

            // Fire observers for the table
            this.observer.fireObservers(`table:${prefixedName}`)
        }, ctx.docId)
        if (this.tablesConfig[prefixedName] !== url) {
            this.observer.fireObservers(`file:${url}`)
            this.tablesConfig[prefixedName] = url
        } else {
            // We still need to update the table watchers?
            requestAnimationFrame(() => {
                this.observer.fireObservers(`table:${prefixedName}`)
            })
        }
    }

    const selectRegexp = /SELECT\s+(.*)/g; // OR WITH?
    const selectMatch = selectRegexp.exec(source)
    if (selectMatch) {
        try {
            // FIXME: WAIT FOR TABLES TO BE READDY!!!!
            const selectStatement = selectMatch[0]
            const { statement, tables } = updateTables(selectStatement, this.globalTables, prefix)

            const renderSelect = async () => {
                try {
                    const stmt = await this.db.db.prepare(statement)
                    const columns = await stmt.columns().map(column => column.name);
                    const data = await stmt.all(frontmatter ?? {})
                    displayData(el, columns, data)
                } catch (e) {
                    displayError(el, e)
                }
            }

            // Register observer for each table
            tables.forEach(table => {
                const observer = async () => {
                    if (!el.isConnected) {
                        // Unregistering using the context id
                        this.observer.unregisterObserversByTag(ctx.docId)
                    }


                    displayLoader(el)

                    await renderSelect()
                }
                this.observer.registerObserver(`table:${table}`, observer, ctx.docId)
            })

            this.globalTables.forEach(t => this.observer.fireObservers(`table:${t}`))

            // await renderSelect() <- this should get triggered automatically.

        } catch (e) {
            if (e instanceof RangeError && ctx && Object.keys(ctx.frontmatter).length === 0) {
                displayInfo(el, 'Cannot access frontmatter properties in Live Preview Mode. Switch to Reading Mode to see the results.')
            } else {
                displayError(el, e)
            }
        }
    }
        }
    }
}