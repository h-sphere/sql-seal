import { OmnibusRegistrator } from "@hypersphere/omnibus";
import { App, MarkdownRenderChild } from "obsidian";
import { transformQuery } from "../../sql/sqlTransformer";
import { SqlSealDatabase } from "../../../database/database";
import { Sync } from "../../../sync/sync/sync";
import { registerObservers } from "../../../../utils/registerObservers";
import { displayError } from "../../../../utils/ui";
import { Settings } from "../../../settings/Settings";

export class InlineProcessor extends MarkdownRenderChild {
    private registrator: OmnibusRegistrator;

    constructor(
        private el: HTMLElement,
        private query: string,
        private sourcePath: string,
        private db: SqlSealDatabase,
        private settings: Settings,
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

            // FIXME: settings here instead of plugin
            if (this.settings.get('enableDynamicUpdates')) {
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

            const { data, columns } = (await this.db.select(
                transformedQuery.sql,
                variables
            ))!; // FIXME: better code here.

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