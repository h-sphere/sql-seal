import { makeInjector } from "@hypersphere/dity";
import { GlobalTablesModule } from "./module";
import { addIcon, App, Plugin, WorkspaceLeaf } from "obsidian";
import { GLOBAL_TABLES_VIEW_TYPE, GlobalTablesView } from "./GlobalTablesView";
// @ts-ignore: Handled by esbuild
import SQLSealIcon from "./sqlseal-bw.svg";
import { Sync } from "../sync/sync/sync";

@(makeInjector<GlobalTablesModule, "factory">()(["plugin", "app", "sync"]))
export class GlobalTablesViewRegister {
	make(plugin: Plugin, app: App, sync: Sync) {
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
				GLOBAL_TABLES_VIEW_TYPE,
				(leaf) => new GlobalTablesView(leaf, app.vault, sync),
			);

			// SQLSeal Icon
			addIcon("logo-sqlseal", SQLSealIcon);

			plugin.addRibbonIcon("logo-sqlseal", "SQLSeal Global Tables", () =>
				activateView(GLOBAL_TABLES_VIEW_TYPE),
			);
		};
	}
}
