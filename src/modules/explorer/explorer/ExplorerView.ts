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
import { CellParser } from "../../../../types-package/dist/src/cellParser";
import { Settings } from "../../settings/Settings";
import { ModernCellParser } from "../../syntaxHighlight/cellParser/ModernCellParser";
import { Sync } from "../../sync/sync/sync";
import { Language } from "@codemirror/language";
import { ViewPluginGeneratorType } from "../../syntaxHighlight/viewPluginGenerator";
import { Editor } from "../Editor";

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
	getViewType() {
		return "sqlseal-explorer-view";
	}
	getDisplayText() {
		return "SQLSeal Explorer";
	}
	async onOpen() {
		const content = this.contentEl;


		const codeblockProcessorGenerator = async (el: HTMLElement, source: string) => {
			const ctx: MarkdownPostProcessorContext = {
			docId: "",
			sourcePath: "",
			frontmatter: {},
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
			await processor.render();
			return processor
		}

		const editor = new Editor(codeblockProcessorGenerator, this.viewPluginGenerator)

		editor.render(content)

		// content.empty();
		// const c = content.createDiv({ cls: "sqlseal-explorer-container" });

		// const grid = c.createDiv({ cls: "sqlseal-explorer-grid-container" });

		// const codeSidebar = grid.createDiv({ cls: "sqlseal-explorer-code" });
		// codeSidebar.classList.add('cm-sqlseal-explorer')
		// // codeSidebar.textContent = "CODE"
		// const contentSidebar = grid.createDiv({ cls: "sqlseal-explorer-render" });

		// this.codeblockElement = contentSidebar;

		// this.createEditor(codeSidebar);
		// this.createCodeblockProcessor();
	}

	// source = "SELECT *\n FROM files\n LIMIT 10\n";

	// createEditor(el: HTMLElement) {
	// 	const state = EditorState.create({
	// 		doc: this.source,
	// 		extensions: [
	// 			// this.createCustomLanguage(),
	// 			// this.createChangeListener(),
	// 			this.createKeyBindings(),
	// 			this.viewPluginGenerator(true),
	// 			EditorView.theme({
	// 				"&": { height: "100%" },
	// 				".cm-scroller": { fontFamily: "monospace" },
	// 				".cm-content": {
	// 					caretColor: "var(--color-base-100)"
	// 				},
	// 			}),
	// 		],
	// 	});

	// 	this.editor = new EditorView({
	// 		state,
	// 		parent: el,
	// 	});
	// }

	// codeblockElement: HTMLElement | null = null;

	// private processor: CodeblockProcessor | null = null;
	// async createCodeblockProcessor() {
	// 	const el = this.codeblockElement!;
	// 	const ctx: MarkdownPostProcessorContext = {
	// 		docId: "",
	// 		sourcePath: "",
	// 		frontmatter: {},
	// 	} as any;

	// 	if (this.processor) {
	// 		this.processor.unload();
	// 	}

	// 	this.processor = new CodeblockProcessor(
	// 		el,
	// 		this.source,
	// 		ctx,
	// 		this.rendererRegistry,
	// 		this.db,
	// 		this.cellParser,
	// 		this.settings,
	// 		this.app,
	// 		this.sync,
	// 	);
	// 	await this.processor.onload();
	// 	await this.processor.render();
	// }

	// private createKeyBindings() {
	// 	console.log("key bindings?");
	// 	window.addEventListener("keydown", (e) => {
	// 		console.log("KEYDOWN", e);
	// 	});
	// 	return keymap.of([
	// 		// {
	// 		// 	key: "Mod-Enter", // Mod = Cmd on Mac, Ctrl on Windows/Linux
	// 		// 	run: (view: EditorView) => {
	// 		// 		this.source = view.state.doc.toString();
	// 		// 		this.createCodeblockProcessor();
	// 		// 		return true; // Return true to prevent default behavior
	// 		// 	},
	// 		// },
	// 		// You can add more key bindings here
	// 		{
	// 			key: "Mod-r", // Save shortcut example
	// 			run: (view: EditorView) => {
	// 				console.log("saving");
	// 				this.source = view.state.doc.toString();
	// 				this.createCodeblockProcessor();
	// 				return true;
	// 			},
	// 		},
	// 	]);
	// }

	// private createCustomLanguage() {
	// 	// const customLanguage = new Language({}, (input, fragments, ranges) => {
	// 	// 			return {
	// 	// 				parsedPos: input.length,
	// 	// 				stopAt: undefined,
	// 	// 				stoppedAt: undefined,
	// 	// 				advance() {
	// 	// 					return this;
	// 	// 				},
	// 	// 			};
	// 	// 		},)
    //     // return customLanguage
	// }
}
