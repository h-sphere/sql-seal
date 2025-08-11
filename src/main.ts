import { Plugin } from "obsidian";

import {
	AllCommunityModule,
	ModuleRegistry,
	provideGlobalGridOptions,
} from "ag-grid-community";
import { mainModule } from "./modules/main/module";
import { sql } from "kysely";

// Register all community features
ModuleRegistry.registerModules([AllCommunityModule]);

// Mark all grids as using legacy themes
provideGlobalGridOptions({ theme: "legacy" });

export default class SqlSealPlugin extends Plugin {
	container: ReturnType<(typeof mainModule)["build"]>;

	async onload() {
		// CONTAINER
		this.container = mainModule
			.resolve({
				"obsidian.app": this.app,
				"obsidian.plugin": this,
				"obsidian.vault": this.app.vault,
			})
			.build();

		const init = await this.container.get("init");
		init();

		const db = await (await this.container.get('db.provider')).get()
		const data = await db.selectNoFrom(sql<string>`sqlite_version()`).execute()
		console.log(data)
	}

	onunload() {}
}
