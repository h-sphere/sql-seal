import { SqlocalDatabaseProxy } from "../../database/sqlocal/sqlocalDatabaseProxy";

export abstract class Repository {
    constructor(protected readonly db: SqlocalDatabaseProxy) {
    }
}