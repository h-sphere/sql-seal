import { IconName, ItemView, Vault, WorkspaceLeaf } from "obsidian";
import { MenuBar } from "./GlobalTablesView/MenuBar";
import { FileConfig } from "./FileConfig";
import { TableConfiguration } from "./modal/NewGlobalTableModal";
import { GridRenderer } from "../editor/renderer/GridRenderer";
import { createGrid, GridApi, themeQuartz } from "ag-grid-community";
import { ConfigCellRenderer } from "./cells/ConfigCell";
import { StatsRenderer } from "./cells/StatsRenderer";
import { ActionCellRenderer } from "./cells/ActionCell";
import { Sync } from "../sync/sync/sync";
import { ParserTableDefinition } from "../sync/syncStrategy/types";
import { throttle } from "lodash";

export const GLOBAL_TABLES_VIEW_TYPE = "sqlseal-global-tables";

const GLOBAL_SOURCE_FILE = "/";

export class GlobalTablesView extends ItemView {
	config: FileConfig<TableConfiguration>;
	constructor(
		leaf: WorkspaceLeaf,
		vault: Vault,
		public sync: Sync,
	) {
		super(leaf);
		this.config = new FileConfig("__globalviews.sqlseal", vault);
	}

	getViewType() {
		return GLOBAL_TABLES_VIEW_TYPE;
	}

	getDisplayText() {
		return "SQLSeal Global Tables";
	}

	getIcon(): IconName {
		return "logo-sqlseal";
	}

	api: GridApi | null = null;
	private themeObserver: MutationObserver | null = null;

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		const c = container.createDiv({ cls: "sqlseal-global-tables-container" });
		const el = c.createEl("div");

		const menuBar = new MenuBar(el, this.app);

		await this.config.load();
		for (const conf of this.gridData) {
			this.sync.registerTable(this.getTableDefinition(conf));
		}

		menuBar.events.on("new-table", (data) => {
			this.addElement(data);
		});

		// el.createDiv({ text: 'HELLO FROM SQLSEAL GLOBAL TABLES VIEW' })

		const gridEl = c.createDiv({ cls: "sql-seal-csv-viewer" });
		
		// Get theme-aware AG Grid theme
		const currentTheme = this.getCurrentTheme();
		const myTheme = themeQuartz.withParams(this.getThemeParams(currentTheme));

		this.api = createGrid(gridEl, {
			theme: myTheme,
			detailRowAutoHeight: true,
			paginationAutoPageSize: true,
			rowData: this.gridData,
			suppressMoveWhenColumnDragging: true,
			suppressRowDrag: true,
			suppressCellFocus: true,
			suppressMaintainUnsortedOrder: true,
			suppressDragLeaveHidesColumns: true,
			suppressMoveWhenRowDragging: true,
			defaultColDef: {
				resizable: false,
				sortable: false,
				rowDrag: false,
				suppressMovable: true,
				flex: 1,
			},
			autoSizeStrategy: {
				type: "fitGridWidth",
			},
			columnDefs: [
				{ field: "name" },
				{ field: "config.type", minWidth: 50 },
				{ field: "config", cellRenderer: ConfigCellRenderer },
				{
					field: "name",
					cellRenderer: StatsRenderer,
					headerName: "Stats",
					minWidth: 200,
				},
				{ cellRenderer: ActionCellRenderer, headerName: "Actions" },
			],
			context: this,
		});

		this.setupResizeObserver(gridEl);
		this.setupThemeObserver();
	}

	// Vibe Coded.
	private smartResize() {
        if (!this.api) return;
        
        const api = this.api
        const columnApi = this.api
        const containerWidth = this.containerEl.clientWidth;
        
        // First, auto-size all columns based on content
        const allColumnIds = columnApi.getColumns()?.map(col => col.getColId()) || [];
        api.autoSizeColumns(allColumnIds);
        
        // Calculate total width needed
        const totalContentWidth = columnApi.getColumns()
            ?.reduce((sum, col) => sum + col.getActualWidth(), 0) || 0;
        
        // If content fits in container, optionally expand to fill
        if (totalContentWidth < containerWidth * 0.8) {
            // Content fits comfortably, you can choose to:
            // Option A: Leave as-is (content-based sizing)
            // Option B: Expand to fill container
            api.sizeColumnsToFit();
        }
        // If content is wider than container, keep auto-sized widths
        // This will enable horizontal scrolling automatically
    }

	get gridData() {
		return this.config.items;
	}

	async addElement(data: TableConfiguration) {
		await this.config.insert(data);
		switch (data.config.type) {
			case "csv":
			case "json":
				await this.sync.registerTable(this.getTableDefinition(data));
				break;
			case "md-table":
				console.log("NOT IMPLEMENTED YET", data);
		}
		this.refresh();
	}

	getTableDefinition(data: TableConfiguration): ParserTableDefinition {
		switch (data.config.type) {
			case "csv":
				return {
					tableAlias: data.name,
					sourceFile: GLOBAL_SOURCE_FILE,
					type: "file",
					arguments: [data.config.filename],
				};
			case 'json':
				return {
					tableAlias: data.name,
					sourceFile: GLOBAL_SOURCE_FILE,
					type: "file",
					arguments: [data.config.filename, data.config.xpath ? data.config.xpath : '$'],
				}
			case "md-table":
				throw new Error("Not implemented");
		}
	}

	async deleteElement(e: TableConfiguration) {
		await this.config.remove(e);
		const def = this.getTableDefinition(e);
		await this.sync.unregisterTable(def);
		this.refresh();
	}

	refresh() {
		this.api?.setGridOption("rowData", this.gridData);
	}

	private getCurrentTheme() {
		return document.body.classList.contains('theme-dark') ? 'dark' : 'light';
	}

	private getThemeParams(theme: 'dark' | 'light') {
		return {
			borderRadius: 0,
			browserColorScheme: theme,
			backgroundColor: "var(--color-primary)",
			chromeBackgroundColor: {
				ref: "foregroundColor",
				mix: 0.07,
				onto: "backgroundColor"
			},
			foregroundColor: "var(--text-normal)",
			headerFontSize: 14,
			headerRowBorder: false,
			headerVerticalPaddingScale: 1,
			rowBorder: false,
			spacing: 16,
			wrapperBorder: false,
			wrapperBorderRadius: 0,
		};
	}

	private updateGridTheme() {
		if (!this.api) return;
		
		const currentTheme = this.getCurrentTheme();
		const newTheme = themeQuartz.withParams(this.getThemeParams(currentTheme));
		this.api.setGridOption('theme', newTheme);
	}

	private setupThemeObserver() {
		this.themeObserver = new MutationObserver(() => {
			this.updateGridTheme();
		});
		
		this.themeObserver.observe(document.body, {
			attributes: true,
			attributeFilter: ['class']
		});
	}

	async onClose() {
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
		}
		if (this.themeObserver) {
			this.themeObserver.disconnect();
		}
		if (this.api) {
			this.api.destroy();
		}
	}
	private resizeObserver: ResizeObserver;

	private setupResizeObserver(gridContainer: HTMLElement) {
		const fn = throttle(() => this.smartResize(), 100)
		this.resizeObserver = new ResizeObserver(fn);

		this.resizeObserver.observe(gridContainer);
	}
}
