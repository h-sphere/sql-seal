import { OmnibusRegistrator } from "@hypersphere/omnibus";
import { App, MarkdownRenderChild } from "obsidian";
import { SqlSealDatabase } from "../../database/database";
import { Sync } from "../../datamodel/sync";
import { RenderReturn } from "../../renderer/rendererRegistry";
import { transformQuery } from "../../sql/sqlTransformer";
import { registerObservers } from "../../utils/registerObservers";
import { displayError } from "../../utils/ui";

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

            registerObservers({
                bus: this.registrator,
                tables: transformedQuery.mappedTables,
                callback: () => this.render(),
                fileName: this.sourcePath
            })

            const file = this.app.vault.getFileByPath(this.sourcePath);
            if (!file) {
                return;
            }

            const fileCache = this.app.metadataCache.getFileCache(file);
            const { data, columns } = await this.db.select(
                transformedQuery.sql, 
                fileCache?.frontmatter ?? {}
            );

            this.el.empty()
            this.el.createSpan({ text: data[0][columns[0]] ?? '' })

        } catch (e) {
            displayError(this.el, e.toString())
        }
    }
}