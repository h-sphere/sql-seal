import { EditorView, ViewPlugin } from "@codemirror/view";
import { App, Plugin } from "obsidian";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";
import { SQLSealViewPlugin } from "./editorExtension/syntaxHighlight";

export const syntaxHighlightInit = (
	plugin: Plugin,
	viewPluginGenerator: () => ViewPlugin<any>,
) => {
	return () => {
		// FIXME: settings here.
		plugin.registerEditorExtension([viewPluginGenerator()]);
	};
};
