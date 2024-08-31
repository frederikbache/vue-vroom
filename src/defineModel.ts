import type { SimpleModelSettings } from './types';

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
  [K in keyof Fields as RequiredFields<Fields, K>]: Fields[K] extends {
    nullable: boolean;
  }
    ? ReturnType<
        // @ts-expect-error
        Fields[K]['type']
      > | null
    : // @ts-expect-error
      ReturnType<Fields[K]['type']>;
} & {
  [K in keyof Fields as OptionalFields<Fields, K>]?: Fields[K] extends {
    nullable: boolean;
  }
    ? ReturnType<
        // @ts-expect-error
        Fields[K]['type']
      > | null
    : // @ts-expect-error
      ReturnType<Fields[K]['type']>;
};

type IA<Type> = {
  [action: string]: (item: Type) => Partial<Type>;
};

export default function defineModel<
  Schema,
  HasMany,
  BelongsTo,
  ItemActions extends IA<SchemaType<Schema>>,
  const Singleton,
  const Includable,
  const ListMeta
>({
  schema,
  belongsTo,
  hasMany,
  itemActions,
  singleton,
  includable,
  listMeta,
  ...settings
}: {
  schema: Schema;
  itemActions?: ItemActions;
  belongsTo?: BelongsTo;
  hasMany?: HasMany;
  singleton?: Singleton;
  includable?: Includable;
  listMeta?: ListMeta;
} & SimpleModelSettings) {
  return {
    schema,
    hasMany: hasMany || ({} as HasMany),
    belongsTo: belongsTo || ({} as BelongsTo),
    itemActions: itemActions || ({} as ItemActions),
    types: {} as SchemaType<Schema>,
    singleton: singleton as Singleton,
    includable: includable as Includable,
    listMeta: listMeta as ListMeta,
    metaTypes: {} as SchemaType<ListMeta>,
    ...settings,
  };
}
