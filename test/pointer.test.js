import { get, set } from '../src/pointer';

const obj = {
  a: 1,
  b: {
    c: 2,
  },
  d: {
    e: [{ a: 3 }, { b: 4 }, { c: 5 }],
  },
};

describe('should work', () => {
  it('should work', () => {
    const pointer = '/d/e/2~1c';
    expect(get(obj, pointer)).toEqual(5);
    const result = set(obj, pointer, 2);
    expect(result).not.toEqual(obj);
    expect(result.b).toEqual(obj.b);
    expect(get(result, pointer)).toEqual(2);

    // mutate the document
    const res2 = set(obj, pointer, 10, { mutate: true });
    expect(get(obj, pointer)).toEqual(10);
    expect(res2).toEqual(obj);
  });
});
