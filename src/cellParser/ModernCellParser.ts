import { CellFunction } from "./CellFunction";
import { parse } from 'json5'
import { isStringifiedArray, renderStringifiedArray } from '../utils/ui'
import { SqlSealDatabase } from "../database/database";

export type UnregisterCallback = () => void;

export type OnRunCallback = (el: HTMLElement) => void | UnregisterCallback;
export interface Result {
    element: HTMLElement,
    onRunCallback?: OnRunCallback
}

export type CellParserResult = Result | string | HTMLElement

export class ModernCellParser {

    private functions: Map<string, CellFunction> = new Map()

    prepare(content: string): CellParserResult {
        try {
            if (!content) {
                return content
            }
            if (typeof content !== 'string') {
                return content
            }
            if (content.startsWith('SQLSEALCUSTOM')) {
                const parsedData = parse(content.slice('SQLSEALCUSTOM('.length, -1))
                // FIXME: zod or arctype here.
                return this.renderCustomElement(parsedData)
            }

            // If it's an array, decode it and render each individual elements
            if (isStringifiedArray(content)) {
                try {
                    const parsed: string[] = parse(content)
                    const container = createSpan()
                    parsed.forEach((p, i) => {
                        const rendered = this.render(p)
                        if (rendered instanceof HTMLElement) {
                            container.appendChild(rendered)
                            if (i < parsed.length -1) {
                                container.appendChild(document.createTextNode(', '))
                            }
                        }
                    })
                    return container
                } catch (e) {
                    return content
                }
            }

            // If it is a wikilink or markdown link, use "a" renderer
            if (content.startsWith('[[') && content.endsWith(']]')) {
                const renderer = this.functions.get('a');
                if (renderer) {
                    const [link, name] = content.slice(2, -2).split('|');
                    return renderer.prepare([link, name]);
                }
            } else if (content.startsWith('[') && content.includes('](') && content.endsWith(')')) {
                const renderer = this.functions.get('a');
                if (renderer) {
                    const closingBracketIndex = content.indexOf('](');
                    const name = content.slice(1, closingBracketIndex);
                    const href = content.slice(closingBracketIndex + 2, -1);
                    return renderer.prepare([href, name]);
                }
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

    render(content: string) {
        const res = this.prepare(content)
        if (typeof res === 'string' || !res) {
            return res
        } else if (res instanceof HTMLElement) {
            return res
        } else {
            if (res.onRunCallback) {
                res.onRunCallback(res.element)
            }
            return res.element
        }
    }

    renderAsString(content: string): string {
        try {
            if (!content) {
                return content
            }
            if (typeof content !== 'string') {
                return content
            }
            if (content.startsWith('SQLSEALCUSTOM')) {
                const parsedData = parse(content.slice('SQLSEALCUSTOM('.length, -1))
                const renderer = this.getRenderer(parsedData)
                return renderer!.renderAsString(parsedData.values)
            }

            // FIXME: bring this one back
            // If it's an array, decode it and render each individual elements
            if (isStringifiedArray(content)) {
                try {
                    const parsed: string[] = parse(content)
                    return parsed.map(p => this.renderAsString(p)).join(', ')
                } catch (e) {
                    return content.toString()
                }
            }


            // If it is a wikilink or markdown link, use "a" renderer
            if (content.startsWith('[[') && content.endsWith(']]')) {
                const renderer = this.functions.get('a');
                if (renderer) {
                    const [link, name] = content.slice(2, -2).split('|');
                    return renderer.renderAsString([link, name]);
                }
            } else if (content.startsWith('[') && content.includes('](') && content.endsWith(')')) {
                const renderer = this.functions.get('a');
                if (renderer) {
                    const closingBracketIndex = content.indexOf('](');
                    const name = content.slice(1, closingBracketIndex);
                    const href = content.slice(closingBracketIndex + 2, -1);
                    return renderer.renderAsString([href, name]);
                }
            }

            return content
        } catch (e) {
            console.error('Error parsing cell with data:', content, e)
            return 'Parsing Error'
        }
    }

    register(fn: CellFunction) {
        this.functions.set(fn.name, fn)
    }

    unregister(fn: string | CellFunction) {
        if (typeof fn === 'string') {
            this.functions.delete(fn)
        } else {
            this.functions.delete(fn.name)
        }
    }

    private renderCustomElement(el: any) {
        const renderer = this.getRenderer(el)
        return renderer?.prepare(el.values)
    }

    private getRenderer(el: any) {
        if (this.functions.has(el.type)) {
            return this.functions.get(el.type)!
        } else {
            throw new Error(`Custom function processor ${el.type} is not registered`)
        }
    }

    // FIXME: this should be extracted to separate class / function but for now it's fine.
    registerDbFunctions(db: SqlSealDatabase) {
        this.functions.forEach(funct => {
            db.registerCustomFunction(funct.name, funct.sqlFunctionArgumentsCount)
        })
    }
}