import { TFile, Vault } from "obsidian"
import { parse as jsonParse, stringify as jsonStringify } from 'json5'


// export type ColumnType = 'auto' | 'number' | 'text'
export type ColumnType = string

interface ColumnDefinition {
    type: ColumnType
}

export interface ConfigObject {
    columnDefinitions: {[key: string]: ColumnDefinition }
}

export const loadConfig = async (file: TFile, vault: Vault): Promise<ConfigObject> => {
    const config = {
        columnDefinitions: {}
    }

    // Now loading saved one
    const configPath = file!.path + '.sqlsealconfig'
    const configFile = vault.getFileByPath(configPath)
    if (!configFile) {
        return config
    }
    const loadedConfig = await vault.read(configFile)
    // decode
    const decoded = jsonParse(loadedConfig)
    return decoded
}

export const saveConfig = async (file: TFile, content: Object, vault: Vault) => {
    const serialised = jsonStringify(content, null, 2)

    // Check if exists
    const configPath = file!.path + '.sqlsealconfig'
    const configFile = vault.getFileByPath(configPath)
    if (!configFile) {
        // CREATE NEW
        await vault.create(configPath, serialised)
        return
    }

    await vault.modify(configFile, serialised)
}