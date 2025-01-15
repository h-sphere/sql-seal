import { Omnibus } from "@hypersphere/omnibus"
import { registerObservers } from "./registerObservers"

describe('registerObservers', () => {
    it('should properly register observers', () => {
        const bus = new Omnibus()
        const callback = jest.fn()
        const tables = ['files', 'tags']

        registerObservers({
            bus: bus.getRegistrator(),
            callback,
            tables,
            fileName: 'file.md'
        })

        expect(callback).not.toHaveBeenCalled()

        bus.trigger('change::tagss')
        expect(callback).not.toHaveBeenCalled()

        bus.trigger('change::tags')
        bus.trigger('change::files')
        bus.trigger('file::change::file.md')
        expect(callback).toHaveBeenCalledTimes(3)
        


    })
})