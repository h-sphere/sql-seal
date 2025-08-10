import { makeInjector } from "@hypersphere/dity";
import { SyncModule } from "../module";
import { App } from "obsidian";
import { SealFileSync } from "../fileSyncController/FileSync";

@(makeInjector<SyncModule, 'factory'>()([
    'app', 'fileSync'
]))
export class SyncInit {
    make(app: App, fileSync: () => Promise<SealFileSync>) {
        return () => {
            app.workspace.onLayoutReady(async () => {
                await fileSync()
            })
        }
    }
}