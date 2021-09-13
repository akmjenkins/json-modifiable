# json-modifiable

[![npm version](https://img.shields.io/npm/v/json-modifiable)](https://npmjs.org/package/json-modifiable)
[![Coverage Status](https://coveralls.io/repos/github/akmjenkins/json-modifiable/badge.svg)](https://coveralls.io/github/akmjenkins/json-modifiable)
![Build Status](https://github.com/akmjenkins/json-modifiable/actions/workflows/test.yaml/badge.svg)
[![Bundle Phobia](https://badgen.net/bundlephobia/minzip/json-modifiable)](https://bundlephobia.com/result?p=json-modifiable)

An incredibly tiny and configurable rules engine for applying arbitrary modifications to a descriptor based on context. Designed to work best with JSON standards ([json pointer](https://datatracker.ietf.org/doc/html/rfc6901), [json patch](http://jsonpatch.com/), and [json schema](https://json-schema.org/)) but can work with

1. [JSON Pointer]() like-syntax - like [property-expr](https://www.npmjs.com/package/property-expr) or [lodash's get](https://lodash.com/docs/4.17.15#get)
2. Schema validators like [joi](https://www.npmjs.com/package/joi) or [yup](https://www.npmjs.com/package/yup).
3. A custom patch function that accepts a document and the instructions provided in your rules, so you can roll your own patch logic.

## What in the heck is this good for?

Definining easy to read and easy to apply business logic to things that need to change in response to context. One use case I've used this for is to quickly and easily perform complicated modifications to form field descriptors based on the state of the form (or the current application context).

```js
const descriptor = {
  fieldId: 'lastName',
  path: 'user.lastName',
  label: 'Last Name',
  readOnly: false,
  placeholder: 'Enter Your First Name',
  type: 'text',
  hidden: true,
  validations: [['minLength', 2]],
};

const rules = [
  {
    when: [
      {
        '/formData/firstName': {
          type: 'string',
          minLength: 1,
        },
      },
    ],
    then: [
      {
        op: 'add',
        path: '/validations/-',
        value: 'required',
      },
      {
        op: 'replace',
        path: '/hidden',
        value: false,
      },
    ],
  },
];
```

This library internally has tiny implementation of json-patch and json-pointer that it uses as default options. It should be noted that the json pointer and json patch implementations can access/modify nested structures that don't currently exist in the descriptor without throwing errors. And, one of the most important differences with the embedded json-patch utility is that it only patches the parts of the descriptor that are actually modified - i.e. no `cloneDeep`. This allows it to work beautifully with libraries that rely (or make heavy use of) referential integrity/memoization (like React).

```js
const DynamicFormField = ({ context }) => {

  const refDescriptor = useRef(createJSONModifiable(descriptor, rules, { context }))
  const [currentDescriptor, setCurrentDescriptor] = useState(descriptor.current.get());

  useEffect(() => {
    return refDescriptor.current.subscribe(setCurrentDescriptor)
  },[])

  useEffect(() => {
    refDescriptor.current.setContext(context);
  },[context])

  return (/* some JSX*/)
}
```

Think outside the box here, what if you didn't have rules for individual field descriptors, but what if you entire form was just modifiable descriptors and the rules governing the entire form were encoded as a bunch of JSON patch operations? Because of the referential integrity of the patches, `memo`-ed components still work and things are still lightening fast.

```js
const myForm = {
  firstName: {
    label: 'First Name',
    placeholder: 'Enter your first name',
  },
};

const formRules = [
  {
    when: {
      '/formData/firstName': {
        type: 'string',
        pattern: '^A',
      },
    },
    then: [
      {
        op: 'replace',
        path: '/firstName/placeholder',
        value: 'Hey {{/formData/firstName}}, my first name starts with A too!',
      },
    ],
  },
];
```

## Validator

A validator is the only dependency that must be user supplied to

Here's a great one:

```js
import Ajv from 'ajv';

const ajv = new Ajv();
const validator = (schema, subject) => ajv.validate(schema, subject);

const modifiable = createJSONModifiable(myDescriptor, rules, { validator });
```

## Rules

Rules look like `when`, `then`, `otherwise` where only one of the `then` or `otherwise` needs to be defined. A when is made up on an array of objects whose keys are pointers to entities in `context` and whose values are schemas that will be passed to the `validator` function

THe `then` and `otherwise` must be arrays of (using the default settings) JSON patch operations. The entire array of operations in a `then` or `otherwise` will be passed to your `patch` function (if you supply one) and the document they apply to.

It's important to know that rules run in the order they have been defined. So your patch operations will be operating on the last modified descriptor.

## API

```ts
createJSONModifiable<T,C = unknown>(descriptor: T, rules: Rule[], options: Options<C>): JSONModifiable<T,C>

type Rule = {
  when: Condition[];
  then?: Operation[];
  otherwise?: Operation[];
};

type Condition = {
  [key: string]: Record<string, unknown>;
};

// TO DO
type Operation = unknown

type Options<C> = {
  // a validator is required
  validator: (schema: any, subject: any) => boolean;
  pattern?: RegExp;
  resolver?: (object: Record<string, unknown>, path: string) => any;
  patch?: (operations: Operations, record: T) => T;
}

interface JSONModifiable<T,C = unknown> {
  get: () => T;
  set: (descriptor: T) => void;
  setRules: (rules: Rule<T>[]) => void;
  setContext: (context: C) => void;
  subscribe: (subscriber: Subscriber<T>) => Unsubscribe;
}

```

## Interpolation

TO DO

## License

[MIT](./LICENSE)

## Contributing

PRs welcome!
