import { App, Plugin } from "obsidian";
import { SQLSealSettingsTab } from "./SQLSealSettingsTab";
import { Settings } from "./Settings";
import { SettingsCSVControls } from "./settingsTabSection/SettingsCSVControls";
import { SettingsJsonControls } from "./settingsTabSection/SettingsJsonControls";
import { SettingsSQLControls } from "./settingsTabSection/SettingsSQLControls";
import { ViewPluginGeneratorType } from "../syntaxHighlight/viewPluginGenerator";

export const settingsInit = (
	plugin: Plugin,
	settingsTab: SQLSealSettingsTab,
	app: App,
	settings: Settings,
	viewPluginGenerator: ViewPluginGeneratorType,
) => {
	return () => {
		const csvControl = new SettingsCSVControls(
			settings,
			app,
			plugin,
			viewPluginGenerator,
		);
		const jsonControl = new SettingsJsonControls(
			settings,
			app,
			plugin,
			viewPluginGenerator,
		);
		const sqlControl = new SettingsSQLControls(settings, app, plugin);

		const controls = [csvControl, jsonControl, sqlControl];

		settingsTab.registerControls(...controls);

		controls.forEach((c) => c.register());
		plugin.addSettingTab(settingsTab);
		plugin.register(() => {
			controls.forEach((c) => c.unregister());
		});
	};
};
