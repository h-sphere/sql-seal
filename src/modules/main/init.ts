import { makeInjector } from "@hypersphere/dity";
import { MainModule } from "./module";
import { Plugin } from "obsidian";

type InitFn = () => void


@(makeInjector<MainModule, 'factory'>()([
    'settings.init',
    'editor.init',
    'syntaxHighlight.init',
    'contextMenu.init',
    'sync.init',
    'debug.init',
    'api.init',
    'globalTables.init',
    'explorer.init'
]))
export class Init {
    async make(
        settingsInit: InitFn,
        editorInit: InitFn,
        highlighInit: InitFn,
        contextMenu: InitFn,
        syncInit: InitFn,
        debugInit: InitFn,
        apiInit: InitFn,
        globalTablesInit: InitFn,
        explorerInit: InitFn
    ) {
        return () => {
            
            settingsInit()
            editorInit()
            highlighInit()
            contextMenu()
            syncInit()
            // debugInit()
            apiInit()
            globalTablesInit()
            explorerInit()
            
            console.log('🚀 SQL Seal initialized with wa-sqlite test command available');
            console.log('📋 Use Ctrl/Cmd+P -> "Test wa-sqlite Implementation" to test wa-sqlite');
        }
    }
}