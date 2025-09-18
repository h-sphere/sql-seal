import { App, Plugin } from "obsidian";
import { GLOBAL_TABLES_VIEW_TYPE, GlobalTablesView } from "./GlobalTablesView";
import { Sync } from "../sync/sync/sync";
import { activateView } from "../explorer/activateView";

export const globalTablesViewRendererFactory = (
	plugin: Plugin,
	app: App,
	sync: Sync,
) => {
	return () => {
		plugin.registerView(
			GLOBAL_TABLES_VIEW_TYPE,
			(leaf) => new GlobalTablesView(leaf, app.vault, sync),
		);

		plugin.addCommand({
			id: "sqlseal-command-global-tables",
			name: "Open global tables configuration",
			icon: "logo-sqlseal",
			callback: () => activateView(app, GLOBAL_TABLES_VIEW_TYPE),
		});
	};
};
