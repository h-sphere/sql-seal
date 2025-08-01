import { EditorState } from "@codemirror/state";
import { CodeblockProcessor } from "../editor/codeblockHandler/CodeblockProcessor";
import { EditorView, keymap } from "@codemirror/view";
import { ViewPluginGeneratorType } from "../syntaxHighlight/viewPluginGenerator";
import { EditorMenuBar } from "./EditorMenuBar";
import { MemoryDatabase } from "./database/memoryDatabase";
import { SchemaVisualiser } from "./schemaVisualiser/SchemaVisualiser";

type CodeblockProcessorWrapper = (
	el: HTMLElement,
	source: string,
) => Promise<CodeblockProcessor>;

const DEFAULT_QUERY = "SELECT *\nFROM files\nLIMIT 10";

export class Editor {
	constructor(
		private codeblockProcessorGenerator: CodeblockProcessorWrapper,
		private viewPluginGenerator: ViewPluginGeneratorType,
		private query: string = DEFAULT_QUERY,
		private db: MemoryDatabase | null = null
	) {}

	codeblockElement: HTMLElement | null = null;
	render(el: HTMLElement) {
		el.empty();
		const menuBar = new EditorMenuBar(!!this.db);
		const c = el.createDiv({ cls: "sqlseal-explorer-container" });
		menuBar.render(c);
		const grid = c.createDiv({ cls: "sqlseal-explorer-grid-container" });
		const codeSidebar = grid.createDiv({ cls: "sqlseal-explorer-code" });
		codeSidebar.classList.add("cm-sqlseal-explorer");
		// codeSidebar.textContent = "CODE"
		const rightPane = grid.createDiv({ cls: 'sqlseal-explorer-right-pane' })
		const contentSidebar = rightPane.createDiv({ cls: "sqlseal-explorer-render" });
		const structure = rightPane.createDiv({ cls: 'sqlseal-explorer-structure' })
		structure.hide()

		this.codeblockElement = contentSidebar;

		this.createEditor(codeSidebar);
		this.createCodeblockProcessor(this.codeblockElement, this.query);

		if (this.db) {
			// rendering structure
			const schema = this.db.getSchema()
			const vis = new SchemaVisualiser(schema)
			vis.show(structure)
		} else {
		}

		const events = menuBar.events;
		events.on("play", () => {
            this.play()
        });

        events.on('structure', (b) => {
            console.log('SHOWING STRUCTURE')
			if (structure.checkVisibility({ checkVisibilityCSS: true })) {
				// structure visible
				structure.hide()
				contentSidebar.show();
				(b as any).setIcon('database')

			} else {
				// structure invisible
				structure.show()
				contentSidebar.hide();
				(b as any).setIcon('table')
			}
        })
	}

	createCodeblockProcessor(el: HTMLElement, source: string) {
		return this.codeblockProcessorGenerator(el, source);
	}

	editor: EditorView;
	createEditor(el: HTMLElement) {
		const state = EditorState.create({
			doc: this.query,
			extensions: [
				// this.createCustomLanguage(),
				// this.createChangeListener(),
				this.createKeyBindings(),
				this.viewPluginGenerator(true),
				EditorView.theme({
					"&": { height: "100%" },
					".cm-scroller": { fontFamily: "monospace" },
					".cm-content": {
						caretColor: "var(--color-base-100)",
					},
				}),
			],
		});

		this.editor = new EditorView({
			state,
			parent: el,
		});
	}

	createKeyBindings() {
		return keymap.of([
			{
				key: "Mod-r", // Save shortcut example
				run: () => {
                    this.play()
                    return true
				},
			},
		]);
	}

	play() {
		this.query = this.editor.state.doc.toString();
		if (this.codeblockElement) {
			this.createCodeblockProcessor(this.codeblockElement, this.query);
		}
	}
}
