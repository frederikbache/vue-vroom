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
      includable: [],
    }),
    author: defineModel({
      schema: {
        name: { type: String },
      },
      hasMany: {
        books: () => 'book',
      },
      includable: ['books'],
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
      ...vroom.useList(props.model as any, props.settings),
    };
  },
  template: '<div></div>',
});

function getWrapper(model: string, settings = {}) {
  return mount(TestComponent, {
    props: {
      model,
      settings,
    },
    global: {
      provide: res._context.provides,
    },
  });
}

describe('Use list', () => {
  beforeEach(() => {
    vroom.server?.reset();

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
  });

  it('Shows loading state', async () => {
    const wrapper = getWrapper('book');

    expect(wrapper.vm.isLoading).toBe(true);

    await new Promise((r) => setTimeout(r, 2));

    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.vm.items).toHaveLength(4);
  });

  it('Can filter', async () => {
    const authorId = ref('1');

    const wrapper = getWrapper('book', { filter: { authorId } });

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

  it('Can sort', async () => {
    const sortDir = ref('ASC');
    const wrapper = getWrapper('author', {
      sort: [{ field: 'name', dir: sortDir }],
    });
    await new Promise((r) => setTimeout(r, 2));
    expect(wrapper.vm.items).toStrictEqual([
      { id: '2', name: 'George R.R. Martin' },
      { id: '1', name: 'JRR Tolkien' },
    ]);

    sortDir.value = 'DESC';
    await new Promise((r) => setTimeout(r, 5));
    expect(wrapper.vm.items).toStrictEqual([
      { id: '1', name: 'JRR Tolkien' },
      { id: '2', name: 'George R.R. Martin' },
    ]);
  });

  it('Can include', async () => {
    const wrapper = getWrapper('author', {
      include: ['books'],
    });
    await new Promise((r) => setTimeout(r, 2));
    expect(wrapper.vm.items).toStrictEqual([
      {
        id: '1',
        name: 'JRR Tolkien',
        booksIds: ['1', '2'],
        books: [
          { id: '1', title: 'The Hobbit', authorId: '1', isFavourite: false },
          {
            id: '2',
            title: 'The Lord of the Rings',
            authorId: '1',
            isFavourite: false,
          },
        ],
      },
      {
        id: '2',
        name: 'George R.R. Martin',
        booksIds: ['3', '4'],
        books: [
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
        ],
      },
    ]);
  });

  it('Respect includable', async () => {
    expect(() => {
      const wrapper = getWrapper('book', {
        include: ['author'],
      });
    }).toThrowError('does not have');
  });
});
