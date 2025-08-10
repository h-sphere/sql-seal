import { TableInfo, TableVisualiser } from "./TableVisualiser"

export class SchemaVisualiser {
    constructor(private info: TableInfo[]) { }

    show(container: HTMLElement) {
        container.empty()
        
        const c = container.createDiv({ cls: 'sqlseal-tv-container' })
        this.info
        .map(i => new TableVisualiser(i))
        .forEach(v => v.show(c))
    }
}