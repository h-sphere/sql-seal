import { identity, uniqueId } from "lodash";
import { ModernCellParser } from "./ModernCellParser";

type OnSerialisation = (el: HTMLElement) => any;

export class ParseResults {

    functions: ((parentEl: HTMLElement) => void)[] = []

    constructor(
        private readonly cellParser: ModernCellParser,
        private readonly serialise?: OnSerialisation
    ) { }

    parse(data: Record<string, any>[], columns: string[]) {
        this.functions = []
        return data.map(d => {
            const res: any = {}
            for (const col of columns) {
                const data = this.cellParser.prepare(d[col])
                if (data instanceof Element) {
                    if (this.serialise) {
                        res[col] = this.serialise(data)
                    } else {
                        res[col] = data
                    }
                } else if (typeof data === 'string') {
                    res[col] = data
                } else if (!data) {
                    res[col] = ''
                } else {
                    if (!this.serialise) {
                        res[col] = data.element
                        this.functions.push((_parentEl) => {
                            if (data.onRunCallback) {
                                data.onRunCallback(data.element)
                            }
                        })
                    } else {
                        const id = uniqueId('sqlseal__')
                        data.element.id = id
                        res[col] = this.serialise(data.element)
                        this.functions.push((parentEl: HTMLElement) => {
                            const resultingElement = parentEl.find('#' + id)
                            if (!resultingElement) {
                                return
                            }
                            if (data.onRunCallback) {
                                data.onRunCallback(resultingElement)
                            }
                        })
                    }
                    
                }
            }
            return res
        })
    }

    renderAsString(data: Record<string, any>[], columns: string[]) {
        return data.map(d => {
            const res: Record<string, string> = {}
            for (const col of columns) {
                res[col] = this.cellParser.renderAsString(d[col])
            }
            return res
        })
    }

    initialise(parentEl: HTMLElement) {
        this.functions.forEach(fn => fn(parentEl))
    }
}