import { App } from "obsidian";
import { TableDefinitionExternal } from "../repository/tableDefinitions";
import { ParserTableDefinition } from "./types";

export abstract class ISyncStrategy {
    constructor(protected def: TableDefinitionExternal, protected app: App) {
    }

    get tableDefinition(): TableDefinitionExternal {
        return this.def
    }
    abstract returnData(): Promise<{
        data: Record<string, unknown>[],
        columns: string[]
    }>;

    static async fromParser(def: ParserTableDefinition, app: App): Promise<ISyncStrategy> {
        throw new Error('Not Defined')
    }
}