import { App, MarkdownPostProcessorContext } from "obsidian"
import { displayData, displayError, displayInfo, displayLoader } from "./ui"
import { resolveFrontmatter } from "./frontmatter"
import { hashString } from "./hash"
import { prefixedIfNotGlobal, updateTables } from "./sqlReparseTables"
import { SealObserver } from "./SealObserver"
import { SqlSealDatabase } from "./database"
import { Logger } from "./logger"
import { ParsedLanguage, parseLanguage, TableStatement } from "./grammar/parser"
import { SyncModel } from "./models/sync"


export class SqlSealCodeblockHandler {
    get globalTables() {
        return ['files', 'tags']
    }
    syncModel: SyncModel
    constructor(private readonly app: App, private readonly db: SqlSealDatabase,private readonly observer: SealObserver, private logger: Logger) {
        this.syncModel = new SyncModel(db)
    }

    setupTables(tables: ParsedLanguage['tables'], ctx: MarkdownPostProcessorContext) {
        tables.forEach(table => {
            this.setupTable(table, ctx)
        })
    }

    setupTable({ url, name }: TableStatement, ctx: MarkdownPostProcessorContext) {
        // UPDATING TABLES IF THEY CHANGED SINCE LAST REGISTER
        const prefix = hashString(ctx.sourcePath)
        const prefixedName = prefixedIfNotGlobal(name, this.globalTables, prefix)

        const existing = this.syncModel.getSync(ctx.sourcePath, prefixedName)

        this.observer.registerObserver(`file:${url}`, async () => {
            // Update table
            await this.db.loadDataForDatabaseFromUrl(prefixedName, url, true)

            // update when it was updated.
            this.syncModel.removeSync(ctx.sourcePath, prefixedName)
            this.syncModel.registerSync(ctx.sourcePath, url, prefixedName)

            // Fire observers for the table
            this.observer.fireObservers(`table:${prefixedName}`)
        }, ctx.docId)

        if (existing) {

            if (existing.url === url) {
                // Already synced
                // TODO: Check if the file was updated after we synced, if so, we should update it.
                requestAnimationFrame(() => {
                    this.observer.fireObservers(`table:${prefixedName}`)
                })
                return
            } else {
                // Old database is no-no. We need to update it.
                this.db.db.prepare('DROP TABLE :tablename').run({
                    tablename: prefixedName
                })
                this.syncModel.removeSync(ctx.sourcePath, prefixedName)
            }
        }
        this.observer.fireObservers(`file:${url}`)
    }

    setupSelect(selectStmt: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        try {
        const prefix = hashString(ctx.sourcePath)
            const { statement, tables } = updateTables(selectStmt, this.globalTables, prefix)
            const frontmatter = resolveFrontmatter(ctx, this.app)

            const renderSelect = async () => {
                try {
                    const stmt = this.db.db.prepare(statement)
                    const columns = stmt.columns().map(column => column.name);
                    const data = stmt.all(frontmatter ?? {})
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
            if (!this.observer.hasAnyObserver(this.globalTables.map(t => `table:${t}`))) {
                renderSelect()
            }
            // Triggering the ones which exist
            tables.forEach(t => {
                if (this.syncModel.getSync(ctx.sourcePath, t)) {
                    this.observer.fireObservers(`table:${t}`)
                }
            })
        } catch (e) {
            if (e instanceof RangeError && ctx && Object.keys(ctx.frontmatter).length === 0) {
                displayInfo(el, 'Cannot access frontmatter properties in Live Preview Mode. Switch to Reading Mode to see the results.')
            } else {
                displayError(el, e)
            }
        }
    }

    getHandler() {
        return async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {

            displayLoader(el)
            await this.db.connect()
            this.observer.unregisterObserversByTag(ctx.docId) // Unregister all previous observers.

            // NEW PARSING
            try {
            const results = parseLanguage(source)

            // FIXME: if not properly parsed, we should display error.

            this.setupTables(results.tables, ctx)
            results.queryPart ? this.setupSelect(results.queryPart, el, ctx) : displayInfo(el, `SQLSeal. ${results.tables.map(t => `${t.name} table definition.`).join(' ')}`)

            } catch (e) {
                displayError(el, e.toString())
            }

        }
    }
}