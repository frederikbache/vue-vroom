import { mount } from '@vue/test-utils';
import { createVroom, defineModel } from '.';
import { beforeEach, describe, it, expect } from 'vitest';
import { createApp, defineComponent, ref, type Ref } from 'vue';
import { createPinia } from 'pinia';
import { R } from '../src/components/createUseSingle';

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
      includable: ['author'],
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
    id: {
      type: [String, Object] as unknown as () => R<string>,
      required: true,
    },
  },
  setup(props) {
    return {
      // Call the composable and expose all return values into our
      // component instance so we can access them with wrapper.vm
      ...vroom.useSingle(props.model as any, props.id, props.settings),
    };
  },
  template: '<div></div>',
});

function getWrapper(model: string, id: R<string>, settings = {}) {
  return mount(TestComponent, {
    props: {
      model,
      id,
      settings,
    },
    global: {
      provide: res._context.provides,
    },
  });
}

describe('Use single', () => {
  beforeEach(() => {
    vroom.server?.reset();
    vroom.stores.book().items = [];
    vroom.stores.author().items = [];

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
    const wrapper = getWrapper('book', '1');

    expect(wrapper.vm.isLoading).toBe(true);

    await new Promise((r) => setTimeout(r, 2));

    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.vm.item.title).toBe('The Hobbit');
  });

  it('Respect includable', async () => {
    expect(() => {
      getWrapper('book', '1', {
        include: ['author'],
      });
    }).toThrowError('does not have');
  });

  it('Does not load if marked lazy', async () => {
    const wrapper = getWrapper('book', '1', { lazy: true });

    expect(wrapper.vm.isLoading).toBe(false);
  });

  it('Does load if marked prefer cache and id is not in cache', async () => {
    const wrapper = getWrapper('book', '1', { preferCache: true });

    expect(wrapper.vm.isLoading).toBe(true);
  });

  it('Does not load if marked prefer cache and id is in cache', async () => {
    const anotherWrapper = getWrapper('book', '1');
    await new Promise((r) => setTimeout(r, 2));
    const wrapper = getWrapper('book', '1', { preferCache: true });

    expect(wrapper.vm.isLoading).toBe(false);
  });

  it('Does not load if id is undefined', async () => {
    const id = ref(undefined as string | undefined);
    const wrapper = getWrapper('book', id);

    expect(wrapper.vm.isLoading).toBe(false);
  });

  it('Triggers load if id goes from undefined to defined', async () => {
    const id = ref(undefined as string | undefined);
    const wrapper = getWrapper('book', id);

    id.value = '1';
    await new Promise((r) => setTimeout(r, 0));

    expect(wrapper.vm.isLoading).toBe(true);
  });
});
