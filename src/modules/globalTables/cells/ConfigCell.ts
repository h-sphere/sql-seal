import type { ICellRendererComp, ICellRendererParams } from "ag-grid-community";
import { TableConfiguration } from "../modal/NewGlobalTableModal";
import { Component, MarkdownRenderer, TFile } from "obsidian";
import { GlobalTablesView } from "../GlobalTablesView";

export class ConfigCellRenderer implements ICellRendererComp {
	private eGui!: HTMLDivElement;

	public init(
		params: ICellRendererParams<
			TableConfiguration,
			TableConfiguration["config"],
			GlobalTablesView
		>,
	): void {
		const { value, data, context } = params;

		this.eGui = document.createElement("div");
		this.eGui.className = "config";

		const container = this.eGui.createDiv();

		if (value?.type === "csv") {
			const link = container.createEl("a");
			link.href = value.filename;
      link.textContent = value.filename;
			link.addEventListener("click", (e) => {
				e.preventDefault();
				const file = context.app.vault.getAbstractFileByPath(value.filename);
				if (file instanceof TFile) {
					context.app.workspace.openLinkText(value.filename, "", true);
				}
			});
		}
    if (value?.type === 'json') {
      container.textContent = value.filename + '#' + (value.xpath ? value.xpath : '$')
    }
	}

	public getGui(): HTMLElement {
		return this.eGui;
	}

	public refresh(params: ICellRendererParams): boolean {
		return true;
	}
}
