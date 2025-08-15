import { EditorState } from "@codemirror/state";
import { EditorView, keymap, ViewPlugin } from "@codemirror/view";
import {
	ItemView,
	MarkdownPostProcessorContext,
	WorkspaceLeaf,
} from "obsidian";
import { CodeblockProcessor } from "../../editor/codeblockHandler/CodeblockProcessor";
import { SqlSealDatabase } from "../../database/database";
import { RendererRegistry } from "../../editor/renderer/rendererRegistry";
import { Settings } from "../../settings/Settings";
import { ModernCellParser } from "../../syntaxHighlight/cellParser/ModernCellParser";
import { Sync } from "../../sync/sync/sync";
import { ViewPluginGeneratorType } from "../../syntaxHighlight/viewPluginGenerator";
import { Editor } from "../Editor";
import { GridApi } from "ag-grid-community";

export class ExplorerView extends ItemView {
	constructor(
		leaf: WorkspaceLeaf,
		private rendererRegistry: RendererRegistry,
		private db: Pick<SqlSealDatabase, 'select' | 'explain'>,
		private cellParser: ModernCellParser,
		private settings: Settings,
		private sync: Sync,
		private viewPluginGenerator: ViewPluginGeneratorType
	) {
		super(leaf);
	}
	private editor: EditorView;
	private sqlSealEditor: Editor;
	getViewType() {
		return "sqlseal-explorer-view";
	}
	getDisplayText() {
		return "SQLSeal Explorer";
	}

	getIcon() {
		return 'logo-sqlseal'
	}
	async onOpen() {
		const content = this.contentEl;


		const codeblockProcessorGenerator = async (el: HTMLElement, source: string, variables?: Record<string, any>) => {
			const ctx: MarkdownPostProcessorContext = {
			docId: "",
			sourcePath: "",
			frontmatter: variables || {},
		} as any;

			const processor = new CodeblockProcessor(
			el,
			source,
			ctx,
			this.rendererRegistry,
			this.db,
			this.cellParser,
			this.settings,
			this.app,
			this.sync,
		);
			await processor.onload();


			// Resizing and layout configuration for explorer
			const renderer = processor.renderer
			if ('communicator' in renderer && 'gridApi' in (renderer as any)['communicator']) {
				const api: GridApi = (renderer.communicator as any).gridApi
				api.setGridOption('paginationAutoPageSize', true)
				api.setGridOption('domLayout', 'normal') // Override autoHeight for proper pagination
			}

			await processor.render();
			return processor
		}

		this.sqlSealEditor = new Editor(codeblockProcessorGenerator, this.viewPluginGenerator, this.app, undefined, undefined, false, this.rendererRegistry)

		this.sqlSealEditor.render(content)
	}

	async onClose() {
		if (this.sqlSealEditor) {
			this.sqlSealEditor.cleanup();
		}
	}
}
