export interface Match {
  pattern: RegExp | string;
  name?: string;
  nexts?: this[];
}

const _match = <T extends Match>(
  m: T,
  _p: string[],
  params: { [k: string]: string },
): T | undefined => {
  const p = [..._p];

  const v = p.shift();

  if (!v) {
    return;
  }
  const pattern = m.pattern;
  const ok = typeof pattern == 'string' ? v == pattern : pattern.test(v);
  if (!ok) {
    return;
  }
  if (m.name) {
    params[m.name] = v;
  }

  if (p.length > 0) {
    for (const next of m.nexts || []) {
      const r = _match(next, p, params);
      if (r) {
        return r;
      }
    }
    return;
  }

  return m;
};

export const pathMatcher = <T extends Match>(
  matches: T,
  path: string,
): { match: T; params: { [k: string]: string } } | undefined => {
  const params = {} as { [k: string]: string };
  const pathes = path.split('/');
  pathes.shift(); // remove first slash
  const match = _match(matches, pathes, params);
  if (match) {
    return { match: match, params };
  }
  return;
};
