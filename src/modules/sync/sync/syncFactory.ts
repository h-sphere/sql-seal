import { App, Vault } from "obsidian";
import { Sync } from "./sync";
import { SqlocalDatabaseProxy } from "../../database/sqlocal/sqlocalDatabaseProxy";
let singletonSync: Sync|null = null
export const syncBusFactory = async (dbPromise: Promise<SqlocalDatabaseProxy>, vault: Vault, app: App) => {
	if (singletonSync) {
		return singletonSync
	}
	const db = await dbPromise;
	const sync = new Sync(db, vault, app);
	singletonSync = sync
	await sync.init();
	return sync;
};
