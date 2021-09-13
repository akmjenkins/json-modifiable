import { patch } from '../src/patch';

const doc = {
  a: 1,
  b: [
    {
      c: 1,
      d: [1, 2, 3],
    },
    {
      e: { f: { g: ['a', 'b'] } },
    },
  ],
  h: {
    i: {
      j: [1, 23],
    },
    k: {
      l: 'm',
    },
  },
};

type Doc = typeof doc;

describe('patch', () => {
  it('should add', () => {
    type Patch = { m: number };
    const newDoc = patch<Doc & Patch>(doc, [
      { op: 'add', path: '/m', value: 2 },
    ]);
    expect(newDoc.m).toBe(2);
    // immutable
    expect(newDoc).not.toBe(doc);
  });

  it('should add nested (array)', () => {
    type Patch = { m?: { l: number } };
    type PatchedI = { i: Doc['h']['i'] & Patch };
    type PatchedH = { h: Doc['h'] & PatchedI };
    const newDoc = patch<Doc & PatchedH>(doc, [
      { op: 'add', path: '/h/i/m/l/-', value: 2 },
    ]);
    expect(newDoc.h.i.m?.l).toEqual([2]);
  });

  it('should add nested (object)', () => {
    type Patch = { m?: { l: number } };
    type PatchedI = { i: Doc['h']['i'] & Patch };
    type PatchedH = { h: Doc['h'] & PatchedI };
    const newDoc = patch<Doc & PatchedH>(doc, [
      { op: 'add', path: '/h/i/m/l', value: 2 },
    ]);
    expect(newDoc.h.i.m?.l).toBe(2);
  });

  it('should append', () => {
    expect(
      patch(doc, [{ op: 'add', path: '~1h/i/j~1-', value: 90 }]).h.i.j[2],
    ).toBe(90);
  });

  it('should copy', () => {
    const newDoc = patch(doc, [{ op: 'copy', from: '/b/0/d', path: '/b/-' }]);
    expect(newDoc.b.pop()).toBe(newDoc.b[0].d); // note, this is the same reference (by design)
  });

  it('should move', () => {
    const newDoc = patch(doc, [{ op: 'move', from: '/b/0/d', path: '/b/-' }]);
    expect(newDoc.b.pop()).toBe(doc.b[0].d); // should be the original
    expect(newDoc.b[0]).not.toHaveProperty('d'); // moved
  });

  it('should replace', () => {});

  it('should test', () => {
    expect(
      patch(doc, [
        { op: 'test', path: '/a', value: doc.b },
        { op: 'add', path: '/h/k/l', value: 90 },
      ]).h.k.l,
    ).toBe('m');

    expect(
      patch(doc, [
        { op: 'test', path: '/a', value: doc.a },
        { op: 'add', path: '/h/k/l', value: 90 },
      ]).h.k.l,
    ).toBe(90);
  });
});
