import { App, MarkdownPostProcessorContext } from "obsidian"
import { displayError, displayNotice } from "./ui"
import { resolveFrontmatter } from "./frontmatter"
import { hashString } from "./hash"
import { prefixedIfNotGlobal, updateTables } from "./sqlReparseTables"
import { SqlSealDatabase } from "./database"
import { Logger } from "./logger"
import { TablesManager } from "./dataLoader/collections/tablesManager"
import { QueryManager } from "./dataLoader/collections/queryManager"
import { parseLanguage, Table, TableWithParentPath } from "./grammar/newParser"
import { RendererRegistry, RenderReturn } from "./rendererRegistry"

export class SqlSealCodeblockHandler {
    get globalTables() {
        return ['files', 'tags', 'tasks'] // Make this come from SealFileSync and plugins.
    }
    constructor(
        private readonly app: App,
        private readonly db: SqlSealDatabase,
        private logger: Logger,
        private tableManager: TablesManager,
        private queryManager: QueryManager,
        private rendererRegistry: RendererRegistry
    ) {
    }

    setupTableSignals(tables: Array<TableWithParentPath>) {
        tables.forEach(t => {
            this.tableManager.registerTable(t.tableName, t.fileName, t.parentPath)
        })
    }

    setupQuerySignals({ statement, tables }: ReturnType<typeof updateTables>, renderer: RenderReturn, ctx: MarkdownPostProcessorContext, el: Element) {
        const frontmatter = resolveFrontmatter(ctx, this.app)
        const renderSelect = async () => {
            try {
                 const { data, columns } = await this.db.select(statement, frontmatter ?? {})
                 renderer.render({ data, columns })
            } catch (e) {
                renderer.error(e.toString())
            }
        }


        const sig = this.queryManager.registerQuery(ctx.docId, tables)
        const unsubscribe = sig(() => {
            if (!el.isConnected) {
                unsubscribe()
                return
            }
            renderSelect()
        })
    }

    getHandler() {
        return async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
            const prefix = hashString(ctx.sourcePath)

            let results;
            let renderer: RenderReturn;

            try {
                await this.db.connect()
                // Before we display data, we need to parse query to see if there is query part.
                results = parseLanguage(source)
                if (results.queryPart) {
                    // FIXME: this one probably needs both renderer and error api.
                    renderer = this.rendererRegistry.prepareRender(results.intermediateContent)(el)
                } else {
                    displayNotice(el, `Creating tables: ${results.tables.map(t => t.tableName).join(', ')}`)
                }

                const prefixedTables = results.tables.map(t => {
                    return {
                        ...t,
                        tableName: prefixedIfNotGlobal(t.tableName, this.globalTables, prefix),
                        parentPath: ctx.sourcePath
                    }
                }) satisfies TableWithParentPath[]

                this.setupTableSignals(prefixedTables)

            } catch (e) {
                displayError(el, e.toString())
                return
            }

            try {
                if (results.queryPart) {
                    const { statement, tables } = updateTables(results.queryPart!, [...this.globalTables], prefix)
                    this.setupQuerySignals({ statement, tables }, renderer!, ctx, el)
                }
            } catch (e) {
                renderer!.error(e.toString())
            }

        }
    }
}