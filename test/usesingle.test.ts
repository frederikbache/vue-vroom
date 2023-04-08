import { mount } from '@vue/test-utils';
import { createVroom, defineModel } from '.';
import { beforeEach, describe, it, expect } from 'vitest';
import { createApp, defineComponent } from 'vue';
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
    id: {
      type: String,
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

function getWrapper(model: string, id: string, settings = {}) {
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
    const wrapper = getWrapper('book', '1');

    expect(wrapper.vm.isLoading).toBe(true);

    await new Promise((r) => setTimeout(r, 2));

    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.vm.item.title).toBe('The Hobbit');
  });
});
