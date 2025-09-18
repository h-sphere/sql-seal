import { EditorView, ViewPlugin } from "@codemirror/view";
import { SQLSealViewPlugin } from "./editorExtension/syntaxHighlight";
import { App } from "obsidian";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";

export const viewPluginGeneratorFactory = (app: App, rendererRegistry: RendererRegistry) => {
        return (allIsCode: boolean = false) => {
            return ViewPlugin.define(
				(view: EditorView) => new SQLSealViewPlugin(view, app, rendererRegistry, allIsCode),
				{ decorations: v => v.decorations }
			)
        }
    }


export type ViewPluginGeneratorType = ReturnType<typeof viewPluginGeneratorFactory>