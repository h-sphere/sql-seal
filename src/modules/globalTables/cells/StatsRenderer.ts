import type { ICellRendererComp, ICellRendererParams } from "ag-grid-community";
import { TableConfiguration } from "../modal/NewGlobalTableModal";

export class StatsRenderer implements ICellRendererComp {
  private eGui!: HTMLDivElement;

  public init(params: ICellRendererParams<any, string>): void {
    const { value, data } = params;

    this.eGui = document.createElement("div");
    this.eGui.className = "stats";

    const stats = this.eGui.createSpan()
    stats.textContent = 'Colums: 5 / Rows: 10'

  }

  public getGui(): HTMLElement {
    return this.eGui;
  }

  public refresh(params: ICellRendererParams): boolean {
    return true;
  }
}