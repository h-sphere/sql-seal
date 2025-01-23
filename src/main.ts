import { Menu, Plugin, TAbstractFile, Tasks, TFile } from 'obsidian';
import { GridRenderer } from 'src/renderer/GridRenderer';
import { MarkdownRenderer } from 'src/renderer/MarkdownRenderer';
import { TableRenderer } from 'src/renderer/TableRenderer';
import { RendererConfig, RendererRegistry } from 'src/renderer/rendererRegistry';
import { DEFAULT_SETTINGS, SQLSealSettings, SQLSealSettingsTab } from 'src/settings/SQLSealSettingsTab';
import { SqlSeal } from 'src/sqlSeal';
import { SealFileSync } from 'src/vaultSync/SealFileSync';
import { FilesFileSyncTable } from 'src/vaultSync/tables/filesTable';
import { TagsFileSyncTable } from 'src/vaultSync/tables/tagsTable';
import { TasksFileSyncTable } from 'src/vaultSync/tables/tasksTable';
import { CSV_VIEW_TYPE, CSVView } from 'src/view/CSVView';
import { createSqlSealEditorExtension } from './editorExtension/inlineCodeBlock';
import { ListRenderer } from './renderer/ListRenderer';

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
		this.rendererRegistry.register('sql-seal-internal-list', new ListRenderer(this.app))

		this.registerGlobalApi();
		const sqlSeal = new SqlSeal(this.app, false, this.rendererRegistry) // FIXME: set verbose based on the env.
		this.sqlSeal = sqlSeal

		await this.sqlSeal.db.connect()

		// start syncing when files are loaded
		this.app.workspace.onLayoutReady(async () => {
			await this.sqlSeal.startFileSync(this)
			this.registerMarkdownCodeBlockProcessor("sqlseal", sqlSeal.getHandler())
			this.registerInlineCodeblocks()
		})

		this.registerEvent(
            this.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
                this.addCSVCreatorMenuItem(menu, file);
            })
        );
	}

	private registerInlineCodeblocks() {

		// Extension for Live Preview
		const editorExtension = createSqlSealEditorExtension(
			this.app,
			this.sqlSeal.db,
			this.sqlSeal.sync,
		);
		this.registerEditorExtension(editorExtension);

		// Extension for Read mode
		this.registerMarkdownPostProcessor((el, ctx) => {
			const inlineCodeBlocks = el.querySelectorAll('code');
			inlineCodeBlocks.forEach((node: HTMLSpanElement) => {
				const text = node.innerText;
				if (text.startsWith('S>')) {
					const container = createEl('span', { cls: 'sqlseal-inline-result' });
					container.setAttribute('aria-label', text.slice(3));
					container.classList.add('has-tooltip');
					node.replaceWith(container);
					this.sqlSeal.getInlineHandler()(text, container, ctx);
				}
			});
		});

	}

	private addCSVCreatorMenuItem(menu: Menu, file: TAbstractFile) {
		menu.addItem((item) => {
		item
			.setTitle('New CSV file')
			.setIcon('table')
			.onClick(async () => {
				try {
					await this.createNewCSVFile(file)
				} catch (error) {
					console.error('Failed to create CSV file:', error)
				}
			});
		});
	}

	private async createNewCSVFile(file: TAbstractFile) {
		const targetDir = file instanceof TFile ? file.parent : file
		const basePath = targetDir!.path

		const csvTemplate = 'Id,Name\n1,Test Data'

		const defaultName = 'Untitled CSV'
		let fileName = defaultName
		let filePath = `${basePath}/${fileName}.csv`;
		let counter = 1;

		while (await this.app.vault.adapter.exists(filePath)) {
			fileName = `${defaultName} ${counter}`;
			filePath = `${basePath}/${fileName}.csv`;
			counter++;
		}

		try {
			const newFile = await this.app.vault.create(filePath, csvTemplate);

			const leaf = this.app.workspace.getLeaf(false);
			await leaf.openFile(newFile);

			const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0]?.view;
            if (fileExplorer) {
                await (fileExplorer as any).revealInFolder(newFile);
            }
		} catch (error) {
			console.error('Error creating CSV file:', error);
			throw error;
		}
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

		// TODO: figure out why viewRegistry is not being 
		(this.app as any).viewRegistry.unregisterExtensions(['csv'])
		(this.app as any).viewRegistry.unregisterView(CSV_VIEW_TYPE)

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

