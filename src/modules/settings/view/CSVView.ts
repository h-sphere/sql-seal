import { WorkspaceLeaf, TextFileView, Menu, MenuItem } from "obsidian";
import { parse, unparse } from "papaparse";
import {
	GridRenderer,
	GridRendererCommunicator,
} from "../../editor/renderer/GridRenderer";
import { errorNotice } from "../../../utils/notice";
import { ConfigObject, loadConfig, saveConfig } from "src/utils/csvConfig";
import { ColumnType } from "../../../utils/types";
import { Settings } from "../Settings";
import { RenameColumnModal } from "../modal/renameColumnModal";
import { CodeSampleModal } from "../modal/showCodeSample";
import { DeleteConfirmationModal } from "../modal/deleteConfirmationModal";

const delay = (n: number) => new Promise((resolve) => setTimeout(resolve, n));

export const CSV_VIEW_TYPE = "csv-viewer" as const;
export const CSV_VIEW_EXTENSIONS = ["csv"];

export class CSVView extends TextFileView {
	private content: string;
	private table: HTMLTableElement;
	private config: ConfigObject;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly settings: Settings,
	) {
		super(leaf);
	}

	getViewType(): string {
		return CSV_VIEW_TYPE;
	}

	getDisplayText(): string {
		return this.file?.basename || "CSV Viewer";
	}

	async onload(): Promise<void> {
		super.onload();
		this.contentEl.addClass("csv-viewer-container");
	}

	async onOpen() {
		this.renderCSV();
	}

	async onClose() {
		// Cleanup if needed
	}

	async setViewData(data: string, clear: boolean): Promise<void> {
		this.content = data;
		await this.renderCSV();
	}

	getViewData(): string {
		return this.content;
	}

	clear(): void {
		this.content = "";
		this.table.empty();
	}

	private result: any;
	updateRow(newRowData: Record<string, any>) {
		this.result.data[parseInt(newRowData.__index, 10)] = newRowData;
		this.saveData(true);
	}

	deleteRow(idx: number) {
		this.result.data.splice(idx, 1);
		this.saveData();
	}

	deleteColumn(column: string) {
		this.result.fields = this.result.fields.filter((c: string) => c !== column);
		this.saveData();
	}

	addNewColumn(columnName: string) {
		if (this.result.fields.indexOf(columnName) > -1) {
			throw new Error("Column already exists");
		}
		this.result.fields.push(columnName);
		this.result.data = this.result.data.map((d: any) => ({
			[columnName]: "",
			...d,
		}));
		this.saveData();
	}

	renameColumn(oldName: string, newName: string) {
		if (!newName) {
			return;
		}
		if (this.result.fields.contains(newName)) {
			errorNotice("Column already exists");
			return;
		}
		const oldNameIdx = this.result.fields.indexOf(oldName);
		if (oldNameIdx < 0) {
			errorNotice("Old column does not exist");
			return;
		}
		this.result.fields[oldNameIdx] = newName;
		this.result.data = this.result.data.map((d: Record<string, unknown>) => {
			d[newName] = d[oldName];
			delete d[oldName];
			return d;
		});
		this.saveData();
		this.loadDataIntoGrid();
	}

	setIsEditable(newValue: boolean) {
		this.settings.set("enableEditing", newValue);
		// FIXME: if there already rendered view, use this to rerender it?
	}

	saveData(noRefresh: boolean = false) {
		if (noRefresh) {
			this.refreshSkip = Date.now() + 500;
		}

		// Map results
		const res = [...this.result.data].map((r) => {
			const r2 = { ...r };
			Object.keys(r).forEach((k) => {
				if (typeof r[k] === "boolean") {
					r2[k] = r[k] ? 1 : 0;
				}
			});
			return r2;
		});

		const output = unparse({ ...this.result, data: res });
		this.app.vault.modify(this.file!, output);
		this.refreshTypes();
	}

	createRow() {
		this.result.data.push(
			this.result.fields.reduce(
				(acc: Record<string, any>, f: string) => ({ ...acc, [f]: "" }),
				{},
			),
		);
		this.saveData();
	}

	getColumnType(columnName: string) {
		if (this.config.columnDefinitions[columnName]) {
			return this.config.columnDefinitions[columnName].type;
		}
		return "auto";
	}

	async changeColumnType(columnName: string, type: ColumnType) {
		const prev = this.config.columnDefinitions[columnName] ?? {};
		this.config.columnDefinitions[columnName] = {
			...prev,
			type: type,
		};
		await this.saveConfig();
	}

	async loadConfig() {
		while (!this.file) {
			await delay(100);
		}
		this.config = await loadConfig(this.file, this.app.vault);
	}

	async saveConfig() {
		await saveConfig(this.file!, this.config, this.app.vault);
	}

	private getColumnConfigurations(columns: string[]) {
		return columns.map((f) => {
			if (!this.config) {
				return {
					field: f,
				};
			}
			const def = this.config.columnDefinitions[f]?.type;
			if (!def || def === "auto") {
				return { field: f };
			}
			if (def === "date") {
				return {
					field: f,
					cellDataType: "dateString",
				};
			}
			return {
				field: f,
				cellDataType: def,
			};
		});
	}

	refreshTypes() {
		if (this.gridCommunicator) {
			const columns = this.result.fields;
			if (columns && columns.length) {
				this.gridCommunicator.gridApi.setGridOption(
					"columnDefs",
					this.getColumnConfigurations(columns),
				);
			}
		}
	}

	moveColumn(name: string, toIndex: number) {
		let fields = this.result.fields as Array<string>;
		fields = fields.filter((f) => f !== name);
		fields = [...fields.slice(0, toIndex), name, ...fields.slice(toIndex)];
		this.result.fields = fields;
		this.saveData();
	}

	api: any = null;
	gridCommunicator: GridRendererCommunicator | null = null;
	refreshSkip: number = 0;

	formatWithTypes(d: Record<string, string | boolean | number>) {
		Object.entries(this.config.columnDefinitions).forEach(([key, value]) => {
			if (!d[key]) {
				return;
			}
			if (value.type === "boolean") {
				if (d[key] === "false" || d[key] === "0") {
					d[key] = false;
				}
				d[key] = !!d[key];
			}
			if (value.type === "number") {
				if (d[key] === null || d[key] === "") {
					d[key] = "";
				} else {
					d[key] = parseFloat(d[key] as string);
				}
			}
			if (value.type === "date") {
				// try parsing
				const val = d[key] as string;
				const date = new Date(val);
				d[key] = date.toISOString().split("T")[0];
			}
		});
		return d;
	}

	prepareData() {
		const result = parse(this.content, {
			header: true,
			skipEmptyLines: true,
		});
		const data = result.data.map((d: any, i) => ({
			...this.formatWithTypes(d),
			__index: i.toString(),
		}));
		return {
			data: data,
			fields: result.meta.fields,
		};
	}

	loadDataIntoGrid() {
		if (this.refreshSkip > Date.now()) {
			return;
		}
		requestAnimationFrame(() => {
			const result = this.prepareData();
			this.result = result;
			this.refreshTypes();
			this.api!.render(result);
		});
	}

	isLoading: boolean = false;

	private async renderCSV() {
		if (this.isLoading) {
			if (this.api) {
				this.loadDataIntoGrid();
			}
			return;
		}
		this.isLoading = true;

		this.contentEl.empty();
		const csvEditorDiv = this.contentEl.createDiv({
			cls: "sql-seal-csv-editor",
		});

		const buttonsRow = csvEditorDiv.createDiv({
			cls: "sql-seal-csv-viewer-buttons",
		});
		await this.loadConfig();
		if (this.settings.get("enableEditing")) {
			const createColumn = buttonsRow.createEl("button", {
				text: "Add Column",
			});
			const createRow = buttonsRow.createEl("button", { text: "Add Row" });

			createColumn.addEventListener("click", (e) => {
				e.preventDefault();
				const modal = new RenameColumnModal(this.app, (res) => {
					this.addNewColumn(res);
				});
				modal.open();
			});

			createRow.addEventListener("click", (e) => {
				e.preventDefault();
				this.createRow();
			});
		}
		const generateSqlCode = buttonsRow.createEl("button", {
			text: "Generate SQLSeal code",
		});
		const gridEl = csvEditorDiv.createDiv({ cls: "sql-seal-csv-viewer" });

		generateSqlCode.addEventListener("click", (e) => {
			e.preventDefault();
			if (!this.file) {
				return;
			}
			const modal = new CodeSampleModal(this.app, this.file);
			modal.open();
		});

		const grid = new GridRenderer(this.settings, null, this.app);
		const csvView = this;
		const data = this.prepareData();
		this.result = data;
		const api = grid.render(
			{
				columnDefs: this.getColumnConfigurations(data.fields ?? []),
				defaultColDef: {
					editable: this.settings.get("enableEditing"),
					headerComponentParams: {
						enableMenu: this.settings.get("enableEditing"),
						showColumnMenu: function (e: any) {
							const menu = new Menu();

							menu.addItem((item) => {
								item.setTitle("Rename Column");
								item.onClick(() => {
									const modal = new RenameColumnModal(csvView.app, (res) => {
										csvView.renameColumn(
											this.column.userProvidedColDef.field,
											res,
										);
									});
									modal.open();
								});
							});

							menu.addItem((item) => {
								item.setTitle("Delete Column");
								item.onClick(() => {
									const colName = this.column.userProvidedColDef.field;
									const modal = new DeleteConfirmationModal(
										csvView.app,
										`column ${colName}`,
										() => {
											csvView.deleteColumn(colName);
										},
									);
									modal.open();
								});
							});

							// FIXME: rework it to submenus.
							menu.addSeparator();
							menu.addItem((item) => {
								// item.setDisabled(true)
								item.setTitle("Data Type");
								// item.setIsLabel(true)
								const ipfSubmenu = (item as any).setSubmenu();
								const types = [
									"auto",
									"text",
									"number",
									"boolean",
									"date",
								] as ColumnType[];

								const colName = this.column.userProvidedColDef.field;

								const current = csvView.getColumnType(colName);
								types.forEach((type) => {
									ipfSubmenu.addItem((subItem: MenuItem) => {
										const checkbox = type === current ? "✓ " : "";
										subItem.setTitle(checkbox + type);
										subItem.onClick(() => {
											csvView.changeColumnType(colName, type);
											csvView.refreshTypes();
											csvView.loadDataIntoGrid();
										});
									});
								});
							});

							const pos = e.getBoundingClientRect();
							menu.showAtPosition({ x: pos.x, y: pos.y + 20 });
						},
					},
				},
				enableCellTextSelection: false,
				ensureDomOrder: false,
				paginationAutoPageSize: true,
				suppressMovableColumns: false,
				onColumnMoved: (e) => {
					if (!e.finished) {
						return;
					}
					const columnName = e.column?.getUserProvidedColDef();
					if (!columnName) {
						return;
					}
					csvView.moveColumn(columnName?.field!, e.toIndex!);
				},
				domLayout: "normal",
				getRowId: (p) => p.data.__index,
				onCellValueChanged: (event) => {
					if (event.rowIndex === null) {
						return;
					}
					this.updateRow(event.data);
				},
				onCellContextMenu: (e) => {
					if (!this.settings.get("enableEditing")) {
						return;
					}
					const menu = new Menu();
					menu.addItem((item) => {
						item.setTitle("Delete Row");
						item.onClick(() => {
							const modal = new DeleteConfirmationModal(
								csvView.app,
								`row`,
								() => {
									csvView.deleteRow(e.data.__index);
								},
							);
							modal.open();
						});
					});
					menu.showAtMouseEvent(e.event as any);
				},
			},
			gridEl,
			{ sourcePath: this.file?.path || "" },
		);
		this.api = api;
		this.gridCommunicator = api.communicator;
		api.render(data);
	}
}
