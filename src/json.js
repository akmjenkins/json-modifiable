import { patch } from './patch';
import { get } from './pointer';
import { engine } from './engine';

export const jsonEngine = (descriptor, validator, rules, opts = {}) =>
  engine(descriptor, validator, rules, { ...opts, patch, resolver: get });
