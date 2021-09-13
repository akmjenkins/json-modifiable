import { get } from './pointer';
import { patch } from './patch';
const pattern = /\{\{\s*(.+?)\s*\}\}/g;
const resolver = get;

export default { pattern, resolver, patch };
