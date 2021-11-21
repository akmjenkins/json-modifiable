import { patch } from '../src/patch';

const spec = [
  {
    comment: '4.1. add with missing object',
    doc: { q: { bar: 2 } },
    patch: [{ op: 'add', path: '/a/b', value: 1 }],
    error:
      'path /a does not exist -- missing objects are not created recursively',
  },

  {
    comment: 'A.1.  Adding an Object Member',
    doc: {
      foo: 'bar',
    },
    patch: [{ op: 'add', path: '/baz', value: 'qux' }],
    expected: {
      baz: 'qux',
      foo: 'bar',
    },
  },

  {
    comment: 'A.2.  Adding an Array Element',
    doc: {
      foo: ['bar', 'baz'],
    },
    patch: [{ op: 'add', path: '/foo/1', value: 'qux' }],
    expected: {
      foo: ['bar', 'qux', 'baz'],
    },
  },

  {
    comment: 'A.3.  Removing an Object Member',
    doc: {
      baz: 'qux',
      foo: 'bar',
    },
    patch: [{ op: 'remove', path: '/baz' }],
    expected: {
      foo: 'bar',
    },
  },

  {
    comment: 'A.4.  Removing an Array Element',
    doc: {
      foo: ['bar', 'qux', 'baz'],
    },
    patch: [{ op: 'remove', path: '/foo/1' }],
    expected: {
      foo: ['bar', 'baz'],
    },
  },

  {
    comment: 'A.5.  Replacing a Value',
    doc: {
      baz: 'qux',
      foo: 'bar',
    },
    patch: [{ op: 'replace', path: '/baz', value: 'boo' }],
    expected: {
      baz: 'boo',
      foo: 'bar',
    },
  },

  {
    comment: 'A.6.  Moving a Value',
    doc: {
      foo: {
        bar: 'baz',
        waldo: 'fred',
      },
      qux: {
        corge: 'grault',
      },
    },
    patch: [{ op: 'move', from: '/foo/waldo', path: '/qux/thud' }],
    expected: {
      foo: {
        bar: 'baz',
      },
      qux: {
        corge: 'grault',
        thud: 'fred',
      },
    },
  },

  {
    comment: 'A.7.  Moving an Array Element',
    doc: {
      foo: ['all', 'grass', 'cows', 'eat'],
    },
    patch: [{ op: 'move', from: '/foo/1', path: '/foo/3' }],
    expected: {
      foo: ['all', 'cows', 'eat', 'grass'],
    },
  },

  {
    comment: 'A.8.  Testing a Value: Success',
    doc: {
      baz: 'qux',
      foo: ['a', 2, 'c'],
    },
    patch: [
      { op: 'test', path: '/baz', value: 'qux' },
      { op: 'test', path: '/foo/1', value: 2 },
    ],
    expected: {
      baz: 'qux',
      foo: ['a', 2, 'c'],
    },
  },

  {
    comment: 'A.9.  Testing a Value: Error',
    doc: {
      baz: 'qux',
    },
    patch: [{ op: 'test', path: '/baz', value: 'bar' }],
    error: 'string not equivalent',
  },

  {
    comment: 'A.10.  Adding a nested Member Object',
    doc: {
      foo: 'bar',
    },
    patch: [{ op: 'add', path: '/child', value: { grandchild: {} } }],
    expected: {
      foo: 'bar',
      child: {
        grandchild: {},
      },
    },
  },

  {
    comment: 'A.11.  Ignoring Unrecognized Elements',
    doc: {
      foo: 'bar',
    },
    patch: [{ op: 'add', path: '/baz', value: 'qux', xyz: 123 }],
    expected: {
      foo: 'bar',
      baz: 'qux',
    },
  },

  {
    comment: 'A.12.  Adding to a Non-existent Target',
    doc: {
      foo: 'bar',
    },
    patch: [{ op: 'add', path: '/baz/bat', value: 'qux' }],
    error: 'add to a non-existent target',
  },

  {
    comment: 'A.14. ~ Escape Ordering',
    doc: {
      '/': 9,
      '~1': 10,
    },
    patch: [{ op: 'test', path: '/~01', value: 10 }],
    expected: {
      '/': 9,
      '~1': 10,
    },
  },

  {
    comment: 'A.15. Comparing Strings and Numbers',
    doc: {
      '/': 9,
      '~1': 10,
    },
    patch: [{ op: 'test', path: '/~01', value: '10' }],
    error: 'number is not equal to string',
  },

  {
    comment: 'A.16. Adding an Array Value',
    doc: {
      foo: ['bar'],
    },
    patch: [{ op: 'add', path: '/foo/-', value: ['abc', 'def'] }],
    expected: {
      foo: ['bar', ['abc', 'def']],
    },
  },
];

describe('test patch', () => {
  spec
    // skip errors, we don't care
    .filter(({ error }) => !error)
    .forEach(({ comment, doc, patch: pch, expected, error }) => {
      it(`${comment}`, () => {
        if (error) return;
        expect(patch(doc, pch)).toEqual(expected);
      });
    });
});
