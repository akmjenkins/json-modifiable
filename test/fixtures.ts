import Ajv from 'ajv/dist/2019';

export type Descriptor = {
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
const ajv = new Ajv();
export const validator = ajv.validate.bind(ajv);
