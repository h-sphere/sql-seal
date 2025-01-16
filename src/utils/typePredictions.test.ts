import { predictJson, predictType } from './typePredictions'

describe('Utils', () => {
    it('should properly predict TEXT type', () => {
        expect(predictType('xxx', [{ 'xxx': 'dhjkafhkjafhkfas' }])).toEqual('TEXT')
    })

    it('should properly predict JSON type', () => {
        expect(predictType('xxx', [{ 'xxx': { a: 'b' } }])).toEqual('JSON')
    })

    it('should properly predict json by parsing it', () => {
        expect(predictJson([{ 'xxx': '["a", "b"]'}])).toEqual([{
            xxx: ['a', 'b']
        }])
    })
})