import { App, MarkdownPostProcessorContext, MarkdownRenderChild, normalizePath, Vault } from "obsidian"
import { displayError, displayNotice } from "./ui"
import { SqlSealDatabase } from "./database"
import { Logger } from "./logger"
import { parseLanguage, Table } from "./grammar/newParser"
import { RendererRegistry, RenderReturn } from "./rendererRegistry"
import { Sync } from "./datamodel/sync"
import { OmnibusRegistrator } from "@hypersphere/omnibus"
import { transformQuery } from "./datamodel/transformer"

class CodeblockProcessor extends MarkdownRenderChild {

    registrator: OmnibusRegistrator
    renderer: RenderReturn

    constructor(
        private el: HTMLElement,
        private source: string,
        private ctx: MarkdownPostProcessorContext,
        private rendererRegistry: RendererRegistry,
        private db: SqlSealDatabase,
        private app: App,
        private sync: Sync) {
        super(el)
        this.registrator = this.sync.getRegistrator()
    }

    query: string;

    async onload() {
        try {
            const results = parseLanguage(this.source)
            if (results.tables) {
                await this.registerTables(results.tables)
                if (!results.queryPart) {
                    displayNotice(this.el, `Creating tables: ${results.tables.map(t => t.tableName).join(', ')}`)
                    return
                }
            }

            this.renderer = this.rendererRegistry.prepareRender(results.intermediateContent)(this.el)
            
            // FIXME: probably should save the one before transform and perform transform every time we execute it.
            this.query = results.queryPart
            await this.render()
        } catch (e) {
            displayError(this.el, e.toString())
        }
    }

    onunload() {
        this.registrator.offAll()
    }

    async render() {
        try {

        const registeredTablesForContext = await this.sync.getTablesMappingForContext(this.ctx.sourcePath)
        const tranformedQuery = transformQuery(this.query, registeredTablesForContext)

        this.registrator.offAll()
        Object.values(registeredTablesForContext).forEach(v => {
            this.registrator.on(`change::${v}`, () => {
                this.render()
            })
            this.registrator.on('file::change::'+this.ctx.sourcePath, () => {
                sleep(250).then(() => this.render())

            })
        })


        const file = this.app.vault.getFileByPath(this.ctx.sourcePath)
        if (!file) {
            return
        }
        const fileCache = this.app.metadataCache.getFileCache(file)
            const { data, columns } = await this.db.select(tranformedQuery, fileCache?.frontmatter ?? {})
            this.renderer.render({ data, columns })
       } catch (e) {
           this.renderer.error(e.toString())
       }
    }

    async registerTables(tables: Table[]) {
        await Promise.all(tables.map((table) => {
            const path = this.app.metadataCache.getFirstLinkpathDest(table.fileName, this.ctx.sourcePath)
            if (!path) {
                throw new Error(`File does not exist: ${table.fileName} (for ${table.tableName}).`)
            }
            return this.sync.registerTable({
                aliasName: table.tableName,
                fileName: path.path,
                sourceFile: this.ctx.sourcePath
            })
        }))
    }
}


export class SqlSealCodeblockHandler {
    constructor(
        private readonly app: App,
        private readonly db: SqlSealDatabase,
        private sync: Sync,
        private rendererRegistry: RendererRegistry
    ) {
    }

    getHandler() {
        return async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
            const processor = new CodeblockProcessor(el, source, ctx, this.rendererRegistry, this.db, this.app, this.sync)
            ctx.addChild(processor)
        }
    }
}