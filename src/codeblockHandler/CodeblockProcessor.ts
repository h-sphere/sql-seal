import { OmnibusRegistrator } from "@hypersphere/omnibus";
import { App, MarkdownPostProcessorContext, MarkdownRenderChild, TFile } from "obsidian";
import { SqlSealDatabase } from "../database/database";
import { Sync } from "../datamodel/sync";
import { ParserTableDefinition } from "../datamodel/syncStrategy/types";
import { parseLanguage } from "../grammar/newParser";
import { RendererRegistry, RenderReturn } from "../renderer/rendererRegistry";
import { transformQuery } from "../sql/sqlTransformer";
import { registerObservers } from "../utils/registerObservers";
import { displayError, displayNotice } from "../utils/ui";

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
            const results = parseLanguage(this.source, this.ctx.sourcePath)
            if (results.tables) {
                await this.registerTables(results.tables)
                if (!results.queryPart) {
                    displayNotice(this.el, `Creating tables: ${results.tables.map(t => t.tableAlias).join(', ')}`)
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

        const res = transformQuery(this.query, registeredTablesForContext)
        const transformedQuery = res.sql

        registerObservers({
            bus: this.registrator,
            callback: () => this.render(),
            fileName: this.ctx.sourcePath,
            tables: res.mappedTables
        })


        const file = this.app.vault.getFileByPath(this.ctx.sourcePath)
        if (!file) {
            return
        }
        const fileCache = this.app.metadataCache.getFileCache(file)
            const { data, columns } = await this.db.select(transformedQuery, fileCache?.frontmatter ?? {})
            this.renderer.render({ data, columns })
       } catch (e) {
           this.renderer.error(e.toString())
       }
    }

    async registerTables(tables: ParserTableDefinition[]) {
        await Promise.all(tables.map((table) =>  this.sync.registerTable(table)))
    }
}