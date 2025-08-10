import type { ICellRendererComp, ICellRendererParams } from "ag-grid-community";
import { TableConfiguration } from "../modal/NewGlobalTableModal";
import { GlobalTablesView } from "../GlobalTablesView";
import { OmnibusRegistrator } from "@hypersphere/omnibus";

export class StatsRenderer implements ICellRendererComp {
  private eGui!: HTMLDivElement;

  context: GlobalTablesView
  data: TableConfiguration
  eventName: string = ''

  reg: OmnibusRegistrator

  syncFn = () => {
      this.sync()
    }

  public init(params: ICellRendererParams<TableConfiguration, string, GlobalTablesView>) {
    const { value, data, context } = params;
    this.context = context
    this.data = data!

    this.eGui = document.createElement("div");
    this.eGui.className = "stats";

    const stats = this.eGui.createSpan()
    stats.textContent = 'Loading'

    requestAnimationFrame(async () => { this.sync() })

    // Watching for the changes
    this.setupWatchers(context, data!)

  }

  async setupWatchers(context: GlobalTablesView, data: TableConfiguration) {
    this.reg = context.sync.getRegistrator()
    this.eventName = await context.sync.getEventNameForAlias('/', data!.name)
    this.reg.on(this.eventName, this.syncFn)
  }

  async sync() {
    const result = await this.context.sync.getStats('/', this.data!.name)
    this.eGui.textContent = `Rows: ${result.rows} / Columns: ${result.columns}`
  }

  public getGui(): HTMLElement {
    return this.eGui;
  }

  public refresh(params: ICellRendererParams): boolean {
    return false;
  }

  destroy(): void {
    this.reg.off(this.eventName, this.syncFn)
  }
}