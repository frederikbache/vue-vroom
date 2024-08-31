import { mount, flushPromises } from '@vue/test-utils';
import { createVroom, defineModel } from '.';
import { beforeEach, describe, it, expect, vi, test } from 'vitest';
import { createApp, defineComponent, nextTick, ref } from 'vue';
import { createPinia } from 'pinia';
import { wait } from './helpers';

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
    review: defineModel({
      schema: {
        rating: { type: Number },
      },
      pagination: { type: 'page', defaultLimit: 2 },
      listMeta: {
        avgRating: { type: Number },
        minRating: { type: Number },
      },
    }),
  },
  server: {
    enable: true,
    delay: 0,
  },
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

  it('Can lazy load', async () => {
    const wrapper = getWrapper('book', { lazy: true });

    expect(wrapper.vm.isLoading).toBe(false);

    wrapper.vm.refresh();

    expect(wrapper.vm.isLoading).toBe(true);

    await new Promise((r) => setTimeout(r, 2));

    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.vm.items).toHaveLength(4);
  });

  it('Lazy load is dynamic', async () => {
    const lazy = ref(true);
    const wrapper = getWrapper('book', { lazy });

    expect(wrapper.vm.isLoading).toBe(false);

    lazy.value = false;
    await wait();
    expect(wrapper.vm.isLoading).toBe(true);
    await wait();
    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.vm.items).toHaveLength(4);
  });

  it('Handles race condition', async () => {
    const mock = {
      async sleep(delay: number) {
        await wait(delay);
        return;
      },
    };
    vroom.server?.get('/books', async (request, db) => {
      const { delay } = request.query as any;
      const asNumber = parseInt(delay);
      await mock.sleep(asNumber);
      return { data: db.book.all(), meta: { delay: asNumber } };
    });
    const spy = vi.spyOn(mock, 'sleep');

    const delay = ref(2);

    const wrapper = getWrapper('book', { filter: { delay } });
    await wait();
    delay.value = 10;
    await wait();
    delay.value = 5;
    await wait(20); // wait for everything to complete
    expect(wrapper.vm.items).toHaveLength(4);
    expect(spy).toHaveBeenCalledTimes(3);
    // @ts-ignore
    expect(wrapper.vm.meta.delay).toBe(5);
  });

  it('Can throttle', async () => {
    const spy = vi.spyOn(vroom.api, 'get');
    const isFavourite = ref(false);
    const wrapper = getWrapper('book', {
      throttle: 50,
      filter: { isFavourite },
    });

    expect(spy).toHaveBeenCalledWith('/books', { isFavourite: false });
    for (let i = 0; i < 9; i++) {
      await wait(25);
      isFavourite.value = !isFavourite.value;
    }
    await wait(60);
    // We should have 6, the first 4 without delay, and the last triggered by timeout
    expect(spy).toHaveBeenCalledTimes(6);
    expect(spy).toHaveBeenCalledWith('/books', { isFavourite: true });
  });

  it('Can use custom meta fields', async () => {
    vroom.db.review.createMany({ rating: 5 }, { rating: 1 }, { rating: 4 });

    vroom.server?.addMetaFields({
      review: {
        avgRating(items, db) {
          return (
            db.review.all().reduce((acc, item) => acc + item.rating, 0) /
            db.review.all().length
          );
        },
      },
    });

    const wrapper = getWrapper('review');
    await wait();
    expect(wrapper.vm.items).toHaveLength(2);
    expect(wrapper.vm.meta.avgRating).toBe(10 / 3);
    // Min rating should default to default number 0 as we don't have server handler for it
    expect(wrapper.vm.meta.minRating).toBe(0);
  });
});
