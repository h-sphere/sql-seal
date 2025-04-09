import { WorkspaceLeaf, TextFileView, Menu, Notice } from 'obsidian';
import { parse, unparse } from 'papaparse';
import { DeleteConfirmationModal } from '../modal/deleteConfirmationModal';
import { RenameColumnModal } from '../modal/renameColumnModal';
import { CodeSampleModal } from '../modal/showCodeSample';
import { GridRenderer } from '../renderer/GridRenderer';
import { errorNotice } from '../utils/notice';
import { ModernCellParser } from '../cellParser/ModernCellParser';

export const CSV_VIEW_TYPE = "csv-viewer" as const;
export const CSV_VIEW_EXTENSIONS = ['csv'];

export class CSVView extends TextFileView {
    private content: string;
    private table: HTMLTableElement;

    constructor(
        leaf: WorkspaceLeaf,
        private enableEditing: boolean,
        private cellParser: ModernCellParser
    ) {
        super(leaf);
    }

    getViewType(): string {
        return CSV_VIEW_TYPE;
    }

    getDisplayText(): string {
        return this.file?.basename || 'CSV Viewer';
    }

    async onload(): Promise<void> {
        super.onload();
        this.contentEl.addClass('csv-viewer-container');
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
        this.content = '';
        this.table.empty();
    }

    private result: any;
    updateRow(newRowData: Record<string, any>) {
        this.result.data[parseInt(newRowData.__index, 10)] = newRowData;
        this.saveData()
    }

    deleteRow(idx: number) {
        this.result.data.splice(idx, 1)
        this.saveData()
    }

    deleteColumn(column: string) {
        this.result.fields = this.result.fields.filter((c: string) => c !== column)
        this.saveData()
    }

    addNewColumn(columnName: string) {
        if (this.result.fields.indexOf(columnName) > -1) {
            throw new Error('Column already exists')
        }
        this.result.fields.push(columnName)
        this.result.data = this.result.data.map((d: any) => ({ [columnName]: '', ...d }))
        this.saveData()
    }

    renameColumn(oldName: string, newName: string) {
        if (!newName) {
            return
        }
        if (this.result.fields.contains(newName)) {
            errorNotice('Column already exists')
            return
        }
        const oldNameIdx = this.result.fields.indexOf(oldName)
        if (oldNameIdx < 0) {
            errorNotice('Old column does not exist')
            return
        }
        this.result.fields[oldNameIdx] = newName
        this.result.data = this.result.data.map((d: Record<string, unknown>) => {
            d[newName] = d[oldName]
            delete d[oldName]
            return d
        })
        this.saveData()
    }

    setIsEditable(newValue: boolean) {
        this.enableEditing = newValue
        // FIXME: if there already rendered view, use this to rerender it?
    }

    saveData() {
        const output = unparse(this.result)
        this.app.vault.modify(this.file!, output)
    }

    createRow() {
        this.result.data.push(this.result.fields.reduce((acc: Record<string, any>, f: string) => ({ ...acc, [f]: '' }), {}))
        this.saveData()

    }

    moveColumn(name: string, toIndex: number) {
        let fields = this.result.fields as Array<string>
        fields = fields.filter(f => f !== name)
        fields = [
            ...fields.slice(0, toIndex),
            name,
            ...fields.slice(toIndex)
        ]
        this.result.fields = fields
        this.saveData()
    }

    api: any = null;

    loadDataIntoGrid() {
        setTimeout(() => {

            const result = parse(this.content, {
                header: true,
                skipEmptyLines: true,
            });
            const data = result.data.map((d: any, i) => ({
                ...d,
                __index: i.toString()
            }))
            this.result = {
                data: data,
                fields: result.meta.fields
            }


            this.api!.render({
                data: data,
                columns: result.meta.fields
            })

        }, 100)
    }

    private async renderCSV() {

        if (this.api) {
            this.loadDataIntoGrid()
            return
        }

        this.contentEl.empty()
        const csvEditorDiv = this.contentEl.createDiv({ cls: 'sql-seal-csv-editor' })

        const buttonsRow = csvEditorDiv.createDiv({ cls: 'sql-seal-csv-viewer-buttons' })
        if (this.enableEditing) {
            const createColumn = buttonsRow.createEl('button', { text: 'Add Column' })
            const createRow = buttonsRow.createEl('button', { text: 'Add Row' })

            createColumn.addEventListener('click', e => {
                e.preventDefault()
                const modal = new RenameColumnModal(this.app, (res) => {
                    this.addNewColumn(res)
                })
                modal.open()
            })

            createRow.addEventListener('click', e => {
                e.preventDefault()
                this.createRow()
            })
        }
        const generateSqlCode = buttonsRow.createEl('button', { text: 'Generate SQLSeal code' })
        const gridEl = csvEditorDiv.createDiv({ cls: 'sql-seal-csv-viewer' })


        generateSqlCode.addEventListener('click', e => {
            e.preventDefault()
            if (!this.file) {
                return
            }
            const modal = new CodeSampleModal(this.app, this.file)
            modal.open()
        })


        const grid = new GridRenderer(this.app, null)
        const csvView = this;
        const api = grid.render({
            defaultColDef: {
                editable: this.enableEditing,
                headerComponentParams: {
                    enableMenu: this.enableEditing,
                    showColumnMenu: function (e: any) {
                        const menu = new Menu()

                        menu.addItem(item => {
                            item.setTitle('Rename Column')
                            item.onClick(() => {
                                const modal = new RenameColumnModal(csvView.app, (res) => {
                                    csvView.renameColumn(this.column.colId, res)
                                })
                                modal.open()
                            })
                        })

                        menu.addItem(item => {
                            item.setTitle('Delete Column')
                            item.onClick(() => {
                                this.column.colId
                                const modal = new DeleteConfirmationModal(csvView.app, `column ${this.column.colId}`, () => {
                                    csvView.deleteColumn(this.column.colId)
                                })
                                modal.open()
                            })
                        })

                        
                        const pos = e.getBoundingClientRect();
                        menu.showAtPosition({ x: pos.x, y: pos.y + 20 })
                    }
                }
            },
            enableCellTextSelection: false,
            ensureDomOrder: false,
            paginationAutoPageSize: true,
            suppressMovableColumns: false,
            onColumnMoved: (e) => {
                if (!e.finished) {
                    return
                }
                const columnName = e.column?.getUserProvidedColDef()
                if (!columnName) {
                    return
                }
                csvView.moveColumn(columnName?.field!, e.toIndex!)
            },
            domLayout: 'normal',
            getRowId: (p) => p.data.__index,
            onCellValueChanged: (event) => {
                if (event.rowIndex === null) {
                    return;
                }
                this.updateRow(event.data)
            },
            onCellContextMenu: (e) => {
                if (!this.enableEditing) {
                    return
                }
                const menu = new Menu()
                menu.addItem(item => {
                    item.setTitle('Delete Row')
                    item.onClick(() => {
                        const modal = new DeleteConfirmationModal(csvView.app, `row`, () => {
                            csvView.deleteRow(e.data.__index)
                        })
                        modal.open()
                    })
                })
                menu.showAtMouseEvent(e.event as any)
            }
        }, gridEl, { cellParser: this.cellParser, sourcePath: this.file?.path || '' })

        this.api = api;
        this.loadDataIntoGrid()
    }
}