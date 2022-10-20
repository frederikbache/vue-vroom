import { setupDevtoolsPlugin } from '@vue/devtools-api';

const LAYER_ID = 'vroom';

export default function setupDevtools(app: any, db: any, server: any) {
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
            children: Object.entries(db).map(([model, collection]) => {
              return {
                id: model,
                label: model,
              };
            }),
          },
          {
            id: 'routes',
            label: 'Routes',
            children: Object.keys(db).map((model) => {
              return {
                id: 'routes:' + model,
                label: model,
              };
            }),
          },
        ];
      });

      api.on.getInspectorState((payload, context) => {
        if (payload.inspectorId !== INSPECTOR_ID) return;
        const routeMatch = payload.nodeId.match(/routes:(.*)/);
        if (payload.nodeId in db) {
          payload.state = {
            'DB items': db[payload.nodeId].items.map((item: any) => ({
              key: item.id,
              value: item,
            })),
          };
        }
        if (routeMatch) {
          payload.state = {
            Filters: server.filters[routeMatch[1]] || {},
            Routes: [
              {
                key: 'routes',
                value: server.routes
                  .filter((route: any) => route.model === routeMatch[1])
                  .map((route: any) => {
                    return route.method + ' ' + route.path;
                  }),
              },
            ],
          };
        }
      });

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
    }
  );
}
