import { mount, flushPromises } from '@vue/test-utils';
import { createVroom, defineModel } from '.';
import { beforeEach, describe, it, expect, vi, test } from 'vitest';
import { createApp, defineComponent, nextTick, ref } from 'vue';
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

const TestComponent = defineComponent({
  props: {
    // Define props, to test the composable with different input arguments
    model: {
      type: String,
      required: true,
    },
    settings: {
      type: Object,
      default: {},
    },
  },
  setup(props) {
    return {
      // Call the composable and expose all return values into our
      // component instance so we can access them with wrapper.vm
      ...vroom.useList(props.model, props.settings),
    };
  },
  template: '<div></div>',
});

describe('Use list', () => {
  beforeEach(() => {
    vroom.server?.reset();
  });

  it('Can shows loading state', async () => {
    vroom.db.book.create({ title: 'The Hobbit' });

    const wrapper = mount(TestComponent, {
      props: {
        model: 'book',
      },
      global: {
        provide: res._context.provides,
      },
    });

    expect(wrapper.vm.isLoading).toBe(true);

    await new Promise((r) => setTimeout(r, 2));
    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.vm.items).toStrictEqual([
      { id: '1', title: 'The Hobbit', authorId: null, isFavourite: false },
    ]);
  });

  it('Can filter', async () => {
    vroom.db.author.createMany(
      {
        name: 'JRR Tolkien',
        books: vroom.db.book.createMany(
          { title: 'The Hobbit' },
          { title: 'The Lord of the Rings' }
        ),
      },
      {
        name: 'George R.R. Martin',
        books: vroom.db.book.createMany(
          {
            title: 'A Game of Thrones',
          },
          { title: 'A Clash of Kings' }
        ),
      }
    );

    const authorId = ref('1');

    const wrapper = mount(TestComponent, {
      props: {
        model: 'book',
        settings: { filter: { authorId } },
      },
      global: {
        provide: res._context.provides,
      },
    });

    await new Promise((r) => setTimeout(r, 2));
    expect(wrapper.vm.items).toStrictEqual([
      { id: '1', title: 'The Hobbit', authorId: '1', isFavourite: false },
      {
        id: '2',
        title: 'The Lord of the Rings',
        authorId: '1',
        isFavourite: false,
      },
    ]);

    authorId.value = '2';

    await new Promise((r) => setTimeout(r, 5));

    expect(wrapper.vm.items).toStrictEqual([
      {
        id: '3',
        title: 'A Game of Thrones',
        authorId: '2',
        isFavourite: false,
      },
      {
        id: '4',
        title: 'A Clash of Kings',
        authorId: '2',
        isFavourite: false,
      },
    ]);
  });
});
