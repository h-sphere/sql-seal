export interface ColumnInfo {
    name: string
    type: string
}
export interface TableInfo {
    name: string
    columns: ColumnInfo[]
}

export class TableVisualiser {
    constructor(private info: TableInfo) {

    }

    show(el: HTMLElement) {
        const cont = el.createDiv({ cls: 'sqlseal-tv-table' })
        cont.createDiv({ cls: 'sqlseal-tv-table-name', text: this.info.name })
        const columns = cont.createEl('ul', { cls: 'sqlseal-tv-columns' })
        this.info.columns.forEach(info => {
            columns.appendChild(this.createColumn(info))
        })
    }

    createColumn(info: ColumnInfo) {
        const row = createEl('li')
        row.createEl('span', { text: info.name, cls: 'sqlseal-tv-column-name'  })
        row.createEl('span', { text: info.type, cls: 'sqlseal-tv-column-class' })
        return row
    }
}