import nacl from 'tweetnacl';
import { TextDecoder } from 'util';
import { bs62 } from './util';

export const checkSign = (_signKey: string, _sign: string) => {
  const signKey = bs62.decode(_signKey);
  const sign = bs62.decode(_sign);
  const data = nacl.sign.open(sign, signKey);
  if (!data) {
    return;
  }
  const s = new TextDecoder().decode(data);
  return s.split('\0');
};
