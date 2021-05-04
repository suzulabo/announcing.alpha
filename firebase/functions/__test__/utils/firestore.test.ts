import { AnnounceMeta } from 'src/shared';
import { announceMetaHash, _serialize } from 'src/utils/firestore';

describe('firestore', () => {
  it('_serialize', () => {
    const a = _serialize('a', 'b', 'c');
    expect(a).toEqual(_serialize('a', 'b', 'c', undefined, undefined));
  });
  it('announceMetaHash', () => {
    const a = announceMetaHash({ name: 'a' } as AnnounceMeta);
    expect(a).not.toEqual(announceMetaHash({ name: 'b' } as AnnounceMeta));
    expect(a).toEqual(announceMetaHash({ name: 'a', link: '' } as AnnounceMeta));
  });
});
