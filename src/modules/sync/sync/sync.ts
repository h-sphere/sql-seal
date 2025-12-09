import { App, TAbstractFile, TFile, Vault } from "obsidian";
import { FilepathHasher } from "../../../utils/hasher";
import { Omnibus } from "@hypersphere/omnibus";
import { uniq } from "lodash";
import { SqlocalDatabaseProxy } from "../../database/sqlocal/sqlocalDatabaseProxy";
import { TableDefinition, TableDefinitionsRepository } from "../repository/tableDefinitions";
import { TableAliasesRepository } from "../repository/tableAliases";
import { ConfigurationRepository } from "../repository/configuration";
import { ParserTableDefinition } from "../syncStrategy/types";
import { SyncStrategyFactory } from "../syncStrategy/SyncStrategyFactory";


const SQLSEAL_DATABASE_VERSION = 2;

// Global lock to prevent concurrent database recreation
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

export class Sync {
    private tableDefinitionsRepo: TableDefinitionsRepository;
    private tableMapLog: TableAliasesRepository;
    private configRepo: ConfigurationRepository;
    private bus = new Omnibus();
    private isLocallyInitialized = false;

    constructor(
        private readonly db: SqlocalDatabaseProxy,
        private readonly vault: Vault,
        private readonly app: App
    ) {
        console.log('SYNC INSTANTIATED')
    }

    triggerGlobalTableChange(name: string) {
        this.bus.trigger('change::' + name)
    }

    async init() {
        const instanceId = Math.random().toString(36).substring(7);
        console.log(`Sync[${instanceId}]: Starting init, isInitializing: ${isInitializing}, isLocallyInitialized: ${this.isLocallyInitialized}`);

        // If this instance is already initialized, don't do it again
        if (this.isLocallyInitialized) {
            console.log(`Sync[${instanceId}]: This instance already initialized, skipping`);
            return;
        }

        // If another init is already in progress, wait for it
        if (isInitializing && initializationPromise) {
            console.log(`Sync[${instanceId}]: Another init in progress, waiting...`);
            await initializationPromise;
            console.log(`Sync[${instanceId}]: Previous init completed, continuing with local setup`);

            // Just set up the local repositories, don't recreate database
            await this.setupRepositories(instanceId);
            return;
        }

        // Start initialization process
        console.log(`Sync[${instanceId}]: Starting primary initialization`);
        isInitializing = true;
        initializationPromise = this.performInitialization(instanceId);

        try {
            await initializationPromise;
        } finally {
            isInitializing = false;
            initializationPromise = null;
        }
    }

    private async performInitialization(instanceId: string) {
        console.log(`Sync[${instanceId}]: Performing full initialization`);
        console.log(`Sync[${instanceId}]: this.db is:`, this.db);
        console.log(`Sync[${instanceId}]: this.db type:`, typeof this.db);

        await this.db.connect()

        // Configuration
        console.log(`Sync[${instanceId}]: Creating ConfigurationRepository with db:`, this.db);
        this.configRepo = new ConfigurationRepository(this.db)
        console.log(`Sync[${instanceId}]: ConfigurationRepository created`);

        let version
        try {
            version = await this.configRepo.getConfig('version') as number
            console.log('Sync: Current database version:', version);
        } catch (e) {
            console.log('Sync: No version found, assuming version 0');
            version = 0
        }

        if (version < SQLSEAL_DATABASE_VERSION) {
            console.log(`Sync: Upgrading database from version ${version} to ${SQLSEAL_DATABASE_VERSION}`);
            await this.db.recreateDatabase()
        } else {
            console.log('Sync: Database version is current, no recreation needed');
        }

        await this.configRepo.init()

        this.tableDefinitionsRepo = new TableDefinitionsRepository(this.db)
        await this.tableDefinitionsRepo.init()

        this.tableMapLog = new TableAliasesRepository(this.db)
        await this.tableMapLog.init()

        await this.configRepo.setConfig('version', SQLSEAL_DATABASE_VERSION)

        const fileLogs = await this.tableDefinitionsRepo.getAll()
        const uniquePaths = uniq(fileLogs.map(l => l.source_file))
        for (const path of uniquePaths) {
            await this.syncFileByName(path)
        }

        // START SYNCING
        this.startSync()

        await this.refreshGlobalMappings()

        this.isLocallyInitialized = true;
    }

    private async setupRepositories(instanceId: string) {
        console.log(`Sync[${instanceId}]: Setting up repositories for secondary init (no table creation)`);

        await this.db.connect()

        // Create repository instances but don't call init() since tables are already created
        this.configRepo = new ConfigurationRepository(this.db)
        this.tableDefinitionsRepo = new TableDefinitionsRepository(this.db)
        this.tableMapLog = new TableAliasesRepository(this.db)

        // START SYNCING
        this.startSync()

        // Don't call refreshGlobalMappings() - it will be called by the primary initialization
        // await this.refreshGlobalMappings()

        console.log(`Sync[${instanceId}]: Secondary init completed - waiting for global mappings from primary`);
        this.isLocallyInitialized = true;
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
                await this.db.createTable(tableName, columns)
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

    private globalTables: Record<string, string> = {}

    async refreshGlobalMappings() {
        const globalMappings = await this.tableMapLog.getByContext('/') as { alias_name: string, table_name: string }[]
        this.globalTables = Object.fromEntries(globalMappings.map(g => [g.alias_name, g.table_name]))
    }

    get globalTablesMapping() {
        return this.globalTables
    }

    async getTablesMappingForContext(sourceFileName: string) {
        console.log('Sync.getTablesMappingForContext: sourceFileName:', sourceFileName);
        console.log('Sync.getTablesMappingForContext: tableMapLog exists:', !!this.tableMapLog);

        const tables = await this.tableMapLog.getByContext(sourceFileName) as { alias_name: string, table_name: string }[]
        console.log('Sync.getTablesMappingForContext: tables from repository:', tables);

        const map = tables.reduce((acc, t) => ({
            ...acc,
            [t.alias_name as string]: t.table_name
        }), {})

        console.log('Sync.getTablesMappingForContext: local mappings:', map);
        console.log('Sync.getTablesMappingForContext: global mappings:', this.globalTablesMapping);

        const result = {
            ...map,
            ...this.globalTablesMapping,
            files: 'files',
            tasks: 'tasks',
            tags: 'tags',
        };

        console.log('Sync.getTablesMappingForContext: final result:', result);
        return result;
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
            // Create new one
            await this.tableMapLog.insert({
                alias_name: reg.tableAlias,
                source_file_name: reg.sourceFile,
                table_name: tableName,
            })
        } else {
            // Check if it is the same mapping
            if (existingTableLog.table_name !== tableName) {
                await this.tableMapLog.deleteMapping(existingTableLog.id)
                await this.tableMapLog.insert({
                    alias_name: reg.tableAlias,
                    table_name: tableName,
                    source_file_name: reg.sourceFile
                })
            }
        }

        if (reg.sourceFile === '/') {
            await this.refreshGlobalMappings()
        }
    }

    unregisterTable(reg: ParserTableDefinition) {
        return this.tableMapLog.deleteMappingByNames(reg.tableAlias, reg.sourceFile)
    }

    async getStats(sourceFileName: string, table: string) {
        const tab = await this.tableMapLog.getByAlias(sourceFileName, table)
        if (!tab) {
            return { rows: 0, columns: 0 }
        }
        const columns = await this.db.getColumns(tab.table_name)
        const rows = await this.db.count(tab.table_name)
        return {
            rows,
            columns: columns ? columns.length : 0
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