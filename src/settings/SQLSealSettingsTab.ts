import { App, PluginSettingTab, Setting, Plugin } from 'obsidian';

export interface SQLSealSettings {
    enableViewer: boolean;
    enableEditing: boolean;
}

export const DEFAULT_SETTINGS: SQLSealSettings = {
    enableViewer: true,
    enableEditing: true
};


export class SQLSealSettingsTab extends PluginSettingTab {
    plugin: Plugin;
    settings: SQLSealSettings;
    private onChangeFns: Array<(setting: SQLSealSettings) => void> = []

    constructor(app: App, plugin: Plugin, settings: SQLSealSettings) {
        super(app, plugin);
        this.plugin = plugin;
        this.settings = settings;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Enable CSV Viewer')
            .setDesc('Enables CSV files in your vault and adds ability to display them in a grid.')
            .addToggle(toggle => toggle
                .setValue(this.settings.enableViewer)
                .onChange(async (value) => {
                    this.settings.enableViewer = value;
                    if (!value) {
                        this.settings.enableEditing = false;
                    }
                    await this.plugin.saveData(this.settings);
                    this.display();
                    this.callChanges()
                }));

        new Setting(containerEl)
            .setName('Enable CSV Editing')
            .setDesc('Enables Editing functions in the CSV Viewer. This will add buttons to add columns, remove individual rows and columns; and edit each entry.')
            .setDisabled(!this.settings.enableViewer)
            .addToggle(toggle => toggle
                .setValue(this.settings.enableEditing)
                .onChange(async (value) => {
                    this.settings.enableEditing = value;
                    await this.plugin.saveData(this.settings);
                    this.callChanges()
                }));
    }

    private callChanges() {
        this.onChangeFns.forEach(f => f(this.settings))
    }

    onChange(fn: (settings: SQLSealSettings) => void) {
        this.onChangeFns.push(fn)
    }
}