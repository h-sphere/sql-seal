import { describe, it, expect, jest } from '@jest/globals'
import { createSignal } from '../utils/signal'
import { dataTransformer } from './dataTransformer'

describe('Data Transformer', () => {
    it('should properly transform basic file', () => {
        const s = createSignal<string>()
        const dt = dataTransformer(s)
        s(`a,b,c
1,2,3
4,5,6`)
        expect(dt.value.data).toHaveLength(2)
        expect(dt.value.data[0]).toEqual({
            a: 1,
            b: 2,
            c: 3
        })

        expect(dt.value.types).toEqual({
            a: 'INTEGER',
            b: 'INTEGER',
            c: 'INTEGER'
        })
    })

    it('should properly transform incorrect keys', () => {
        const s = createSignal<string>()
        const dt = dataTransformer(s)
        s(`BEGIN,PLAN,QUERY,RAISE,beak size (mm)
1.5,hello world,343.423,22.34,2`)
        expect(dt.value.types).toEqual({
            'begin_': 'REAL',
            'plan_': 'TEXT',
            'query_': 'REAL',
            'raise_': 'REAL',
            'beak_size__mm_': 'INTEGER'
        })
    })
})