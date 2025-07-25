import { args, BusBuilder } from "@hypersphere/omnibus"
import { App, ButtonComponent } from "obsidian"
import { NewGlobalTableModal, TableConfiguration } from "../modal/NewGlobalTableModal"

export class MenuBar {

    private bus =(new BusBuilder())
        .register('new-table', args<TableConfiguration>())
        .build()

    constructor(private el: HTMLDivElement, private app: App) {
        this.show()
    }

    get events() {
        return this.bus.getRegistrator()
    }

    openNewTableModal() {
        const modal = new NewGlobalTableModal(this.app)
        modal.open()
        modal.bus.on('data', d => this.bus.trigger('new-table', d))
    }

    private show() {
        this.el.empty()
        this.addButton('Create New Table', () => this.openNewTableModal(), true)
    }

    private addButton(text: string, onClick: () => void, cta: boolean = false) {
        const btn = new ButtonComponent(this.el)
            .setButtonText(text)
            .onClick(onClick)

        if (cta) {
            btn.setCta()
        }
    }
}