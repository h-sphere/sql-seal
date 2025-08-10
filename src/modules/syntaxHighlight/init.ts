import { makeInjector } from "@hypersphere/dity"
import { SyntaxHighlightModule } from "./module"
import { EditorView, ViewPlugin } from "@codemirror/view";
import { App, Plugin } from "obsidian";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";
import { SQLSealViewPlugin } from "./editorExtension/syntaxHighlight";

@(makeInjector<SyntaxHighlightModule, 'factory'>()([
    'app', 'rendererRegistry', 'plugin'
]))
export class SyntaxHighlightInit {
    make(app: App, rendererRegistry: RendererRegistry, plugin: Plugin) {
        return () => {
            // FIXME: settings here.
            plugin.registerEditorExtension([
			ViewPlugin.define(
				(view: EditorView) => new SQLSealViewPlugin(view, app, rendererRegistry),
				{ decorations: v => v.decorations }
			)
		]);
        }
    }
}