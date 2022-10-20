import { defineStore } from 'pinia';
import type { ID } from './types';

type Cache = {
  [key: string]: {
    [i: ID]: number;
  };
};

export default function createCache(stores: any) {
  return defineStore('vroom:cache', {
    state: () => ({
      ids: {} as Cache,
      timeout: null as ReturnType<typeof setTimeout> | null,
    }),
    actions: {
      subscribe(model: string, ids: ID[]) {
        const newIds = JSON.parse(JSON.stringify(this.ids));
        if (!(model in newIds)) {
          newIds[model] = {};
        }
        ids.forEach((id) => {
          if (!(id in newIds[model])) {
            newIds[model][id] = 0;
          }
          newIds[model][id] += 1;
        });
        this.ids = newIds;
      },
      garbageCollect() {
        this.timeout = null;
        Object.entries(this.ids).forEach(([model, ids]) => {
          const garbage = [] as ID[];
          Object.entries(ids).forEach(([id, subscribers]) => {
            if (subscribers === 0) {
              garbage.push(id);
              delete this.ids[model][id];
            }
          });
          if (garbage.length) {
            stores[model]().garbageCollect(garbage);
          }
        });
      },
      scheduleGarbageCollection() {
        if (this.timeout) return;
        this.timeout = setTimeout(this.garbageCollect, 5000);
      },
      unsubscribe(model: string, ids: ID[]) {
        let foundGarbage = false;
        const newIds = JSON.parse(JSON.stringify(this.ids));
        if (!(model in this.ids)) return;
        ids.forEach((id) => {
          if (!(id in newIds[model])) return;
          newIds[model][id] -= 1;
          if (newIds[model][id] === 0) {
            foundGarbage = true;
          }
        });
        this.ids = newIds;
        if (!this.timeout && foundGarbage) {
          this.scheduleGarbageCollection();
        }
      },
    },
  });
}
