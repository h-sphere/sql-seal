import { App, Plugin, Setting } from "obsidian";
import { Settings } from "../Settings";
import {
	checkTypeViewAvaiability,
} from "../utils/viewInspector";
import { SettingsControls } from "./SettingsControls";
import { CSV_VIEW_EXTENSIONS, CSV_VIEW_TYPE, CSVView } from "../view/CSVView";
import { ViewPluginGeneratorType } from "../../syntaxHighlight/viewPluginGenerator";

export class SettingsCSVControls extends SettingsControls {
	private registeredView: string | null = null;

	constructor(settings: Settings, app: App, plugin: Plugin, private viewPluginGenerator: ViewPluginGeneratorType) {
		super(settings, app, plugin)
	}

	register() {
		if (this.settings.get("enableViewer")) {
			const view = checkTypeViewAvaiability(this.app, CSV_VIEW_EXTENSIONS[0]);
			if (view) {
				this.registeredView = view;
				return;
			}

			this.plugin.registerView(
				CSV_VIEW_TYPE,
				(leaf) => new CSVView(leaf, this.settings, this.viewPluginGenerator),
			);
			this.plugin.registerExtensions(CSV_VIEW_EXTENSIONS, CSV_VIEW_TYPE);
		}
	}

	unregister() {
		this.app.workspace.detachLeavesOfType(CSV_VIEW_TYPE);
		(this.app as any).viewRegistry.unregisterExtensions([
			...CSV_VIEW_EXTENSIONS,
		]);
		(this.app as any).viewRegistry.unregisterView(CSV_VIEW_TYPE);
	}

	display(el: HTMLDivElement) {
		el.empty();
		el.createEl("h2", { text: "CSV File Viewer" });

		const view = checkTypeViewAvaiability(this.app, "csv");

		if (view && view !== CSV_VIEW_TYPE) {
			el.createDiv({
				text: "CSV files are already handled by different plugin. To enable SQLSeal CSV editor, disable other plugin that handles it",
				cls: "sqlseal-settings-warn",
			});
			return;
		}

		new Setting(el)
			.setName("Enable CSV Viewer")
			.setDesc(
				"Enables CSV files in your vault and adds ability to display them in a grid.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.get("enableViewer"))
					.onChange(async (value) => {
						this.settings.set("enableViewer", !!value);
						if (!!value) {
							// Enabled
							this.register();
						} else {
							// Disabled
							this.unregister();
						}
						// await this.plugin.saveData(this.settings);
						// this.display();
						// this.callChanges()
					}),
			);

		new Setting(el)
			.setName("Enable CSV Editing")
			.setDesc(
				"Enables Editing functions in the CSV Viewer. This will add buttons to add columns, remove individual rows and columns; and edit each entry.",
			)
			.setDisabled(!this.settings.get("enableViewer"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.get("enableEditing"))
					.onChange(async (value) => {
						this.settings.set("enableEditing", value);
						// await this.plugin.saveData(this.settings);
						// this.callChanges()
					}),
			);
	}
}
