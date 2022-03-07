import interpolatable from 'interpolatable';
import { areArraysEqual } from './utils';

const evalMap = (map, context, { validator, resolver }) =>
  Object.entries(map).every(([key, schema]) =>
    validator(schema, resolver(context, key)),
  );

const createStatefulMap = (when, options) => {
  const deps = Object.keys(when).map(
    (key) => (context) => options.resolver(context, key),
  );

  let lastDeps = [];
  let lastWhen;
  let last;
  when = interpolatable(when, options);
  return (context) => {
    let nextDeps;
    const getNextDeps = () =>
      nextDeps || (nextDeps = deps.map((d) => d(context)));

    const nextWhen = when(context);
    if (nextWhen !== lastWhen || !areArraysEqual(getNextDeps(), lastDeps)) {
      lastWhen = nextWhen;
      lastDeps = nextDeps || getNextDeps();
      return (last = evalMap(nextWhen, context, options));
    }
    return last;
  };
};

const createStatefulRule = (
  { when, then, otherwise, options: ruleOpts = {} },
  options,
) => {
  let t, o;
  const interpolatableOptions = { ...options, ...ruleOpts };
  when = when.map((w) => createStatefulMap(w, interpolatableOptions));

  return (context) => {
    let which;
    const pass = when.some((w) => w(context));

    if (pass) {
      which = t || (t = interpolatable(then, interpolatableOptions));
    } else {
      which = o || (o = interpolatable(otherwise, interpolatableOptions));
    }
    return which(context);
  };
};

export const createStatefulRules = (rules, options) => {
  rules = rules.map((rule) => createStatefulRule(rule, options));
  return (context) => rules.map((rule) => rule(context));
};
