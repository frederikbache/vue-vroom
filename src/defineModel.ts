import type { ModelSettings } from './types';

type RequiredFields<Fields, K extends keyof Fields> = Fields[K] extends {
  optional: boolean;
}
  ? never
  : K;
type OptionalFields<Fields, K extends keyof Fields> = Fields[K] extends {
  optional: boolean;
}
  ? K
  : never;
type SchemaType<Fields> = {
  [K in keyof Fields as RequiredFields<Fields, K>]: ReturnType<
    // @ts-expect-error
    Fields[K]['type']
  >;
} & {
  [K in keyof Fields as OptionalFields<Fields, K>]?: ReturnType<
    // @ts-expect-error
    Fields[K]['type']
  >;
};

type IA<Type> = {
  [action: string]: (item: Type) => Partial<Type>;
};

export default function defineModel<
  Schema,
  HasMany,
  BelongsTo,
  ItemActions extends IA<SchemaType<Schema>>,
  const Singleton
>({
  schema,
  belongsTo,
  hasMany,
  itemActions,
  singleton,
  ...settings
}: {
  schema: Schema;
  itemActions?: ItemActions;
  belongsTo?: BelongsTo;
  hasMany?: HasMany;
  singleton?: Singleton;
} & ModelSettings) {
  return {
    schema,
    hasMany: hasMany || ({} as HasMany),
    belongsTo: belongsTo || ({} as BelongsTo),
    itemActions: itemActions || ({} as ItemActions),
    types: {} as SchemaType<Schema>,
    singleton: singleton as Singleton,
    ...settings,
  };
}
