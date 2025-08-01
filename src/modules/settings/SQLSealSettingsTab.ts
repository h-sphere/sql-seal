import { makeInjector } from '@hypersphere/dity';
import { App, PluginSettingTab, Setting, Plugin } from 'obsidian';
import { SettingsModule } from './module';
import { Settings } from './Settings';
import { SettingsControls } from './settingsTabSection/SettingsControls';

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
    // settings: SQLSealSettings;
    private onChangeFns: Array<(setting: SQLSealSettings) => void> = []

    constructor(app: App, plugin: Plugin, private settings: Settings) {
        super(app, plugin);
        this.plugin = plugin;
        this.settings = settings;
    }

    private controls: SettingsControls[] = []

    registerControls(...controls: SettingsControls[]) {
        this.controls = controls
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        this.controls.forEach(c => {
            c.display(containerEl.createDiv())
        })


        containerEl.createEl('h3', { text: 'Behavior' });
        new Setting(containerEl)
            .setName('Enable Dynamic Updates')
            .setDesc('SQLSeal will refresh your tables when underlying data changes.')
            .addToggle(toggle => toggle
                .setValue(this.settings.get('enableDynamicUpdates'))
                .onChange(async (value) => {
                    this.settings.set('enableDynamicUpdates', !!value)
                    // await this.plugin.saveData(this.settings);
                    this.display();
                    // this.callChanges()
                }));
        new Setting(containerEl)
            .setName('Enable Syntax Highlighting')
            .setDesc('Syntax will get highlighted when editing SQLSeal code')
            .addToggle(toggle => toggle
                .setValue(this.settings.get('enableSyntaxHighlighting'))
                .onChange(async (value) => {
                    this.settings.set('enableSyntaxHighlighting', !!value)
                    // await this.plugin.saveData(this.settings);
                    this.display();
                    // this.callChanges()
                }));


        containerEl.createEl('h3', { text: 'Views' });
        new Setting(containerEl)
            .setName('Default View')
            .setDesc('This view will be used by default when you don\'t provide any view definition in your query')
            .addDropdown(dropdown => dropdown
                .addOption('grid', 'Grid')
                .addOption('html', 'HTML Table')
                .addOption('markdown', 'Markdown Table')
                .setValue(this.settings.get('defaultView'))
                .onChange(async (value: 'grid' | 'html' | 'markdown') => {
                    this.settings.set('defaultView', value ?? DEFAULT_SETTINGS.defaultView)
                    // await this.plugin.saveData(this.settings);
                    this.display();
                    // this.callChanges()
                }));
        containerEl.createEl('h4', { text: 'Grid View' });
        new Setting(containerEl)
            .setName('Items per page ')
            .setDesc('How many items should display for each page of the Grid view')
            .addDropdown(dropdown => dropdown
                .addOption('20', '20')
                .addOption('50', '50')
                .addOption('100', '100')
                .setValue(this.settings.get('gridItemsPerPage').toString())
                .onChange(async (value) => {
                    this.settings.set('gridItemsPerPage', parseInt(value, 10) ?? DEFAULT_SETTINGS.gridItemsPerPage)
                    // await this.plugin.saveData(this.settings);
                    this.display();
                    // this.callChanges()
                }));


    }

    // private callChanges() {
    //     // this.onChangeFns.forEach(f => f(this.settings))
    // }

    onChange(fn: (settings: SQLSealSettings) => void) {
        this.settings.onChange(fn)
        // this.onChangeFns.push(fn)
    }
}