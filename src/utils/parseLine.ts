import { parse } from 'papaparse';

export function parseCSVLine(line: string) {

    const result = parse<Array<string>>(line, {
        dynamicTyping: false,
        transform: v => v.trim(),
        skipEmptyLines: false,
    })

    return result.data[0]
}