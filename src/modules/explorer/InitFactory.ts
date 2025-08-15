import { makeInjector } from "@hypersphere/dity";
import { ExplorerModule } from "./module";
import { addIcon, App, Plugin, WorkspaceLeaf } from "obsidian";
import { SqlSealDatabase } from "../database/database";
import { ModernCellParser } from "../syntaxHighlight/cellParser/ModernCellParser";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";
import { Sync } from "../sync/sync/sync";
import { Settings } from "../settings/Settings";
import { ExplorerView } from "./explorer/ExplorerView";
import { ViewPlugin } from "@codemirror/view";
import { ViewPluginGeneratorType } from "../syntaxHighlight/viewPluginGenerator";
import { SQLSEAL_FILE_VIEW, SQLSealFileView } from "./SQLSealFileView";
import { DatabaseManager } from "./database/databaseManager";
import { activateView } from "./activateView";

// @ts-ignore: Handled by esbuild
import SQLSealIcon from "./sqlseal-bw.svg";

@(makeInjector<ExplorerModule, "factory">()([
	"plugin",
	"app",
	"db",
	"cellParser",
	"rendererRegistry",
	"sync",
	"settings",
	"viewPluginGenerator",
	"dbManager"
]))
export class InitFactory {
	make(
		plugin: Plugin,
		app: App,
		db: SqlSealDatabase,
		cellParser: ModernCellParser,
		rendererRegistry: RendererRegistry,
		sync: Sync,
		settings: Settings,
		viewPluginGenerator: ViewPluginGeneratorType,
		dbManager: DatabaseManager
	) {

		return () => {
			plugin.registerView(
				"sqlseal-explorer-view",
				(leaf) =>
					new ExplorerView(
						leaf,
						rendererRegistry,
						db,
						cellParser,
						settings,
						sync,
						viewPluginGenerator
					),
			);
			addIcon("logo-sqlseal", SQLSealIcon);
			plugin.addRibbonIcon("logo-sqlseal", "SQLSeal Explorer", () =>
				activateView(plugin.app, "sqlseal-explorer-view"),
			);

			// Register unified SQLSeal file view for both SQL and database files
			plugin.registerView(SQLSEAL_FILE_VIEW, (leaf) => {
				return new SQLSealFileView(leaf, dbManager, viewPluginGenerator, rendererRegistry, cellParser, settings, sync, db)
			})

			// Extensions for SQLSeal file view are registered by SettingsSQLControls

			plugin.addCommand({
				id: 'sqlseal-command-explorer',
				name: 'Open SQLSeal Explorer',
				icon: 'logo-sqlseal',
				callback: () => activateView(app, 'sqlseal-explorer-view')
				
			})

		};
	}
}
