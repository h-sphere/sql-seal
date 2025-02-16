import { parse, ParserResult, parseWithDefaults, ViewDefinition } from './parser'

const DEFAULT_VIEWS: ViewDefinition[] = [
    {
        name: 'GRID',
        singleLine: false,
        argument: 'anyObject?'
    },
    {
        name: 'HTML',
        singleLine: true,
        argument: 'restLine?'
    },
    {
        name: 'MARKDOWN',
        singleLine: true,
        argument: 'restLine?'
    },
    {
        name: 'LIST',
        singleLine: true,
        argument: 'restLine?'
    }
]

describe('Ohm parser', () => {

    it('should parse simple table expression', () => {
        expect(parse('TABLE x = file(a.csv)', DEFAULT_VIEWS)).toEqual({
            query: '',
            tables: [{ arguments: ['a.csv'], type: 'file', tableAlias: 'x' }],
            flags: {},
            renderer: {
                name: 'GRID',
                options: ''
            }
        })
    })

    it('should parse SELECT statement alone', () => {
        expect(parse('SELECT * FROM files', DEFAULT_VIEWS)).toEqual({
            query: 'SELECT * FROM files',
            tables: [],
            flags: {},
            renderer: { name: 'GRID', options: '' }
        })
    })

    it('should not parse incorrect statement', () => {
        expect(() => parse('this is not valid entry', DEFAULT_VIEWS)).toThrow()
    })

    it('should parse statement with table and select', () => {
        expect(parse(`TABLE x = file(a.csv)
SELECT * FROM x`, DEFAULT_VIEWS)).toEqual({
            tables: [{ type: 'file', arguments: ['a.csv'], tableAlias: 'x' }],
            flags: {},
            renderer: { name: 'GRID', options: '' },
            query: 'SELECT * FROM x'
        })
    })

    it('should have table and flags', () => {
        expect(parse(`
            TABLE x = file(a.csv)
            REFRESH
            EXPLAIN
            SELECT * FROM x`, DEFAULT_VIEWS)).toEqual({
            tables: [{
                arguments: ['a.csv'],
                tableAlias: 'x',
                type: 'file'
            }],
            renderer: {
                name: 'GRID',
                options: ''
            },
            flags: {
                explain: true,
                refresh: true
            },
            query: 'SELECT * FROM x'
        })
    })

    it('should properly setup 2 different types of tables', () => {
        expect(parse(`
            TABLE x = file(a.csv)
            TABLE y = table(0)
        `, DEFAULT_VIEWS)).toEqual({
            tables: [{
                type: 'file',
                tableAlias: 'x',
                arguments: ['a.csv']
            },
            {
                type: 'table',
                tableAlias: 'y',
                arguments: ['0']
            }],
            flags: {},
            query: '',
            renderer: { name: 'GRID', options: '' }
        })
    })

    it('should work in a lowercase', () => {
        expect(parse(`
        table xyz = FILE(a.csv)
        tAbLe ppp = tAbLe(3)
        nO rEfResH
        eXplaIn
        hTmL
        sElEct * fRom xyz JOIN ppp ON xyz.a=ppp.b
            `, DEFAULT_VIEWS)).toEqual({
            flags: {
                refresh: false,
                explain: true
            },
            tables: [
                {
                    tableAlias: 'xyz',
                    type: 'file',
                    arguments: ['a.csv']
                },
                {
                    tableAlias: 'ppp',
                    type: 'table',
                    arguments: ["3"]
                }
            ],
            renderer: {
                type: 'HTML',
                options: ''
            },
            query: 'sElEct * fRom xyz JOIN ppp ON xyz.a=ppp.b'
        })
    })

    it('should work with html renderer with options', () => {
        expect(parse(`
            HTML .class1.class2
            SELECT * FROM files
            `, DEFAULT_VIEWS)).toEqual({
            "flags": {},
            "query": "SELECT * FROM files",
            "renderer": {
                "options": ".class1.class2",
                "type": "HTML",
            },
            "tables": [],
        })

        expect(parse(`
            HTML class1 class2 class3 class4
            SELECT * FROM files
            `, DEFAULT_VIEWS)).toEqual({
            "flags": {},
            "query": "SELECT * FROM files",
            "renderer": {
                "options": "class1 class2 class3 class4",
                "type": "HTML",
            },
            "tables": [],
        })
    })

    it('should work with GRID and generic object', () => {
        expect(parse(`
            GRID {
                a: 5,
                b: () => column('a')
            }
            SELECT * FROM files`, DEFAULT_VIEWS)).toEqual({
            flags: {},
            query: 'SELECT * FROM files',
            renderer: {
                type: 'GRID',
                options: `{
                a: 5,
                b: () => column('a')
            }`,
            },
            tables: []
        })
    })

    it('should allow for blank lines and weird formatting', () => {
        expect(parse(`


EXPLAIN

TABLE y =
            FILE(
                a.csv
            )


            GRID {
                a: 5,
                b: () => column('a')
            }
            SELECT * FROM files`, DEFAULT_VIEWS)).toEqual({
            flags: { explain: true },
            query: 'SELECT * FROM files',
            renderer: {
                type: 'GRID',
                options: `{
                a: 5,
                b: () => column('a')
            }`,
            },
            tables: [{ tableAlias: 'y', arguments: ['a.csv'], type: 'file' }]
        })
    })
})

const DEFAULTS: ParserResult = {
    flags: { explain: false, refresh: true },
    query: '',
    renderer: { type: 'GRID', options: '' },
    tables: []
}

describe('parseWithDefaults', () => {
    it('should properly apply modifications to the defaults', () => {
        expect(parseWithDefaults(`HTML
            EXPLAIN
            SELECT * FROM files`, DEFAULT_VIEWS, DEFAULTS)).toEqual({
            flags: { explain: true, refresh: true },
            query: 'SELECT * FROM files',
            renderer: { type: 'HTML', options: '' },
            tables: []
        })
    })

    it('should properly use all different flags and statements', () => {
        expect(parseWithDefaults(`
            TABLE a = file(file.csv)
            TABLE b = table(0)
            LIST
            EXPLAIN
            NO REFRESH
            WITH x AS (
                SELECT * FROM x
            )
            SELECT * FROM x`, DEFAULT_VIEWS, DEFAULTS)).toEqual({
            flags: { explain: true, refresh: false },
            query: `WITH x AS (
                SELECT * FROM x
            )
            SELECT * FROM x`,
            renderer: { type: 'LIST', options: '' },
            tables: [
                {
                    tableAlias: 'a',
                    arguments: ['file.csv'],
                    type: 'file'
                },
                {
                    tableAlias: 'b',
                    arguments: ['0'],
                    type: 'table'
                }
            ]
        })
    })

    it('should properly use all advanced symbols and spacers', () => {
        expect(parseWithDefaults(`
    TABLE       TaBl3__NaMe =
                                file(
                                    ../../File Name34-XYZ_.Final2.csv
                                )

                TABLE table2 = file(x.json5, $[1])
                
                LIST .class1.sql-seal__graph .another-class__333
                EXPLAIN
                NO REFRESH

                WITH dsadasd AS ( SELECT * FROM files)
                SELECT * FROM dsadasd
            `, DEFAULT_VIEWS, DEFAULTS)).toEqual({
            flags: { explain: true, refresh: false },
            query: `WITH dsadasd AS ( SELECT * FROM files)
                SELECT * FROM dsadasd`,
            renderer: { type: 'LIST', options: '.class1.sql-seal__graph .another-class__333' },
            tables: [
                {
                    "arguments": [
                        "../../File Name34-XYZ_.Final2.csv",
                    ],
                    "tableAlias": "TaBl3__NaMe",
                    "type": "file",
                },
                {
                    arguments: ["x.json5", "$[1]"],
                    type: "file",
                    "tableAlias": "table2"
                }
            ]
        })
    })

    it('should properly handle chart', () => {
        expect(parseWithDefaults(`
            TABLE data = file(test_data.csv)

CHART {
      grid3D: {},
      xAxis3D: {
        type: 'category'
      },
      yAxis3D: {},
      zAxis3D: {}
}
SELECT * FROM data`, [...DEFAULT_VIEWS, { argument: 'anyObject?', name: 'chart', singleLine: false }], DEFAULTS)).toEqual({
      "flags":  {
        "explain": false,
        "refresh": true,
      },
      "query": "SELECT * FROM data",
      "renderer":  {
    "options": `{
      grid3D: {},
      xAxis3D: {
        type: 'category'
      },
      yAxis3D: {},
      zAxis3D: {}
}`,
        "type": "CHART",
      },
      "tables":  [
         {
          "arguments":  [
            "test_data.csv",
          ],
          "tableAlias": "data",
          "type": "file",
        },
      ],
    })
    })
})