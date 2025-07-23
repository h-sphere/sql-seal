import { App, Plugin } from "obsidian";
import { Settings } from "../Settings";

export abstract class SettingsControls {
	constructor(
		protected settings: Settings,
		protected app: App,
        protected plugin: Plugin
	) {}

    abstract display(el: HTMLDivElement): void
}
