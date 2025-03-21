import { identity } from "lodash"
import { App } from "obsidian"
import { CellParserRegistar } from "../cellParser"
import { renderCheckbox } from "./ui/checkbox"
import { renderLink } from "./ui/link"
import { renderImage } from "./ui/image"

export  const displayNotice = (el: HTMLElement, text: string) => {
    el.empty()
    el.createDiv({ text: text, cls: 'sqlseal-notice' })
}

export  const displayError = (el: HTMLElement, text: string) => {
    el.empty()
    el.createDiv({ text: text, cls: 'sqlseal-error' })
}



export const isStringifiedArray = (str: string) => {
    return str.length > 1 && str.startsWith('[') && str.endsWith(']') && str[1] !== '[' && str[str.length - 2] !== ']'
}

export const renderStringifiedArray = (input: string, transformer: (f: string) => string | Node = identity) => {
    const arr = JSON.parse(input)
    if (!Array.isArray(arr)) {
        return input
    }
    const links = arr.map(transformer).map(el => [el, ', ']).flat().slice(0, -1)
    const el = createEl('span', { cls: 'sqlseal-element-inline-list'})
    el.append(...links)
    return el
}

export const registerDefaultFunctions = (registar: CellParserRegistar, app: App) => {
    registar.register('checkbox', renderCheckbox(app), 1)
    registar.register('a', renderLink(app), 2)
    registar.register('img', renderImage(app), 2)
}