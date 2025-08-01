import { makeInjector } from "@hypersphere/dity";
import { ExplorerModule } from "./module";
import { App, Plugin, WorkspaceLeaf } from "obsidian";
import { SqlSealDatabase } from "../database/database";
import { ModernCellParser } from "../syntaxHighlight/cellParser/ModernCellParser";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";
import { Sync } from "../sync/sync/sync";
import { Settings } from "../settings/Settings";
import { ExplorerView } from "./explorer/ExplorerView";
import { ViewPlugin } from "@codemirror/view";
import { ViewPluginGeneratorType } from "../syntaxHighlight/viewPluginGenerator";
import { FILE_DATABASE_VIEW, FileDatabaseExplorerView } from "./FileDatabaseExplorerView";
import { DatabaseManager } from "./database/databaseManager";

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

        // FIXME: abstract this and GlobalTablesViewRegister
		const activateView = async (name: string) => {
			const { workspace } = plugin.app;

			let leaf: WorkspaceLeaf | null = null;
			const leaves = workspace.getLeavesOfType(name);

			if (leaves.length > 0) {
				// A leaf with our view already exists, use that
				leaf = leaves[0];
			} else {
				leaf = workspace.getLeaf("tab");
				if (!leaf) {
					return;
				}
				await leaf.setViewState({ type: name, active: true });
			}

			// "Reveal" the leaf in case it is in a collapsed sidebar
			workspace.revealLeaf(leaf);
		};
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
			plugin.addRibbonIcon("dice", "SQLSeal Explorer", () =>
				activateView("sqlseal-explorer-view"),
			);


			// Register for extenion
			plugin.registerView(FILE_DATABASE_VIEW, (leaf) => {
				return new FileDatabaseExplorerView(leaf, dbManager, viewPluginGenerator, rendererRegistry, cellParser, settings, sync)
			})

			plugin.registerExtensions(['sqlite'], FILE_DATABASE_VIEW)

		};
	}
}
