import patch from './patch';
import { get } from './pointer';
import createJSONModifiable from './index';

export default (descriptor, rules, opts = {}) =>
  createJSONModifiable(descriptor, rules, { ...opts, patch, resolver: get });
