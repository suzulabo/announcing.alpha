const STRINGS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const FIRST_CHAR = STRINGS[0];

export const incString = {
  next: (v?: string) => {
    if (!v) {
      return FIRST_CHAR;
    }

    const values = [...v];
    for (let i = values.length - 1; i >= 0; i--) {
      const c = values[i];
      const p = STRINGS.indexOf(c);
      const n = p < STRINGS.length - 1 ? STRINGS[p + 1] : FIRST_CHAR;
      values[i] = n;
      if (n != FIRST_CHAR) {
        break;
      }
      if (i == 0) {
        values.splice(0, 0, FIRST_CHAR);
        break;
      }
    }
    return values.join('');
  },
  compare: (s1: string, s2: string) => {
    if (s1 == s2) {
      return 0;
    }

    const len1 = s1?.length || 0;
    const len2 = s2?.length || 0;
    if (len1 != len2) {
      return len1 < len2 ? -1 : 1;
    }
    return s1 < s2 ? -1 : 1;
  },
  max: (v: string[]) => {
    let s = FIRST_CHAR;
    if (v) {
      for (const c of v) {
        if (incString.compare(s, c) > 0) {
          s = c;
        }
      }
    }
    return s;
  },
};
