import Ajv from 'ajv/dist/2019';
import createJSONModifiable from '../src';

describe('modifiable', () => {
  const ajv = new Ajv();
  const validator = (schema: any, subject: any) =>
    ajv.validate(schema, subject);

  it('should work', () => {
    const descriptor = {
      fieldId: 'firstName',
      path: 'user.firstName',
      label: 'First Name',
      readOnly: false,
      placeholder: 'Enter Your First Name',
      type: 'text',
      inner: {
        test: '1',
      },
      hidden: false,
      validations: ['required', ['minLength', 2]],
    };

    const rules = [
      {
        when: [
          {
            '/contextPath': {
              type: 'string',
              const: '1', // allow interpolation from context?
            },
          },
        ],
        then: [
          // interpolations
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
      },
    ];

    const m = createJSONModifiable(descriptor, rules, { validator });
    const spy = jest.fn();
    m.on('modified', spy);
    m.setContext({ contextPath: '1' });

    // 1 notification with the modified descriptor
    expect(spy).toHaveBeenCalledTimes(1);
    const modified = m.get();
    expect(spy).toHaveBeenCalledWith(modified);

    // modified !== descriptor
    expect(modified).not.toBe(descriptor);
    // referential integrity on non-patched parts of the document
    expect(modified.inner).toBe(descriptor.inner);

    // patched parts should not be referntially identical
    expect(modified.validations).not.toBe(descriptor.validations);

    // no updates
    m.setContext({ contextPath: '1' });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
