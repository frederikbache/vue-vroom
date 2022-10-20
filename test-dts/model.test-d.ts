import { expectType } from '.';
import { defineModel } from '.';

const model = defineModel({
  schema: {
    aString: { type: String },
    aNumber: { type: Number },
    aBool: { type: Boolean },
    anOptional: { type: String, optional: true },
    anArrayWithoutTyping: { type: Array },
    anArrayWithType: { type: Array as () => number[] },
    anObjectWithoutType: { type: Object },
    anObjectWithType: { type: Object as () => { x: number; y: number } },
    factoryString: { type: () => 'lorem ipsum' },
    factoryObject: { type: () => ({ x: 0, y: 0 }) },
  },
});

type ExpectedType = {
  aString: string;
  aNumber: number;
  aBool: boolean;
  anOptional?: string;
  anArrayWithoutTyping: unknown[];
  anArrayWithType: number[];
  anObjectWithoutType: {};
  anObjectWithType: { x: number; y: number };
  factoryString: string;
  factoryObject: { x: number; y: number };
};

expectType<ExpectedType>(model.types);
