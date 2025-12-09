import { App, Vault } from "obsidian";
import { Sync } from "./sync";
import { SqlocalDatabaseProxy } from "../../database/sqlocal/sqlocalDatabaseProxy";
let singletonSync: Sync|null = null
export const syncBusFactory = async (dbPromise: Promise<SqlocalDatabaseProxy>, vault: Vault, app: App) => {
	console.log('##### SYNC BUS CREATION')
	if (singletonSync) {
		console.log('got singleton')
		return singletonSync
	}
	console.log('no singleton')
	console.log('SYNC BUS FACTORY', singletonSync)
	const db = await dbPromise;
	console.log('syncBusFactory: Database resolved:', !!db);
	const sync = new Sync(db, vault, app);
	singletonSync = sync
	await sync.init();
	return sync;
};
