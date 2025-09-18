import { Registrator } from "@hypersphere/dity";
import { App, Plugin } from "obsidian";
import { settingsFactory } from "./settingsFactory";
import { settingsTabFactory, SQLSealSettingsTab } from "./SQLSealSettingsTab";
import { settingsInit } from "./init";
import { ModernCellParser } from "../syntaxHighlight/cellParser/ModernCellParser";
import { ViewPluginGeneratorType } from "../syntaxHighlight/viewPluginGenerator";

export const settingsModule = new Registrator()
    .import<'plugin', Plugin>()
    .import<'app', App>()
    .import<'cellParser', Promise<ModernCellParser>>()
    .import<'viewPluginGenerator', ViewPluginGeneratorType>() // FIXME: we don't need this anymore
    .register('settings', d => d.fn(settingsFactory).inject('plugin'))
    .register('settingsTab', d => d.fn(settingsTabFactory).inject('app', 'plugin', 'settings'))
    .register('init', d => d.fn(settingsInit).inject('plugin', 'settingsTab', 'app', 'settings', 'viewPluginGenerator'))
    .export('settings', 'init')

export type SettingsModule = typeof settingsModule