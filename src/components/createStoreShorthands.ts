type PostData<Model> = Partial<Omit<Model, 'id'>>;

type SortSettings = {
  field: string;
  dir?: 'ASC' | 'DESC';
};

type PaginationSettings = {
  page?: number;
  limit?: number;
  cursor?: number | string;
};

export default function createStoreShortHands<Models, IdType>(stores: any) {
  return {
    create: <const ModelName extends keyof Models>(
      model: ModelName,
      data: PostData<Models[ModelName]>
    ): Promise<Models[ModelName]> => {
      return stores[model]().create(data);
    },

    update: <const ModelName extends keyof Models>(
      model: ModelName,
      id: IdType,
      data: PostData<Models[ModelName]>
    ): Promise<Models[ModelName]> => {
      return stores[model]().update(id, data);
    },

    delete: <const ModelName extends keyof Models>(
      model: ModelName,
      id: IdType
    ): Promise<void> => {
      return stores[model]().delete(id);
    },

    get: <const ModelName extends keyof Models>(
      model: ModelName,
      id: IdType,
      settings?: {
        include?: string[];
      }
    ): Promise<Models[ModelName]> => {
      const include = settings?.include || [];
      return stores[model]().$single(id, include);
    },

    getSingleton: <const ModelName extends keyof Models>(
      model: ModelName,
      filter?: { [key: string]: any }
    ): Promise<Models[ModelName]> => {
      return stores[model]().$fetch(filter || {});
    },

    updateSingleton: <const ModelName extends keyof Models>(
      model: ModelName,
      data: PostData<Models[ModelName]>,
      filter?: { [key: string]: any }
    ): Promise<Models[ModelName]> => {
      return stores[model]().update(data, filter || {});
    },

    list: <const ModelName extends keyof Models>(
      model: ModelName,
      settings?: {
        filter?: any;
        pagination?: PaginationSettings;
        sort?: SortSettings[];
        include?: string[];
      }
    ): Promise<Models[ModelName][]> => {
      const filter = settings?.filter || {};
      const pagination = settings?.pagination || {};
      const sort = settings?.sort || {};
      const include = settings?.include || [];
      return stores[model]().$list(filter, pagination, sort, include);
    },
  };
}
