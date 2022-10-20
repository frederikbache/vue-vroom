import { mount, flushPromises } from "@vue/test-utils";
import { createVroom, defineModel } from ".";
import FetchList from "../src/FetchList.vue";
import { describe, it, expect, vi } from "vitest";
import { createApp, nextTick } from "vue";
import { createPinia } from "pinia";


const app = createApp({});
const vroom = createVroom({
    models: {
        book: defineModel({
            schema: { title: { type: String } },
        })
    },
    server: {
        enable: true
    }
})

app.use(createPinia())
const res = app.use(vroom);

const mockFetch = vi.fn((...args) => {
    const [url, config] = args;
    // @ts-expect-error
    return Promise.resolve(vroom.server.parseRequest({
        method: config.method,
        url,
        body: config.body 
    }, ''));
})
// @ts-expect-error;
global.fetch = mockFetch;
const spy = vi.spyOn(global, 'fetch')

describe("FetchList.vue", () => {

  it("should renders is page content is correct", async () => {
    vroom.db.book.createMany(
        { title: 'The Hobbit' },
        { title: 'The Lord of the Rings' }
    )
    const wrapper = mount(FetchList, {
      props: { model: 'book' },
      global: {
        provide: res._context.provides
      },
      slots: {
        default: `<template #default="{bookItems}">
            <p v-for="book in bookItems">{{ book.id }} - {{ book.title }}</p>
        </template>`,
      }
    });

    expect(spy).toHaveBeenCalledWith('/books', {
        method: 'GET',
        body: undefined,
        headers: {}
    })

    expect(spy).toHaveBeenCalledTimes(1)

    await flushPromises()

    const book = wrapper.findAll('p')
    expect(book.length).toBe(2);
    expect(book[0].text()).toBe('1 - The Hobbit')
    expect(book[1].text()).toBe('2 - The Lord of the Rings')
  })
});