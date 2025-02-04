import { parseIntermediateContent } from "./parseIntermediateContent"

describe('Parse Intermediate Content', () => {
    it('should properly parse content without any flags', () => {
        expect(parseIntermediateContent(`
            
            HTML`, {})).toEqual({
                renderer: 'HTML',
                rendererArguments: '',
                flags: {
                    explain: false,
                    refresh: true
                }
            })
    })

    it('should properly set no refresh', () => {
        expect(parseIntermediateContent(`
            NO REFRESH
            HTML`, {})).toEqual({
                renderer: 'HTML',
                rendererArguments: '',
                flags: {
                    explain: false,
                    refresh: false
                }
            })
    })

    it('should properly set explain', () => {
        expect(parseIntermediateContent(`
            EXPLAIN
            HTML`, {})).toEqual({
                renderer: 'HTML',
                rendererArguments: '',
                flags: {
                    explain: true,
                    refresh: true
                }
            })
    })

    it('should properly set both flags', () => {
        expect(parseIntermediateContent(`
            EXPLAIN
            NO REFRESH
            HTML`, {})).toEqual({
                renderer: 'HTML',
                rendererArguments: '',
                flags: {
                    explain: true,
                    refresh: false
                }
            })
    })

    it('should use initial values when calculating', () => {
        expect(parseIntermediateContent(`HTML`, {
            flags: { explain: true, refresh: false }
        })).toEqual({
            flags: { explain: true, refresh: false },
            renderer: 'HTML',
            rendererArguments: ''
        })
    })

    it('should allow for flag modifiers to be used in lower case', () => {
        expect(parseIntermediateContent(`
            explain
            no refresh
            grid
        `, {})).toEqual({
            flags: { explain: true, refresh: false },
            renderer: 'GRID',
            rendererArguments: ''
        })
    })
})