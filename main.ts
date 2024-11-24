import { Plugin, Tasks } from 'obsidian';
import { FilesFileSyncTable } from 'src/fileSyncTable/filesTable';
import { TagsFileSyncTable } from 'src/fileSyncTable/tagsTable';
import { TasksFileSyncTable } from 'src/fileSyncTable/tasksTable';
import { GridRenderer } from 'src/renderer/GridRenderer';
import { MarkdownRenderer } from 'src/renderer/MarkdownRenderer';
import { TableRenderer } from 'src/renderer/TableRenderer';
import { RendererConfig, RendererRegistry } from 'src/rendererRegistry';
import { SealFileSync } from 'src/SealFileSync';
import { DEFAULT_SETTINGS, SQLSealSettings, SQLSealSettingsTab } from 'src/settings/SQLSealSettingsTab';
import { SqlSeal } from 'src/sqlSeal';
import { CSV_VIEW_TYPE, CSVView } from 'src/view/CSVView';

const GLOBAL_KEY = 'sqlSealApi'

export default class SqlSealPlugin extends Plugin {
	settings: SQLSealSettings;
	fileSync: SealFileSync;
	sqlSeal: SqlSeal;
	rendererRegistry: RendererRegistry = new RendererRegistry();

	async onload() {
		await this.loadSettings();
		const settingsTab = new SQLSealSettingsTab(this.app, this, this.settings)
		this.addSettingTab(settingsTab);
		settingsTab.onChange(settings => {
			this.settings = settings
			// FIXME: check how to unregister the view
			this.unregisterCSVView()
			this.registerCsvView()
		})

		await this.registerCsvView();
		this.rendererRegistry.register('sql-seal-internal-table', new TableRenderer(this.app))
		this.rendererRegistry.register('sql-seal-internal-grid', new GridRenderer(this.app))
		this.rendererRegistry.register('sql-seal-internal-markdown', new MarkdownRenderer(this.app))

		this.registerGlobalApi();
		const sqlSeal = new SqlSeal(this.app, false, this.rendererRegistry) // FIXME: set verbose based on the env.
		this.registerMarkdownCodeBlockProcessor("sqlseal", sqlSeal.getHandler())
		this.sqlSeal = sqlSeal
		// start syncing when files are loaded
		this.app.workspace.onLayoutReady(() => {
			sqlSeal.db.connect().then(() => {
				this.fileSync = new SealFileSync(this.app, this)

				this.fileSync.addTablePlugin(new FilesFileSyncTable(sqlSeal.db, this.app, sqlSeal.tablesManager, this))
				this.fileSync.addTablePlugin(new TagsFileSyncTable(sqlSeal.db, this.app, sqlSeal.tablesManager))
				this.fileSync.addTablePlugin(new TasksFileSyncTable(sqlSeal.db, this.app, sqlSeal.tablesManager))

				this.fileSync.init()
			})
		})

		// this.addSettingTab(new SqlSealSettingsTab(this.app, this));

	}

	async registerCsvView() {
		if (this.settings.enableViewer) {
			this.registerView(
				CSV_VIEW_TYPE,
				(leaf) => new CSVView(leaf, this.settings.enableEditing)
			);

			// Register the view with the workspace for .csv files
			this.registerExtensions(['csv'], CSV_VIEW_TYPE);
		}
	}

	registerGlobalApi() {
		(window as any)[GLOBAL_KEY] = {
			registerRenderer: (uniqueName: string, config: RendererConfig) => {
				this.rendererRegistry.register(uniqueName, config)
			},

			unregisterRenderer: (uniqueName: string) => {
				this.rendererRegistry.unregister(uniqueName)
			}
		}
	}

	unregisterGlobalApi() {
		(window as any)[GLOBAL_KEY] = undefined
	}

	unregisterCSVView() {
		this.app.workspace.detachLeavesOfType(CSV_VIEW_TYPE);
		this.app.viewRegistry.unregisterExtensions(['csv'])
		this.app.viewRegistry.unregisterView(CSV_VIEW_TYPE)

	}

	onunload() {
		this.sqlSeal.db.disconect();
		this.unregisterCSVView();
		this.unregisterGlobalApi();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

