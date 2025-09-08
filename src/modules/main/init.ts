import { makeInjector } from "@hypersphere/dity";
import { MainModule } from "./module";

type InitFn = () => void


@(makeInjector<MainModule, 'factory'>()([
    'settings.init',
    'editor.init',
    'syntaxHighlight.init',
    'contextMenu.init',
    'sync.init',
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
            apiInit()
            globalTablesInit()
            explorerInit()
        }
    }
}