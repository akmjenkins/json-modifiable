import { patch } from './patch';
import { get } from './pointer';
import { engine } from './engine';

export const jsonEngine = (descriptor, rules, opts = {}) =>
  engine(descriptor, rules, { ...opts, patch, resolver: get });
