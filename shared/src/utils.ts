import base32Decode from 'base32-decode';
import base32Encode from 'base32-encode';
import { decode, encode } from 'base64-arraybuffer';
import _nacl from 'tweetnacl';

export const nacl = _nacl;

// https://stackoverflow.com/questions/54775790/forcing-excess-property-checking-on-variable-passed-to-typescript-function
export type StrictPropertyCheck<T, TExpected> = Exclude<keyof T, keyof TExpected> extends never
  ? {}
  : never;

export const toBase32 = (v: Uint8Array) => {
  return base32Encode(v, 'Crockford');
};

export const fromBase32 = (s: string) => {
  return new Uint8Array(base32Decode(s, 'Crockford'));
};

export const makeShortID = (v: Uint8Array, length = 12) => {
  const v32 = toBase32(v);
  const hash = toBase32(nacl.hash(v));
  return v32.substring(0, length / 2) + hash.substring(0, length / 2);
};

export const toBase64 = (v: Uint8Array) => {
  return encode(v);
};

export const fromBase64 = (s: string) => {
  return new Uint8Array(decode(s));
};

export const strToBin = (s: string) => {
  return new TextEncoder().encode(s);
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

export const findByID = <T extends { id: string }>(list: T[], id: string) => {
  if (!list) {
    return;
  }
  for (const v of list) {
    if (v.id == id) {
      return v;
    }
  }
};
