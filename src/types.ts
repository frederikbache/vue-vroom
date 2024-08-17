export type ActionName =
  | 'index'
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'bulk-create'
  | 'bulk-update'
  | 'bulk-delete';

export type ID = string | number;

export type HasId = { id: ID };

export type ServerSettings = {
  enable?: boolean;
  /** Sets the mock server delay in ms */
  delay?: number;
};

export type SimpleModelSettings = {
  /** An array of actions to enable for this model */
  only?: ActionName[];
  /** The plural name of the model, defaults to [name]s */
  plural?: string;
  /** Base path for the model in the API */
  path?: string;
  /** Whether or not to wrap the API return in a data prop. Defaults to true. */
  envelope?: boolean;
  pagination?: {
    type: 'page' | 'cursor';
    defaultLimit: number;
  };
  inverse?: {
    [local: string]: string | null;
  };
};
export type ModelSettings = {
  /** An array of actions to enable for this model */
  only?: ActionName[];
  /** The plural name of the model, defaults to [name]s */
  plural?: string;
  /** Base path for the model in the API */
  path?: string;
  /** Whether or not to wrap the API return in a data prop. Defaults to true. */
  envelope?: boolean;
  singleton?: true;
  pagination?: {
    type: 'page' | 'cursor';
    defaultLimit: number;
  };
  inverse?: {
    [local: string]: string | null;
  };
};

export type ApiNames = {
  data: string;
  dataSingle: string;
  meta: string;
  included: string;
};

export type FetchRequestOptions = {
  mode?: 'no-cors' | 'cors' | 'same-origin';
  credentials?: 'include' | 'same-origin' | 'omit';
  cache?: 'default' | 'no-cache' | 'reload' | 'force-cache' | 'only-if-cached';
  redirect?: 'manual' | 'follow' | 'error';
  referrerPolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
};

export type Settings = {
  baseURL?: string;
  server?: ServerSettings;
  idsAreNumbers?: boolean;
  idFactory?: (i: number) => string;
  naming?: {
    [key in keyof ApiNames]?: string;
  };
  identityModel?: any;
  useSnakeCase?: boolean;
};

type WithBelongsToPostFix<Obj, Id, SnakeCase> = SnakeCase extends true
  ? {
      // @ts-expect-error
      [K in `${keyof Obj}_id`]: Id;
    }
  : {
      // @ts-expect-error
      [K in `${keyof Obj}Id`]: Id;
    };

type WithHasManyPostFix<Obj, Id, SnakeCase> = SnakeCase extends true
  ? {
      // @ts-expect-error
      [K in `${keyof Obj}_ids`]?: Id[];
    }
  : {
      // @ts-expect-error
      [K in `${keyof Obj}Ids`]?: Id[];
    };

type RelId<One, Id, SnakeCase> = One extends { [key: string]: () => string }
  ? WithBelongsToPostFix<One, Id, SnakeCase>
  : {};

type RelIds<Many, Id, SnakeCase> = Many extends { [key: string]: () => string }
  ? WithHasManyPostFix<Many, Id, SnakeCase>
  : {};

export type Rels<Many, Models, Id, SnakeCase> = Many extends {
  [key: string]: () => string;
}
  ? {
      [K in keyof Many]?: (Id &
        // @ts-expect-error
        Models[ReturnType<Many[K]>]['types'] &
        // @ts-expect-error
        RelId<Models[ReturnType<Many[K]>]['belongsTo'], Id['id'], SnakeCase>)[];
    }
  : {};

export type Rel<One, Models, Id, SnakeCase> = One extends {
  [key: string]: () => string;
}
  ? {
      [K in keyof One]?: Id &
        // @ts-expect-error
        Models[ReturnType<One[K]>]['types'] &
        // @ts-expect-error
        RelId<Models[ReturnType<One[K]>]['belongsTo'], Id['id'], SnakeCase>;
    }
  : {};

export type FieldTypes<Models, Id, SnakeCase> = {
  // @ts-expect-error
  [K in keyof Models]: Models[K]['types'] &
    Id &
    // @ts-expect-error
    Rels<Models[K]['hasMany'], Models, Id, SnakeCase> &
    // @ts-expect-error
    Rel<Models[K]['belongsTo'], Models, Id, SnakeCase> &
    // @ts-expect-error
    RelId<Models[K]['belongsTo'], Id['id'], SnakeCase> &
    // @ts-expect-error
    RelIds<Models[K]['hasMany'], Id['id'], SnakeCase>;
};

export type IdType<IdSettings> = IdSettings extends { idsAreNumbers: true }
  ? { id: number }
  : { id: string };

export type SnakeCase<CaseSettings> = CaseSettings extends {
  useSnakeCase: true;
}
  ? true
  : false;
