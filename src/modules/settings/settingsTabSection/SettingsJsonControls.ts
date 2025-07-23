import { App, Setting } from "obsidian";
import { Settings } from "../Settings";
import { SettingsControls } from "./SettingsControls";
import { checkTypeViewAvaiability } from "../utils/viewInspector";
import {
	JSON_VIEW_EXTENSIONS,
	JSON_VIEW_TYPE,
	JsonView,
} from "../view/JsonView";

export class SettingsJsonControls extends SettingsControls {
	private registeredView: string | null = null;

	register() {
		if (this.settings.get("enableJSONViewer")) {
			const view = checkTypeViewAvaiability(this.app, JSON_VIEW_EXTENSIONS[0]);
			// FIXME: also allow for json5 checks
			if (view) {
				this.registeredView = view;
				return;
			}

			this.plugin.registerView(JSON_VIEW_TYPE, (leaf) => new JsonView(leaf));
			this.plugin.registerExtensions(JSON_VIEW_EXTENSIONS, JSON_VIEW_TYPE);
		}
	}

	unregister() {
		this.app.workspace.detachLeavesOfType(JSON_VIEW_TYPE);
		(this.app as any).viewRegistry.unregisterExtensions([
			...JSON_VIEW_EXTENSIONS,
		]);
		(this.app as any).viewRegistry.unregisterView(JSON_VIEW_TYPE);
	}

	display(el: HTMLDivElement) {
		el.empty();

		el.createEl("h2", { text: "JSON File Viewer" });

		const view = checkTypeViewAvaiability(this.app, "json");

		if (view && view !== JSON_VIEW_TYPE) {
			el.createDiv({
				text: "JSON files are already handled by different plugin. To enable SQLSeal JSON preview, disable other plugin that handles it",
				cls: 'sqlseal-settings-warn'
			});
			return;
		}

		new Setting(el)
			.setName("Enable JSON Viewer")
			.setDesc(
				"Enables JSON and JSON5 files in your files explorer and allows to preview them.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.get("enableJSONViewer"))
					.onChange(async (value) => {
						this.settings.set("enableJSONViewer", !!value);
						if (!!value) {
							// Enabled
							this.register();
						} else {
							// Disabled
							this.unregister();
						}
					}),
			);
	}
}
