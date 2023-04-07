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
    delay: 0,
  },
});

app.use(createPinia());
const res = app.use(vroom);

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

    await new Promise((r) => setTimeout(r, 1));
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

    await new Promise((r) => setTimeout(r, 1));
    vroom.stores.profile().update({ name: 'Bob ' });
    await new Promise((r) => setTimeout(r, 1));
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

    await new Promise((r) => setTimeout(r, 1));
    expect(wrapper.text()).toBe('Date: 2022-01-02, Temp: 10');

    vroom.stores.weather().update({ temp: 1 }, { date: '2022-01-02' });

    await new Promise((r) => setTimeout(r, 1));
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

    await new Promise((r) => setTimeout(r, 1));

    expect(wrapper.text()).toBe('Loading done');
  });
});
