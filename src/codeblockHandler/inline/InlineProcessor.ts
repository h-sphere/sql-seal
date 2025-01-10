import { OmnibusRegistrator } from "@hypersphere/omnibus";
import { App, MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";
import { SqlSealDatabase } from "src/database/database";
import { Sync } from "src/datamodel/sync";
import { RendererRegistry, RenderReturn } from "src/renderer/rendererRegistry";
import { transformQuery } from "src/sql/transformer";
import { displayError } from "src/utils/ui";

export class InlineProcessor extends MarkdownRenderChild {
    private registrator: OmnibusRegistrator;
    private renderer: RenderReturn;

    constructor(
        private el: HTMLElement,
        private query: string,
        private sourcePath: string,
        private db: SqlSealDatabase,
        private app: App,
        private sync: Sync
    ) {
        super(el);
        this.registrator = this.sync.getRegistrator();
    }

    async onload() {
        try {
            await this.render();
        } catch (e) {
            displayError(this.el, e.toString());
        }
    }

    onunload() {
        this.registrator.offAll();
    }

    async render() {
        try {
            const registeredTablesForContext = await this.sync.getTablesMappingForContext(this.sourcePath);
            const transformedQuery = transformQuery(this.query, registeredTablesForContext);

            this.registrator.offAll();
            Object.values(registeredTablesForContext).forEach(v => {
                this.registrator.on(`change::${v}`, () => {
                    this.render();
                });
            });

            this.registrator.on('file::change::' + this.sourcePath, () => {
                setTimeout(() => this.render(), 250);
            });

            const file = this.app.vault.getFileByPath(this.sourcePath);
            if (!file) {
                return;
            }

            const fileCache = this.app.metadataCache.getFileCache(file);
            const { data, columns } = await this.db.select(
                transformedQuery, 
                fileCache?.frontmatter ?? {}
            );

            this.el.empty()
            this.el.createSpan({ text: data[0][columns[0]] ?? '' })

        } catch (e) {
            displayError(this.el, e.toString())
        }
    }
}