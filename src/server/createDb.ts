import ServerError from '../ServerError';
import type { FieldTypes, HasId, ID } from '../types';
import socketConnection, { sendMessage } from './Mocket';

type Relation = {
  [K: string]: () => string;
};

type RelationUpdate = {
  name: string;
  model: string;
  id: ID;
  newId: ID;
  oldId?: ID;
};

type Schema = {
  [k: string]: { type: () => any; optional?: boolean };
};

let db = {} as any;

const bc = new BroadcastChannel('db:changes');

export class Collection<Type extends HasId> {
  model: string;
  schema: Schema;
  items: Type[];
  belongsTo: Relation;
  hasMany: Relation;
  inverse: { [field: string]: string };
  lastId: number;
  idsAreNumbers: boolean;
  idFactory: (i: number) => string;
  addDevtoolsEvent:
    | ((title: string, subtitle: string, data: any) => void)
    | undefined;

  constructor(
    model: string,
    schema: Schema,
    belongsTo: Relation,
    hasMany: Relation,
    inverse: any,
    idsAreNumbers: boolean,
    idFactory: any
  ) {
    this.model = model;
    this.schema = schema;
    this.items = [];
    this.lastId = 0;
    this.belongsTo = belongsTo;
    this.hasMany = hasMany;
    this.idsAreNumbers = idsAreNumbers;
    this.idFactory = idFactory;
    this.inverse = inverse || {};
  }

  find(id: Type['id']) {
    let normalisedId = id;
    if (this.idsAreNumbers && typeof id === 'string') {
      normalisedId = parseInt(id, 10);
    }
    return this.all().find((item) => item.id === normalisedId);
  }

  where(filter: (item: Type) => boolean) {
    return this.all().filter(filter);
  }

  count(filter?: (item: Type) => boolean) {
    if (!filter) return this.items.length;
    return this.where(filter).length;
  }

  first() {
    return this.all().length > 0 ? this.all()[0] : null;
  }

  all(): Type[] {
    return JSON.parse(JSON.stringify(this.items));
  }

  createId() {
    this.lastId += 1;

    if (this.idsAreNumbers) return this.lastId;
    if (this.idFactory) return this.idFactory(this.lastId);

    return this.lastId.toString();
  }

  createMany(...items: Partial<Type>[]) {
    return items.map((item) => this.create(item));
  }

  findInverse(field: string) {
    return field in this.inverse ? this.inverse[field] : undefined;
  }

  updateRelations(
    relationsToUpdate: RelationUpdate[],
    relationsToRemove: RelationUpdate[]
  ) {
    relationsToRemove.forEach((rel) => {
      const inverse = this.findInverse(rel.name);
      if (inverse === null) {
        return;
      }
      const collection = db[rel.model] as Collection<any>;
      collection.removeRelation(this.model, rel.id, rel.newId, inverse);
    });

    relationsToUpdate.forEach((rel) => {
      const inverse = this.findInverse(rel.name);
      if (inverse === null) {
        return;
      }
      const collection = db[rel.model] as Collection<any>;
      collection.pushRelation(this.model, rel.id, rel.newId, inverse);
    });
  }

  create(json: Partial<Type>) {
    const newId = json.id || this.createId();

    const factoryData = {} as any;
    Object.entries(this.schema).forEach(([k, v]) => {
      if (v.optional) return;
      factoryData[k] = v.type();
    });

    const relationsToUpdate = [] as RelationUpdate[];

    let data = { ...factoryData, ...json } as any;

    Object.entries(this.belongsTo).forEach(([name, modelFn]) => {
      const nameWithId = name + 'Id';

      if (nameWithId in data) {
        relationsToUpdate.push({
          name,
          newId,
          model: modelFn(),
          id: data[nameWithId],
        });
      } else if (name in data) {
        const id = data[name].id;
        data[nameWithId] = data[name].id;
        delete data[name];
        relationsToUpdate.push({ name, newId, model: modelFn(), id });
      }
      if (!(nameWithId in data)) {
        data[nameWithId] = null;
      }
    });

    Object.entries(this.hasMany).forEach(([name, modelFn]) => {
      const nameWithId = name + 'Ids';

      if (nameWithId in data) {
        data[nameWithId].forEach((id: ID) => {
          relationsToUpdate.push({ name, newId, model: modelFn(), id });
        });
      } else if (name in data) {
        const ids = data[name].map((item: HasId) => item.id);
        data[nameWithId] = ids;
        delete data[name];
        ids.forEach((id: ID) => {
          relationsToUpdate.push({ name, newId, model: modelFn(), id });
        });
      }
      if (!(nameWithId in data)) {
        data[nameWithId] = [];
      }
    });

    this.items.push({
      id: newId,
      ...data,
    } as any);

    if (this.addDevtoolsEvent) {
      this.addDevtoolsEvent(this.model, 'create', {
        payload: data,
        result: this.items[this.items.length - 1],
      });
    }

    if (relationsToUpdate.length) {
      this.updateRelations(relationsToUpdate, []);
    }

    this.sync();
    sendMessage({
      type: 'db:create',
      model: this.model,
      id: newId,
      data: this.items[this.items.length - 1],
    });

    return this.items[this.items.length - 1];
  }

  pushRelation(
    model: string,
    id: Type['id'],
    relationId: Type['id'],
    force: string | null | undefined
  ) {
    if (force === null) return;

    Object.entries(this.hasMany).forEach(([k, v]) => {
      if (force && k !== force) return;
      if (v() === model) {
        const item = this.find(id) as any;
        const field = k + 'Ids';
        const existing = item[field] ? [...item[field]] : [];
        // Don't push if it's already there
        if (existing.includes(relationId)) return;
        this.update(id, {
          [field]: [...existing, relationId],
        } as any);
      }
    });

    Object.entries(this.belongsTo).forEach(([k, v]) => {
      if (force && k !== force) return;
      if (v() === model) {
        const field = k + 'Id';
        const item = this.find(id) as any;
        // Don't update if it's already the same
        if (item[field] === relationId) return;
        this.update(id, {
          [field]: relationId,
        } as any);
      }
    });
  }

  removeRelation(
    model: string,
    id: Type['id'],
    relationId: Type['id'],
    force?: string
  ) {
    Object.entries(this.hasMany).forEach(([k, v]) => {
      if (force && k !== force) return;
      if (v() === model) {
        const item = this.find(id) as any;
        const field = k + 'Ids';
        const existing = item[field] ? [...item[field]] : [];
        if (!item[field].includes(relationId)) return;
        this.update(id, {
          [field]: existing.filter((item) => item !== relationId),
        } as any);
      }
    });

    Object.entries(this.belongsTo).forEach(([k, v]) => {
      if (force && k !== force) return;
      if (v() === model) {
        const item = this.find(id) as any;
        const field = k + 'Id';
        if (item[field] !== relationId) return;
        this.update(id, { [field]: null } as any);
      }
    });
  }

  getRelated(id: Type['id'], key: string) {
    if (key in this.belongsTo) {
      const model = this.belongsTo[key]();
      const field = key + 'Id';
      // @ts-expect-error
      if (!this.find(id)[field]) return [];
      // @ts-expect-error
      return [db[model].find(this.find(id)[field])];
    }
    if (key in this.hasMany) {
      const model = this.hasMany[key]();
      const field = key + 'Ids';
      // @ts-expect-error
      return this.find(id)[field].map((relId: ID) => {
        return db[model].find(relId);
      });
    }
  }

  getRelatedModelName(key: string) {
    if (key in this.belongsTo) {
      return this.belongsTo[key]();
    }
    if (key in this.hasMany) {
      return this.hasMany[key]();
    }
    throw new ServerError(400, { type: 'related_model_not_found' });
  }

  update(id: Type['id'], json: Partial<Type>) {
    const idNormalised =
      this.idsAreNumbers && typeof id !== 'number' ? parseInt(id, 10) : id;
    const index = this.items.findIndex((item) => item.id === idNormalised);
    if (index === -1) {
      throw new ServerError(404);
    }

    const oldData = this.items[index] as any;
    const data = json as any;
    const relationsToUpdate = [] as RelationUpdate[];
    const relationsToRemove = [] as RelationUpdate[];

    Object.entries(this.belongsTo).forEach(([name, modelFn]) => {
      const nameWithId = name + 'Id';
      const oldId = oldData[nameWithId];
      if (nameWithId in data) {
        if (data[nameWithId]) {
          relationsToUpdate.push({
            name,
            newId: idNormalised,
            model: modelFn(),
            id: data[nameWithId],
          });
        }
        if (oldId && oldId !== id) {
          relationsToRemove.push({
            name,
            newId: idNormalised,
            model: modelFn(),
            id: oldId,
          });
        }
      } else if (name in data) {
        const foreignId = data[name].id;
        data[nameWithId] = data[name].id;
        delete data[name];
        relationsToUpdate.push({
          name,
          newId: idNormalised,
          model: modelFn(),
          id: foreignId,
        });
        if (oldId && oldId !== id) {
          relationsToRemove.push({
            name,
            newId: idNormalised,
            model: modelFn(),
            id: oldId,
          });
        }
      }
    });

    Object.entries(this.hasMany).forEach(([name, modelFn]) => {
      const nameWithId = name + 'Ids';
      const oldIds = oldData[nameWithId] || [];
      if (nameWithId in data) {
        const ids = data[nameWithId];
        ids
          .filter((newId: ID) => !oldIds.includes(newId))
          .forEach((foreignId: ID) => {
            relationsToUpdate.push({
              name,
              newId: idNormalised,
              model: modelFn(),
              id: foreignId,
            });
          });
        oldIds
          .filter((oldId: ID) => !ids.includes(oldId))
          .forEach((foreignId: ID) => {
            relationsToRemove.push({
              name,
              newId: idNormalised,
              model: modelFn(),
              id: foreignId,
            });
          });
      } else if (name in data) {
        const ids = data[name].map((item: HasId) => item.id);
        data[nameWithId] = ids;
        delete data[name];
        ids
          .filter((newId: ID) => !oldIds.includes(newId))
          .forEach((foreignId: ID) => {
            relationsToUpdate.push({
              name,
              newId: idNormalised,
              model: modelFn(),
              id: foreignId,
            });
          });
        oldIds
          .filter((oldId: ID) => !ids.includes(oldId))
          .forEach((foreignId: ID) => {
            relationsToRemove.push({
              name,
              newId: idNormalised,
              model: modelFn(),
              id: foreignId,
            });
          });
      }
    });

    const before = JSON.parse(JSON.stringify(this.items[index]));
    Object.entries(data).forEach(([field, value]) => {
      // @ts-expect-error
      this.items[index][field] = value;
    });

    if (this.addDevtoolsEvent) {
      this.addDevtoolsEvent(this.model, 'update', {
        payload: data,
        before,
        after: JSON.parse(JSON.stringify(this.items[index])),
      });
    }

    if (relationsToUpdate.length || relationsToRemove.length) {
      this.updateRelations(relationsToUpdate, relationsToRemove);
    }

    this.sync();

    sendMessage({
      type: 'db:update',
      model: this.model,
      id: id,
      data: this.items[index],
    });

    return this.items[index];
  }

  destroy(id: Type['id']) {
    const item = this.find(id);
    this.items = this.items.filter((item) => item.id !== id);

    if (this.addDevtoolsEvent) {
      this.addDevtoolsEvent(this.model, 'delete', {
        id: id,
      });
    }

    this.sync();
    sendMessage({ type: 'db:delete', model: this.model, id: id, data: item });

    // TODO Update relations on delete also
  }

  truncate() {
    this.items = [];
    this.lastId = 0;
  }

  sync() {
    bc.postMessage({
      type: 'db:sync',
      model: this.model,
      items: this.items,
      lastId: this.lastId,
    });
  }
}

type Database<Models> = {
  // @ts-expect-error
  [K in keyof Models]: Collection<Models[K]>;
};

export type VroomDb<Models, ModelId> = Database<
  FieldTypes<Models, { id: ModelId }>
>;

export default function createDb<ModelTypes>(options: any) {
  const { models, ...settings } = options;
  const idsAreNumbers = settings.idsAreNumbers || false;

  // @ts-expect-error
  if (window.cypressVroom) {
    // @ts-expect-error
    db = window.cypressVroom.db;
    return db as Database<ModelTypes>;
  }

  Object.entries(models as any).forEach(([key, value]) => {
    db[key] = new Collection(
      key,
      (value as any).schema,
      (value as any).belongsTo,
      (value as any).hasMany,
      (value as any).inverse,
      idsAreNumbers,
      settings.idFactory
    );
  });

  setTimeout(() => {
    bc.onmessage = function (ev: any) {
      db[ev.data.model].items = ev.data.items;
      db[ev.data.model].lastId = ev.data.lastId;
    };
  }, 100);

  return db as Database<ModelTypes>;
}
