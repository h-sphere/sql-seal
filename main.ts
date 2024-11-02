import { Plugin } from 'obsidian';
import { SealFileSync } from 'src/SealFileSync';
import { SqlSealSettings } from 'src/settings';
import { SqlSeal } from 'src/sqlSeal';

const DEFAULT_SETTINGS = { rows: [] }

export default class SqlSealPlugin extends Plugin {
	settings: SqlSealSettings;
	fileSync: SealFileSync;
	sqlSeal: SqlSeal;

	async onload() {
		await this.loadSettings();
		const sqlSeal = new SqlSeal(this.app, false) // FIXME: set verbose based on the env.
		this.registerMarkdownCodeBlockProcessor("sqlseal",  sqlSeal.getHandler())
		this.sqlSeal = sqlSeal
		// start syncing when files are loaded
		this.app.workspace.onLayoutReady(() => {
			sqlSeal.db.connect().then(() => {
				this.fileSync = new SealFileSync(this.app, sqlSeal, this, sqlSeal.tablesManager)
			this.fileSync.init()
			})
		})

	// this.addSettingTab(new SqlSealSettingsTab(this.app, this));

	}

	onunload() {
		this.sqlSeal.db.disconect();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

