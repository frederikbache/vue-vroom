import { expectType } from '.';
import { createVroom, defineModel } from '.';

const vroom = createVroom({
    models: {
        foo: defineModel({
            schema: {
                bar: { type: Number }
            }
        })
    }
})

vroom.server?.get('/foo', (request, db) => {
    expectType<{[key: string]: string}>(request.params)
    // TODO Should this be typed better?
    expectType<object>(request.query)
    expectType<{ bar: number } | null>(db.foo.first());
})