export interface ISyncStrategy {
    tableName(): Promise<string>;
    returnData(): Promise<{
        data: Record<string, unknown>[],
        columns: string[]
    }>;
}