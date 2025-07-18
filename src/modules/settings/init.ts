import { makeInjector } from "@hypersphere/dity";
import { SettingsModule } from "./module";
import { App, Plugin } from "obsidian";
import { SQLSealSettingsTab } from "./SQLSealSettingsTab";
import { CSV_VIEW_EXTENSIONS, CSV_VIEW_TYPE, CSVView } from "../../view/CSVView";
import { JSON_VIEW_EXTENSIONS, JSON_VIEW_TYPE, JsonView } from "../../view/JsonView";
import { CellParser } from "../../../types-package/dist/src/cellParser";
import { ModernCellParser } from "../../cellParser/ModernCellParser";

@(makeInjector<SettingsModule>()(['plugin', 'settingsTab', 'app', 'cellParser']))
export class SettingsInit {
    async make(plugin: Plugin, settingsTab: SQLSealSettingsTab, app: App, cellParser: ModernCellParser) {

        const unregister = () => {
            app.workspace.detachLeavesOfType(CSV_VIEW_TYPE);
            app.workspace.detachLeavesOfType(JSON_VIEW_TYPE);

            (app as any).viewRegistry.unregisterExtensions([
                ...CSV_VIEW_EXTENSIONS,
                ...JSON_VIEW_EXTENSIONS
            ])
        }

        const registerViews = () => {
            plugin.registerView(
                CSV_VIEW_TYPE,
                (leaf) => new CSVView(leaf, /*this.settings.enableEditing*/true, cellParser)
            );
            plugin.registerView(
                JSON_VIEW_TYPE,
                (leaf) => new JsonView(leaf)
            )
        }


        const register = () => {
            if (true /*settings.enableViewer*/) {
                plugin.registerExtensions(CSV_VIEW_EXTENSIONS, CSV_VIEW_TYPE);
            }
            if (/*settings.enableJSONViewer*/true) {
                plugin.registerExtensions(JSON_VIEW_EXTENSIONS, JSON_VIEW_TYPE)
            }
        }

        return () => {
            registerViews()
            register()
            plugin.addSettingTab(settingsTab)

            settingsTab.onChange(async settings => {
                // FIXME: update settings somehow
                // FIXME: check how to unregister the view
                unregister()
                register()
            })
            // FIXME: migrate linking from main to here.
        }
    }
}