import { FakeFirestore } from './fake-firestore';

describe('fake-firestore', () => {
  it('doc.get().data()', () => {
    const f = new FakeFirestore({
      users: {
        aaa: { name: 'test' },
      },
    });

    expect(f.doc('users/aaa').get().data()).toStrictEqual({ name: 'test' });
    expect(f.doc('users/bbb').get().data()).toBeUndefined();
  });
  it('doc.get().data() subcollection', () => {
    const f = new FakeFirestore({
      users: {
        aaa: {
          name: 'test',
          _collections: {
            followers: {
              AAA: {
                name: 'TEST',
              },
            },
          },
        },
      },
    });

    expect(f.doc('users/aaa/followers/AAA').get().data()).toStrictEqual({ name: 'TEST' });
    expect(f.doc('users/bbb/followers/BBB').get().data()).toBeUndefined();
  });

  it('doc.delete', () => {
    const f = new FakeFirestore({
      users: {
        aaa: { name: 'test' },
      },
    });

    f.doc('users/aaa').delete();
    expect(f.data.users).toStrictEqual({});
  });
});
