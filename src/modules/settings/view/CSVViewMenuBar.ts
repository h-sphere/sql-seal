import { App, ButtonComponent } from "obsidian";
import { RenameColumnModal } from "../modal/renameColumnModal";
import { Settings } from "../Settings";
import { args, BusBuilder } from "@hypersphere/omnibus";

const SHOW_HIDDEN_TEXT = "Show Hidden Columns";
const HIDE_HIDDEN_TEXT = "Hide Hidden Columns";

export class CSVViewMenuBar {
	private bus = new BusBuilder()
		.register("add-row", args<[]>())
		.register("add-column", args<string>())
		.register("generate-code", args<[]>())
		.register("toggle-hidden", args<boolean>())
		.build();

	constructor(
		private el: HTMLElement,
		private settings: Settings,
		private app: App,
	) {
		this.show();
	}

	private showHidden: boolean = false;

	get events() {
		return this.bus.getRegistrator();
	}

	private show() {
		const el = this.el;

		el.empty();

		if (this.settings.get("enableEditing")) {
			new ButtonComponent(el)
				.setButtonText("Add Row")
				.setCta()
				.onClick(() => this.bus.trigger("add-row"));

			new ButtonComponent(el).setButtonText("Add Column").onClick(() => {
				const modal = new RenameColumnModal(this.app, (res) => {
					this.bus.trigger("add-column", res);
				});
				modal.open();
			});

			new ButtonComponent(el)
				.setButtonText("Generate SQLSeal Code")
				.onClick(() => this.bus.trigger("generate-code"));

			const showHiddenButton = new ButtonComponent(el)
				.setButtonText(SHOW_HIDDEN_TEXT)
				.onClick(() => {
					this.showHidden = !this.showHidden;
					showHiddenButton.setButtonText(
						this.showHidden ? HIDE_HIDDEN_TEXT : SHOW_HIDDEN_TEXT,
					);
					this.bus.trigger("toggle-hidden", this.showHidden);
				});
		}
	}
}
