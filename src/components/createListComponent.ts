import { computed, defineComponent, h } from 'vue';
import RenderComponent from './RenderComponent.vue';

type SortSettings = {
  field: string;
  dir?: 'ASC' | 'DESC';
};

type PaginationSettings = {
  page?: number;
  limit?: number;
  cursor?: number | string;
};

export default function createListComponent<Models>(stores: any) {
  return defineComponent({
    props: {
      model: { type: String as unknown as () => keyof Models, required: true },
      include: { type: Array as () => string[], default: () => [] },
      pagination: {
        type: Object as () => PaginationSettings,
        default: () => ({}),
      },
      filter: { type: Object, default: () => ({}) },
      sort: { type: Array as () => SortSettings[], default: () => [] },
      mergePages: { type: Boolean, default: false },
      loadOnUpdate: { type: Boolean, default: false },
      path: { type: String, default: null },
      modelValue: { type: Array, default: null },
    },
    emits: ['lorem'],
    setup(props, { slots }) {
      console.log('Will now fetch', props.model, typeof props.model, stores);
      const store = stores[props.model]();

      store.$list({}, {}, [], [], '');
      let passedSlots = {} as any;

      const all = computed(() => store.items);
      // @ts-ignore
      return () => h('div', slots.default({ items: all }));
    },
  });
}
