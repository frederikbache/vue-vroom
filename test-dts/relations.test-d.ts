import { expectType } from '.';
import { createVroom, defineModel } from '.';

const vroom = createVroom({
  models: {
    foo: defineModel({
      schema: {},
      belongsTo: {
        baz: () => 'baz',
      },
      hasMany: {
        bars: () => 'bar',
      },
    }),
    bar: defineModel({
      schema: {},
      belongsTo: {
        foo: () => 'foo',
      },
    }),
    baz: defineModel({
      schema: {},
    }),
  },
});

vroom.types.foo.bars;
vroom.types.bar.foo;

type BarsType = {
  id: string;
  fooId: string;
};

type FooType = {
  id: string;
  bazId: string;
};

expectType<BarsType[] | undefined>(vroom.types.foo.bars);
expectType<FooType | undefined>(vroom.types.bar.foo);
