import { mount, flushPromises } from '@vue/test-utils';
import { createVroom, defineModel } from '.';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { createApp, nextTick } from 'vue';
import { createPinia } from 'pinia';
import FetchSingle from '../src/FetchSingle.vue';

const app = createApp({});
const vroom = createVroom({
  models: {
    user: defineModel({
      schema: {
        name: { type: String },
      },
    }),
  },
  server: { enable: true, delay: 0 },
  identityModel: () => 'user',
});

app.use(createPinia());
app.use(vroom);

describe('Custom routes', async () => {
  it('Add custom route', async () => {
    vroom.server?.get('/custom-route', (request, db) => {
      return { hello: 'world' };
    });

    vroom.server?.post('/custom-route', (request, db) => {
      return request.json;
    });

    vroom.server?.patch('/custom-route/:baz', (request, db) => {
      return { ...request.params, ...request.json };
    });

    vroom.server?.delete('/custom-route/:id', (request, db) => {
      return request.params.id;
    });

    let res = await vroom.api.get('/custom-route');
    expect(res).toStrictEqual({ hello: 'world' });

    res = await vroom.api.post('/custom-route', { foo: 'bar' });
    expect(res).toStrictEqual({ foo: 'bar' });

    res = await vroom.api.patch('/custom-route/lorem-ipsum', { foo: 'bar' });
    expect(res).toStrictEqual({ baz: 'lorem-ipsum', foo: 'bar' });

    res = await vroom.api.delete('/custom-route/42');
    expect(res).toStrictEqual('42');
  });

  it('Override routes', async () => {
    vroom.server?.overrideGet('/custom-route', (request, db) => {
      return { overridden: true };
    });

    vroom.server?.overridePost('/custom-route', (request, db) => {
      return { overridden: true };
    });

    vroom.server?.overridePatch('/custom-route/:baz', (request, db) => {
      return { overridden: true };
    });

    vroom.server?.overrideDelete('/custom-route/:id', (request, db) => {
      return { overridden: true };
    });

    let res = await vroom.api.get('/custom-route');
    expect(res).toStrictEqual({ overridden: true });

    res = await vroom.api.post('/custom-route', { foo: 'bar' });
    expect(res).toStrictEqual({ overridden: true });

    res = await vroom.api.patch('/custom-route/lorem-ipsum', { foo: 'bar' });
    expect(res).toStrictEqual({ overridden: true });

    res = await vroom.api.delete('/custom-route/42');
    expect(res).toStrictEqual({ overridden: true });

    vroom.server?.reset();

    res = await vroom.api.get('/custom-route');
    expect(res).toStrictEqual({ hello: 'world' });

    res = await vroom.api.post('/custom-route', { foo: 'bar' });
    expect(res).toStrictEqual({ foo: 'bar' });

    res = await vroom.api.patch('/custom-route/lorem-ipsum', { foo: 'bar' });
    expect(res).toStrictEqual({ baz: 'lorem-ipsum', foo: 'bar' });

    res = await vroom.api.delete('/custom-route/42');
    expect(res).toStrictEqual('42');
  });

  it('Gets identity', async () => {
    vroom.db.user.createMany({ name: 'Alice' }, { name: 'Bob' });
    vroom.api.headers['authorization'] = 'Bearer 2';

    vroom.server?.get('/me', (request) => {
      return { name: request.identity?.name };
    });

    const res = await vroom.api.get('/me');
    expect(res).toStrictEqual({ name: 'Bob' });
  });
});
