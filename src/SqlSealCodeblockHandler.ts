import { App, MarkdownPostProcessorContext } from "obsidian"
import { displayData } from "./ui"
import { resolveFrontmatter } from "./frontmatter"
import { hashString } from "./hash"
import { prefixedIfNotGlobal, updateTables } from "./sqlReparseTables"
import { SqlSealDatabase } from "./database"
import { Logger } from "./logger"
import { parseLanguage, TableStatement } from "./grammar/parser"
import { SyncModel } from "./models/sync"
import { TablesManager } from "./dataLoader/collections/tablesManager"
import { QueryManager } from "./dataLoader/collections/queryManager"

export class SqlSealCodeblockHandler {
    get globalTables() {
        return ['files', 'tags']
    }
    syncModel: SyncModel
    constructor(
        private readonly app: App,
        private readonly db: SqlSealDatabase,
        private logger: Logger,
        private tableManager: TablesManager,
        private queryManager: QueryManager
    ) {
        this.syncModel = new SyncModel(db)
    }

    setupTableSignals(tables: Array<TableStatement>) {
        tables.forEach(t => {
            this.logger.log(`Registering table ${t.name} -> ${t.url}`)
            this.tableManager.registerTable(t.name, t.url)
        })
    }

    setupQuerySignals({ statement, tables }: ReturnType<typeof updateTables>, { api, errorApi }: ReturnType<typeof displayData>, ctx: MarkdownPostProcessorContext) {
        const frontmatter = resolveFrontmatter(ctx, this.app)
        const renderSelect = async () => {
            try {
                const stmt = this.db.db.prepare(statement)
                const columns = stmt.columns().map(column => column.name);
                const data = stmt.all(frontmatter ?? {})

                api.setGridOption('columnDefs', columns.map(c => ({ field: c })))
                api.setGridOption('rowData', data)
                api.setGridOption('loading', false)
                errorApi.hide()
            } catch (e) {
                errorApi.show(e.toString())
            }
        }


        const sig = this.queryManager.registerQuery(ctx.docId, tables)
        sig(() => {
            renderSelect()
        })
    }

    getHandler() {
        return async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
            const prefix = hashString(ctx.sourcePath)
            const { api, errorApi} = displayData(el, [], [], this.app, prefix)
            api.setGridOption('loading', true)
            await this.db.connect()

            try {
                const results = parseLanguage(source)


                const prefixedTables = results.tables.map(t => {
                    return {
                        ...t,
                        name: prefixedIfNotGlobal(t.name, this.globalTables, prefix)
                    }
                })

                this.setupTableSignals(prefixedTables)

                if (results.queryPart) {
                    const { statement, tables } = updateTables(results.queryPart!, [...this.globalTables], prefix)
                    this.setupQuerySignals({ statement, tables }, { api, errorApi }, ctx)
                }
            } catch (e) {
                errorApi.show(e.toString())
            }

        }
    }
}