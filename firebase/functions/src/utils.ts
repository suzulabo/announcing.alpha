import bsx from 'base-x';
import * as crypto from 'crypto';

const bs62 = bsx('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

export const toBase62 = (v: Uint8Array) => {
  return bs62.encode(v);
};

export const toMD5Base62 = (v: Uint8Array) => {
  const md5 = crypto.createHash('md5');
  return bs62.encode(md5.update(v).digest());
};
