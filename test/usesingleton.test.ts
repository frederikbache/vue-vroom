import { mount } from '@vue/test-utils';
import { createVroom, defineModel } from '.';
import { beforeEach, describe, it, expect } from 'vitest';
import { createApp, defineComponent } from 'vue';
import { createPinia } from 'pinia';

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
      ...vroom.useSingleton(props.model as any, props.settings),
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
    vroom.db.profile.create({
      name: 'Alice',
    });
    vroom.db.weather.createMany(
      { date: '2022-01-01', temp: 24 },
      { date: '2022-01-02', temp: 10 },
      { date: '2022-01-03', temp: 16 }
    );
  });

  it('Shows loading state', async () => {
    const wrapper = getWrapper('profile');

    expect(wrapper.vm.isLoading).toBe(true);

    await new Promise((r) => setTimeout(r, 2));

    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.vm.item.name).toBe('Alice');
  });

  it('Can filter', async () => {
    const wrapper = getWrapper('weather', { filter: { date: '2022-01-02' } });

    await new Promise((r) => setTimeout(r, 2));

    expect(wrapper.vm.item.temp).toBe(10);
  });
});
