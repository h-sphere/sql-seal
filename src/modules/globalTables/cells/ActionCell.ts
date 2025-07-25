import type { ICellRendererComp, ICellRendererParams } from "ag-grid-community";
import { TableConfiguration } from "../modal/NewGlobalTableModal";
import { ButtonComponent } from "obsidian";
import { GlobalTablesView } from "../GlobalTablesView";

export class ActionCellRenderer implements ICellRendererComp {
  private eGui!: HTMLDivElement;

  public init(params: ICellRendererParams<any, string, GlobalTablesView>): void {
    const { value, data, context } = params;

    

    this.eGui = document.createElement("div");

    new ButtonComponent(this.eGui)
    .setIcon('trash-2')
    .onClick(() => context.deleteElement(data))
  }

  public getGui(): HTMLElement {
    return this.eGui;
  }

  public refresh(params: ICellRendererParams): boolean {
    return true;
  }
}