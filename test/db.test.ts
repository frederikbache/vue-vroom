import { describe, expect, it } from 'vitest';
import { createVroom, defineModel } from '.';

const vroom = createVroom({
  models: {
    foo: defineModel({
      schema: {
        aString: { type: String },
        aNumber: { type: Number },
        aBool: { type: Boolean },
        anOptional: { type: String, optional: true },
        anArrayWithoutTyping: { type: Array },
        anArrayWithType: { type: Array as () => number[] },
        anObjectWithoutType: { type: Object },
        anObjectWithType: { type: Object as () => { x: number; y: number } },
        factoryString: { type: () => 'lorem ipsum' },
        factoryObject: { type: () => ({ x: 0, y: 0 }) },
      },
    }),
    book: defineModel({
      schema: {
        title: { type: String },
      },
      belongsTo: {
        author: () => 'author',
        editor: () => 'author',
      },
      inverse: {
        author: 'books',
        editor: null,
      },
    }),
    author: defineModel({
      schema: {
        name: { type: String },
      },
      hasMany: {
        books: () => 'book',
      },
      inverse: {
        books: 'author',
      },
    }),
    post: defineModel({
      schema: {
        title: { type: String },
      },
      hasMany: {
        tags: () => 'tag',
      },
    }),
    tag: defineModel({
      schema: {
        name: { type: String },
      },
      hasMany: {
        posts: () => 'post',
      },
    }),
  },
  server: {
    enable: true,
  },
});

describe('DB', () => {
  it('Autogenerates non-optional fields', () => {
    const foo = vroom.db.foo.create({});

    expect(foo).toStrictEqual({
      id: '1',
      aString: '',
      aNumber: 0,
      aBool: false,
      // anOption: null,
      anArrayWithoutTyping: [],
      anArrayWithType: [],
      anObjectWithoutType: {},
      anObjectWithType: {},
      factoryString: 'lorem ipsum',
      factoryObject: { x: 0, y: 0 },
    });
  });

  it('Updates inverses correctly (1:m)', () => {
    const { author, book } = vroom.db;
    const a = author.create({ name: 'Arthur' });
    const e = author.create({ name: 'Edith' });
    const b = book.create({
      id: 'book',
      title: 'Book',
      editorId: e.id,
      author: a,
    });
    expect(a.booksIds).toStrictEqual(['book']);
    expect(e.booksIds).toStrictEqual([]);

    book.update(b.id, { authorId: e.id, editor: a });

    expect(a.booksIds).toStrictEqual([]);
    expect(e.booksIds).toStrictEqual(['book']);

    author.update(a.id, { books: [b] });

    expect(a.booksIds).toStrictEqual(['book']);
    expect(e.booksIds).toStrictEqual([]);
  });

  it('Updates inverses correctly (m:m)', () => {
    const { post, tag } = vroom.db;

    const p1 = post.create({
      title: 'First post',
      tags: tag.createMany(
        { name: 'Lorem' },
        { name: 'Ipsum' },
        { name: 'Dolor' }
      ),
    });

    expect(p1.tagsIds).toStrictEqual(['1', '2', '3']);

    expect(tag.find('1')?.postsIds).toEqual(['1']);
    post.update(p1.id, { tagsIds: ['2', '3'] });
    expect(tag.find('1')?.postsIds).toEqual([]);

    tag.update('2', { posts: [post.create({ title: 'Aonther post' })] });
    expect(tag.find('2')?.postsIds).toEqual(['2']);
    expect(p1.tagsIds).toStrictEqual(['3']);
  });
});
