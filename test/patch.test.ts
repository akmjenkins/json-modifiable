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

describe('patch', () => {
  it('should add', () => {
    const newDoc = patch<typeof doc & { m: number }>(doc, [
      { op: 'add', path: '/m', value: 2 },
    ]);
    expect(newDoc.m).toBe(2);
    // immutable
    expect(newDoc).not.toBe(doc);
  });

  it('should append', () => {
    expect(
      patch(doc, [{ op: 'add', path: '~1h/i/j~1-', value: 90 }]).h.i.j[2],
    ).toBe(90);
  });

  it('should copy', () => {
    const f = patch(doc, [{ op: 'copy', from: '/b/0/d', path: '/b/-' }]);
  });

  it('should move', () => {
    const f = patch(doc, [{ op: 'move', from: '/b/0/d', path: '/b/-' }]);
  });

  it('should replace', () => {});

  it('should test', () => {});
});
