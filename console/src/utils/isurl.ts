export const isURL = (s: string | undefined, nullResult = true) => {
  if (!s) {
    return nullResult;
  }
  try {
    const url = new URL(s);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};
