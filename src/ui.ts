export const displayData = (el: HTMLElement, columns, data) => {
    el.empty()
    const table = el.createEl("table")
    table.style.setProperty('width', '100%');

    // HEADER
    const header = table.createEl("thead").createEl("tr")
    columns.forEach(c => {
        header.createEl("th", { text: c })
    })

    const body = table.createEl("tbody")
    data.forEach(d => {
        const row = body.createEl("tr")
        columns.forEach(c => {
            row.createEl("td", { text: d[c] })

        })
    })
}

export const displayError = (el: HTMLElement, e: Error) => {
    el.empty()
    const callout = el.createEl("div", { text: e.toString(), cls: 'callout' })
    callout.dataset.callout = 'error'
}

export const displayInfo = (el: HTMLElement, message: string) => {
    el.empty()
    el.childNodes.forEach(c => c.remove())
    const callout = el.createEl("div", { text: message, cls: 'callout' })
    callout.dataset.callout = 'info'
}

export const displayLoader = (el: HTMLElement) => {
    el.empty()
    const loader = el.createEl("div", { cls: 'callout', text: 'Loading SQLSeal database...' })
    loader.dataset.callout = 'info'
}