import { Plugin } from "obsidian";
import {
	PluginRegister,
	SQLSealApi,
	SQLSealRegisterApi,
} from "./pluginApi/sqlSealApi";
import { makeInjector } from "@hypersphere/dity";
import { ApiModule } from "./module";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";
import { SqlSealDatabase } from "../database/database";
import { ModernCellParser } from "../syntaxHighlight/cellParser/ModernCellParser";

const SQLSEAL_API_KEY = "___sqlSeal";
const SQLSEAL_QUEUED_PLUGINS = "___sqlSeal_queue";

@(makeInjector<ApiModule, "factory">()([
	"plugin",
	"cellParser",
	"rendererRegistry",
	"db",
]))
export class ApiInit {
	make(
		plugin: Plugin,
		cellParser: ModernCellParser,
		rendererRegistry: RendererRegistry,
		db: SqlSealDatabase,
	) {
		return () => {
			const api = new SQLSealRegisterApi(
				plugin,
				cellParser,
				rendererRegistry,
				db,
			);
			(window as any)[SQLSEAL_API_KEY] = api;
			plugin.register(() => {
				delete (window as any)[SQLSEAL_API_KEY];
			});

			const queuedPlugins = (window as any)[SQLSEAL_QUEUED_PLUGINS] as
				| PluginRegister[]
				| undefined;
			if (!queuedPlugins) {
				return;
			}

			queuedPlugins.forEach((pl) => {
				api.registerForPluginNew(pl);
			});

			(window as any)[SQLSEAL_QUEUED_PLUGINS] = [];
		};
	}
}
