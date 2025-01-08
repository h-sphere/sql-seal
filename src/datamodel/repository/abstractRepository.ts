import { SqlSealDatabase } from "src/database";

export abstract class Repository {
    constructor(protected readonly db: SqlSealDatabase) { }
}