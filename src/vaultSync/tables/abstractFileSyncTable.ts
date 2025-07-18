import { App, TFile } from "obsidian";
import { SqlSealDatabase } from "../../modules/database/database";

export abstract class AFileSyncTable {
    constructor(
        protected readonly db: SqlSealDatabase,
        protected readonly app: App
    ) {
    }

    shouldPerformBulkInsert: boolean = false
    abstract get tableName(): string;

    abstract onFileModify(file: TFile): Promise<void>;
    abstract onFileDelete(path: string): Promise<void>;
    abstract onFileCreate(file: TFile): Promise<void>;
    abstract onInit(): Promise<void>;
    onFileCreateBulk(files: TFile[]): Promise<void> {
        return Promise.resolve()
    }

}