import { asClass, asFactory, buildContainer } from "@hypersphere/dity";
import { App, Plugin } from "obsidian";
import { SettingsFactory } from "./settingsFactory";
import { SQLSealSettingsTab } from "./SQLSealSettingsTab";
import { SettingsInit } from "./init";
import { ModernCellParser } from "../../cellParser/ModernCellParser";

export const settingsModule = buildContainer(c => c
    .externals<{
        'plugin': Plugin,
        'app': App,
        'cellParser': ModernCellParser
    }>()
    .register({
        'settings': asFactory(SettingsFactory),
        'settingsTab': asClass(SQLSealSettingsTab),
        init: asFactory(SettingsInit)
    })
)

export type SettingsModule = typeof settingsModule