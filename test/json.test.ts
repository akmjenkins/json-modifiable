import { SomeJSONSchema } from 'ajv/dist/types/json-schema';
import { jsonEngine, JSONPatchRule } from '../src';
import { Descriptor, validator } from './fixtures';

describe('json pointer/patch', () => {
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

    const rules: JSONPatchRule<SomeJSONSchema>[] = [
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

    const m = jsonEngine(descriptor, validator, rules);
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
});
