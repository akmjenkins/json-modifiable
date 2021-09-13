import { get } from './pointer';
import { patch } from './patch';
const pattern = /\{\{\s*(.+?)\s*\}\}/g;
const resolver = get;
const validator = () => {
  throw new Error('You must supply a validator');
};

export default { pattern, resolver, patch, validator };
