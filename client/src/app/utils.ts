import bsx from 'base-x';

const bs62 = bsx('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

export const postIDtoMillis = (s: string) => {
  const b = bs62.decode(s.split('-')[0]);
  const view = new DataView(b.buffer);
  return view.getFloat64(0);
};
