import { describe, expect, it } from 'vitest';
import { createVroom, defineModel } from '.';
import { useServerRequest } from './useServerRequest';

describe('Generates paths', () => {
  it('Autogenerates from model name', () => {
    const vroom = createVroom({
      models: {
        book: defineModel({
          schema: { title: { type: String } },
        }),
      },
      server: {
        enable: true,
      },
    });
    const request = useServerRequest(vroom);
    const response = request.post('/books', { title: 'ABC' });
    expect(response.json().title).toBe('ABC');
  });

  it('Uses plural', () => {
    const vroom = createVroom({
      models: {
        category: defineModel({
          schema: { title: { type: String } },
          plural: 'categories',
        }),
      },
      server: {
        enable: true,
      },
    });
    const request = useServerRequest(vroom);
    const response = request.post('/categories', { title: 'ABC' });
    expect(response.json().title).toBe('ABC');
  });

  it('Uses plural', () => {
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
      },
    });
    const request = useServerRequest(vroom);
    const response = request.post('/longer/path/categories', { title: 'ABC' });
    expect(response.json().title).toBe('ABC');
  });
});
