import { describe, it, expect } from '@jest/globals'
import { parseLanguage } from './parser'


describe('Parser', () => {
    it('should properly parse select only', () => {
        expect(parseLanguage('SELECT * FROM files')).toEqual({
            tables: [],
            queryPart: 'SELECT * FROM files'
        })
    })
})