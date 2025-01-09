import { OmnibusRegistrator } from "@hypersphere/omnibus";
import { App, MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";
import { SqlSealDatabase } from "src/database/database";
import { Sync } from "src/datamodel/sync";
import { transformQuery } from "src/datamodel/transformer";
import { parseLanguage, Table } from "src/grammar/newParser";
import { RendererRegistry, RenderReturn } from "src/renderer/rendererRegistry";
import { displayError, displayNotice } from "src/utils/ui";

export class CodeblockProcessor extends MarkdownRenderChild {

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