import { makeInjector } from "@hypersphere/dity";
import { App, Plugin } from "obsidian";
import { createSqlSealEditorExtension } from "../../editorExtension/inlineCodeBlock";
import { SqlSealDatabase } from "../database/database";
import { Sync } from "../sync/sync/sync";
import { EditorModule } from "./module";
import { RendererRegistry } from "./renderer/rendererRegistry";
import { TableRenderer } from "./renderer/TableRenderer";
import { GridRenderer } from "./renderer/GridRenderer";
import { ListRenderer } from "./renderer/ListRenderer";
import { TemplateRenderer } from "./renderer/TemplateRenderer";
import { MarkdownRenderer } from "./renderer/MarkdownRenderer";
import { Settings } from "../settings/Settings";
import { SqlSealInlineHandler } from "./codeblockHandler/inline/InlineCodeHandler";
import { SqlSealCodeblockHandler } from "./codeblockHandler/SqlSealCodeblockHandler";

@(makeInjector<EditorModule, 'factory'>()([
    'app', 'db', 'plugin', 'sync', 'inlineHandler', 'blockHandler', 'rendererRegistry', 'settings'
]))
export class EditorInit {
    make(
        app: App,
        db: SqlSealDatabase,
        plugin: Plugin,
        sync: Sync,
        inlineHandler: SqlSealInlineHandler,
        blockHandler: SqlSealCodeblockHandler,
        rendererRegistry: RendererRegistry,
        settings: Settings
    ) {

        const registerInlineCodeblocks = () => {

            // Extension for Live Preview
            const editorExtension = createSqlSealEditorExtension(
                app,
                db,
                settings,
                sync,
            );

            plugin.registerEditorExtension(editorExtension);

            // Extension for Read mode
            plugin.registerMarkdownPostProcessor((el, ctx) => {
                const inlineCodeBlocks = el.querySelectorAll('code');
                inlineCodeBlocks.forEach((node: HTMLSpanElement) => {
                    const text = node.innerText;
                    if (text.startsWith('S>')) {
                        const container = createEl('span', { cls: 'sqlseal-inline-result' });
                        container.setAttribute('aria-label', text.slice(3));
                        container.classList.add('has-tooltip');
                        node.replaceWith(container);
                        inlineHandler.getHandler()(text, container, ctx);
                    }
                });
            });

        }

        const registerBlockCodeblock = () => {
            plugin.registerMarkdownCodeBlockProcessor('sqlseal', blockHandler.getHandler())
        }

        const registerViews = () => {

            rendererRegistry.register('sql-seal-internal-table', new TableRenderer(app))
            rendererRegistry.register('sql-seal-internal-grid', new GridRenderer(settings, plugin, app))
            rendererRegistry.register('sql-seal-internal-markdown', new MarkdownRenderer(app))
            rendererRegistry.register('sql-seal-internal-list', new ListRenderer(app))
            rendererRegistry.register('sql-seal-internal-template', new TemplateRenderer(app))
        }

        return () => {

            registerViews()

            app.workspace.onLayoutReady(async () => {
                registerInlineCodeblocks()
                registerBlockCodeblock()
            })
            // FIXME: block
        }
    }
}