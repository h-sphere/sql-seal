import { Notice } from "obsidian"

export const errorNotice = (text: string) => {
    const n = new Notice(text)
    n.noticeEl.classList.add('sqlseal-notice-error')
    return n
}