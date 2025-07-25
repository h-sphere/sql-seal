import { args, BusBuilder } from "@hypersphere/omnibus"
import { TFile, Vault } from "obsidian"

interface DropdownValue {
    name: string
    path: string
    originalFile: TFile
}

export class AutocompleteInput {
    constructor(parent: HTMLElement, private vault: Vault) {
        const c = parent.createDiv({ cls: 'sqlseal-autocomplete-container'})
        this.selectedEl = c.createEl('div', { cls: 'selected-el'})
        this.selectedElText = this.selectedEl.createSpan()
        this.selectedEl.createEl('button', { text: 'X'}).addEventListener('click', () => {
            this.input.show()
            this.input.value = ''
            this.selectedEl.hide()
            this.bus.trigger('change', '')
        })
        this.selectedEl.hide()
        this.input = c.createEl('input', { type: 'text' })
        this.dropdownContainer = c.createDiv({ cls: 'sqlseal-autocomplete-dropdown'})
        this.render()
    }

    bus = new BusBuilder()
        .register('item-selected', args<DropdownValue>())
        .register('change', args<string>())
        .build()

    dropdownContainer: HTMLDivElement
    input: HTMLInputElement
    dropdownValues: DropdownValue[] = []
    selectedEl: HTMLDivElement
    selectedElText: HTMLSpanElement

    render() {
        this.input.addEventListener('keydown', e => {
            requestAnimationFrame(() => {
                this.dropdownValues = this.getFilesForInput((e.target! as any).value)
                this.setDropdownValues()
            })
        })

        this.bus.on('item-selected', e => {
            this.input.value = e.originalFile.path
            this.bus.trigger('change', e.originalFile.path)
            this.dropdownValues = []
            this.setDropdownValues()

            this.selectedEl.show()
            this.selectedElText.textContent = e.originalFile.path
            this.input.hide()

        })
    }

    setDropdownValues() {
        this.dropdownContainer.empty()
        for (const val of this.dropdownValues) {
            this.dropdownContainer.appendChild(this.createDropdownOption(val))
        }
    }

    private createDropdownOption(opt: DropdownValue) {
        const el = createEl('div', { cls: 'sqlseal-dropdown-el' })
        el.createDiv({ text: opt.name, cls: 'sqlseal-dropdown-el-name' })
        el.createDiv({ text: opt.path, cls: 'sqlseal-dropdown-el-path' })
        el.addEventListener('click', e => {
            this.bus.trigger('item-selected', opt)
        })
        return el
    }

    getFilesForInput(inp: string): DropdownValue[] {
        console.log('ALL FILES', this.vault.getFiles())
        return this.vault.getFiles()
            .filter(f => f.extension === 'csv')
            .filter(f => f.path.includes(inp))
            .map(f => ({ name: f.name, path: f.parent?.path ?? '', originalFile: f }))
    }
}