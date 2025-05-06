import { OmnibusRegistrator } from "@hypersphere/omnibus";
import { App, MarkdownRenderChild } from "obsidian";
import { SqlSealDatabase } from "../../database/database";
import { Sync } from "../../datamodel/sync";
import { transformQuery } from "../../sql/sqlTransformer";
import { registerObservers } from "../../utils/registerObservers";
import { displayError } from "../../utils/ui";
import SqlSealPlugin from "../../main";

export class InlineProcessor extends MarkdownRenderChild {
    private registrator: OmnibusRegistrator;

    constructor(
        private el: HTMLElement,
        private query: string,
        private sourcePath: string,
        private db: SqlSealDatabase,
        private plugin: SqlSealPlugin,
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

            if (this.plugin.settings.enableDynamicUpdates) {
                registerObservers({
                    bus: this.registrator,
                    tables: transformedQuery.mappedTables,
                    callback: () => this.render(),
                    fileName: this.sourcePath
                })
            }

            const file = this.app.vault.getFileByPath(this.sourcePath);
            if (!file) {
                return;
            }

            const fileCache = this.app.metadataCache.getFileCache(file);
            
            // TODO: unify this between codeblock and inline handlers
            const variables = {
                ...(fileCache?.frontmatter ?? {}),
                path: file.path,
                fileName: file.name,
                basename: file.basename,
                parent: file.parent?.path,
                extension: file.extension,
            }

            const { data, columns } = await this.db.select(
                transformedQuery.sql,
                variables
            );

            this.el.empty()
            let value = data[0][columns[0]] ?? ''
            if (typeof value !== 'string') {
                value = value?.toString()
            }
            this.el.createSpan({ text: value })

        } catch (e) {
            displayError(this.el, e.toString())
        }
    }
}