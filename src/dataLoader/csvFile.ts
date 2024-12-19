import { TFile } from "obsidian";
import { createSignal, Signal } from "src/utils/signal";

export type CSVData = string

export const csvFileSignal = (_file: string): Signal<CSVData> => {
    const sig = createSignal<CSVData>()
    return sig
}