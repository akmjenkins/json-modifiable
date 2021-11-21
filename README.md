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
  const descriptor = jsonModifiable.engine(...)
  
  // or see JSON Engine
  const descriptor = jsonModifiable.jsonEngine(...)
</script>
```

- [Descriptor](#descriptor)
- [Context](#context)
- [Validator](#validator)
- [Rules](#rules)
  - [Conditions](#condition)
  - [Operation](#operation)
- [Resolver](#resolver)  
- [Patch](#patch)

## Descriptor

```ts
type Descriptor = Record<string,unknown>
```

A descriptor is a plain-old JavaScript object (POJO) that should be "modified" - contain different properties/structures - in various [contexts](#context). The modifications are defined by [rules](#rules).

```js
{
    fieldId: 'lastName',
    path: 'user.lastName',
    label: 'Last Name',
    readOnly: false,
    placeholder: 'Enter Your First Name',
    type: 'text',
    hidden: true,
    validations: [],
}
```

## Context

```ts
type Context = Record<string,unknown>
```

Context is also an object. The context is used by the [validator](#validator) to evaluate the [conditions](#condition) of [rules](#rules)

```js
{
  formData: {
    firstName: 'Joe',
    lastName: 'Smith'
  }
}
```

## Validator

```ts
type Validator = (schema: any, subject: any) => boolean;
```

A validator is the only dependency that must be user supplied. It accepts a [condition](#condition) and an subject to evaluate and it must **synchronously** return a boolean. Because of the extensive performance optimizations going on inside the engine to keep it blazing fast **it's important to note the validator MUST BE A PURE FUNCTION**

Here's a great one, and the one used in all our tests:

```js
import { engine } from 'json-modifiable';
import Ajv from 'ajv';

const ajv = new Ajv();
const validator = (schema, subject) => ajv.validate(schema, subject);

const modifiable = engine(myDescriptor, rules, { validator });
```

You can see that by supplying a different validator, you don't even have to use JSON schema (though we recommend it) in your modifiable rules.

## Rules

```ts
export type Rule<Operation> = {
  when: Condition[];
  then?: Operation;
  otherwise?: Operation;
};
```

A rule is an object whose `when` property is an array of [conditions](#condition) and contains a `then` and/or `otherwise` clause. The [validator](#validator) will evaluate the conditions and, if any of them are true, will apply the `then` operation (if supplied) via the [patch function](#patch). If none of them are true, the `otherwise` operation (if supplied) will be applied.

### Condition

A condition is a plain object whose keys are resolved to values (by means of the [resolver](#resolver) function) and whose values are passed to the [validator](#validator) function with the resolved values.

Using the default resolver, this means that the following:

```js
// context
{
  firstName: 'joe'
}

// condition
{
  firstName: {
    type: 'string',
    pattern: '^j'
  }
}
```

is given to the validator like this:

```js
validator({ type: 'string', pattern: '^j'}, 'joe');
```

### Operation

After the engine has run, the modified descriptor is computed by reducing all collected operations via the [patch](#patch) function in the order they were supplied in rules. They can be absolutely anything that the patch function can understand.

## Resolver

A resolver resolves the keys of [conditions](#condition) to values. It is passed the key and the context being evaluated. The resultant value can be any value that will subsequently get passed to the [validator](#validator). The default resolver simply maps the key of the condition to the key in context:

```js
const resolver = (context, ket) => context[key]
```

But the resolver function can be anything you choose. Some other ideas are:

- [json pointer](https://datatracker.ietf.org/doc/html/rfc6901)

```js
// context
{
  formData: {
    address: {
      street: '123 Fake Street'
    }
  }
}

// condition
{
  '/formData/address/street': {
    type: 'string'
  }
}

// for example:
import { get } from 'json-pointer';
const resolver = get;
```

- [lodash get](https://lodash.com/docs/#get)

```js
// context
{
  formData: {
    address: {
      street: '123 Fake Street'
    }
  }
}

// condition
{
  'formData.address.street': {
    type: 'string'
  }
}

// for example:
import { get } from 'lodash';
const resolver = get;
```

## Patch

The patch function does the work of applying the instructions encoded in the [operations](#operations) to the descriptor to end up with the final "modified" descriptor for any given context. 

**NOTE:** The descriptor itself **should never be mutated**. `json-modifiable` leaves it up to the user to ensure the patch function is non-mutating. The default patch function is a simple shallow-clone `Object.assign`:

```js
const patch = (...args) => Object.assign( {}, ...args);
```

## Usage

`json-modifiable` relies on a [validator](#validator) function that evaluates the [condition](#condition) of [rules](#rules) and applies patches


```js
import { engine } from 'json-modifiable';

const descriptor = engine(
  {
    fieldId: 'lastName',
    path: 'user.lastName',
    label: 'Last Name',
    readOnly: false,
    placeholder: 'Enter Your First Name',
    type: 'text',
    hidden: true,
    validations: [],
  },
  validator,
  [
    {
      when: [
        {
          'firstName': {
            type: 'string',
            minLength: 1
          }
        },
      ],
      then: {
        validations: ['required']
      }
    },
    // ... more rules
  ],
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
  validations: [],
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
    then: {
      validations: ['required'],
      hidden: false
    }
  },
];
```



### Types

```ts
export function engine<Descriptor, Op = Partial<Descriptor>, Context>(
  descriptor: Descriptor,
  validator: Validator,
  rules: Rule<Op>[],
  options?: Options<Descriptor, Op, Context>,
): JSONModifiable<Descriptor, Op, Context>;

export interface JSONModifiable<Descriptor, Operation = Partial<Descriptor>, Context> {
  get: () => Descriptor;
  set: (descriptor: Descriptor) => void;
  setRules: (rules: Rule<Operation>[]) => void;
  setContext: (context: Context) => void;
  subscribe: (subscriber: Subscriber<Descriptor>) => Unsubscribe;
  on: (event: 'modified', subscriber: Subscriber<Descriptor>) => Unsubscribe;
  on: (event: 'error', subscriber: Subscriber<ErrorEvent>) => Unsubscribe;
}

type Condition = {
  [key: string]: Record<string, unknown>;
};

export type Rule<Operation> = {
  when: Condition[];
  then?: Operation;
  otherwise?: Operation;
};

export type Options<Descriptor, Operation, Context> = {
  context?: Context;
  pattern?: RegExp | null;
  resolver?: Resolver<Context>;
  patch?: (descriptor: Descriptor, operation: Operation) => Descriptor;
};
```


### JSON Engine

This library also exports a function `jsonEngine` which is a thin wrapper over the engine using [json patch](http://jsonpatch.com/) as the patch function and [json pointer](https://datatracker.ietf.org/doc/html/rfc6901) as the default resolver. You can then write modifiable rules like this:



This library internally has tiny, largely spec compliant implementations of [json patch](http://jsonpatch.com/) and [json pointer](https://datatracker.ietf.org/doc/html/rfc6901) that it uses as default options. It should be noted that the json pointer and json patch implementations can access/modify nested structures that don't currently exist in the descriptor **without throwing errors** (not spec compliant). 

The patch operations are a bit looser than the spec - `add` and `replace` are treated as synonyms and prescribed errors aren't thrown. Another very important difference with the embedded json-patch utility is that it **only patches the parts of the descriptor that are actually modified** - i.e. no `cloneDeep`. This allows it to work beautifully with libraries that rely on (or make heavy use of) referential integrity/memoization (like React).

```js
const DynamicFormField = ({ context }) => {

  const refDescriptor = useRef(engine(descriptor, rules, { context }))
  const [currentDescriptor, setCurrentDescriptor] = useState(descriptor.current.get());
  const [context,setContext] = useState({})  

  useEffect(() => {
    return refDescriptor.current.subscribe(setCurrentDescriptor)
  },[])

  useEffect(() => {
    refDescriptor.current.setContext(context);
  },[context])

  return (/* some JSX */)
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

## Rules

```ts
type Rule<Patch = unknown> = {
  when: Condition[];
  then?: Patch;
  otherwise: Patch;
};
```

A rule looks like `when`, `then`, `otherwise` where only one of the `then` or `otherwise` needs to be defined. A when is made up on an array of objects whose keys are pointers to entities in `context` and whose values are schemas that will be passed to the `validator` function.

The `when` is always an array of `Condition`s. `Condition`s are plain objects whose keys are `path`s and values are `schemas`.

```ts
type Condition = {
  [key: string]: Record<string, any>;
};

// e.g. Condition using json-pointer syntax
const condition = {
  '/formData/firstName': {
    type: 'string',
    minLength: 2,
  },
};
```

If **any** of the `Condition`s in a `Rule` are true, then the operations in the `then` clause are applied. If none of them are true then the patch `otherwise` clause are applied. If a rule is false but no `otherwise` clause is specified, then no patches will be applied. The same goes for if a rule is true but doesn't have a `then` clause.

## Operations

THe `then` and `otherwise` are patch entites. Using json standards, JSON Modifiable allows them to be be specified as a [JSON patch](http://jsonpatch.com/) - an array of patch operations.

```ts
type PatchFunction = <T>(descriptor: T, operations: Operation[]) => T;
```

**Note:** It's important to know that rules run in the order they have been defined. So your patches will be applied in the order they are evaluated.

## Interpolation

`json-modifiable` uses [interpolatable](https://github.com/akmjenkins/interpolatable) to offer allow interpolation of values into rules/patches. See the [docs](https://github.com/akmjenkins/interpolatable) for how it works. The resolver function passed to `json-modifiable` will be the same one passed to interpolatable. By default it's just an accessor, but you could also use a resolver that works with [json pointer](https://datatracker.ietf.org/doc/html/rfc6901):

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

### About interpolation performance

**TLDR** in performance critical environments where you aren't using interpolation, pass `null` for the `pattern` option:

```js
const modifiable = engine(
  myDescriptor, 
  rules, 
  { 
    validator,
    pattern: null
  }
);
```

## Other Cool Stuff

Check out [json-schema-rules-engine](https://github.com/akmjenkins/json-schema-rules-engine) for a different type of rules engine.

## License

[MIT](./LICENSE)

## Contributing

PRs welcome!
