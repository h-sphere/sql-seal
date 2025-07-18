import { Menu, Plugin, TAbstractFile, TFile } from 'obsidian';

import { AllCommunityModule, ModuleRegistry, provideGlobalGridOptions } from 'ag-grid-community';
import { mainModule } from './modules/main/module';

// Register all community features
ModuleRegistry.registerModules([AllCommunityModule]);

// Mark all grids as using legacy themes
provideGlobalGridOptions({ theme: "legacy"});

export default class SqlSealPlugin extends Plugin {
	container: ReturnType<typeof mainModule['build']>

	async onload() {

		// await this.loadSettings();

		// CONTAINER
		this.container = mainModule
			.resolve({
				'obsidian.app': this.app,
				'obsidian.plugin': this,
				'obsidian.vault': this.app.vault,
			})
			.build()

		const init = await this.container.get('init')
		init()


		// // const settingsTab = await this.container.get('settingsTab')
		// this.rendererRegistry = await this.container.get('editor.rendererRegistry')

		// this.addSettingTab(settingsTab)

		// settingsTab.onChange(async settings => {
		// 	this.settings = settings
		// 	// FIXME: check how to unregister the view
		// 	await this.unregisterSQLSealExtensions()
		// 	await this.registerSQLSealExtensions()
		// })

		// RESOLVING

		// HERE WE CAN TAKE OTHER ELEMENTS
		



		// await this.registerViews();
		// await this.registerSQLSealExtensions()
		// await this.loadSyntaxHighlighting()

		// this.registerGlobalApi();

		// await this.sqlSeal.db.connect()

		// this.cellParser.registerDbFunctions(this.sqlSeal.db)

		// start syncing when files are loaded
		// this.app.workspace.onLayoutReady(async () => {

		// 	// START FILE SYNC HEHE

		// 	// await this.sqlSeal.startFileSync(this)
		// 	this.registerMarkdownCodeBlockProcessor("sqlseal", sqlSeal.getHandler())
		// 	// this.registerInlineCodeblocks()
		// })

		// this.registerEvent(
		// 	this.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
		// 		this.addCSVCreatorMenuItem(menu, file);
		// 	})
		// );
	}

	// private registerInlineCodeblocks() {

	// 	// Extension for Live Preview
	// 	const editorExtension = createSqlSealEditorExtension(
	// 		this.app,
	// 		this.sqlSeal.db,
	// 		this,
	// 		this.sqlSeal.sync,
	// 	);
	// 	this.registerEditorExtension(editorExtension);

	// 	// Extension for Read mode
	// 	this.registerMarkdownPostProcessor((el, ctx) => {
	// 		const inlineCodeBlocks = el.querySelectorAll('code');
	// 		inlineCodeBlocks.forEach((node: HTMLSpanElement) => {
	// 			const text = node.innerText;
	// 			if (text.startsWith('S>')) {
	// 				const container = createEl('span', { cls: 'sqlseal-inline-result' });
	// 				container.setAttribute('aria-label', text.slice(3));
	// 				container.classList.add('has-tooltip');
	// 				node.replaceWith(container);
	// 				this.sqlSeal.getInlineHandler()(text, container, ctx);
	// 			}
	// 		});
	// 	});

	// }

	// private addCSVCreatorMenuItem(menu: Menu, file: TAbstractFile) {
	// 	menu.addItem((item) => {
	// 		item
	// 			.setTitle('New CSV file')
	// 			.setIcon('table')
	// 			.onClick(async () => {
	// 				try {
	// 					await this.createNewCSVFile(file)
	// 				} catch (error) {
	// 					console.error('Failed to create CSV file:', error)
	// 				}
	// 			});
	// 	});
	// }

	// private loadSyntaxHighlighting() {
	// 	if (!this.settings.enableSyntaxHighlighting) {
	// 		return
	// 	}

	// 	this.registerEditorExtension([
	// 		ViewPlugin.define(
	// 			(view: EditorView) => new SQLSealViewPlugin(view, this.app, this.rendererRegistry),
	// 			{ decorations: v => v.decorations }
	// 		)
	// 	]);
	// }

	// private async createNewCSVFile(file: TAbstractFile) {
	// 	const targetDir = file instanceof TFile ? file.parent : file
	// 	const basePath = targetDir!.path

	// 	const csvTemplate = 'Id,Name\n1,Test Data'

	// 	const defaultName = 'Untitled CSV'
	// 	let fileName = defaultName
	// 	let filePath = `${basePath}/${fileName}.csv`;
	// 	let counter = 1;

	// 	while (await this.app.vault.adapter.exists(filePath)) {
	// 		fileName = `${defaultName} ${counter}`;
	// 		filePath = `${basePath}/${fileName}.csv`;
	// 		counter++;
	// 	}

	// 	try {
	// 		const newFile = await this.app.vault.create(filePath, csvTemplate);

	// 		const leaf = this.app.workspace.getLeaf(false);
	// 		await leaf.openFile(newFile);

	// 		const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0]?.view;
	// 		if (fileExplorer) {
	// 			await (fileExplorer as any).revealInFolder(newFile);
	// 		}
	// 	} catch (error) {
	// 		console.error('Error creating CSV file:', error);
	// 		throw error;
	// 	}
	// }

	// async registerSQLSealExtensions() {
	// 	if (this.settings.enableViewer) {
	// 		this.registerExtensions(CSV_VIEW_EXTENSIONS, CSV_VIEW_TYPE);
	// 	}
	// 	if (this.settings.enableJSONViewer) {
	// 		this.registerExtensions(JSON_VIEW_EXTENSIONS, JSON_VIEW_TYPE)
	// 	}

	// }

	// async unregisterSQLSealExtensions() {
	// 	this.app.workspace.detachLeavesOfType(CSV_VIEW_TYPE);
	// 	this.app.workspace.detachLeavesOfType(JSON_VIEW_TYPE);

	// 	(this.app as any).viewRegistry.unregisterExtensions([
	// 		...CSV_VIEW_EXTENSIONS,
	// 		...JSON_VIEW_EXTENSIONS
	// 	])
	// }

	// async registerViews() {
	// 	const cellParser = await this.container.get('cellParser')
	// 	this.registerView(
	// 		CSV_VIEW_TYPE,
	// 		(leaf) => new CSVView(leaf, this.settings.enableEditing, cellParser)
	// 	);
	// 	this.registerView(
	// 		JSON_VIEW_TYPE,
	// 		(leaf) => new JsonView(leaf)
	// 	)
	// }

	// registerSQLSealView(name: string, config: RendererConfig) {
	// 	this.rendererRegistry.register(name, config)
	// }

	// unregisterSQLSealView(name: string) {
	// 	this.rendererRegistry.unregister(name)
	// }

	// async registerSQLSealFunction(fn: CellFunction) {
	// 	const cellParser = await this.container.get('cellParser')
	// 	cellParser.register(fn)
	// }

	// async unregisterSQLSealFunction(name: string) {
	// 	const cellParser = await this.container.get('cellParser')
	// 	cellParser.unregister(name)
	// }

	// registerSQLSealFlag(flag: Flag) {
	// 	this.rendererRegistry.registerFlag(flag)
	// }

	// unregisterSQLSealFlag(name: string) {
	// 	this.rendererRegistry.unregisterFlag(name)
	// }

	// async registerTable<const columns extends string[]>(plugin: Plugin, name: string, columns: columns) {
	// 	const hash = await FilepathHasher.sha256(`${plugin.manifest.name}`)
	// 	const tableName = `external_table_${hash}_name`
	// 	const newTable = new DatabaseTable(this.sqlSeal.db, tableName, columns)
	// 	await newTable.connect()
	// 	// FIXME: probably register this table in some type of map for the future use?
	// 	return newTable
	// }

	// registerGlobalApi() {
	// 	registerAPI('sqlseal', new SQLSealRegisterApi(this), this)
	// }

	onunload() {
	// 	this.sqlSeal.db.disconect();
	// 	this.unregisterSQLSealExtensions();
	// }

	// async loadSettings() {
	// 	this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	// }

	// async saveSettings() {
	// 	await this.saveData(this.settings);
	}
}

