import { derivedSignal, Signal, SignalEventType } from "../utils/signal"
import { CSVData } from "./csvFile"
import { parse } from 'papaparse'
import { toTypeStatements } from "../utils"
import { sanitise } from "../utils/sanitiseColumn"
import { TFile } from "obsidian"


export const parseData = (csvData: string) => {
    const parsed = parse<Record<string, string>>(csvData, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: true,
        transformHeader: sanitise
    })
    return parsed
}


export const dataTransformer = (s: Signal<CSVData>) => {
    const sig =  derivedSignal([s], (data) => {
        try {
            const parsed = parseData(data)
            const typeStatements = toTypeStatements(parsed.meta.fields ?? [], parsed.data)
            return typeStatements
        } catch (e) {
            console.error(e);
            return {
                data: [],
                types: {}
            }
        }
    })

    return sig
}

export type DataTransformerOut = SignalEventType<ReturnType<typeof dataTransformer>>
