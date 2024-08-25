import { describe, it, expect } from '@jest/globals'
import { predictType } from './utils'

describe('Utils', () => {

    it('should properly predict TEXT type', () => {
        expect(predictType('xxx', [{ 'xxx': 'dhjkafhkjafhkfas' }])).toEqual('TEXT')
    })

    it('should properly predict JSON type', () => {
        expect(predictType('xxx', [{ 'xxx': { a: 'b' } }])).toEqual('JSON')
    })
})