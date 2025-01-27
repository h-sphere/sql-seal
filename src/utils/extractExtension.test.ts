import { getFileExtension } from "./extractExtension"

describe('extractExtension', () => {
    it('should properly parse file', () => {
        expect(getFileExtension('a.csv')).toEqual('csv')
        expect(getFileExtension('A.CSV')).toEqual('csv')
        expect(getFileExtension('a/b/c/d/e/f.csv')).toEqual('csv')
        expect(getFileExtension('3.Resources/a/b/c.csv')).toEqual('csv')
    })
})