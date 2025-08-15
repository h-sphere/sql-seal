import { App, Plugin, Setting } from "obsidian";
import { Settings } from "../Settings";
import {
	checkTypeViewAvaiability,
} from "../utils/viewInspector";
import { SettingsControls } from "./SettingsControls";
import { SQLSEAL_FILE_VIEW } from "../../explorer/SQLSealFileView";

export class SettingsSQLControls extends SettingsControls {
	private registeredView: string | null = null;

	constructor(settings: Settings, app: App, plugin: Plugin) {
		super(settings, app, plugin)
	}

	register() {
		if (this.settings.get("enableSQLViewer")) {
			const view = checkTypeViewAvaiability(this.app, 'sql');
			if (view && view !== SQLSEAL_FILE_VIEW) {
				this.registeredView = view;
				return;
			}

			// Register extensions when enabling
			this.plugin.registerExtensions(['sql', 'sqlseal', 'sqlite', 'db'], SQLSEAL_FILE_VIEW);
		}
	}

	unregister() {
		this.app.workspace.detachLeavesOfType(SQLSEAL_FILE_VIEW);
		(this.app as any).viewRegistry.unregisterExtensions([
			'sql', 'sqlseal', 'sqlite', 'db'
		]);
	}

	display(el: HTMLDivElement) {
		el.empty();
		el.createEl("h2", { text: "SQL Explorer" });

		const view = checkTypeViewAvaiability(this.app, "sql");

		if (view && view !== SQLSEAL_FILE_VIEW) {
			el.createDiv({
				text: "SQL files are already handled by different plugin. To enable SQLSeal SQL viewer, disable other plugin that handles it",
				cls: "sqlseal-settings-warn",
			});
			return;
		}

		new Setting(el)
			.setName("Enable SQL Explorer")
			.setDesc(
				"Enables SQL, SQLSeal, SQLite and DB files in your vault to preview then and execture queries.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.get("enableSQLViewer"))
					.onChange(async (value) => {
						this.settings.set("enableSQLViewer", !!value);
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