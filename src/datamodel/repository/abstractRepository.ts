import { SqlSealDatabase } from "src/database/database";

export abstract class Repository {
    constructor(protected readonly db: SqlSealDatabase) { }
}