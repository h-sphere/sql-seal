import { App, Vault } from "obsidian";
import { Sync } from "./sync";
import { SqlSealDatabase } from "../../database/database";

export const syncBusFactory = async (db: SqlSealDatabase, vault: Vault, app: App) => {
	const sync = new Sync(db, vault, app);
	await sync.init();
	return sync;
};
