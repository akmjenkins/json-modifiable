# json-modifiable

[![npm version](https://img.shields.io/npm/v/json-modifiable)](https://npmjs.org/package/json-modifiable)
[![Coverage Status](https://coveralls.io/repos/github/akmjenkins/json-modifiable/badge.svg)](https://coveralls.io/github/akmjenkins/json-modifiable)
![Build Status](https://github.com/akmjenkins/json-modifiable/actions/workflows/test.yaml/badge.svg)
[![Bundle Phobia](https://badgen.net/bundlephobia/minzip/json-modifiable)](https://bundlephobia.com/result?p=json-modifiable)

An incredibly tiny and configurable rules engine for applying arbitrary modifications to a descriptor based on context. Designed to work best with JSON standards ([json pointer](https://datatracker.ietf.org/doc/html/rfc6901), [json patch](http://jsonpatch.com/), and [json schema](https://json-schema.org/)) but can work with

1. [JSON Pointer](https://datatracker.ietf.org/doc/html/rfc6901) like-syntax - like [property-expr](https://www.npmjs.com/package/property-expr) or [lodash's get](https://lodash.com/docs/4.17.15#get)
2. Schema validators like [joi](https://www.npmjs.com/package/joi) or [yup](https://www.npmjs.com/package/yup).
3. A custom patch function that accepts a document and the instructions provided in your rules, so you can roll your own patch logic.

## Installation

```bash
npm install json-modifiable
## or
yarn add json-modifiable
```

Or directly via the browser:

```html
<script src="https://cdn.jsdelivr.net/npm/json-modifiable"></script>
<script>
  const descriptor = createJSONModifiable(...);
</script>
```

## Usage

```js
import createJSONModifiable from 'json-modifiable';

const descriptor = createJSONModifiable(
  {
    fieldId: 'lastName',
    path: 'user.lastName',
    label: 'Last Name',
    readOnly: false,
    placeholder: 'Enter Your First Name',
    type: 'text',
    hidden: true,
    validations: [['minLength', 2]],
  },
  [
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
      ],
    },
  ],
  { validator },
);

descriptor.get().validations.find((v) => v === 'required'); // not found
descriptor.setContext({ formData: { firstName: 'fred' } });
descriptor.get().validations.find((v) => v === 'required'); // found!
```

## What in the heck is this good for?

Definining easy to read and easy to apply business logic to things that need to behave differently in different contexts. One use case I've used this for is to quickly and easily perform complicated modifications to form field descriptors based on the state of the form (or some other current application context).

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

This library internally has tiny implementations of [json patch](http://jsonpatch.com/) and [json pointer](https://datatracker.ietf.org/doc/html/rfc6901) that it uses as default options. It should be noted that the json pointer and json patch implementations can access/modify nested structures that don't currently exist in the descriptor **without throwing errors**. And the patch operations are a bit looser than the spec - `add` and `replace` are treated as synonyms and prescribed errors aren't thrown. Another very important difference with the embedded json-patch utility is that it **only patches the parts of the descriptor that are actually modified** - i.e. no `cloneDeep`. This allows it to work beautifully with libraries that rely (or make heavy use of) referential integrity/memoization (like React).

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

```ts
type Validator = (schema: any, subject: any) => boolean;
```

A validator is the only dependency that must be user supplied. It accepts a schema and an subject to evaluate and it synchronously returns a boolean.

Here's a great one, and the one used in all our tests:

```js
import Ajv from 'ajv';

const ajv = new Ajv();
const validator = (schema, subject) => ajv.validate(schema, subject);

const modifiable = createJSONModifiable(myDescriptor, rules, { validator });
```

You can see that by supplying a different validator, you don't even have to use JSON schema (though we recommend it) in your modifiable rules.

## Rules

```ts
type Rule = {
  when: Condition[];
  then?: Operation[];
  otherwise: Operation[];
};
```

A rule looks like `when`, `then`, `otherwise` where only one of the `then` or `otherwise` needs to be defined. A when is made up on an array of objects whose keys are pointers to entities in `context` and whose values are schemas that will be passed to the `validator` function.

The `when` is always an array of `Condition`s. `Condition`s are plain objects whose keys are `path`s and values are `schemas`.

```ts
type Condition = {
  [key: string]: Record<string, any>;
};

// e.g.
const condition = {
  '/formData/firstName': {
    type: 'string',
    minLength: 2,
  },
};
```

If **any** of the `Condition`s in a `Rule` are true, then the operations in the `then` clause are applied. If none of them are true then the operations in the `otherwise` clause are applied. If a rule is false but no `otherwise` clause is specified, then no patches will be applied. The same goes for if a rule is true but doesn't have a `then` clause.

## Operations

THe `then` and `otherwise` must be arrays or `Operation`s. The default implementation requires them to be [JSON patch](http://jsonpatch.com/) operations. The array of operations in a `then` or `otherwise` will be passed to the `patch` function and the document to apply them to.

```ts
type PatchFunction = <T>(descriptor: T, operations: Operation[]) => T;
```

It's important to know that rules run in the order they have been defined. So your patch operations will be operating on the last modified descriptor.

## API

```ts
createJSONModifiable<T,C = unknown,Op = JSONPatchOperation>(
  descriptor: T,
  rules: Rule<Op>[],
  options: Options<T,C,Op>
): JSONModifiable<T,C>

type Rule<Op> = {
  when: Condition[];
  then?: Op[];
  otherwise?: Op[];
};

type Condition = {
  [key: string]: Record<string, unknown>;
};


type Validator = (schema: any, subject: any) => boolean;
type Resolver = (object: Record<string, unknown>, path: string) => any;

type Options<T, C, Op> = {
  // a validator is required
  validator: Validator;
  context?: C;
  pattern?: RegExp;
  resolver?: Resolver;
  patch?: (operations: Op[], record: T) => T;
};

type Unsubscribe = () => void;
type Subscriber<T> = (arg: T) => void;

interface JSONModifiable<T, C, Op> {
  get: () => T;
  set: (descriptor: T) => void;
  setRules: (rules: Rule<Op>[]) => void;
  setContext: (context: C) => void;
  subscribe: (subscriber: Subscriber<T>) => Unsubscribe;
  on: (event: 'modified', subscriber: Subscriber<T>) => Unsubscribe;
  on: (event: 'error', subscriber: Subscriber<ErrorEvent>) => Unsubscribe;
}

```

## Interpolation

You can interpolate values from context into your rules and patches using the `pattern` regexp. By default it uses [handlebars](https://handlebarsjs.com/)-style - e.g. `{{thingToInerpolate}}`

Note the `resolver` accepts, by default, a [json pointer](https://datatracker.ietf.org/doc/html/rfc6901) is used for to evaluate what's being interpolated. So, by default, all interpolation patterns will look like this: `{{/path/to/thing/in/context}}`

Also useful to know is that you can interpolate more than strings, you can interpolate objects or even arrays.

Given the rule and the following context:

```js
const rule = {
  when: [
    {
      type: 'object',
      properties: '{{/fields/from/context}}',
      required: '{{/fields/required}}',
    },
  ];
}

const context = {
  fields: {
    from: {
      context: {
        a: {
          type: "strng"
        },
        b: {
          type: "number"
        }
      }
    }
  },
  required: ["a"]
}
```

You'll end up with the following interpolated rule:

```js
{
  when: [
    {
      type: 'object',
      properties: {
        a: {
          type: "strng"
        },
        b: {
          type: "number"
        }
      }
      required: ["a"]
    },
  ];
}
```

Interpolations are very powerful and keep your rules serializable.

## Other Cool Stuff

Check out [json-schema-rules-engine](https://github.com/akmjenkins/json-schema-rules-engine) for a different type of rules engine.

## License

[MIT](./LICENSE)

## Contributing

PRs welcome!
