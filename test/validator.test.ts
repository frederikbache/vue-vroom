import { mount, flushPromises } from '@vue/test-utils';
import { createVroom, defineModel } from '.';
import { beforeEach, describe, it, expect, vi, test } from 'vitest';
import { createApp, nextTick } from 'vue';
import { createPinia } from 'pinia';
import FetchSingle from '../src/FetchSingle.vue';

const app = createApp({});
const vroom = createVroom({
  models: {
    book: defineModel({
      schema: {
        title: { type: String },
        isFavourite: { type: Boolean },
      },
      belongsTo: {
        author: () => 'author',
      },
    }),
    author: defineModel({
      schema: {
        name: { type: String },
      },
      hasMany: {
        books: () => 'book',
      },
    }),
  },
  server: {
    enable: true,
    delay: 0,
  },
});

app.use(createPinia());
app.use(vroom);

describe('Response Validation', () => {
  beforeEach(() => {
    vroom.server?.reset();
  });

  test('Envelope missing', async () => {
    vroom.server?.overrideGet('/authors', (request, db) => {
      return db.author.all();
    });
    let errors = [] as any[];

    await vroom.stores
      .author()
      // @ts-expect-error
      .$list({}, {}, [], [])
      .catch((e) => {
        errors = e.errors;
      });

    expect(errors).toHaveLength(1);
    expect(errors[0].msg).toBe('Response did not include "data" object');
  });

  test('Type mismatch', async () => {
    // @ts-expect-error
    vroom.db.author.create({ name: 1 });

    let errors = [] as any[];

    await vroom.stores
      .author()
      // @ts-expect-error
      .$list({}, {}, [], [])
      .catch((e) => {
        errors = e.errors;
      });

    expect(errors).toHaveLength(1);
    expect(errors[0]).toStrictEqual({
      type: 'type_mismatch',
      field: 'name',
      id: '1',
      expected: 'string',
      actual: 'number',
    });
  });
});
