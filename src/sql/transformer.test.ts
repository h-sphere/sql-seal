import { describe, it, expect } from '@jest/globals'
import { transformQuery } from './transformer'


describe('SQL Transformer', () => {
    it('should properly transform basic SQL query', () => {
        const transformed = transformQuery('SELECT * FROM x', { x: 'file_123' })
        expect(transformed).toEqual('SELECT * FROM "file_123"')
    })

    it('should properly transform SQL with CTE', () => {
        const transformed = transformQuery('WITH virtual AS (SELECT * FROM x) SELECT * FROM virtual, x', { x: 'y' })
        expect(transformed).toEqual("WITH \"virtual\" AS (SELECT * FROM \"y\") SELECT * FROM \"virtual\", \"y\"")
    })

    it('should properly persist table functions like json_each', () => {
        const transformed = transformQuery(`SELECT y.name, x.value
FROM y, json_each(y.list) as x
WHERE list IS NOT NULL`, { y: 'file_123' })

        expect(transformed).toEqual("SELECT \"file_123\".\"name\", \"x\".\"value\" FROM \"file_123\", json_each(\"file_123\".\"list\") AS \"x\" WHERE \"list\" IS NOT NULL")
    })
})