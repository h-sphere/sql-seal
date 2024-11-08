import { SqlSealDatabase } from "src/database";

export interface SyncEntry {
    filename: string;
    url: string;
    name: string;
    syncedAt: string;
    metadata: any;
}


export class SyncModel {
    tableName = 'sqlseal_sync'
    constructor(private db: SqlSealDatabase) {
        this.db.connect().then(() => 
            this.createTableIfNotExists()
        )
    }

    createTableIfNotExists() {
        this.db.createTable(this.tableName, {
            'filename': 'TEXT',
            'url': 'TEXT',
            'name': 'TEXT',
            'syncedAt': 'TEXT',
            'metadata': 'JSON'
        })
    }

    registerSync(filename: string, url: string, tableName: string) {
        this.db.insertData(this.tableName, [{
            filename,
            url,
            name: tableName,
            syncedAt: Date.now(),
            metadata: { }
        }])
    }

    getSync(filename: string, tableName: string) {
        const { data } = this.db.select(`SELECT *
            FROM sqlseal_sync
            WHERE filename = @filename
              AND name = @name`,
              {
                name: tableName,
                filename: filename
              })

        if (data) {
            return data[0] as SyncEntry
        }
        return null
    }

    removeSync(filename: string, tableName: string) {
        // FIXME: do not use exposed db, instead implement "exec" method inside the file.
        this.db.db.prepare('DELETE FROM sqlseal_sync WHERE filename = :filename AND name = :name').run({
            filename: filename,
            name: tableName
        })
    }

}