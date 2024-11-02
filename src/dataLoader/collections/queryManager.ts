import { createSignal, derivedSignal, SignalUnsubscriber, withSignals } from "src/utils/signal";
import { TablesManager } from "./tablesManager";

export class QueryManager {
    private registeredQueries: Map<string, SignalUnsubscriber> = new Map()
    constructor(private tablesManager: TablesManager) { }

    registerQuery(fileId: string, tables: Array<string>) {
        if (this.registeredQueries.has(fileId)) {
            this.registeredQueries.get(fileId)!()
            this.registeredQueries.delete(fileId)
        }
        const tableSignals = tables.map(t => this.tablesManager.getTableSignal(t))
        const quertySignal = createSignal<number>()
        const unregister = withSignals(...tableSignals)(() => {
            quertySignal(Date.now())
        })
        this.registeredQueries.set(fileId, unregister)
        return quertySignal
    }
}