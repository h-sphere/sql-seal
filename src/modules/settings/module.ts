import { asClass, asFactory, buildContainer } from "@hypersphere/dity";
import { App, Plugin } from "obsidian";
import { SettingsFactory } from "./settingsFactory";
import { SQLSealSettingsTab } from "./SQLSealSettingsTab";
import { SettingsInit } from "./init";
import { ModernCellParser } from "../syntaxHighlight/cellParser/ModernCellParser";
import { ViewPluginGeneratorType } from "../syntaxHighlight/viewPluginGenerator";

export const settingsModule = buildContainer(c => c
    .externals<{
        'plugin': Plugin,
        'app': App,
        'cellParser': ModernCellParser,
        'viewPluginGenerator': ViewPluginGeneratorType
    }>()
    .register({
        'settings': asFactory(SettingsFactory),
        'settingsTab': asClass(SQLSealSettingsTab),
        init: asFactory(SettingsInit)
    })
    .exports('settings', 'init')
)

export type SettingsModule = typeof settingsModule