import { parseLanguage } from './newParser'
jest.mock('../datamodel/syncStrategy/MarkdownTableSyncStrategy')

describe('Parser', () => {
    it('should properly parse select only', () => {
        expect(parseLanguage('SELECT * FROM files')).toEqual({
            tables: [],
            queryPart: 'SELECT * FROM files',
            intermediateContent: ''
        })
    })

    it('should parse properly table and select', () => {
        expect(parseLanguage(`TABLE x = file(a.csv)
SELECT * FROM files`, "source.md")).toEqual({
            tables: [{
                tableAlias: 'x',
                arguments: ['a.csv'],
                type: 'file',
                sourceFile: "source.md"
            }],
            queryPart: 'SELECT * FROM files',
            intermediateContent: ''
        })
    })

    it('should parse properly multiple tables in the same file', () => {
        expect(parseLanguage(`TABLE x = file(a.csv)
TABLE y = file(very-long-name.csv)
SELECT * FROM a JOIN y ON a.id=y.id`, 's.md')).toEqual({
            tables: [{
                tableAlias: 'x',
                arguments: ['a.csv'],
                type: 'file',
                sourceFile: 's.md'
            },
            {
                tableAlias: 'y',
                arguments: ['very-long-name.csv'],
                type: 'file',
                sourceFile: 's.md'
            }],
            queryPart: 'SELECT * FROM a JOIN y ON a.id=y.id',
            intermediateContent: ''
        })
    })

    it('should parse properly multiple tables in the same file', () => {
        expect(parseLanguage(`TABLE x = file(a.csv)
TABLE y = file(      very-long-name.csv       )

CHART {
    x: 5,
    y: 654
}
SELECT * FROM a JOIN y ON a.id=y.id`, 'source.md')).toEqual({
            tables: [{
                tableAlias: 'x',
                arguments: ['a.csv'],
                type: 'file',
                sourceFile: 'source.md'
            },
            {
                tableAlias: 'y',
                arguments: ['very-long-name.csv'],
                type: 'file',
                sourceFile: 'source.md'
            }],
            queryPart: 'SELECT * FROM a JOIN y ON a.id=y.id',
            intermediateContent: `CHART {
    x: 5,
    y: 654
}`
        })
    })

    it('should properly parse query where SELECT is lowercase', () => {
        expect(parseLanguage(`
HTML
select * from files`)).toEqual({
            "intermediateContent": "HTML",
            "queryPart": "select * from files",
            "tables": [],
        })

        expect(parseLanguage(`
            html
            select * from files`)).toEqual({
                        "intermediateContent": "html",
                        "queryPart": "select * from files",
                        "tables": [],
                    })
    })

    it('should properly parse query where SELECT is in sPoNgeBoB-cAsE', () => {
        expect(parseLanguage(`
HTML
sElEcT * fRoM files`)).toEqual({
            "intermediateContent": "HTML",
            "queryPart": "sElEcT * fRoM files",
            "tables": [],
        })
    })

    it('should allow for lowercase TABLE syntax', () => {
        expect(parseLanguage(`
            
            table x = file(a.csv)

            html

            select * from files
            
            `, 'src.md')).toEqual({
            'intermediateContent': 'html',
            'queryPart': 'select * from files',
            tables: [
                {
                    tableAlias: 'x',
                    arguments: ['a.csv'],
                    type: 'file',
                    sourceFile: 'src.md'
                }
            ]
        })
    })

    it('should properly parse query with just table and sql syntax', () => {
        const q = `table x = file(aaa.csv)
select * from x`
        expect(parseLanguage(q, '2025-01-01.md')).toEqual({
            queryPart: 'select * from x',
            intermediateContent: '',
            tables: [
                {
                    tableAlias: 'x',
                    arguments: ['aaa.csv'],
                    type: 'file',
                    sourceFile: '2025-01-01.md'
                }
            ]
        })
    })

    it('should properly parse query with table definition with multiple arguments', () => {
        const q = `table x = file(aaa.csv, secondArg,         third argument)
select * from x`
        expect(parseLanguage(q, '2025-01-01.md')).toEqual({
            queryPart: 'select * from x',
            intermediateContent: '',
            tables: [
                {
                    tableAlias: 'x',
                    arguments: ['aaa.csv', 'secondArg', 'third argument'],
                    type: 'file',
                    sourceFile: '2025-01-01.md'
                }
            ]
        })
    })

    it('should properly parse query with dot in their name', () => {
        const q = `table x = file(3.Resources/data/file.csv)
        select * from x
        `
        expect(parseLanguage(q, '2025-01-01.md')).toEqual({
            queryPart: 'select * from x',
            intermediateContent: '',
            tables: [
                {
                    tableAlias: 'x',
                    arguments: ['3.Resources/data/file.csv'],
                    type: 'file',
                    sourceFile: '2025-01-01.md'
                }
            ]
        })
    })
})