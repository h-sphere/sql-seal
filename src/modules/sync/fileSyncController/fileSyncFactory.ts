import { App, Plugin } from "obsidian";
import { SealFileSync } from "./FileSync";
import { Sync } from "../sync/sync";
import { SqlocalDatabaseProxy } from "../../database/sqlocal/sqlocalDatabaseProxy";
import { FilesFileSyncTable } from "../sync/tables/filesTable";
import { TagsFileSyncTable } from "../sync/tables/tagsTable";
import { TasksFileSyncTable } from "../sync/tables/tasksTable";
import { LinksFileSyncTable } from "../sync/tables/linksTable";

export const fileSyncFactory = async (
	app: App,
	plugin: Plugin,
	dbPromise: Promise<SqlocalDatabaseProxy>,
	sync: Sync,
) => {
	return async () => {
		const db = await dbPromise;

		const fileSync = new SealFileSync(app, plugin, (name) =>
			sync.triggerGlobalTableChange(name),
		);

		fileSync.addTablePlugin(new FilesFileSyncTable(db, app, plugin));
		fileSync.addTablePlugin(new TagsFileSyncTable(db, app));
		fileSync.addTablePlugin(new TasksFileSyncTable(db, app));
		fileSync.addTablePlugin(new LinksFileSyncTable(db, app));

		await fileSync.init();
		return fileSync;
	};
};
