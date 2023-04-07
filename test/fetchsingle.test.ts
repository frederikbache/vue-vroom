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
    delay: 0,
  },
});

app.use(createPinia());
const res = app.use(vroom);

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

    await new Promise((r) => setTimeout(r, 1));
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

    await new Promise((r) => setTimeout(r, 1));

    expect(wrapper.text()).toBe('Loading done');
  });
});
