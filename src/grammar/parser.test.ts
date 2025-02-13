import { parse } from './parser'

describe('Ohm parser', () => {
    
    it('should parse simple table expression', () => {
        expect(parse('TABLE x = file(a.csv)')).toEqual({
            query: '',
            tables: [{ filename: 'a.csv', type: 'csv', identifier: 'x'}],
            flags: {
                explain: false,
                refresh: true
            },
            renderer: {
                name: 'GRID',
                options: ''
            }
        })
    })

    it('should parse SELECT statement alone', () => {
        expect(parse('SELECT * FROM files')).toEqual({
            query: 'SELECT * FROM files',
            tables: [],
            flags: { explain: false, refresh: true },
            renderer: { name: 'GRID', options: '' }
        })
    })

    it('should not parse incorrect statement', () => {
        expect(() => parse('this is not valid entry')).toThrow()
    })

    it('should parse statement with table and select', () => {
        expect(parse(`TABLE x = file(a.csv)
SELECT * FROM x`)).toEqual({
    tables: [{ type: 'csv', filename: 'a.csv', identifier: 'x' }],
    flags: { explain: false, refresh: true },
    renderer: { name: 'GRID', options: '' },
    query: 'SELECT * FROM x'
})
    })

    it('should have table and flags', () => {
        expect(parse(`
            TABLE x = file(a.csv)
            REFRESH
            EXPLAIN
            SELECT * FROM x`)).toEqual({
                tables: [{
                    filename: 'a.csv',
                    identifier: 'x',
                    type: 'csv'
                }],
                renderer: {
                    name: 'GRID',
                    options: ''
                },
                flags: {
                    explain: false,
                    refresh: true
                },
                query: 'SELECT * FROM x'
            })
    })
})