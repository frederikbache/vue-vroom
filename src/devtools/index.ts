import { setupDevtoolsPlugin } from '@vue/devtools-api';

const LAYER_ID = 'vroom';

let models = [] as any[];
let collections = {} as any;
let created = false;

export default function setupDevtools(app: any, db: any, server: any) {
  models.push(...Object.entries(db));
  models.forEach(([model, value]) => {
    collections[model] = value.items;
  });

  setupDevtoolsPlugin(
    {
      id: 'vue-vroom',
      label: 'Vroom',
      packageName: 'vue-vroom',
      homepage: 'https://frederikbache.github.io/vue-vroom/',
      app,
    },
    (api) => {
      const INSPECTOR_ID = 'vue-vroom';

      server.setDevTools((settings: any) => {
        setTimeout(() => {
          api.addTimelineEvent({
            layerId: INSPECTOR_ID,
            event: {
              time: api.now(),
              ...settings,
            },
          });
        });
      });

      Object.values(db).forEach((collection: any) => {
        collection.addDevtoolsEvent = (
          title: string,
          subtitle: string,
          data: any
        ) => {
          setTimeout(() => {
            api.addTimelineEvent({
              layerId: INSPECTOR_ID,
              event: {
                time: api.now(),
                title: '💾',
                subtitle: title + ':' + subtitle,
                data,
              },
            });
          });
        };
      });

      if (!created) {
        created = true;
        api.addInspector({
          id: INSPECTOR_ID,
          label: 'Vroom',
          icon: 'electric_moped',
        });

        api.addTimelineLayer({
          id: INSPECTOR_ID,
          color: 0xff984f,
          label: 'Vroom',
        });

        api.on.getInspectorTree((payload, context) => {
          if (payload.inspectorId !== INSPECTOR_ID) return;
          payload.rootNodes = [
            {
              id: 'db',
              label: 'Database',
              children: models.map(([model, collection]) => {
                return {
                  id: model,
                  label: model,
                };
              }),
            },
          ];
        });

        api.on.getInspectorState((payload, context) => {
          if (payload.inspectorId !== INSPECTOR_ID) return;
          const routeMatch = payload.nodeId.match(/routes:(.*)/);
          if (payload.nodeId in collections) {
            payload.state = {
              'DB items': collections[payload.nodeId].map((item: any) => ({
                key: item.id,
                value: item,
              })),
            };
          }
        });
      }
    }
  );
}
