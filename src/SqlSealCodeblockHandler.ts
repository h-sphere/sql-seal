import { App, MarkdownPostProcessorContext } from "obsidian"
import { displayData, displayError, displayNotice } from "./ui"
import { resolveFrontmatter } from "./frontmatter"
import { hashString } from "./hash"
import { prefixedIfNotGlobal, updateTables } from "./sqlReparseTables"
import { SqlSealDatabase } from "./database"
import { Logger } from "./logger"
import { SyncModel } from "./models/sync"
import { TablesManager } from "./dataLoader/collections/tablesManager"
import { QueryManager } from "./dataLoader/collections/queryManager"
import { parseLanguage, Table } from "./grammar/newParser"

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

    setupTableSignals(tables: Array<Table>) {
        tables.forEach(t => {
            this.logger.log(`Registering table ${t.tableName} -> ${t.fileName}`)
            this.tableManager.registerTable(t.tableName, t.fileName)
        })
    }

    setupQuerySignals({ statement, tables }: ReturnType<typeof updateTables>, { api, errorApi }: ReturnType<typeof displayData>, ctx: MarkdownPostProcessorContext) {
        const frontmatter = resolveFrontmatter(ctx, this.app)
        const renderSelect = async () => {
            try {
                 const { data, columns } = this.db.select(statement, frontmatter ?? {})
                api.setGridOption('columnDefs', columns.map((c: any) => ({ field: c })))
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

            let api, errorApi, results;

            try {
                await this.db.connect()
                // Before we display data, we need to parse query to see if there is query part.
                results = parseLanguage(source)
                if (results.queryPart) {
                    const data = displayData(el, [], [], this.app, prefix)
                    api = data.api
                    errorApi = data.errorApi
                    api.setGridOption('loading', true)
                } else {
                    displayNotice(el, `Creating tables: ${results.tables.map(t => t.tableName).join(', ')}`)
                }

                const prefixedTables = results.tables.map(t => {
                    return {
                        ...t,
                        tableName: prefixedIfNotGlobal(t.tableName, this.globalTables, prefix)
                    }
                })

                this.setupTableSignals(prefixedTables)

            } catch (e) {
                displayError(el, e.toString())
                return
            }

            try {
                if (results.queryPart) {
                    const { statement, tables } = updateTables(results.queryPart!, [...this.globalTables], prefix)
                    this.setupQuerySignals({ statement, tables }, { api, errorApi: errorApi! }, ctx)
                }
            } catch (e) {
                errorApi!.show(e.toString())
            }

        }
    }
}