import { mount, flushPromises } from '@vue/test-utils';
import { createVroom, defineModel } from '.';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { createApp, nextTick } from 'vue';
import { createPinia } from 'pinia';
import FetchSingleton from '../src/FetchSingleton.vue';

const app = createApp({});
const vroom = createVroom({
  models: {
    profile: defineModel({
      schema: {
        name: { type: String },
      },
      singleton: true,
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

describe('FetchSingleton.vue', () => {
  beforeEach(() => {
    vroom.server?.reset();
  });

  it('Fetch singleton', async () => {
    vroom.db.profile.create({
      name: 'Alice',
    });
    const wrapper = mount(FetchSingleton, {
      props: { model: 'profile' },
      global: {
        provide: res._context.provides,
      },
      slots: {
        default: `<template #default="{profile}">
            <p>Name: {{ profile.name }}</p>
        </template>`,
      },
    });

    await flushPromises();
    expect(wrapper.text()).toBe('Name: Alice');
  });

  it('Singleton updates', async () => {
    vroom.db.profile.create({
      name: 'Alice',
    });
    const wrapper = mount(FetchSingleton, {
      props: { model: 'profile' },
      global: {
        provide: res._context.provides,
      },
      slots: {
        default: `<template #default="{profile}">
            <p>Name: {{ profile.name }}</p>
        </template>`,
      },
    });

    await flushPromises();
    vroom.stores.profile().update({ name: 'Bob ' });
    await flushPromises();
    expect(wrapper.text()).toBe('Name: Bob');
  });
});
