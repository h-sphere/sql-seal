import { renderLink } from "./ui"

const makeApp = () => ({ metadataCache: { getFirstLinkpathDest: jest.fn(p => ({ path: p })) } })

describe('UI', () => {
    it('should properly render links', () => {
        const app = makeApp()
        const createEl = jest.fn()
        renderLink(app as any, createEl)(['a/b/c.md'])
        expect(createEl).toHaveBeenCalledWith('a', {
            cls: 'internal-link',
            href: 'a/b/c.md',
            text: 'c'
        })
    })

    it('should properly render link with name provided', () => {
        const app = makeApp()
        const createEl = jest.fn()
        renderLink(app as any, createEl)(['a/b/c.md', 'Name'])
        expect(createEl).toHaveBeenCalledWith('a', {
            cls: 'internal-link',
            href: 'a/b/c.md',
            text: 'Name'
        })
    })

    it('should properly render link with external url', () => {
        const app = makeApp()
        const createEl = jest.fn()
        renderLink(app as any, createEl)(['https://wikipedia.org', 'Wikipedia'])
        expect(createEl).toHaveBeenCalledWith('a', {
            cls: '',
            href: 'https://wikipedia.org',
            text: 'Wikipedia'
        })
    })

    it('should properly render link using wikilink tag', () => {
        const app = makeApp()
        const createEl = jest.fn()
        renderLink(app as any, createEl)(['[[a/b/c.md|Alias]]'])
        expect(createEl).toHaveBeenCalledWith('a', {
            cls: 'internal-link',
            href: 'a/b/c.md',
            text: 'Alias'
        })
    })

    it('should properly return empty string when link is empty', () => {
        const app = makeApp()
        const createEl = jest.fn()
        const res = renderLink(app as any, createEl)([undefined as any])
        expect(createEl).not.toHaveBeenCalled()
        expect(res).toEqual('')
    })
})