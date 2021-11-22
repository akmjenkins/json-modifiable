import { SomeJSONSchema } from 'ajv/dist/types/json-schema';
import { applyPatch, Operation } from 'fast-json-patch';
import { get } from 'jsonpointer';
import expr from 'property-expr';
import { Rule, engine } from '../src/index';
import { Descriptor, validator } from './fixtures';

const { getter } = expr;

describe('modifiable', () => {
  it.only('should work with default settings', () => {
    const descriptor: Descriptor = {
      fieldId: 'firstName',
      path: 'user.firstName',
      label: 'First Name',
      readOnly: false,
      type: 'text',
      inner: { test: '1' },
      hidden: false,
      validations: ['required', ['minLength', 2]],
    };

    const rules: Rule<Partial<Descriptor>, SomeJSONSchema>[] = [
      {
        when: [{ contextPath: { type: 'string', const: '1' } }],
        then: { someNewKey: 'fred' },
      },
      {
        when: [{ firstName: { type: 'string', pattern: '^A' } }],
        then: {
          placeholder: 'Hey {{firstName}}! My first name starts with A, too!',
        },
        otherwise: { placeholder: 'Enter your first name' },
      },
    ];

    const m = engine(descriptor, validator, rules);
    expect(m.get().someNewKey).toBeUndefined();
    expect(m.get().placeholder).toBe('Enter your first name');
    m.setContext({ contextPath: '1' });
    expect(m.get().someNewKey).toBe('fred');
    m.setContext({ firstName: 'Andrew' });
    expect(m.get().placeholder).toBe(
      'Hey Andrew! My first name starts with A, too!',
    );
  });

  it('should work with a custom resolver', () => {
    const resolver = (object: any, path: string) => getter(path, true)(object);

    const descriptor: Descriptor = {
      fieldId: 'firstName',
      path: 'user.firstName',
      label: 'First Name',
      readOnly: false,
      type: 'text',
      inner: { test: '1' },
      hidden: false,
      validations: ['required', ['minLength', 2]],
    };

    const rules: Rule<Partial<Descriptor>, SomeJSONSchema>[] = [
      {
        when: [{ contextPath: { type: 'string', const: '1' } }],
        then: { someNewKey: 'fred' },
      },
      {
        when: [{ 'formData.firstName': { type: 'string', pattern: '^A' } }],
        then: {
          placeholder:
            'Hey {{formData.firstName}}! My first name starts with A, too!',
        },
        otherwise: { placeholder: 'Enter your first name' },
      },
    ];

    const m = engine(descriptor, validator, rules, { resolver });
    expect(m.get().someNewKey).toBeUndefined();
    expect(m.get().placeholder).toBe('Enter your first name');
    m.setContext({ contextPath: '1' });
    expect(m.get().someNewKey).toBe('fred');
    m.setContext({ formData: { firstName: 'Andrew' } });
    expect(m.get().placeholder).toBe(
      'Hey Andrew! My first name starts with A, too!',
    );
  });

  it('should work with JSON standards', () => {
    const descriptor: Descriptor = {
      fieldId: 'firstName',
      path: 'user.firstName',
      label: 'First Name',
      readOnly: false,
      type: 'text',
      inner: { test: '1' },
      hidden: false,
      validations: ['required', ['minLength', 2]],
    };

    const rules: Rule<Operation[], SomeJSONSchema>[] = [
      {
        when: [
          {
            '/contextPath': {
              type: 'string',
              const: '1',
            },
          },
        ],
        then: [
          {
            op: 'remove',
            path: '/validations/0',
          },
          {
            op: 'replace',
            path: '/someNewKey',
            value: { newThing: 'fred' },
          },
        ],
        otherwise: [
          {
            op: 'remove',
            path: '/validations',
          },
        ],
      },
      {
        when: [
          {
            '/formData/firstName': {
              type: 'string',
              pattern: '^A',
            },
          },
        ],
        then: [
          {
            op: 'add',
            path: '/placeholder',
            value:
              'Hey {{/formData/firstName}}! My first name starts with A, too!',
          },
        ],
        otherwise: [
          {
            op: 'add',
            path: '/placeholder',
            value: 'Enter your first name',
          },
        ],
      },
    ];

    const m = engine(descriptor, validator, rules, {
      resolver: get,
      patch: (descriptor, ops) =>
        applyPatch(descriptor, ops, false, false).newDocument,
    });
    const spy = jest.fn();
    const unsub = m.subscribe(spy);
    m.setContext({ contextPath: '1' });

    // 1 notification with the modified descriptor
    expect(spy).toHaveBeenCalledTimes(1);
    const modified = m.get();
    expect(spy).toHaveBeenCalledWith(modified);
    expect(modified.placeholder).toBe('Enter your first name');

    // modified !== descriptor
    expect(modified).not.toBe(descriptor);

    // no updates
    spy.mockClear();
    m.setContext({ contextPath: '1' });
    expect(spy).not.toHaveBeenCalled();
    m.setContext({ contextPath: '1', formData: { firstName: 'bill' } });
    expect(spy).not.toHaveBeenCalled();
    m.setContext({ formData: { firstName: 'bill' } });
    expect(m.get().validations).toBeUndefined();
    m.setContext({ formData: { firstName: 'Andrew' } });
    expect(m.get().placeholder).toBe(
      'Hey Andrew! My first name starts with A, too!',
    );

    unsub();
    spy.mockClear();
    m.setContext({ contextPath: '1' });
    expect(spy).not.toHaveBeenCalled(); // un subbed
  });

  it('should work without interpolations', () => {
    type Descriptor = {
      fieldId: string;
      path: string;
      label: string;
      readOnly: boolean;
      type: string;
      inner: Record<string, unknown>;
      hidden: boolean;
      validations: any[];
      someNewKey?: string;
      placeholder?: string;
    };

    const descriptor: Descriptor = {
      fieldId: 'firstName',
      path: 'user.firstName',
      label: 'First Name',
      readOnly: false,
      type: 'text',
      inner: { test: '1' },
      hidden: false,
      validations: ['required', ['minLength', 2]],
    };

    const rules: Rule<Operation[], SomeJSONSchema>[] = [
      {
        when: [
          {
            '/contextPath': {
              type: 'string',
              const: '1',
            },
          },
        ],
        then: [
          {
            op: 'remove',
            path: '/validations/0',
          },
          {
            op: 'replace',
            path: '/someNewKey',
            value: { newThing: 'fred' },
          },
        ],
        otherwise: [
          {
            op: 'remove',
            path: '/validations',
          },
        ],
      },
      {
        when: [
          {
            '/formData/firstName': {
              type: 'string',
              pattern: '^A',
            },
          },
        ],
        then: [
          {
            op: 'add',
            path: '/placeholder',
            value: 'Hey you! My first name starts with A, too!',
          },
        ],
        otherwise: [
          {
            op: 'add',
            path: '/placeholder',
            value: 'Enter your first name',
          },
        ],
      },
    ];

    const m = engine(descriptor, validator, rules, {
      pattern: null,
      resolver: get,
      patch: (descriptor, ops) =>
        applyPatch(descriptor, ops, false, false).newDocument,
    });
    const spy = jest.fn();
    const unsub = m.subscribe(spy);
    m.setContext({ contextPath: '1' });

    // 1 notification with the modified descriptor
    expect(spy).toHaveBeenCalledTimes(1);
    const modified = m.get();
    expect(spy).toHaveBeenCalledWith(modified);
    expect(modified.placeholder).toBe('Enter your first name');

    // modified !== descriptor
    expect(modified).not.toBe(descriptor);

    // no updates
    spy.mockClear();
    m.setContext({ contextPath: '1' });
    expect(spy).not.toHaveBeenCalled();
    m.setContext({ contextPath: '1', formData: { firstName: 'bill' } });
    expect(spy).not.toHaveBeenCalled();
    m.setContext({ formData: { firstName: 'bill' } });
    expect(m.get().validations).toBeUndefined();
    m.setContext({ formData: { firstName: 'Andrew' } });
    expect(m.get().placeholder).toBe(
      'Hey you! My first name starts with A, too!',
    );

    unsub();
    spy.mockClear();
    m.setContext({ contextPath: '1' });
    expect(spy).not.toHaveBeenCalled(); // un subbed
  });
});
