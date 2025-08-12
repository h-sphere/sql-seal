import { FileView, IconName, MarkdownPostProcessorContext, Menu, TextFileView, TFile, WorkspaceLeaf } from "obsidian";
import { GridApi } from "ag-grid-community";
import { MemoryDatabase } from "./database/memoryDatabase";
import { DatabaseManager } from "./database/databaseManager";
import { TableInfo } from "./schemaVisualiser/TableVisualiser";
import { SchemaVisualiser } from "./schemaVisualiser/SchemaVisualiser";
import { ExplorerView } from "./explorer/ExplorerView";
import { Editor } from "./Editor";
import { ViewPluginGeneratorType } from "../syntaxHighlight/viewPluginGenerator";
import { CodeblockProcessor } from "../editor/codeblockHandler/CodeblockProcessor";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";
import { ModernCellParser } from "../syntaxHighlight/cellParser/ModernCellParser";
import { Settings } from "../settings/Settings";
import { Sync } from "../sync/sync/sync";

export const FILE_DATABASE_VIEW = 'sqlseal-sqlite-file-view'

const INITIAL_QUERY = "SELECT name\nFROM sqlite_master\nWHERE type='table'"

export class FileDatabaseExplorerView extends FileView {
    constructor(
        leaf: WorkspaceLeaf,
        private manager: DatabaseManager,
        private viewPluginGenerator: ViewPluginGeneratorType,
        private rendererRegistry: RendererRegistry,
        private cellParser: ModernCellParser,
        private settings: Settings,
        private sync: Sync,
    
    ) {
        super(leaf)
    }
    getViewType(): string {
        return FILE_DATABASE_VIEW
    }
    getDisplayText(): string {
        return this.file?.basename || 'Database'
    }

    async onOpen() {
    }

    onPaneMenu(menu: Menu, source: "more-options" | "tab-header" | string): void {
        menu.addItem(i => i.setTitle('test'))
    }

    db: MemoryDatabase
    async onLoadFile(file: TFile): Promise<void> {
        const db = await this.manager.getDatabaseConnection(file)
        await db.connect()
        this.db = db

        // GETTING ALL TABLES
        this.schema = db.getSchema()
        this.render()
    }

    schema: TableInfo[]
    render() {
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
                this.db as any, // FIXME
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

        const editor = new Editor(codeblockProcessorGenerator, this.viewPluginGenerator,this.app, INITIAL_QUERY, this.db)

        editor.render(this.contentEl)

        // const vis = new SchemaVisualiser(this.schema)
        // vis.show(container)

    }

    getIcon(): IconName {
        return 'database'
    }

}