import { describe, expect, it } from 'vitest';
import { createVroom, defineModel } from '.';

describe('Generates paths', () => {
  it('Autogenerates from model name', async () => {
    const vroom = createVroom({
      models: {
        book: defineModel({
          schema: { title: { type: String } },
        }),
      },
      server: {
        enable: true,
        delay: 0,
      },
    });
    const response = await vroom.api.post('/books', { title: 'ABC' });
    expect(response.title).toBe('ABC');
  });

  it('Uses plural', async () => {
    const vroom = createVroom({
      models: {
        category: defineModel({
          schema: { title: { type: String } },
          plural: 'categories',
        }),
      },
      server: {
        enable: true,
        delay: 0,
      },
    });
    const response = await vroom.api.post('/categories', { title: 'ABC' });
    expect(response.title).toBe('ABC');
  });

  it('Uses plural', async () => {
    const vroom = createVroom({
      models: {
        category: defineModel({
          schema: { title: { type: String } },
          plural: 'categories',
          path: '/longer/path/categories',
        }),
      },
      server: {
        enable: true,
        delay: 0,
      },
    });
    const response = await vroom.api.post('/longer/path/categories', {
      title: 'ABC',
    });
    expect(response.title).toBe('ABC');
  });
});
