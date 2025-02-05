import { sanitise } from "./sanitiseColumn"

describe('sanitise', () => {
    it('should sanitise spaces and special characters', () => {
        expect(sanitise('distance (km2)')).toEqual('distance__km2_')
        expect(sanitise('is new?')).toEqual('is_new_')
        expect(sanitise('view-as')).toEqual('view_as')
    })

    it('should sanitise reserved keywords', () => {
        expect(sanitise('BEGIN')).toEqual('begin_')
        expect(sanitise('AS')).toEqual('as_')
        expect(sanitise('BEGIN AS')).toEqual('begin_as')
    })

    it('should properly normalise non-latin characters', () => {
        expect(sanitise('ćwiczenia')).toEqual('cwiczenia')
        expect(sanitise('część')).toEqual('czesc')
        expect(sanitise('geändert')).toEqual('geandert')
        expect(sanitise('หมวดหมู่')).toEqual('hmwdhmuu')
        expect(sanitise('类别')).toEqual('lei_bie')
        expect(sanitise('категория')).toEqual('kategoriia')
        expect(sanitise('カテゴリ')).toEqual('kategori')
        expect(sanitise('ノートタイプ')).toEqual('nototaipu')
        expect(sanitise('نوع یادداشت')).toEqual('nw__yddsht')
        expect(sanitise('סוג הערה')).toEqual('svg_h_rh')
        expect(sanitise('नोट प्रकार')).toEqual('nott_prkaar')
        expect(sanitise('kožušček')).toEqual('kozuscek')
    })
})