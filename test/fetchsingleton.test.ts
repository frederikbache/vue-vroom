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
    weather: defineModel({
      schema: {
        date: { type: String },
        temp: { type: Number },
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
        headers: {},
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

  it('Singleton filters', async () => {
    vroom.db.weather.createMany(
      { date: '2022-01-01', temp: 24 },
      { date: '2022-01-02', temp: 10 },
      { date: '2022-01-03', temp: 16 }
    );

    const wrapper = mount(FetchSingleton, {
      props: { model: 'weather', filter: { date: '2022-01-02' } },
      global: {
        provide: res._context.provides,
      },
      slots: {
        default: `<template #default="{weather}">
            <p>Date: {{ weather.date}}, Temp: {{ weather.temp }}</p>
        </template>`,
      },
    });

    await flushPromises();
    expect(wrapper.text()).toBe('Date: 2022-01-02, Temp: 10');

    vroom.stores.weather().update({ temp: 1 }, { date: '2022-01-02' });

    await flushPromises();
    expect(wrapper.text()).toBe('Date: 2022-01-02, Temp: 1');
  });

  it('Slot all', async () => {
    vroom.db.profile.create({
      name: 'Alice',
    });
    const wrapper = mount(FetchSingleton, {
      props: { model: 'profile' },
      global: {
        provide: res._context.provides,
      },
      slots: {
        default: `<template #all="{profile, isLoading}">
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
    mount(FetchSingleton, {
      props: { model: 'profile', path: '/my-profile' },
      global: {
        provide: res._context.provides,
      },
    });

    expect(spy).toHaveBeenCalledWith('/my-profile', {
      method: 'GET',
      body: undefined,
      headers: { 'Content-Type': 'application/json' },
    });
  });
});
