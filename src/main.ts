import { Plugin } from "obsidian";

import {
	AllCommunityModule,
	ModuleRegistry,
	provideGlobalGridOptions,
} from "ag-grid-community";
import { mainModule } from "./modules/main/module";

// Register all community features
ModuleRegistry.registerModules([AllCommunityModule]);

// Mark all grids as using legacy themes
provideGlobalGridOptions({ theme: "legacy" });

export default class SqlSealPlugin extends Plugin {
	container: ReturnType<(typeof mainModule)["build"]>;

	async onload() {
		// CONTAINER
		this.container = mainModule
			.resolve('obsidian.app', d => d.value(this.app))
			.resolve('obsidian.plugin', d => d.value(this))
			.resolve('obsidian.vault', d => d.value(this.app.vault))
			.build()

		const init = await this.container.get("init")
		init()
	}
}
