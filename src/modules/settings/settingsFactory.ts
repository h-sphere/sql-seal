import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS } from "./SQLSealSettingsTab";
import { Settings } from "./Settings";

export const settingsFactory = async (plugin: Plugin) => {
	const settings = Object.assign({}, DEFAULT_SETTINGS, await plugin.loadData());
	const obj = new Settings(settings);

	obj.onChange((settings) => {
		plugin.saveData(settings);
	});

	return obj;
};
