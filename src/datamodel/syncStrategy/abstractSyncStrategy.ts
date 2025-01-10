export interface ISyncStrategy {
    tableName(): Promise<string>;
    returnData(): any;
}