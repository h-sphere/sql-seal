import * as Comlink from "comlink"
import initSqlJs from 'sql.js'
import wasmBinary from '../node_modules/sql.js/dist/sql-wasm.wasm'

class DatabaseWrap {
    constructor() {
        
    }
    async connect() {
        const SQL = await initSqlJs({
            wasmBinary: wasmBinary
        })

        const db = new SQL.Database()
        const query = db.prepare('CREATE TABLE a(a TEXT, b REAL)').run()
        const data = db.prepare('PRAGMA table_info(a)')
        console.log('DATA', data)
        return data
        // return db
    }
    foo() {
        return 'bar'
    }
}

Comlink.expose(DatabaseWrap)
