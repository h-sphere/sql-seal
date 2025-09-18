import { FileView, IconName, MarkdownPostProcessorContext, Menu, TextFileView, TFile, WorkspaceLeaf } from "obsidian";
import { GridApi } from "ag-grid-community";
import { MemoryDatabase } from "./database/memoryDatabase";
import { DatabaseManager } from "./database/databaseManager";
import { TableInfo } from "./schemaVisualiser/TableVisualiser";
import { Editor } from "./Editor";
import { ViewPluginGeneratorType } from "../syntaxHighlight/viewPluginGenerator";
import { CodeblockProcessor } from "../editor/codeblockHandler/CodeblockProcessor";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";
import { ModernCellParser } from "../syntaxHighlight/cellParser/ModernCellParser";
import { Settings } from "../settings/Settings";
import { Sync } from "../sync/sync/sync";
import { SqlSealDatabase } from "../database/database";

export const SQLSEAL_FILE_VIEW = 'sqlseal-file-view';

const DEFAULT_SQLITE_QUERY = "SELECT name\nFROM sqlite_master\nWHERE type='table'";
const DEFAULT_SQL_QUERY = "SELECT *\nFROM files\nLIMIT 10";

export class SQLSealFileView extends TextFileView {
    private fileDb: MemoryDatabase | null = null;
    private schema: TableInfo[] = [];
    private editor: Editor | null = null;
    private fileContent: string = "";

    constructor(
        leaf: WorkspaceLeaf,
        private manager: DatabaseManager,
        private viewPluginGenerator: ViewPluginGeneratorType,
        private rendererRegistry: RendererRegistry,
        private cellParser: ModernCellParser,
        private settings: Settings,
        private sync: Sync,
        private vaultDb: Pick<SqlSealDatabase, 'select' | 'explain'>,
    ) {
        super(leaf);
    }

    getViewType(): string {
        return SQLSEAL_FILE_VIEW;
    }

    getDisplayText(): string {
        return this.file?.basename || 'SQLSeal';
    }

    async onOpen() {
        this.contentEl.addClass("sqlseal-file-view-container");
    }

    async setViewData(data: string, clear: boolean): Promise<void> {
        this.fileContent = data;
        await this.initializeView();
    }

    getViewData(): string {
        if (this.editor) {
            // CRITICAL: Only return full content with variables for SQL text files
            // NEVER modify SQLite database files
            if (this.file && (this.file.extension === 'sql' || this.file.extension === 'sqlseal')) {
                return this.editor.getFullContent();
            } else {
                // For database files, return clean query only
                return this.editor.getCurrentQuery();
            }
        }
        return this.fileContent;
    }

    clear(): void {
        this.fileContent = "";
        this.contentEl.empty();
    }

    private async initializeView() {
        if (!this.file) return;

        const fileExtension = this.file.extension.toLowerCase();
        
        if (fileExtension === 'sqlite' || fileExtension === 'db') {
            // Handle database files
            await this.initializeDatabaseView();
        } else if (fileExtension === 'sql' || fileExtension === 'sqlseal') {
            // Handle SQL text files
            await this.initializeSQLView();
        }
    }

    private async initializeDatabaseView() {
        if (!this.file) return;

        try {
            this.fileDb = await this.manager.getDatabaseConnection(this.file);
            await this.fileDb.connect();
            this.schema = this.fileDb.getSchema();
        } catch (error) {
            console.error("Failed to connect to database:", error);
            return;
        }

        await this.render(DEFAULT_SQLITE_QUERY);
    }

    private async initializeSQLView() {
        // For SQL files, use the vault database that was injected
        // No need to connect as it's already available

        // Use file content as initial query, or default if empty
        const initialQuery = this.fileContent.trim() || DEFAULT_SQL_QUERY;
        await this.render(initialQuery);
    }

    private async render(initialQuery: string) {
        const codeblockProcessorGenerator = async (el: HTMLElement, source: string, variables?: Record<string, any>) => {
            const ctx: MarkdownPostProcessorContext = {
                docId: "",
                sourcePath: this.file?.path || "",
                frontmatter: variables || {},
            } as any;

            // Create a database adapter to handle both MemoryDatabase and SqlSealDatabase
            const dbAdapter = this.fileDb ? {
                select: async (statement: string, frontmatter: Record<string, unknown>) => {
                    const result = this.fileDb!.select(statement);
                    return {
                        data: result.data,
                        columns: Array.isArray(result.columns) ? result.columns : Object.keys(result.columns)
                    };
                },
                explain: async () => ""
            } : this.vaultDb;

            const processor = new CodeblockProcessor(
                el,
                source,
                ctx,
                this.rendererRegistry,
                dbAdapter,
                this.cellParser,
                this.settings,
                this.app,
                this.sync,
            );
            await processor.onload();

            // Resizing and layout configuration for explorer
            const renderer = processor.renderer;
            if (renderer && 'communicator' in renderer && 'gridApi' in (renderer as any)['communicator']) {
                const api: GridApi = (renderer.communicator as any).gridApi;
                api.setGridOption('paginationAutoPageSize', true);
                api.setGridOption('domLayout', 'normal'); // Override autoHeight for proper pagination
            }

            await processor.render();
            return processor;
        };

        // Determine if this is a text file that should support variables
        const isTextFile = Boolean(this.file && (this.file.extension === 'sql' || this.file.extension === 'sqlseal'));
        
        this.editor = new Editor(
            codeblockProcessorGenerator,
            this.viewPluginGenerator,
            this.app,
            initialQuery,
            this.fileDb, // Pass the file database (only for sqlite files)
            isTextFile, // Only enable variables for SQL text files
            this.rendererRegistry // Pass renderer registry for OHM parsing
        );

        // Override the editor's play function to include save functionality
        const originalPlay = this.editor.play.bind(this.editor);
        this.editor.play = async () => {
            // Save the file first if it's a SQL file
            if (this.file && (this.file.extension === 'sql' || this.file.extension === 'sqlseal')) {
                const currentContent = this.editor?.getCurrentQuery() || "";
                if (currentContent !== this.fileContent) {
                    this.fileContent = currentContent;
                    await this.save();
                }
            }
            // Then run the query
            await originalPlay();
        };

        this.contentEl.empty();
        this.editor.render(this.contentEl);
    }

    onPaneMenu(menu: Menu, source: "more-options" | "tab-header" | string): void {
        if (this.file && (this.file.extension === 'sql' || this.file.extension === 'sqlseal')) {
            menu.addItem(item => {
                item.setTitle("Save and Run Query")
                    .setIcon("play")
                    .onClick(() => {
                        if (this.editor) {
                            this.editor.play();
                        }
                    });
            });
        }

        menu.addItem(item => {
            item.setTitle("Run Query")
                .setIcon("play")
                .onClick(() => {
                    if (this.editor) {
                        this.editor.play();
                    }
                });
        });

        super.onPaneMenu(menu, source);
    }

    getIcon(): IconName {
        if (!this.file) return 'database';
        
        const ext = this.file.extension.toLowerCase();
        if (ext === 'sql' || ext === 'sqlseal') {
            return 'code';
        }
        return 'database';
    }

    async save(): Promise<void> {
        // CRITICAL: NEVER save database files - only save SQL text files
        if (!this.file) return;
        
        const ext = this.file.extension.toLowerCase();
        if (ext === 'sqlite' || ext === 'db') {
            console.warn('[SQLSeal] Prevented saving database file:', this.file.path);
            return; // Do not save database files
        }
        
        // Only save SQL text files
        if (ext === 'sql' || ext === 'sqlseal') {
            await super.save();
        }
    }

    async onClose() {
        // MemoryDatabase doesn't need explicit disconnection
        if (this.editor) {
            this.editor.cleanup();
        }
    }
}