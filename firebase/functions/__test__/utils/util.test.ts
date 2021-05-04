import { millisToBase62, postIDtoMillis } from '../../src/utils/util';

describe('util', () => {
  it('postIDtoMillis', () => {
    const v = 1618886704000;
    const s = millisToBase62(v);
    expect(s).toEqual('5HNKrmbrTCo');
    expect(postIDtoMillis(s)).toEqual(v);
  });
});
