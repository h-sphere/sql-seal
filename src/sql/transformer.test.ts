import { describe, it, expect } from '@jest/globals'
import { transformQuery } from './sqlTransformer'


describe('SQL Transformer', () => {
    it('should properly transform basic SQL query', () => {
        const transformed = transformQuery('SELECT * FROM x', { x: 'file_123' })
        expect(transformed.sql).toEqual('SELECT * FROM file_123')
        expect(transformed.mappedTables).toEqual(['file_123'])
    })

    it('should properly transform SQL with CTE', () => {
        const transformed = transformQuery('WITH v AS (SELECT * FROM x) SELECT * FROM v, x', { x: 'y' })
        expect(transformed.sql).toEqual("WITH v AS (SELECT * FROM y) SELECT * FROM v, y")
        expect(transformed.mappedTables).toEqual(['y'])
    })

    it('should properly persist table functions like json_each', () => {
        const transformed = transformQuery(`SELECT y.name, x.value
FROM y, json_each(y.list) as x
WHERE list IS NOT NULL`, { y: 'file_123' })

        expect(transformed).toEqual({
            sql: `SELECT file_123.name, x.value
FROM file_123, json_each(file_123.list) as x
WHERE list IS NOT NULL`,
            mappedTables: ['file_123']
        })
    })

    it('should properly transform window function', () => {
        const input = `WITH RECURSIVE  
numbers AS (  
SELECT 1 AS num  
UNION ALL  
SELECT num + 1  
FROM numbers  
WHERE num < 10  
)
SELECT  
num,  
SUM(num) OVER (ORDER BY num) AS running_total  
FROM  
numbers`

        expect(transformQuery(input, { files: 'files' })).toEqual({
            sql: input,
            mappedTables: []
        })
    })
})