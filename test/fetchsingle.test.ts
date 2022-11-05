import { mount, flushPromises } from '@vue/test-utils';
import { createVroom, defineModel } from '.';
import { beforeEach, describe, it, expect, vi } from 'vitest';
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

const mockFetch = vi.fn((...args) => {
  const [url, config] = args;

  return Promise.resolve(
    // @ts-expect-error
    vroom.server.parseRequest(
      {
        method: config.method,
        url,
        body: config.body,
      },
      ''
    )
  );
});
// @ts-expect-error;
global.fetch = mockFetch;
const spy = vi.spyOn(global, 'fetch');

describe('FetchSingle.vue', () => {
  beforeEach(() => {
    vroom.server?.reset();
  });

  it('Fetch single', async () => {
    vroom.db.author.create({
      name: 'JRR Tolkien',
      books: vroom.db.book.createMany(
        { title: 'The Hobbit' },
        { title: 'The Lord of the Rings' }
      ),
    });
    const wrapper = mount(FetchSingle, {
      props: { model: 'author', id: '1', include: ['books'] },
      global: {
        provide: res._context.provides,
      },
      slots: {
        default: `<template #default="{author}">
            <p>Name: {{ author.name }}</p>
            <span v-for="book in author.books">{{ book.title }}</span>
        </template>`,
      },
    });

    await flushPromises();
    expect(wrapper.find('p').text()).toBe('Name: JRR Tolkien');
    const books = wrapper.findAll('span');
    expect(books[0].text()).toBe('The Hobbit');
    expect(books[1].text()).toBe('The Lord of the Rings');
  });

  it('Slot all', async () => {
    vroom.db.book.create({ title: 'The Hobbit' });
    const wrapper = mount(FetchSingle, {
      props: { model: 'book', id: '1' },
      global: {
        provide: res._context.provides,
      },
      slots: {
        default: `<template #all="{book, isLoading}">
                    <div v-if="!isLoading">
                      <p>Loading done</p>
                    </div>
                </template>`,
      },
    });

    await flushPromises();

    expect(wrapper.text()).toBe('Loading done');
  });

  it('Custom path', () => {
    mount(FetchSingle, {
      props: { model: 'book', id: '1', path: '/some-other-path/1' },
      global: {
        provide: res._context.provides,
      },
    });

    expect(spy).toHaveBeenCalledWith('/some-other-path/1', {
      method: 'GET',
      body: undefined,
      headers: {},
    });
  });

  it('Change ID', async () => {
    const wrapper = mount(FetchSingle, {
      props: { model: 'book', id: '1' },
      global: {
        provide: res._context.provides,
      },
    });

    expect(spy).toHaveBeenCalledWith('/books/1', {
      method: 'GET',
      body: undefined,
      headers: {},
    });

    await wrapper.setProps({ id: '2' });

    expect(spy).toHaveBeenCalledWith('/books/2', {
      method: 'GET',
      body: undefined,
      headers: {},
    });
  });
});
