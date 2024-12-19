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
            'checksum': 'TEXT',
            'syncedAt': 'TEXT',
        })
    }

    registerSync(filename: string, checksum: string) {
        this.db.insertData(this.tableName, [{
            filename,
            checksum,
            syncedAt: Date.now(),
        }])
    }

    async getSync(filename: string) {
        const { data } = await this.db.select(`SELECT *
            FROM sqlseal_sync
            WHERE filename = @filename`,
              {
                filename: filename
              })

        if (data) {
            return data[0] as unknown as SyncEntry
        }
        return null
    }

    removeSync(filename: string) {
        // FIXME: do not use exposed db, instead implement "exec" method inside the file.
        this.db.db.prepare('DELETE FROM sqlseal_sync WHERE filename = :filename AND name = :name').run({
            filename: filename,
            name: tableName
        })
    }

}