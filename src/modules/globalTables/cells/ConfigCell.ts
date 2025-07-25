import type { ICellRendererComp, ICellRendererParams } from "ag-grid-community";
import { TableConfiguration } from "../modal/NewGlobalTableModal";

export class ConfigCellRenderer implements ICellRendererComp {
  private eGui!: HTMLDivElement;

  public init(params: ICellRendererParams<any, TableConfiguration['config']>): void {
    const { value, data } = params;

    this.eGui = document.createElement("div");
    this.eGui.className = "config";


    if (value?.type === 'csv') {
        const filename = document.createElement("span");
        filename.textContent = value.filename
        this.eGui.appendChild(filename);
    }
  }

  public getGui(): HTMLElement {
    return this.eGui;
  }

  public refresh(params: ICellRendererParams): boolean {
    return true;
  }
}