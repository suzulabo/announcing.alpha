import bsx from 'base-x';
import * as crypto from 'crypto';
import nacl from 'tweetnacl';

export const bs62 = bsx('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

export const toMD5Base62 = (v: Buffer | string) => {
  const md5 = crypto.createHash('md5');
  return bs62.encode(md5.update(v).digest());
};

export const millisToBase62 = (v: number) => {
  const b = Buffer.alloc(8);
  b.writeDoubleBE(v, 0);
  return bs62.encode(b);
};

export const postIDtoMillis = (s: string) => {
  const b = bs62.decode(s.split('-')[0]);
  return b.readDoubleBE(0);
};

export const autoID = (len = 12) => {
  const chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

  const random = nacl.randomBytes(len);
  const l = [] as string[];
  random.forEach(v => {
    l.push(chars.charAt(v % 32));
  });
  return l.join('');
};
