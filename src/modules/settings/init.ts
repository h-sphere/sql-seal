import { makeInjector } from "@hypersphere/dity";
import { SettingsModule } from "./module";
import { App, Plugin } from "obsidian";
import { SQLSealSettingsTab } from "./SQLSealSettingsTab";
import { CSV_VIEW_EXTENSIONS, CSV_VIEW_TYPE, CSVView } from "./view/CSVView";
import { JSON_VIEW_EXTENSIONS, JSON_VIEW_TYPE, JsonView } from "./view/JsonView";
import { Settings } from "./Settings";
import type { ModernCellParser } from "../syntaxHighlight/cellParser/ModernCellParser";

@(makeInjector<SettingsModule>()(['plugin', 'settingsTab', 'app', 'cellParser', 'settings']))
export class SettingsInit {
    async make(plugin: Plugin, settingsTab: SQLSealSettingsTab, app: App, cellParser: ModernCellParser, settings: Settings) {

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
                (leaf) => new CSVView(leaf, settings)
            );
            plugin.registerView(
                JSON_VIEW_TYPE,
                (leaf) => new JsonView(leaf)
            )
        }


        const register = () => {
            if (settings.get('enableViewer')) {
                plugin.registerExtensions(CSV_VIEW_EXTENSIONS, CSV_VIEW_TYPE);
            }
            if (settings.get('enableJSONViewer')) {
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