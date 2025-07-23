import { Menu, MenuItem } from "obsidian";
import { RenameColumnModal } from "../modal/renameColumnModal";
import { CSVView } from "../view/CSVView";
import { AgColumn } from "ag-grid-community";
import { DeleteConfirmationModal } from "../modal/deleteConfirmationModal";
import { ColumnType } from "../../../utils/types";

export class CSVColumnContextMenu {
	constructor(
		private csvView: CSVView,
		private column: AgColumn,
	) { }

	onRename() {
		const modal = new RenameColumnModal(this.csvView.app, (res) => {
			this.csvView.renameColumn(this.columnField, res);
		});
		modal.open();
	}

	onDelete() {
		const colName = this.columnField;
		const modal = new DeleteConfirmationModal(
			this.csvView.app,
			`column ${colName}`,
			() => {
				this.csvView.deleteColumn(colName);
			},
		);
		modal.open();
	}

	get columnField() {
		return this.column.getUserProvidedColDef()?.field!;
	}

    get config() {
        return this.csvView.getColumnConfig(this.columnField)
    }

	show(pos: { x: number; y: number }) {
		const menu = new Menu();

		menu.addItem((item) => {
			item.setTitle("Rename Column");
			item.onClick(this.onRename.bind(this));
		});

		menu.addItem((item) => {
			item.setTitle("Delete Column");
			item.onClick(this.onDelete.bind(this));
		});

        menu.addSeparator();
        menu.addItem(item => {
            const isHidden = !!this.config.isHidden
            item.setTitle(isHidden ? 'Show in queries' : 'Hide from queries')
            item.onClick(async () => {
                await this.csvView.setConfig(this.columnField, { isHidden: !isHidden })
                this.csvView.refreshTypes()
				this.csvView.saveData()
            })
        })


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

			const colName = this.columnField;

			const current = this.csvView.getColumnType(colName);
			types.forEach((type) => {
				ipfSubmenu.addItem((subItem: MenuItem) => {
					const checkbox = type === current ? "✓ " : "";
					subItem.setTitle(checkbox + type);
					subItem.onClick(() => {
						this.csvView.changeColumnType(colName, type);
						this.csvView.refreshTypes();
						this.csvView.loadDataIntoGrid();
					});
				});
			});
		});

		menu.showAtPosition(pos);
	}
}
