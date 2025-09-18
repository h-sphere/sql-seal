import { Registrator } from '@hypersphere/dity'
import { App, Plugin, Vault } from 'obsidian'
import { db } from '../database/module'
import { editor } from '../editor/module'
import { sync } from '../sync/module'
import { SQLSealSettings } from '../settings/SQLSealSettingsTab'
import { mainInit } from './init'
import { settingsModule } from '../settings/module'
import { syntaxHighlight } from '../syntaxHighlight/module'
import { contextMenu } from '../contextMenu/module'
import { apiModule } from '../api/module'
import { globalTables } from '../globalTables/module'
import { explorer } from '../explorer/module'

const obsidian = new Registrator({ logger: console.log })
.import<'app', App>()
.import<'plugin', Plugin>()
.import<'vault', Vault>()
.export('app', 'plugin', 'vault')


export const mainModule = new Registrator()
.module('obsidian', obsidian)
.module('db', db)
.module('editor', editor)
.module('sync', sync)
.module('settings', settingsModule)
.module('syntaxHighlight', syntaxHighlight)
.module('contextMenu', contextMenu)
.module('api', apiModule)
.module('globalTables', globalTables)
.module('explorer', explorer)
.register('init', d => d.fn(mainInit).inject(
    'settings.init',
    'editor.init',
    'syntaxHighlight.init',
    'contextMenu.init',
    'sync.init',
    'api.init',
    'globalTables.init',
    'explorer.init'
))
.link('db.app', 'obsidian.app')

.link('editor.app', 'obsidian.app')
.link('editor.db', 'db.db')
.link('editor.plugin', 'obsidian.plugin')
.link('editor.sync', 'sync.syncBus')
.link('editor.cellParser', 'syntaxHighlight.cellParser')
.link('editor.settings', 'settings.settings')

.link('sync.app', 'obsidian.app')
.link('sync.db', 'db.db')
.link('sync.plugin', 'obsidian.plugin')
.link('sync.vault', 'obsidian.vault')

.link('settings.app', 'obsidian.app')
.link('settings.plugin', 'obsidian.plugin')
.link('settings.viewPluginGenerator', 'syntaxHighlight.viewPluginGenerator')
.link('settings.cellParser', 'syntaxHighlight.cellParser')

.link('syntaxHighlight.app', 'obsidian.app')
.link('syntaxHighlight.db', 'db.db')
.link('syntaxHighlight.plugin', 'obsidian.plugin')
.link('syntaxHighlight.rendererRegistry', 'editor.rendererRegistry')

.link('contextMenu.app', 'obsidian.app')
.link('contextMenu.plugin', 'obsidian.plugin')

.link('api.plugin', 'obsidian.plugin')
.link('api.cellParser', 'syntaxHighlight.cellParser')
.link('api.db', 'db.db')
.link('api.rendererRegistry', 'editor.rendererRegistry')

.link('globalTables.app', 'obsidian.app')
.link('globalTables.plugin', 'obsidian.plugin')
.link('globalTables.sync', 'sync.syncBus')

.link('explorer.app', 'obsidian.app')
.link('explorer.plugin', 'obsidian.plugin')
.link('explorer.cellParser', 'syntaxHighlight.cellParser')
.link('explorer.db', 'db.db')
.link('explorer.viewPluginGenerator', 'syntaxHighlight.viewPluginGenerator')
.link('explorer.sync', 'sync.syncBus')
.link('explorer.rendererRegistry', 'editor.rendererRegistry')
.link('explorer.settings', 'settings.settings')

