import { SqlSealDatabase } from "src/database";
import { FileLog, FileLogRepository } from "./repository/fileLog";
import { TableMapLogRepository } from "./repository/tableMapLog";
import { TAbstractFile, TFile, Vault } from "obsidian";
import { parse } from "papaparse";
import { sanitise } from "src/utils/sanitiseColumn";
import { FieldTypes, toTypeStatements } from "src/utils";
import { FilepathHasher } from "./hasher";
import { Omnibus } from "@hypersphere/omnibus";


interface TableRegistration {
    fileName: string;
    aliasName: string;
    sourceFile: string;
}

export class Sync {
    private fileLog: FileLogRepository;
    private tableMapLog: TableMapLogRepository;
    private bus = new Omnibus()

    private tableMaps = new Map<string, FileLog>()

    constructor(
        private readonly db: SqlSealDatabase,
        private readonly vault: Vault
    ) {

    }

    async updateTableMaps() {
        const data = await this.fileLog.getAll()
        this.tableMaps.clear()
        data.forEach(log => {
            this.tableMaps.set(log.file_name, log)
        })
    }

    async init() {
        await this.db.connect()
        this.fileLog = new FileLogRepository(this.db)
        await this.fileLog.init()

        this.tableMapLog = new TableMapLogRepository(this.db)
        await this.tableMapLog.init()

        const fileLogs = await this.fileLog.getAll()
        for (const log of fileLogs) {
            await this.syncFileByName(log.file_name)
        }

        await this.updateTableMaps()

        // START SYNCING
        this.startSync()
    }

    async syncFileByName(fileName: string) {
        const file = this.vault.getFileByPath(fileName)
        if (!file) {
            return
        }
        await this.syncFile(file)
    }

    async syncFile(file: TFile) {
        if (!this.tableMaps.has(file.path)) {
            this.bus.trigger('file::change::'+file.path)
            return;
        }

        const entry = this.tableMaps.get(file.path)!
        if (entry.file_hash !== file.stat.mtime.toString()) {
            const data = await this.vault.cachedRead(file)
            // TODO: PROBABLY SHOULD BE EXTRACTED SOMEWHERE FROM HERE later.
            const parsed = parse<Record<string, string>>(data, {
                header: true,
                dynamicTyping: false,
                skipEmptyLines: true,
                transformHeader: sanitise
            })
            const typeStatements = toTypeStatements(parsed.meta.fields ?? [], parsed.data)
            const columns = Object.entries(typeStatements.types).map(([key, value]) => ({
                name: key,
                type: value as FieldTypes
            }));
            const tableName = entry.table_name
            await this.db.createTableClean(tableName, columns)
            await this.db.insertData(tableName, typeStatements.data)
            await this.fileLog.updateHash(tableName, file.stat.mtime.toString())
            this.bus.trigger('change::' + tableName)

        }
    }

    startSync() {
        this.vault.on('modify', (file: TAbstractFile) => {
            if (file instanceof TFile) {
                this.syncFile(file)
            }
        })
    }

    async registerFile(log: Omit<FileLog, 'id' | 'created_at' | 'updated_at'>) {
        await this.fileLog.insert(log)
        await this.updateTableMaps()
    }

    async getTablesMappingForContext(sourceFileName: string) {
        const tables = await this.tableMapLog.getByContext(sourceFileName)
        const map = tables.reduce((acc, t) => ({
            ...acc,
            [t.alias_name as string]: t.table_name
        }), {})

        return {
            ...map,
            files: 'files',
            tasks: 'tasks',
            tags: 'tags'
        }
    }

    async generateTableName(fileName: string) {
        const hash = await FilepathHasher.sha256(fileName)
        return `file_${hash}`
    }

    async registerTable(reg: TableRegistration) {
        const existingFileLog = await this.fileLog.getByFilename(reg.fileName)
        let fileTableName: string;
        if (!existingFileLog) {
            // We need to create new one.
            const tableName = await this.generateTableName(reg.fileName)
            await this.registerFile({
                file_name: reg.fileName,
                table_name: tableName,
                file_hash: ''
            })
            fileTableName = tableName
            // INITIAL SYNC
            await this.syncFileByName(reg.fileName)
        } else {
            fileTableName = existingFileLog.table_name
        }

        const existingTableLog = await this.tableMapLog.getByAlias(reg.sourceFile, reg.aliasName)
        if (!existingTableLog) {
            // Create new one
            await this.tableMapLog.insert({
                alias_name: reg.aliasName,
                source_file_name: reg.sourceFile,
                table_name: fileTableName,
            })
        } else {
            // Already exists, doing nothing.
            // Check if it is the same mapping
            if (existingTableLog.table_name != fileTableName) {
                await this.tableMapLog.deleteMapping(existingTableLog.id) // FIXME: might need to remove event too
                await this.tableMapLog.insert({
                    alias_name: reg.aliasName,
                    table_name: fileTableName,
                    source_file_name: reg.sourceFile
                })
            }
        }
    }

    getRegistrator() {
        return this.bus.getRegistrator()
    }

    async getEventNameForAlias(sourceFileName: string, aliasName: string) {
        const log = await this.tableMapLog.getByAlias(sourceFileName, aliasName)
        if (!log) {
            throw new Error(`${aliasName} does not exist for ${sourceFileName}`)
        }
        return `change::${log.table_name}`
    }

    // async onFileChange(file: TFile) {
    //     const path = file.path
    //     const hash = file.stat.mtime
    //     // Checking if the file is registered
    //     const reg = await this.fileLog.getByFilename(path)
    //     if (reg) {
    //         // Need to syncronise it.
    //         // Need to save update in the database.
    //         // Need to trigger all related files.
    //         const allRelated = this.tableMapLog.getByTableName(reg.tableName)
    //         for (const related of allRelated) {
    //             this.bus.bus.trigger('')
    //         }
    //     }

    //     // Checking if the file file is in the map.
    // }
}