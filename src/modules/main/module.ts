import { asClass, asFactory, buildContainer } from '@hypersphere/dity'
import { App, Plugin, Vault } from 'obsidian'
import { db } from '../database/module'
import { editor } from '../editor/module'
import { sync } from '../sync/module'
import { CellParserFactory } from '../../cellParser/factory'
import { SQLSealSettings, SQLSealSettingsTab } from '../settings/SQLSealSettingsTab'
import { Init } from './init'
import { settingsModule } from '../settings/module'
import { syntaxHighlight } from '../syntaxHighlight/module'
import { contextMenu } from '../contextMenu/module'
import { debugModule } from '../debug/module'
import { apiModule } from '../api/module'

const obsidian = buildContainer(c => c
    .externals<{
        app: App,
        plugin: Plugin,
        vault: Vault
    }>()
)


export const mainModule = buildContainer(c => c
    .submodules({
        obsidian,
        db,
        editor,
        sync,
        settings: settingsModule,
        syntaxHighlight,
        contextMenu,
        debug: debugModule,
        api: apiModule
    })
    .register({
        cellParser: asFactory(CellParserFactory), // FIXME: move this to settings
        init: asFactory(Init)
    })
    .externals<{ settings: SQLSealSettings }>()
    .resolve({
        'db.app': 'obsidian.app',
    })
    .resolve({
        'editor.app': 'obsidian.app', // THESE SHOULD BE INVALID NOW
        'editor.db': 'db.db',
        'editor.plugin': 'obsidian.plugin',
        'editor.sync': 'sync.syncBus',
        'editor.cellParser': 'cellParser',
        'editor.settings': 'settings.settings'
    })
    .resolve({
        'sync.app': 'obsidian.app',
        'sync.db': 'db.db',
        'sync.plugin': 'obsidian.plugin',
        'sync.vault': 'obsidian.vault',
    })
    .resolve({
        'settings.app': 'obsidian.app',
        'settings.plugin': 'obsidian.plugin',
        'settings.cellParser': 'cellParser',
    })
    .resolve({
        'syntaxHighlight.app': 'obsidian.app',
        'syntaxHighlight.plugin': 'obsidian.plugin',
        'syntaxHighlight.rendererRegistry': 'editor.rendererRegistry'
    })
    .resolve({
        'contextMenu.app': 'obsidian.app',
        'contextMenu.plugin': 'obsidian.plugin'
    })
    .resolve({
        'debug.plugin': 'obsidian.plugin'
    })
    .resolve({
        'api.plugin': 'obsidian.plugin',
        'api.cellParser': 'cellParser',
        'api.db': 'db.db',
        'api.rendererRegistry': 'editor.rendererRegistry'
    })
)

export type MainModule = typeof mainModule
