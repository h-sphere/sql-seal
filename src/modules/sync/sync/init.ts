import { App } from "obsidian";
import { SealFileSync } from "../fileSyncController/FileSync";

export const syncInit = (app: App, fileSync: () => Promise<SealFileSync>) => {
	return () => {
		app.workspace.onLayoutReady(async () => {
			console.log('FILE SYNC')
			await fileSync();
		});
	};
};
