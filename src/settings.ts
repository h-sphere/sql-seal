import SqlSealPlugin from "main";
import { App, ButtonComponent, PluginSettingTab, Setting } from "obsidian";

export interface SqlSealSettings {
    rows: RowSettings[];
}

interface RowSettings {
    name: string;
    type: string;
    dynamicField: string;
}


export class SqlSealSettingsTab extends PluginSettingTab {
    plugin: SqlSealPlugin;

    constructor(app: App, plugin: SqlSealPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Rows')
            .setDesc('Configure your rows')
            .addButton((button: ButtonComponent) => {
                button
                    .setButtonText('Add row')
                    .onClick(async () => {
                        this.plugin.settings.rows.push({ name: '', type: 'File', dynamicField: '' });
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });

        for (let i = 0; i < this.plugin.settings.rows.length; i++) {
            const row = this.plugin.settings.rows[i];
            this.displayRow(containerEl, row, i);
        }
    }

    displayRow(containerEl: HTMLElement, row: RowSettings, index: number) {
        const rowContainer = containerEl.createDiv({ cls: 'setting-item' });

        new Setting(rowContainer)
            .setName('Name')
            .addText(text => text
                .setValue(row.name)
                .onChange(async (value) => {
                    this.plugin.settings.rows[index].name = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(rowContainer)
            .setName('Type')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'File': 'File',
                    'SQL': 'SQL'
                })
                .setValue(row.type)
                .onChange(async (value) => {
                    this.plugin.settings.rows[index].type = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (row.type === 'File') {
            new Setting(rowContainer)
                .setName('File selector')
                .addText(text => {
                    text
                    .setPlaceholder('Select file')
                    .setValue(row.dynamicField)
                    .onChange(async (value) => {
                        this.plugin.settings.rows[index].dynamicField = value;
                        await this.plugin.saveSettings();
                    })
                    text.setPlaceholder(`'Start typing to search for a file in your vault.`)
                    text.inputEl.autocomplete = 'on'
                    text.inputEl.setAttr('list', `file-list${index}`)
                    // .setDesc('Start typing to search for a file in your vault.')
                    // .inputEl.autocomplete = 'on'
                    // .inputEl.setAttribute('list', `file-list-${index}`)
                });

            // Create a datalist element for autocomplete
            const datalist = rowContainer.createEl('datalist', { attr: { id: `file-list-${index}` } });
            for (const file of this.app.vault.getFiles()) {
                const option = document.createElement('option');
                option.value = file.path;
                datalist.appendChild(option);
            }
        } else if (row.type === 'SQL') {
            new Setting(rowContainer)
                .setName('SQL Code')
                .addTextArea(textarea => textarea
                    .setValue(row.dynamicField)
                    .onChange(async (value) => {
                        this.plugin.settings.rows[index].dynamicField = value;
                        await this.plugin.saveSettings();
                    }));
        }

        rowContainer.createEl('button', {
            text: 'Remove',
            cls: 'mod-remove',
        }).onClickEvent(async () => {
            this.plugin.settings.rows.splice(index, 1);
            await this.plugin.saveSettings();
            this.display();
        })
    }
}