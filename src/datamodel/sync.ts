import { SqlSealDatabase } from "../database/database";
import { TableAliasesRepository } from "./repository/tableAliases";
import { App, TAbstractFile, TFile, Vault } from "obsidian";
import { FilepathHasher } from "../utils/hasher";
import { Omnibus } from "@hypersphere/omnibus";
import { SyncStrategyFactory } from "./syncStrategy/SyncStrategyFactory";
import { ConfigurationRepository } from "./repository/configuration";
import { TableDefinitionsRepository, TableDefinition } from "./repository/tableDefinitions";
import { ParserTableDefinition } from "./syncStrategy/types";
import { uniq } from "lodash";


const SQLSEAL_DATABASE_VERSION = 2;

export class Sync {
    private tableDefinitionsRepo: TableDefinitionsRepository;
    private tableMapLog: TableAliasesRepository;
    private bus = new Omnibus()

    constructor(
        private readonly db: SqlSealDatabase,
        private readonly vault: Vault,
        private readonly app: App
    ) {

    }

    triggerGlobalTableChange(name: string) {
        this.bus.trigger('change::' + name)
    }

    async init() {
        await this.db.connect()

        // Configuration
        const config = new ConfigurationRepository(this.db)
        let version
        try {
            version = await config.getConfig('version') as number
        } catch (e) {
            version = 0
        }

        if (version < SQLSEAL_DATABASE_VERSION) {
            await this.db.recreateDatabase()
        }

        await config.init()

        this.tableDefinitionsRepo = new TableDefinitionsRepository(this.db)
        await this.tableDefinitionsRepo.init()

        this.tableMapLog = new TableAliasesRepository(this.db)
        await this.tableMapLog.init()

        await config.setConfig('version', SQLSEAL_DATABASE_VERSION)

        const fileLogs = await this.tableDefinitionsRepo.getAll()
        const uniquePaths = uniq(fileLogs.map(l => l.source_file))
        for (const path of uniquePaths) {
            await this.syncFileByName(path)
        }

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
        this.bus.trigger('file::change::'+file.path)

        const maps = await this.tableDefinitionsRepo.getBySourceFile(file.path)

        if (!maps) {
            return
        }

        for (const entry of maps) {
            if (!entry) {
                return
            }
            if (entry.file_hash !== file.stat.mtime.toString()) {
                const syncObject = SyncStrategyFactory.getStrategy(entry, this.app)
    
                const { data, columns } = await syncObject.returnData()
    
                const tableName = entry.table_name
                await this.db.createTableNoTypes(tableName, columns)
                await this.db.insertData(tableName, data)
                await this.tableDefinitionsRepo.update(entry.id, { file_hash: file.stat.mtime.toString() })
                this.bus.trigger('change::' + tableName)
    
            }
        }
    }

    startSync() {
        this.vault.on('modify', (file: TAbstractFile) => {
            if (file instanceof TFile) {
                this.syncFile(file)
            }
        })
    }

    async registerFile(log: Omit<TableDefinition, 'id' | 'created_at' | 'updated_at'>) {
        await this.tableDefinitionsRepo.insert(log)
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

    async registerTable(reg: ParserTableDefinition) {
        const syncObject = await SyncStrategyFactory.getStrategyFromParser(reg, this.app)

        const definition = syncObject.tableDefinition

        const existingDefinition = await this.tableDefinitionsRepo.getByRefreshId(definition.refresh_id) // FIXME: probably can be by table name too.

        let tableName: string;

        if (!existingDefinition) {
            // This one is not registered yet, registering
            await this.registerFile(definition)
            await this.syncFileByName(definition.source_file)
            tableName = definition.table_name
        } else {
            tableName = existingDefinition.table_name
        }

        // TODO: THIS PART SHOULD BE REWRITTEN SOONish
        const existingTableLog = await this.tableMapLog.getByAlias(reg.sourceFile, reg.tableAlias)
        if (!existingTableLog) {
            // console.log(`Registering new mapping ${reg.sourceFile} :: ${reg.tableAlias} -> ${tableName}`)
            // Create new one
            await this.tableMapLog.insert({
                alias_name: reg.tableAlias,
                source_file_name: reg.sourceFile,
                table_name: tableName,
            })
        } else {
            // Check if it is the same mapping
            if (existingTableLog.table_name !== tableName) {
                // console.log(`Alias ${reg.sourceFile} :: ${reg.tableAlias} changed table, now it should refer to ${tableName})`)
                await this.tableMapLog.deleteMapping(existingTableLog.id)
                await this.tableMapLog.insert({
                    alias_name: reg.tableAlias,
                    table_name: tableName,
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
}