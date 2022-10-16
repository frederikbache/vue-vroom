type ActionName = 'index' | 'create' | 'read' | 'update' | 'delete'

export type ID = string | number;

export type HasId = { id: ID }

export type ServerSettings = {
    enable?: boolean,
    /** Sets the mock server delay in ms */
    delay?: number,
}

export type ModelSettings = {
    /** An array of actions to enable for this model */
    only?: ActionName[],
    /** The plural name of the model, defaults to [name]s */
    plural?: string,
    /** Base path for the model in the API */
    path?: string,
    /** Whether or not to wrap the API return in a data prop. Defaults to true. */
    envelope?: boolean,
    pagination?: {
        type: 'page' | 'cursor',
        defaultLimit: number
    },
    singleton?: true,
    inverse?: {
        [local: string]: string | null
    }
}

export type Settings = {
    baseURL?: string,
    server?: ServerSettings,
    idsAreNumbers?: boolean,
    idFactory?: (i: number) => string,
}

type RelId<One, Id> = One extends { [key: string]: () => string } ? {
    // @ts-expect-error
    [K in `${keyof One}Id`]: Id
} : {}

type RelIds<Many, Id> = Many extends { [key: string]: () => string } ? {
    // @ts-expect-error
    [K in `${keyof Many}Ids`]?: Id[]
} : {}

export type Rels<Many, Models, Id> = Many extends { [key: string]: () => string } ? {
    // @ts-expect-error
    [K in keyof Many]?: (Id & Models[ReturnType<Many[K]>]['types'])[]
} : {}

export type Rel<One, Models, Id> = One extends { [key: string]: () => string } ? {
    // @ts-expect-error
    [K in keyof One]?: Id & Models[ReturnType<One[K]>]['types']
} : {}

export type FieldTypes<Models, Id> = {
    // @ts-expect-error
    [K in keyof Models]: Models[K]['types']
    // @ts-expect-error
    & Id & Rels<Models[K]['hasMany'], Models, Id>
    // @ts-expect-error
    & Rel<Models[K]['belongsTo'], Models, Id>
    // @ts-expect-error
    & RelId<Models[K]['belongsTo'], Id['id']>
    // @ts-expect-error
    & RelIds<Models[K]['hasMany'], Id['id']>
}

export type IdType<IdSettings> = IdSettings extends { idsAreNumbers: true } ? { id: number } : { id: string };