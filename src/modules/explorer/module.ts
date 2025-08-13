import { asClass, asFactory, buildContainer } from "@hypersphere/dity";
import { InitFactory } from "./InitFactory";
import { App, Plugin } from "obsidian";
import { ModernCellParser } from "../syntaxHighlight/cellParser/ModernCellParser";
import { SqlSealDatabase } from "../database/database";
import { Settings } from "../settings/Settings";
import { Sync } from "../sync/sync/sync";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";
import { ViewPlugin } from "@codemirror/view";
import { ViewPluginGeneratorType } from "../syntaxHighlight/viewPluginGenerator";
import { DatabaseManager } from "./database/databaseManager";

export const explorer = buildContainer((c) =>
	c
		.register({
			init: asFactory(InitFactory),
            dbManager: asClass(DatabaseManager)
		})
		.externals<{
            app: App,
            cellParser: ModernCellParser,
            db: SqlSealDatabase,
            settings: Settings,
            sync: Sync
            rendererRegistry: RendererRegistry,
            plugin: Plugin,
            viewPluginGenerator: ViewPluginGeneratorType
        }>()
        .exports('init'),
);

export type ExplorerModule = typeof explorer;
