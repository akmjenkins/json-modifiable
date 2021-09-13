export const replace = (subject = '', params = {}, match, resolver) => {
  let shouldReplaceFull, found;

  const replaced = subject.replace(match, (full, matched) => {
    shouldReplaceFull = full === subject;
    found = resolver(params, matched);
    return shouldReplaceFull ? '' : found;
  });

  return shouldReplaceFull ? found : replaced;
};

export const interpolate = (o, params, matcher, resolver) => {
  if (!o || typeof o === 'number' || typeof o === 'boolean') return o;

  if (typeof o === 'string') return replace(o, params, matcher, resolver);

  if (Array.isArray(o))
    return o.map((t) => interpolate(t, params, matcher, resolver));

  return Object.entries(o).reduce(
    (acc, [k, v]) => ({
      ...acc,
      [k]: interpolate(v, params, matcher, resolver),
    }),
    {},
  );
};
