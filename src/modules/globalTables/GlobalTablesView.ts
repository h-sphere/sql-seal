import { IconName, ItemView, Vault, WorkspaceLeaf } from "obsidian";
import { MenuBar } from "./GlobalTablesView/MenuBar";
import { FileConfig } from "./FileConfig";
import { TableConfiguration } from "./modal/NewGlobalTableModal";
import { GridRenderer } from "../editor/renderer/GridRenderer";
import { createGrid, GridApi, themeQuartz } from "ag-grid-community";
import { ConfigCellRenderer } from "./cells/ConfigCell";
import { StatsRenderer } from "./cells/StatsRenderer";
import { ActionCellRenderer } from "./cells/ActionCell";

export const GLOBAL_TABLES_VIEW_TYPE = "sqlseal-global-tables";

export class GlobalTablesView extends ItemView {
	config: FileConfig<TableConfiguration>;
	constructor(leaf: WorkspaceLeaf, vault: Vault) {
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

    api: GridApi | null = null

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		const c = container.createDiv({ cls: "sqlseal-global-tables-container" });
		const el = c.createEl("div");

		const menuBar = new MenuBar(el, this.app);

		await this.config.load();

		menuBar.events.on("new-table", async (data) => {
			console.log("New table creation requested", data);
			await this.config.insert(data);
            this.refresh()
		});

		// el.createDiv({ text: 'HELLO FROM SQLSEAL GLOBAL TABLES VIEW' })

		const gridEl = c.createDiv({ cls: "sql-seal-csv-viewer" });
		const myTheme = themeQuartz.withParams({
			borderRadius: 0,
			browserColorScheme: "light",
			headerFontSize: 14,
			headerRowBorder: false,
			headerVerticalPaddingScale: 1,
			rowBorder: false,
			spacing: 16,
			wrapperBorder: false,
			wrapperBorderRadius: 0,
		});

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
                suppressMovable: true
			},
			autoSizeStrategy: {
				type: "fitGridWidth",
			},
			columnDefs: [
				{ field: "name" },
				{ field: "config.type" },
				{ field: "config", cellRenderer: ConfigCellRenderer },
				{ field: "name", cellRenderer: StatsRenderer, headerName: "Stats"  },
                { cellRenderer: ActionCellRenderer, headerName: "Actions" }
			],
            context: this
		});
	}

	get gridData() {
		console.log("ITEMS", this.config.items);
		return this.config.items;
	}

    async deleteElement(e: TableConfiguration) {
        await this.config.remove(e)
        this.refresh()
    }

    refresh() {
        this.api?.setGridOption("rowData", this.gridData);
    }

	async onClose() {
		// Clean up if needed
	}
}
