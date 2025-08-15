import { EditorState } from "@codemirror/state";
import { CodeblockProcessor } from "../editor/codeblockHandler/CodeblockProcessor";
import { EditorView, keymap } from "@codemirror/view";
import { ViewPluginGeneratorType } from "../syntaxHighlight/viewPluginGenerator";
import { EditorMenuBar } from "./EditorMenuBar";
import { MemoryDatabase } from "./database/memoryDatabase";
import { SchemaVisualiser } from "./schemaVisualiser/SchemaVisualiser";
import { activateView } from "./activateView";
import { App } from "obsidian";
import { GLOBAL_TABLES_VIEW_TYPE } from "../globalTables/GlobalTablesView";
import { GridApi } from "ag-grid-community";
import { SqlVariableParser } from "./variables/SqlVariableParser";
import { VariableInputInterface } from "./variables/VariableInputInterface";
import { VariablePersistence } from "./variables/VariablePersistence";
import { parseWithDefaults, ParserResult } from "../editor/parser";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";

type CodeblockProcessorWrapper = (
	el: HTMLElement,
	source: string,
	variables?: Record<string, any>
) => Promise<CodeblockProcessor>;

const DEFAULT_QUERY = "SELECT *\nFROM files\nLIMIT 10";

export class Editor {
	private globalKeyHandler?: (event: KeyboardEvent) => void;
	private containerElement?: HTMLElement;

	constructor(
		private codeblockProcessorGenerator: CodeblockProcessorWrapper,
		private viewPluginGenerator: ViewPluginGeneratorType,
		private app: App,
		private query: string = DEFAULT_QUERY,
		private db: MemoryDatabase | null = null,
		private isTextFile: boolean = false,
		private rendererRegistry?: RendererRegistry
	) {
		// Extract and load variables from the initial query content (only for text files)
		if (this.isTextFile) {
			this.loadVariablesFromContent();
		} else {
			this.fullContent = this.query;
		}
	}

	codeblockElement: HTMLElement | null = null;
	variableInterface: VariableInputInterface | null = null;
	private currentVariableValues: Record<string, string> = {};
	private fullContent: string = ""; // Store full content including variable comments
	render(el: HTMLElement) {
		el.empty();
		const menuBar = new EditorMenuBar(!!this.db);
		const c = el.createDiv({ cls: "sqlseal-explorer-container" });
		this.containerElement = c;
		menuBar.render(c);
		
		// Setup global CMD+R handler
		this.setupGlobalKeyHandler();
		const grid = c.createDiv({ cls: "sqlseal-explorer-grid-container" });
		const codeSidebar = grid.createDiv({ cls: "sqlseal-explorer-code" });
		
		// Create code editor container (first)
		const editorContainer = codeSidebar.createDiv({ cls: "cm-sqlseal-explorer" });
		
		// Create variables interface container (second, at bottom)
		const variablesContainer = codeSidebar.createDiv({ cls: "sqlseal-variables-container" });
		this.variableInterface = new VariableInputInterface(variablesContainer);
		
		// Setup variable change handler
		this.variableInterface.onChange((values) => {
			this.currentVariableValues = values;
			// Note: Variables will be saved when file is saved
			// Auto-run query when variables change (optional behavior)
			// this.play();
		});

		const rightPane = grid.createDiv({ cls: 'sqlseal-explorer-right-pane' })
		const contentSidebar = rightPane.createDiv({ cls: "sqlseal-explorer-render" });
		const structure = rightPane.createDiv({ cls: 'sqlseal-explorer-structure' })
		structure.hide()

		this.codeblockElement = contentSidebar;

		this.createEditor(editorContainer);
		this.createCodeblockProcessor(this.codeblockElement, this.query);
		this.updateVariableInterface();
		
		// Load saved variable values into the interface
		if (this.variableInterface && Object.keys(this.currentVariableValues).length > 0) {
			this.variableInterface.setValues(this.currentVariableValues);
		}

		if (this.db) {
			const vis = new SchemaVisualiser(this.db)
			vis.show(structure)
		} else {
		}

		const events = menuBar.events;
		events.on("play", () => {
            this.play()
        });

        events.on('structure', (b) => {
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

		events.on('globals', () => {
			activateView(this.app, GLOBAL_TABLES_VIEW_TYPE)
		})
	}

	createCodeblockProcessor(el: HTMLElement, source: string, variables?: Record<string, any>) {
		return this.codeblockProcessorGenerator(el, source, variables);
	}

	editor: EditorView;
	createEditor(el: HTMLElement) {
		const state = EditorState.create({
			doc: this.query,
			extensions: [
				// this.createCustomLanguage(),
				this.createChangeListener(),
				this.createKeyBindings(),
				this.viewPluginGenerator(true),
				EditorView.theme({
					"&": { 
						height: "100%"
					},
					".cm-scroller": { 
						fontFamily: "monospace"
					},
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

	createChangeListener() {
		return EditorView.updateListener.of((update) => {
			if (update.docChanged) {
				// Update variable interface when query changes
				this.updateVariableInterface();
			}
		});
	}

	private updateVariableInterface() {
		if (!this.variableInterface) return;

		try {
			const currentContent = this.getCurrentQuery();
			
			// Use OHM parser to extract actual SQL query from the codeblock
			let extractedQuery = currentContent;
			if (this.rendererRegistry) {
				try {
					const defaults: ParserResult = {
						flags: { refresh: false, explain: false },
						query: "",
						renderer: { options: "", type: "GRID" },
						tables: [],
					};
					
					const parsed = parseWithDefaults(
						currentContent, 
						this.rendererRegistry.getViewDefinitions(), 
						defaults,
						this.rendererRegistry.flags
					);
					
					// Use the extracted query if available, otherwise fall back to current content
					extractedQuery = parsed.query || currentContent;
				} catch (ohmError) {
					console.warn('[SQLSeal Variables] OHM parsing failed, using raw content:', ohmError);
					// Fall back to using the raw content
				}
			}
			
			const variables = SqlVariableParser.extractVariables(extractedQuery);
			this.variableInterface.setVariables(variables);
		} catch (error) {
			// If parsing fails, keep previous variables and don't clear the interface
			console.warn('[SQLSeal Variables] Failed to parse variables, keeping previous values:', error);
			// Don't call clear() - this preserves the existing variables and user input
		}
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

	async play() {
		this.query = this.editor.state.doc.toString();
		
		if (this.codeblockElement) {
			// Prepare variables for SQL execution
			const sqlVariables = Object.keys(this.currentVariableValues).length > 0 
				? SqlVariableParser.createParameterObject(this.currentVariableValues)
				: undefined;


			await this.createCodeblockProcessor(this.codeblockElement, this.query, sqlVariables);
			// const renderer = processor.renderer
			// if ('communicator' in renderer && 'gridApi' in (renderer as any)['communicator']) {
			// 	const api: GridApi = (renderer.communicator as any).gridApi
			// 	api.setGridOption('paginationAutoPageSize', true)
			// }
		}
	}

	getCurrentQuery(): string {
		return this.editor?.state.doc.toString() || this.query;
	}

	/**
	 * Get the current query content combined with variable definitions
	 * Only includes variables for text files (.sql/.sqlseal)
	 */
	getFullContent(): string {
		const cleanQuery = this.getCurrentQuery();
		// Only add variables for text files, never for database files
		if (this.isTextFile) {
			return VariablePersistence.updateVariableValues(cleanQuery, this.currentVariableValues);
		} else {
			return cleanQuery;
		}
	}

	setQuery(newQuery: string) {
		// Store full content and extract clean query (only for text files)
		this.fullContent = newQuery;
		
		if (this.isTextFile) {
			this.loadVariablesFromContent();
			// Set clean query in editor
			const cleanQuery = VariablePersistence.getCleanSqlContent(newQuery);
			this.query = cleanQuery;
		} else {
			// For database files, use content as-is
			this.query = newQuery;
		}
		
		if (this.editor) {
			this.editor.dispatch({
				changes: {
					from: 0,
					to: this.editor.state.doc.length,
					insert: this.query
				}
			});
		}
	}

	/**
	 * Load variables from the current content
	 */
	private loadVariablesFromContent() {
		this.fullContent = this.query;
		
		// Extract variable values from content
		const savedVariables = VariablePersistence.extractVariableValues(this.fullContent);
		this.currentVariableValues = savedVariables;
		
		// Get clean SQL content for editor
		this.query = VariablePersistence.getCleanSqlContent(this.fullContent);
		
	}

	private setupGlobalKeyHandler() {
		if (!this.containerElement) return;
		
		this.globalKeyHandler = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
				event.preventDefault();
				event.stopPropagation();
				this.play();
			}
		};
		
		this.containerElement.addEventListener('keydown', this.globalKeyHandler);
		// Make the container focusable so it can receive keyboard events
		this.containerElement.setAttribute('tabindex', '0');
	}

	cleanup() {
		if (this.globalKeyHandler && this.containerElement) {
			this.containerElement.removeEventListener('keydown', this.globalKeyHandler);
			this.globalKeyHandler = undefined;
		}
	}
}
