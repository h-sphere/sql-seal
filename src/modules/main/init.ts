import { makeInjector } from "@hypersphere/dity";
import { MainModule } from "./module";

type InitFn = () => void


@(makeInjector<MainModule, 'factory'>()([
    'settings.init',
    'editor.init',
    'syntaxHighlight.init',
    'contextMenu.init',
    'sync.init',
    'debug.init',
    'api.init'
]))
export class Init {
    async make(
        settingsInit: InitFn,
        editorInit: InitFn,
        highlighInit: InitFn,
        contextMenu: InitFn,
        syncInit: InitFn,
        debugInit: InitFn,
        apiInit: InitFn
    ) {
        return () => {
            settingsInit()
            editorInit()
            highlighInit()
            contextMenu()
            syncInit()
            debugInit()
            apiInit()
        }
    }
}