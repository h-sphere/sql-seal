import { args, BusBuilder } from "@hypersphere/omnibus"
import { ButtonComponent } from "obsidian"

export class EditorMenuBar {
    bus = new BusBuilder()
        .register('play', args<[]>())
        .register('structure', args<[ButtonComponent]>())
        .register('globals', args<[]>())
        .build()
    constructor(private fileDatabasePreview: boolean = false) {

    }

    strucureButton: ButtonComponent
    render(el: HTMLElement) {
        const container = el.createDiv({ cls: 'sqlseal-menubar-container' })
        new ButtonComponent(container)
        .setIcon('play')
        .setClass('sqlseal-menubar-button')
        .setTooltip('Run (CMD+R)', {
            placement: 'bottom',
            delay: 1
        })
        .onClick(() => this.bus.trigger('play'))

        if (this.fileDatabasePreview) {
            const b = new ButtonComponent(container)
            .setIcon('database')
            .setClass('sqlseal-menubar-button')
            .setTooltip('Structure', {
                placement: 'bottom',
                delay: 1
            })
            .onClick(() => {
                const but = b
                this.bus.trigger('structure', but as any)
            })
        }

        container.createDiv({ cls: 'separator' })

        if (!this.fileDatabasePreview) {
            // global button
            const b = new ButtonComponent(container)
            .setIcon('bolt')
            .setClass('sqlseal-menubar-button')
            .setTooltip('Global Tables', { delay: 1, placement: 'bottom' })
            .onClick(() => {
                this.bus.trigger('globals')
            })
        }
    }

    get events() {
        return this.bus.getRegistrator()
    }
}