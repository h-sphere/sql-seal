import { MenuSeparator, Modal, Setting } from "obsidian";
import { AutocompleteInput } from "../autocompleteElement/AutocompleteInput";
import { args, BusBuilder } from "@hypersphere/omnibus";

export interface CSVConfig {
    type: 'csv'
    filename: string
}

export interface JsonConfig {
    type: 'json'
    filename: string
    xpath: string
}

export interface MDTable {
    type: 'md-table'
    filename: string
    selector: string
}

export interface TableConfiguration {
    name: string
    config: CSVConfig | JsonConfig | MDTable
}

export type Type = TableConfiguration['config']['type']

export class NewGlobalTableModal extends Modal {

    bus = new BusBuilder()
    .register('data', args<TableConfiguration>())
    .build()

	data: TableConfiguration = {
		name: "",
        config: {
            type: 'csv',
            filename: ''
        }
	};

    typeSectionEl: HTMLElement | null = null

	onOpen(): void {
		const { contentEl } = this;
        contentEl.closest('.modal')?.classList.add('modal-overflow')
		contentEl.createEl("h2", { text: "New Table Modal" });

		const settingsEl = contentEl.createDiv();

		const name = new Setting(settingsEl).setName("Table Name").addText((txt) =>
			txt.setPlaceholder("eg. Data").onChange((val) => {
				this.data.name = val;
			}),
		);

		const type = new Setting(settingsEl)
			.setName("Source Type")
			.addDropdown((drop) =>
				drop.addOptions({
					csv: "CSV",
					json: "JSON",
					// "md-table": "Markdown Table",
				})
                .setValue(this.data.config.type)
                .onChange(v => {
                    this.data.config.type = v as Type
                    this.renderTypeSection()
                })
			);

        this.typeSectionEl = contentEl.createDiv()
        this.renderTypeSection()

        new Setting(contentEl)
            .addButton(b => b
                .setButtonText('Add')
                .setCta()
                .onClick(() => {
                    this.bus.trigger('data', this.data)
                    this.close()
                })
            )
	}

	renderTypeSection() {
        if (!this.typeSectionEl) {
            return
        }
        const el = this.typeSectionEl
        el.empty()

        switch (this.data.config.type) {
            case 'csv':
                this.renderCsvSection()
                break
            case 'json':
                this.renderJsonSection()
                break
            case 'md-table':
                break
            default:
                break
        }
    }

    renderCsvSection() {
        const filename = new Setting(this.typeSectionEl!)
        .setName('Filename')
        const autocomplete = new AutocompleteInput(filename.controlEl, this.app.vault, ['csv'])
        autocomplete.bus.on('change', (path) => {
            this.data.config.filename = path
        })
    }

    renderJsonSection() {
        const filename = new Setting(this.typeSectionEl!)
        .setName('Filename')
        const autocomplete = new AutocompleteInput(filename.controlEl, this.app.vault, ['json', 'json5'])
        autocomplete.bus.on('change', (path) => {
            this.data.config.filename = path
        })

        const xpath = new Setting(this.typeSectionEl!)
            .setName('Selector')
            .addText(c => c.setPlaceholder('$.[0]')
            .onChange(e => {
                (this.data.config as JsonConfig).xpath = e
            }))

    }
}
