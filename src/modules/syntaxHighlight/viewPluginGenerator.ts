import { makeInjector } from "@hypersphere/dity";
import { SyntaxHighlightModule } from "./module";
import { EditorView, ViewPlugin } from "@codemirror/view";
import { SQLSealViewPlugin } from "./editorExtension/syntaxHighlight";
import { App } from "obsidian";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";

export type ViewPluginGeneratorType = ReturnType<ViewPluginGenerator['make']>

@(makeInjector<SyntaxHighlightModule, 'factory'>()([
    'app', 'rendererRegistry'
]))
export class ViewPluginGenerator {
    make(app: App, rendererRegistry: RendererRegistry) {
        return (allIsCode: boolean = false) => {
            return ViewPlugin.define(
				(view: EditorView) => new SQLSealViewPlugin(view, app, rendererRegistry, allIsCode),
				{ decorations: v => v.decorations }
			)
        }
    }
}