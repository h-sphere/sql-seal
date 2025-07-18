import { App, Plugin } from "obsidian";
import { RendererRegistry } from "./rendererRegistry";
import { TableRenderer } from "./TableRenderer";
import { GridRenderer } from "./GridRenderer";
import { ListRenderer } from "./ListRenderer";
import { TemplateRenderer } from "./TemplateRenderer";
import { MarkdownRenderer } from "./MarkdownRenderer";

export class RendererRegistryFactory {
    make(app: App, plugin: Plugin) {
        // FIXME: instead of plugin it needs settings, can be refactored
        const registry = new RendererRegistry()
        
        registry.register('sql-seal-internal-table', new TableRenderer(app))
        registry.register('sql-seal-internal-grid', new GridRenderer(app, plugin as any))
        registry.register('sql-seal-internal-markdown', new MarkdownRenderer(app))
        registry.register('sql-seal-internal-list', new ListRenderer(app))
        registry.register('sql-seal-internal-template', new TemplateRenderer(app))

        return registry
    }
}