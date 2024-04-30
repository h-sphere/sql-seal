import { MarkdownRenderer, MarkdownView, Plugin } from 'obsidian';
import { SqlSealSettings, SqlSealSettingsTab } from 'src/settings';
import { SqlSeal } from 'src/sqlSeal';

const DEFAULT_SETTINGS = { rows: [] }

export default class SqlSealPlugin extends Plugin {
	settings: SqlSealSettings;

	async onload() {
		await this.loadSettings();
		const sqlSeal = new SqlSeal(this.app, true)
		this.registerMarkdownCodeBlockProcessor("sqlseal",  sqlSeal.getHandler())

// or onload
	this.app.workspace.iterateAllLeaves((leaf) => {
		if (leaf.view && leaf.view instanceof MarkdownView) {
			const editorView = (leaf.view.editor as any).cm;
			console.log('EDITOR VIEW', editorView)
			// ...
		}
	})
// })
// 		MarkdownRenderer.registerLanguage({
// 			id: "sqlseal",
// 			codeMirrorMode: "sql",
// 			name: "sqlseal",
// 		  });

		this.addSettingTab(new SqlSealSettingsTab(this.app, this));

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

