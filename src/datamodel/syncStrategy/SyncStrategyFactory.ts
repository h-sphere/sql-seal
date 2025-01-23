import { App } from "obsidian";
import { ISyncStrategy } from "./abstractSyncStrategy";
import { CsvFileSyncStrategy } from "./CsvFileSyncStrategy";
import { MarkdownTableSyncStrategy } from "./MarkdownTableSyncStrategy";
import { ParserTableDefinition } from "./types";
import path from "path";
import { TableDefinitionExternal } from "../repository/tableDefinitions";

function getFileExtension(pathname: string): string | null {


    // FIXME: splitting for now
    return pathname.split('.')[1].toLowerCase()

    // const url = new URL(pathname);
    // const filePath = url.pathname;
    // const fileName = path.basename(filePath);
    // return path.extname(fileName);
}

const resolveFileStrategy = (filename: string) => {
    const extension = getFileExtension(filename)

    switch (extension) {
        case 'csv':
            return CsvFileSyncStrategy
        default:
            throw new Error(`No file processor for extension ${extension}`)
    }
}

const resolveClass = (type: string, filename: string) => {
    switch (type) {
        case 'file':
            return resolveFileStrategy(filename)
        case 'table':
            return MarkdownTableSyncStrategy
        default:
            throw new Error(`Undefined strategy for type ${type}`)
    }
}

export class SyncStrategyFactory {
    static async getStrategyFromParser(def: ParserTableDefinition, app: App): Promise<ISyncStrategy> {
        const Cls = resolveClass(def.type, def.arguments[0])
        return Cls.fromParser(def, app)
    }

    static getStrategy(def: TableDefinitionExternal, app: App): ISyncStrategy {
        const Cls = resolveClass(def.type, def.source_file)
        return new Cls(def, app)
    }
}