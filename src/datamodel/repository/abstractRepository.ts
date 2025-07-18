import { SqlSealDatabase } from "../../modules/database/database";

export abstract class Repository {
    constructor(protected readonly db: SqlSealDatabase) { }
}