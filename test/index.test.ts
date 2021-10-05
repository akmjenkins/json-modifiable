import Ajv from 'ajv/dist/2019';
import createJSONModifiable from '../src';

describe('modifiable', () => {
  const ajv = new Ajv();
  const validator = (schema: any, subject: any) =>
    ajv.validate(schema, subject);

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

  const rules = [
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

  it('should work', () => {
    const m = createJSONModifiable(descriptor, rules, { validator });
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
    // referential integrity on non-patched parts of the document
    expect(modified.inner).toBe(descriptor.inner);

    // patched parts should not be referntially identical
    expect(modified.validations).not.toBe(descriptor.validations);

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

  it('should subscribe to a part', () => {
    const m = createJSONModifiable(descriptor, rules, { validator });
    const spy = jest.fn();
    m.subscribeTo<Descriptor['placeholder']>('/placeholder', spy);
    m.setContext({ formData: { firstName: 'Alice' } });
    expect(spy).toHaveBeenCalledWith(m.get().placeholder);
    spy.mockClear();
    m.setContext({
      formData: { firstName: 'Alice', lastName: 'in Wonderland' },
    });
    expect(spy).not.toHaveBeenCalled();
  });
});
