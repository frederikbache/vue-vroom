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
  },
});

app.use(createPinia());
const res = app.use(vroom);

let intercept = (response: any) => response;

const mockFetch = vi.fn((...args) => {
  const [url, config] = args;

  return Promise.resolve(
    intercept(
      // @ts-expect-error
      vroom.server.parseRequest(
        {
          method: config.method,
          url,
          body: config.body,
          headers: {},
        },
        ''
      )
    )
  );
});
global.fetch = mockFetch;
const spy = vi.spyOn(global, 'fetch');

describe('Response Validation', () => {
  beforeEach(() => {
    vroom.server?.reset();
    intercept = (response: any) => response;
  });

  test('Envelope missing', async () => {
    intercept = () => {
      return { ok: true, body: [], json: () => [] };
    };
    let errors = [] as any[];

    vroom.stores
      .author()
      // @ts-expect-error
      .$list({}, {}, [], [])
      .catch((e) => {
        errors = e.errors;
      });

    await flushPromises();
    expect(errors).toHaveLength(1);
    expect(errors[0].msg).toBe('Response did not include "data" object');
  });

  test('Type mismatch', async () => {
    // @ts-expect-error
    vroom.db.author.create({ name: 1 });

    let errors = [] as any[];

    vroom.stores
      .author()
      // @ts-expect-error
      .$list({}, {}, [], [])
      .catch((e) => {
        errors = e.errors;
      });

    await flushPromises();

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
