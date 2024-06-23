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
        is_favourite: { type: Boolean },
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
  useSnakeCase: true,
});

vroom.server?.addSorters({
  author: {
    reverse: (a, b, dir) => {
      return a.name.localeCompare(b.name) * dir * -1;
    },
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
    const author_id = ref('1');

    const wrapper = getWrapper('book', { filter: { author_id } });

    await new Promise((r) => setTimeout(r, 2));
    expect(wrapper.vm.items).toStrictEqual([
      { id: '1', title: 'The Hobbit', author_id: '1', is_favourite: false },
      {
        id: '2',
        title: 'The Lord of the Rings',
        author_id: '1',
        is_favourite: false,
      },
    ]);

    author_id.value = '2';

    await new Promise((r) => setTimeout(r, 5));

    expect(wrapper.vm.items).toStrictEqual([
      {
        id: '3',
        title: 'A Game of Thrones',
        author_id: '2',
        is_favourite: false,
      },
      {
        id: '4',
        title: 'A Clash of Kings',
        author_id: '2',
        is_favourite: false,
      },
    ]);
  });

  it('Can sort', async () => {
    const sortDir = ref('ASC');
    const sortField = ref('name');
    const wrapper = getWrapper('author', {
      sort: [{ field: sortField, dir: sortDir }],
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

    sortField.value = 'reverse';
    sortDir.value = 'ASC';
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
        books_ids: ['1', '2'],
        books: [
          { id: '1', title: 'The Hobbit', author_id: '1', is_favourite: false },
          {
            id: '2',
            title: 'The Lord of the Rings',
            author_id: '1',
            is_favourite: false,
          },
        ],
      },
      {
        id: '2',
        name: 'George R.R. Martin',
        books_ids: ['3', '4'],
        books: [
          {
            id: '3',
            title: 'A Game of Thrones',
            author_id: '2',
            is_favourite: false,
          },
          {
            id: '4',
            title: 'A Clash of Kings',
            author_id: '2',
            is_favourite: false,
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

  it('Can lazy load', async () => {
    const wrapper = getWrapper('book', { lazy: true });

    expect(wrapper.vm.isLoading).toBe(false);

    wrapper.vm.refresh();

    expect(wrapper.vm.isLoading).toBe(true);

    await new Promise((r) => setTimeout(r, 2));

    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.vm.items).toHaveLength(4);
  });
});
