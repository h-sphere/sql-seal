import { App, Plugin, Setting } from "obsidian";
import { Settings } from "../Settings";
import { SettingsControls } from "./SettingsControls";
import { checkTypeViewAvaiability } from "../utils/viewInspector";
import {
	JSONL_VIEW_EXTENSIONS,
	JSONL_VIEW_TYPE,
	JsonlView,
} from "../view/JsonlView";
import { ViewPluginGeneratorType } from "../../syntaxHighlight/viewPluginGenerator";

export class SettingsJsonlControls extends SettingsControls {
	private registeredView: string | null = null;

	constructor(settings: Settings, app: App, plugin: Plugin, private viewPluginGenerator: ViewPluginGeneratorType) {
		super(settings, app, plugin);
	}

	register() {
		if (this.settings.get("enableJSONLViewer")) {
			const view = checkTypeViewAvaiability(this.app, JSONL_VIEW_EXTENSIONS[0]);
			if (view) {
				this.registeredView = view;
				return;
			}

			this.plugin.registerView(JSONL_VIEW_TYPE, (leaf) => new JsonlView(leaf, this.viewPluginGenerator));
			this.plugin.registerExtensions(JSONL_VIEW_EXTENSIONS, JSONL_VIEW_TYPE);
		}
	}

	unregister() {
		this.app.workspace.detachLeavesOfType(JSONL_VIEW_TYPE);
		(this.app as any).viewRegistry.unregisterExtensions([...JSONL_VIEW_EXTENSIONS]);
		(this.app as any).viewRegistry.unregisterView(JSONL_VIEW_TYPE);
	}

	display(el: HTMLDivElement) {
		el.empty();

		el.createEl("h2", { text: "JSONL / NDJSON File Viewer" });

		const view = checkTypeViewAvaiability(this.app, JSONL_VIEW_EXTENSIONS[0]);

		if (view && view !== JSONL_VIEW_TYPE) {
			el.createDiv({
				text: "JSONL files are already handled by a different plugin. To enable SQLSeal JSONL preview, disable the other plugin that handles it.",
				cls: 'sqlseal-settings-warn'
			});
			return;
		}

		new Setting(el)
			.setName("Enable JSONL Viewer")
			.setDesc("Enables JSONL and NDJSON files in your files explorer and allows previewing them as a table.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.get("enableJSONLViewer"))
					.onChange(async (value) => {
						this.settings.set("enableJSONLViewer", !!value);
						if (!!value) {
							this.register();
						} else {
							this.unregister();
						}
					}),
			);
	}
}
