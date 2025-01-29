import { Database } from "sql.js";
import { parse } from 'json5'
import { SqlSealDatabase } from "./database/database";

export interface CellParser {
    render: (content: string) => Node | string;
}

export class CellParserRegistar implements CellParser {
    functions: Map<string, any> = new Map()
    constructor(private db: SqlSealDatabase) {

    }

    register(name: string, fn: any, argsCount = 1) {
        if (this.functions.has(name)) {
            throw new Error('Function with that name already exists: ' + name)
        }
        this.functions.set(name, fn)
        this.db.registerCustomFunction(name, argsCount)
    }

    unregister(name: string) {
        this.functions.delete(name)
    }

    private renderCustomElement(el: any): Node | string {
        if (this.functions.has(el.type)) {
            return this.functions.get(el.type)!(el.values)
        } else {
            throw new Error(`Custom function processor ${el.type} is not registered`)
        }
    }

    render(content: string) {
        try {
            if (!content) {
                return content
            }
            if (typeof content !== 'string') {
                return content
            }
            if (content.startsWith('SQLSEALCUSTOM')) {
                const parsedData = parse(content.slice('SQLSEALCUSTOM('.length, -1))
                return this.renderCustomElement(parsedData)
            }
            return content
        } catch (e) {
            console.error('Error parsing cell with data:', content, e)
            return createDiv({
                text: 'Parsing error',
                cls: 'sqlseal-parse-error'
            })
        }
    }
}
