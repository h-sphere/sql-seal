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
		const sqlSeal = new SqlSeal(this.app, false)
		this.registerMarkdownCodeBlockProcessor("sqlseal",  sqlSeal.getHandler())
		await sqlSeal.connect()
		
		this.sqlSeal = sqlSeal


		this.fileSync = new SealFileSync(this.app, sqlSeal, this)
		// start syncing when files are loaded
		this.app.workspace.onLayoutReady(() => {
			this.fileSync.init()
		})

	// this.addSettingTab(new SqlSealSettingsTab(this.app, this));

	}

	onunload() {
		if (this.fileSync) {
			this.fileSync.destroy();
		}
		this.sqlSeal.db.disconect();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

