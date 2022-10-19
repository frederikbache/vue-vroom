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

vroom.server?.addFilters({
    foo: {
        baz(item, value, db) {
            expectType<{ bar: number }>(item);
            expectType<string>(value);
            expectType<{ bar: number } | null>(db.foo.first());
            return true;
        }
    },
    // @ts-expect-error
    nonExistingModel: {}
})