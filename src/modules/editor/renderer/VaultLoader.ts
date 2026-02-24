import { App, Plugin, TFile } from "obsidian";

const TEMPLATE_EXTENSION = "njk";

interface LoaderSource {
	src: string;
	path: string;
	noCache: boolean;
}

export class VaultLoader {
	private _templates: Map<string, string> = new Map();

	constructor(
		private readonly app: App,
		private readonly plugin: Plugin,
	) {}

	getSource(name: string): LoaderSource {
		let src = this._templates.get(name);

		if (src === undefined && !name.includes(".")) {
			src = this._templates.get(name + "." + TEMPLATE_EXTENSION);
		}

		if (src === undefined) {
			throw new Error(`Template not found: ${name}`);
		}

		return { src, path: name, noCache: true };
	}

	async loadAll(): Promise<void> {
		const files = this.app.vault
			.getFiles()
			.filter((f) => f.extension === TEMPLATE_EXTENSION);

		for (const file of files) {
			const content = await this.app.vault.cachedRead(file);
			this._templates.set(file.path, content);
		}
	}

	registerWatchers(): void {
		this.plugin.registerEvent(
			this.app.vault.on("modify", async (file) => {
				if (
					file instanceof TFile &&
					file.extension === TEMPLATE_EXTENSION
				) {
					const content = await this.app.vault.cachedRead(file);
					this._templates.set(file.path, content);
				}
			}),
		);

		this.plugin.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (
					file instanceof TFile &&
					file.extension === TEMPLATE_EXTENSION
				) {
					this._templates.delete(file.path);
				}
			}),
		);

		this.plugin.registerEvent(
			this.app.vault.on("rename", async (file, oldPath) => {
				if (file instanceof TFile) {
					this._templates.delete(oldPath);
					if (file.extension === TEMPLATE_EXTENSION) {
						const content =
							await this.app.vault.cachedRead(file);
						this._templates.set(file.path, content);
					}
				}
			}),
		);

		this.plugin.registerEvent(
			this.app.vault.on("create", async (file) => {
				if (
					file instanceof TFile &&
					file.extension === TEMPLATE_EXTENSION
				) {
					const content = await this.app.vault.cachedRead(file);
					this._templates.set(file.path, content);
				}
			}),
		);
	}
}
