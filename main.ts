import { MarkdownRenderer, MarkdownView, Plugin } from 'obsidian';
import { SealFileSync } from 'src/SealFileSync';
import { SqlSealSettings, SqlSealSettingsTab } from 'src/settings';
import { SqlSeal } from 'src/sqlSeal';

const DEFAULT_SETTINGS = { rows: [] }

export default class SqlSealPlugin extends Plugin {
	settings: SqlSealSettings;

	async onload() {
		await this.loadSettings();
		const sqlSeal = new SqlSeal(this.app, false)
		this.registerMarkdownCodeBlockProcessor("sqlseal",  sqlSeal.getHandler())

		// const fileSync = new SealFileSync(this.app, sqlSeal)
		// setTimeout(() => {
		// 	fileSync.init()
		// }, 5000)

	// this.addSettingTab(new SqlSealSettingsTab(this.app, this));




	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

