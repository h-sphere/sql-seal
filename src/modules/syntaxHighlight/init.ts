import { makeInjector } from "@hypersphere/dity"
import { SyntaxHighlightModule } from "./module"
import { EditorView, ViewPlugin } from "@codemirror/view";
import { App, Plugin } from "obsidian";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";
import { SQLSealViewPlugin } from "./editorExtension/syntaxHighlight";

@(makeInjector<SyntaxHighlightModule, 'factory'>()([
    'plugin', 'viewPluginGenerator'
]))
export class SyntaxHighlightInit {
    make(plugin: Plugin, viewPluginGenerator: () => ViewPlugin<any>) {
        return () => {
            // FIXME: settings here.
            plugin.registerEditorExtension([viewPluginGenerator()]);
        }
    }
}