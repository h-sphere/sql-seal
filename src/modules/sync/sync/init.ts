import { App } from "obsidian";
import { SealFileSync } from "../fileSyncController/FileSync";

export const syncInit = (app: App, fileSync: () => Promise<SealFileSync>) => {
	return () => {
		app.workspace.onLayoutReady(async () => {
			await fileSync();
		});
	};
};
