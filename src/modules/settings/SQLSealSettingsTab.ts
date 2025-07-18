import { makeInjector } from '@hypersphere/dity';
import { App, PluginSettingTab, Setting, Plugin } from 'obsidian';
import { MainModule } from '../container';
import { SettingsModule } from './module';
import { Settings } from './Settings';

export interface SQLSealSettings {
    enableViewer: boolean;
    enableEditing: boolean;
    enableJSONViewer: boolean;
    enableDynamicUpdates: boolean;
    enableSyntaxHighlighting: boolean;
    defaultView: 'grid' | 'markdown' | 'html';
    gridItemsPerPage: number
}

export const DEFAULT_SETTINGS: SQLSealSettings = {
    enableViewer: true,
    enableEditing: true,
    enableJSONViewer: true,
    enableDynamicUpdates: true,
    enableSyntaxHighlighting: true,
    defaultView: 'grid',
    gridItemsPerPage: 20
};


@(makeInjector<SettingsModule>()(['app', 'plugin', 'settings']))
export class SQLSealSettingsTab extends PluginSettingTab {
    plugin: Plugin;
    settings: SQLSealSettings;
    private onChangeFns: Array<(setting: SQLSealSettings) => void> = []

    constructor(app: App, plugin: Plugin, settings: Settings) {
        super(app, plugin);
        this.plugin = plugin;
        this.settings = settings;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'CSV File Viewer' });

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

        containerEl.createEl('h3', { text: 'JSON File Viewer' });
        new Setting(containerEl)
            .setName('Enable JSON Viewer')
            .setDesc('Enables JSON and JSON5 files in your files explorer and allows to preview them.')
            .addToggle(toggle => toggle
                .setValue(this.settings.enableJSONViewer)
                .onChange(async (value) => {
                    this.settings.enableJSONViewer = value;
                    if (!value) {
                        this.settings.enableJSONViewer = false;
                    }
                    await this.plugin.saveData(this.settings);
                    this.display();
                    this.callChanges()
                }));

        containerEl.createEl('h3', { text: 'Behavior' });
        new Setting(containerEl)
            .setName('Enable Dynamic Updates')
            .setDesc('SQLSeal will refresh your tables when underlying data changes.')
            .addToggle(toggle => toggle
                .setValue(this.settings.enableDynamicUpdates)
                .onChange(async (value) => {
                    this.settings.enableDynamicUpdates = value;
                    if (!value) {
                        this.settings.enableDynamicUpdates = false;
                    }
                    await this.plugin.saveData(this.settings);
                    this.display();
                    this.callChanges()
                }));
        new Setting(containerEl)
            .setName('Enable Syntax Highlighting')
            .setDesc('Syntax will get highlighted when editing SQLSeal code')
            .addToggle(toggle => toggle
                .setValue(this.settings.enableSyntaxHighlighting)
                .onChange(async (value) => {
                    this.settings.enableSyntaxHighlighting = value;
                    if (!value) {
                        this.settings.enableSyntaxHighlighting = false;
                    }
                    await this.plugin.saveData(this.settings);
                    this.display();
                    this.callChanges()
                }));


        containerEl.createEl('h3', { text: 'Views' });
        new Setting(containerEl)
            .setName('Default View')
            .setDesc('This view will be used by default when you don\'t provide any view definition in your query')
            .addDropdown(dropdown => dropdown
                .addOption('grid', 'Grid')
                .addOption('html', 'HTML Table')
                .addOption('markdown', 'Markdown Table')
                .setValue(this.settings.defaultView)
                .onChange(async (value) => {
                    this.settings.defaultView = value as 'grid' | 'html' | 'markdown';
                    if (!value) {
                        this.settings.defaultView = DEFAULT_SETTINGS.defaultView
                    }
                    await this.plugin.saveData(this.settings);
                    this.display();
                    this.callChanges()
                }));
        containerEl.createEl('h4', { text: 'Grid View' });
        new Setting(containerEl)
            .setName('Items per page ')
            .setDesc('How many items should display for each page of the Grid view')
            .addDropdown(dropdown => dropdown
                .addOption('20', '20')
                .addOption('50', '50')
                .addOption('100', '100')
                .setValue(this.settings.gridItemsPerPage + '')
                .onChange(async (value) => {
                    this.settings.gridItemsPerPage = parseInt(value, 10);
                    if (!value) {
                        this.settings.gridItemsPerPage = DEFAULT_SETTINGS.gridItemsPerPage
                    }
                    await this.plugin.saveData(this.settings);
                    this.display();
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