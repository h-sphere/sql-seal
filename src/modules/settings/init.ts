import { makeInjector } from "@hypersphere/dity";
import { SettingsModule } from "./module";
import { App, Plugin } from "obsidian";
import { SQLSealSettingsTab } from "./SQLSealSettingsTab";
import { Settings } from "./Settings";
import { SettingsCSVControls } from "./settingsTabSection/SettingsCSVControls";
import { SettingsJsonControls } from "./settingsTabSection/SettingsJsonControls";

@(makeInjector<SettingsModule>()(["plugin", "settingsTab", "app", "settings"]))
export class SettingsInit {
	async make(
		plugin: Plugin,
		settingsTab: SQLSealSettingsTab,
		app: App,
		settings: Settings,
	) {
		const csvControl = new SettingsCSVControls(settings, app, plugin);
		const jsonControl = new SettingsJsonControls(settings, app, plugin);

		const controls = [csvControl, jsonControl];

		settingsTab.registerControls(...controls);

		return () => {
			controls.forEach((c) => c.register());
			plugin.addSettingTab(settingsTab);
			plugin.register(() => {
				controls.forEach((c) => c.unregister());
			});
		};
	}
}
