import { mount, flushPromises } from '@vue/test-utils';
import { createVroom, defineModel } from '.';
import FetchList from '../src/FetchList.vue';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { createApp, nextTick } from 'vue';
import { createPinia } from 'pinia';

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
      pagination: { type: 'page', defaultLimit: 10 },
    }),
    author: defineModel({
      schema: {
        name: { type: String },
      },
      pagination: { type: 'cursor', defaultLimit: 10 },
      hasMany: {
        books: () => 'book',
      },
    }),
  },
  server: {
    enable: true,
  },
  naming: {
    dataSingle: 'item',
    dataList: 'items',
    meta: 'pagination',
    included: 'sideloaded',
  },
});

app.use(createPinia());
const res = app.use(vroom);

const mockFetch = vi.fn((...args) => {
  const [url, config] = args;

  return Promise.resolve(
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
  );
});
// @ts-expect-error;
global.fetch = mockFetch;
const spy = vi.spyOn(global, 'fetch');

describe('FetchList.vue', () => {
  beforeEach(() => {
    vroom.server?.reset();
  });

  it('Naming works', async () => {
    vroom.db.author.create({
      name: 'JRR Tolkien',
      books: vroom.db.book.createMany(
        { title: 'The Hobbit' },
        { title: 'The Lord of the Rings' }
      ),
    });

    const bookList = mount(FetchList, {
      props: { model: 'book', include: ['author'] },
      global: {
        provide: res._context.provides,
      },
      slots: {
        default: `<template #default="{bookItems}">
              <p v-for="book in bookItems">{{ book.id }} - {{ book.title }} - {{ book.author?.name }}</p>
          </template>`,
      },
    });

    await flushPromises();

    const book = bookList.findAll('p');
    expect(book[0].text()).toBe('1 - The Hobbit - JRR Tolkien');
    expect(book[1].text()).toBe('2 - The Lord of the Rings - JRR Tolkien');
  });
});
