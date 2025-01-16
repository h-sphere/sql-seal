import { ISyncStrategy } from "../abstractSyncStrategy";

export class MarkdownTableSyncStrategy implements ISyncStrategy {
    tableName(): Promise<string> {
        throw new Error("Method not implemented.");
    }
    returnData() {
        throw new Error("Method not implemented.");
    }
}