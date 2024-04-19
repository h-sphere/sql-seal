import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, FileManager, Vault } from 'obsidian';
import Database from 'better-sqlite3'
import type { Database as DBtype } from 'better-sqlite3'
import { SqliteError } from 'better-sqlite3'
import path from 'path'
import Papa from 'papaparse';


// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

function isNumeric(str: string) {
	if (typeof str != "string") return false // we only process strings!  
	return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
		   !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }


const toTypeStatements = (header: Array<string>, data: Array<Record<string, string>>) => {
	let d: Array<Record<string, string|number>> = data
	let types: Record<string, ReturnType<typeof predictType>> = {}
	header.forEach(key => {
		const type = predictType(key, data)
		console.log('TYPE:', key, type)
		if (type === 'REAL' || type === 'INTEGER') {
			// converting all data here to text
			d = d.map(record => ({
				...record,
				[key]: type === 'REAL'
					? parseFloat(record[key] as string)
					: parseInt(record[key] as string)
			}))
		}

		types[key] = type
	})

	return {
		data: d,
		types
	}
}

const predictType = (field: string, data: Array<Record<string, string>>) => {

	if (field === 'id') {
		return 'TEXT'
	}

	const canBeNumber = data.reduce((acc, d) => acc && isNumeric(d[field]), true)
	if (canBeNumber) {

		// Check if Integer or Float
		const canBeInteger = data.reduce((acc, d) => acc && parseFloat(d[field]) === parseInt(d[field]), true)
		if (canBeInteger) {
			return 'INTEGER'
		}

		return 'REAL'
	}
	return 'TEXT'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		// await this.loadSettings();

		// // This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
		// 	// Called when the user clicks the icon.
		// 	new Notice('This is a notice!');
		// });
		// // Perform additional things with the ribbon
		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		// // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		// // This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: 'open-sample-modal-simple',
		// 	name: 'Open sample modal (simple)',
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	}
		// });
		// // This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'sample-editor-command',
		// 	name: 'Sample editor command',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection('Sample Editor Command');
		// 	}
		// });
		// // This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'open-sample-modal-complex',
		// 	name: 'Open sample modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	}
		// });

		// // This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new SampleSettingTab(this.app, this));

		// // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// // Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));


		// const database = Database('db.sqlite3')
		
		// console.log('DB', database)

		// const db = new sqlite.Database(':memory:')
		// console.log(db)


		//@ts-ignore
		const defaultDbPath = path.resolve(this.app.vault.adapter.basePath, this.app.vault.configDir, "obsidian.db")
    	const db = new Database(defaultDbPath, { /* verbose: console.log */ })
		const savedDatabases: any = {}

		const defineDatabaseFromUrl = async (name: string, url: string) => {
			if (savedDatabases[name]) {
				console.log('Database Exists', name)
				return
			}
			const file = this.app.vault.getFileByPath(url)
				if (!file) {
					console.log('File not found')
					return
				}
				const data = await this.app.vault.cachedRead(file)

				const parsed = Papa.parse(data, {
					header: true,
					dynamicTyping: false,
					skipEmptyLines: true
				})
				const fields = parsed.meta.fields
				const { data: parsedData, types } = toTypeStatements(fields, parsed.data)

				const sqlFields = Object.entries(types).map(([key, type]) => `${key} ${type}`).join(',\n')
				// FIXME: probably use schema generator, for now create with hardcoded fields
				await db.prepare(`DROP TABLE IF EXISTS ${name}`).run()
				const createSQL = `CREATE TABLE IF NOT EXISTS ${name} (
					${sqlFields}
				);`

				await db.prepare(createSQL).run()
				savedDatabases[name] = url

				// Purge the database
				await db.prepare(`DELETE FROM ${name}`).run()

				const insert = db.prepare(`INSERT INTO ${name} (${fields.join(', ')}) VALUES (${fields.map(key => '@' + key).join(', ')})`);
				const insertMany = db.transaction(pData => {
					pData.forEach(data => {
						try {
						insert.run(data)
						} catch (e) {
							console.log(e)
						}
					})
				})

				await insertMany(parsedData)

		}

		const displayData = (el: HTMLElement, columns, data) => {
			const table = el.createEl("table")

			// HEADER
			const header = table.createEl("thead").createEl("tr")
			columns.forEach(c => {
				header.createEl("th", { text: c })
			})

			const body = table.createEl("tbody")
			data.forEach(d => {
				const row = body.createEl("tr")
				columns.forEach(c => {
					row.createEl("td", { text: d[c] })

				})
			})
		}

		const displayError = (el: HTMLElement, e: Error) => {
			const callout = el.createEl("div", { text: e.toString(), cls: 'callout' })
			callout.dataset.callout = 'error'
		}

		// FIXME: registering here
		this.registerMarkdownCodeBlockProcessor("sql",  async (source, el, ctx) => {
			const regex = /TABLE\s+(.+)\s+=\s+file\(([^)]+)\)/g;
			let match
			while ((match = regex.exec(source)) !== null) {
				const name = match[1];
				const url = match[2];
				defineDatabaseFromUrl(name, url)
			}

			const selectRegexp = /SELECT\s+(.*)/g;
			const selectMatch = selectRegexp.exec(source)
			if (selectMatch) {
				try {
					const stmt = await db.prepare(selectMatch[0])
					const columns = await stmt.columns().map(column => column.name);
					const data = await stmt.all()
					displayData(el, columns, data)
				} catch (e) {
					displayError(el, e)
				}
			}

		})

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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
