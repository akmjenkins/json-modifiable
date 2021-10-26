const replace = (subject, params = {}, match, resolver, dependencies) => {
  let shouldReplaceFull, found;

  const replaced = subject.replace(match, (full, matched) => {
    shouldReplaceFull = full === subject;
    found = resolver(params, matched);
    dependencies.push([matched, found]);
    return shouldReplaceFull ? '' : found;
  });

  return shouldReplaceFull ? found : replaced;
};

const interpolate = (
  o,
  params,
  matcher,
  resolver,
  dependencies = [],
  original,
) => {
  if (!o || typeof o === 'number' || typeof o === 'boolean' || original === o)
    return o;

  if (typeof o === 'string')
    return replace(o, params, matcher, resolver, dependencies);

  if (Array.isArray(o)) {
    let didInterpolate = false;
    const next = o.map((t, i) => {
      const inner = interpolate(
        t,
        params,
        matcher,
        resolver,
        dependencies,
        original?.[i],
      );
      if (inner !== t) didInterpolate = true;
      return inner;
    });
    return didInterpolate ? next : o;
  }

  return Object.entries(o).reduce((acc, [k, v]) => {
    const next = interpolate(
      v,
      params,
      matcher,
      resolver,
      dependencies,
      original?.[k],
    );
    return next === v ? acc : { ...acc, [k]: next };
  }, o);
};

export const memoedInterpolate = (o, matcher, resolver) => {
  let lastInterpolated;
  let dependencies = [];
  // no need to traverse "everything" after the first one, just call set paths for each of these if they differ?
  // but I think that's accomplished by passing original down after the first time

  return (params) => {
    if (
      lastInterpolated &&
      (!dependencies.length ||
        dependencies.every(([d, v]) => resolver(params, d) === v))
    )
      return lastInterpolated;

    dependencies = [];

    return (lastInterpolated = interpolate(
      o,
      params,
      matcher,
      resolver,
      dependencies,
      lastInterpolated ? o : undefined,
    ));
  };
};
