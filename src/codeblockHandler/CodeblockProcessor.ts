import { OmnibusRegistrator } from "@hypersphere/omnibus";
import { App, MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";
import { SqlSealDatabase } from "../database/database";
import { Sync } from "../datamodel/sync";
import { RendererRegistry, RenderReturn } from "../renderer/rendererRegistry";
import { transformQuery } from "../sql/sqlTransformer";
import { displayError, displayNotice } from "../utils/ui";
import SqlSealPlugin from "../main";
import { registerObservers } from "../utils/registerObservers";
import { ParserResult, parseWithDefaults, TableDefinition } from "../grammar/parser";

export class CodeblockProcessor extends MarkdownRenderChild {

    registrator: OmnibusRegistrator
    renderer: RenderReturn
    private flags: ParserResult['flags']
    private extrasEl: HTMLElement
    private explainEl: HTMLElement

    constructor(
        private el: HTMLElement,
        private source: string,
        private ctx: MarkdownPostProcessorContext,
        private rendererRegistry: RendererRegistry,
        private db: SqlSealDatabase,
        private plugin: SqlSealPlugin,
        private app: App,
        private sync: Sync) {
        super(el)

        this.registrator = this.sync.getRegistrator()
    }

    query: string;

    async onload() {
        try {

            const defaults: ParserResult = {
                flags: {
                    refresh: this.plugin.settings.enableDynamicUpdates,
                    explain: false
                },
                query: '',
                renderer: { options: '', type: this.plugin.settings.defaultView.toUpperCase() },
                tables: []
            
            }

            const results = parseWithDefaults(this.source, this.rendererRegistry.getViewDefinitions(), defaults, this.rendererRegistry.flags)

            // const results = parseLanguage(this.source, this.ctx.sourcePath)
            if (results.tables) {
                await this.registerTables(results.tables)
                if (!results.query) {
                    displayNotice(this.el, `Creating tables: ${results.tables.map(t => t.tableAlias).join(', ')}`)
                    return
                }
            }

            this.flags = results.flags
            let rendererEl = this.el

            if (this.flags.explain) {
                this.extrasEl = this.el.createDiv({ cls: 'sqlseal-extras-container' })
                if (this.flags.explain) {
                    this.explainEl = this.extrasEl.createEl('pre', { cls: 'sqlseal-extras-explain-container' })
                }
                rendererEl = this.el.createDiv({ cls: 'sqlseal-renderer-container' })
            }

            this.renderer = this.rendererRegistry.prepareRender(results.renderer.type.toLowerCase(), results.renderer.options)(rendererEl)

            // FIXME: probably should save the one before transform and perform transform every time we execute it.
            this.query = results.query
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


            if (this.flags.refresh) {
                registerObservers({
                    bus: this.registrator,
                    callback: () => this.render(),
                    fileName: this.ctx.sourcePath,
                    tables: res.mappedTables
                })
            }


            const file = this.app.vault.getFileByPath(this.ctx.sourcePath)
            if (!file) {
                return
            }
            const fileCache = this.app.metadataCache.getFileCache(file)

            if (this.flags.explain) {
                // Rendering explain
                const result = await this.db.explain(transformedQuery, fileCache?.frontmatter ?? {})
                this.explainEl.textContent = result
            }

            const variables = {
                ...fileCache?.frontmatter ?? {},
                path: file.path,
                fileName: file.name,
                extension: file.extension,
            }

            const { data, columns } = await this.db.select(transformedQuery, variables)
            this.renderer.render({ data, columns, flags: this.flags })
        } catch (e) {
            this.renderer.error(e.toString())
        }
    }

    async registerTables(tables: TableDefinition[]) {
        await Promise.all(tables.map((table) => this.sync.registerTable({
            ...table,
            sourceFile: this.ctx.sourcePath
        })))
    }
}