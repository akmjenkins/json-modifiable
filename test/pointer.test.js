import { get } from '../src/pointer';

const spec = {
  description: 'The examples in section 5 (JSON String Representation)',
  document: {
    foo: ['bar', 'baz'],
    '': 0,
    'a/b': 1,
    'c%d': 2,
    'e^f': 3,
    'g|h': 4,
    'i\\j': 5,
    'k"l': 6,
    ' ': 7,
    'm~n': 8,
  },
};
const tests = [
  {
    description: 'The whole document',
    pointer: '',
    data: {
      foo: ['bar', 'baz'],
      '': 0,
      'a/b': 1,
      'c%d': 2,
      'e^f': 3,
      'g|h': 4,
      'i\\j': 5,
      'k"l': 6,
      ' ': 7,
      'm~n': 8,
    },
  },
  {
    description: 'Root object field (document["foo"])',
    pointer: '/foo',
    data: ['bar', 'baz'],
  },
  {
    description: 'Nested array member (document["foo"][0])',
    pointer: '/foo/0',
    data: 'bar',
  },
  {
    description: 'Empty string object field (document[""])',
    pointer: '/',
    data: 0,
  },
  {
    description:
      'Including escaped slash character object field (document["a/b"])',
    pointer: '/a~1b',
    data: 1,
  },
  {
    description: 'Including percent character object field (document["c%d"])',
    pointer: '/c%d',
    data: 2,
  },
  {
    description: 'Including hat charater object field (document["e^f"])',
    pointer: '/e^f',
    data: 3,
  },
  {
    description: 'Including pipe character object field (document["g|h"])',
    pointer: '/g|h',
    data: 4,
  },
  {
    description:
      'Including back slash character object field (document["i\\\\j"])',
    pointer: '/i\\j',
    data: 5,
  },
  {
    description:
      'Including double quote character object field (document["k\\"l"])',
    pointer: '/k"l',
    data: 6,
  },
  {
    description: 'Including space character object field (document[" "])',
    pointer: '/ ',
    data: 7,
  },
  {
    description:
      'Including escaped tilde character object field (document["m~n"])',
    pointer: '/m~0n',
    data: 8,
  },
];

describe(`${spec.description}`, () => {
  tests.forEach(({ description, pointer, data }) => {
    it(`${description}`, () => {
      expect(get(spec.document, pointer)).toEqual(data);
    });
  });
});
