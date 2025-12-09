import { SqlocalDatabase } from "../../database/sqlocal/sqlocalDatabase";

export abstract class Repository {
    constructor(protected readonly db: SqlocalDatabase) {
        console.log('Repository constructor called with db:', db);
        console.log('Repository constructor - db type:', typeof db);
        console.log('Repository constructor - db has updateData:', typeof db?.updateData);
    }
}