import { announceMetaHash, AnnounceMeta_FS, _serialize } from '../src/firestore';

describe('firestore', () => {
  it('_serialize', () => {
    const a = _serialize('a', 'b', 'c');
    expect(a).toEqual(_serialize('a', 'b', 'c', undefined, undefined));
  });
  it('announceMetaHash', () => {
    const a = announceMetaHash({ name: 'a' } as AnnounceMeta_FS);
    expect(a).not.toEqual(announceMetaHash({ name: 'b' } as AnnounceMeta_FS));
    expect(a).toEqual(announceMetaHash({ name: 'a', link: '' } as AnnounceMeta_FS));
  });
});
