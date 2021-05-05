import admin from 'firebase-admin';
import { FakeFirestore } from './fake-firestore';

import FieldValue = admin.firestore.FieldValue;

describe('fake-firestore', () => {
  it('doc.get().data()', () => {
    const f = new FakeFirestore({
      users: {
        aaa: { name: 'test' },
      },
    });

    expect(f.doc('users/aaa').get().data()).toEqual({ name: 'test' });
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

    expect(f.doc('users/aaa/followers/AAA').get().data()).toEqual({ name: 'TEST' });
    expect(f.doc('users/bbb/followers/BBB').get().data()).toBeUndefined();
  });

  it('collection().doc().set()', () => {
    const f = new FakeFirestore({
      users: {
        aaa: {
          name: 'test',
        },
      },
    });

    const doc = f.doc('users/aaa');
    const c = doc.collection('items');
    c.doc('A').set({ name: 'A' });
    expect(f.doc('users/aaa/items/A').get().data()).toEqual({ name: 'A' });
    expect(f.doc('users/aaa').get().data()).toEqual({ name: 'test' });
  });

  it('doc.create', () => {
    const f = new FakeFirestore();
    f.doc('users/aaa').create({ name: 'test' });
    expect(f.data.users.aaa).toEqual({ name: 'test' });
  });

  it('doc.delete', () => {
    const f = new FakeFirestore({
      users: {
        aaa: { name: 'test' },
      },
    });

    f.doc('users/aaa').delete();
    expect(f.data.users).toEqual({});
  });

  it('FieldValue serverTimestamp', () => {
    const f = new FakeFirestore();

    f.doc('users/aaa').set({ name: 'test', uT: FieldValue.serverTimestamp() });
    expect(f.data.users.aaa).toEqual({ name: 'test', uT: expect.any(Date) });
  });

  it('FieldValue arrayUnion', () => {
    const f = new FakeFirestore();
    f.doc('users/aaa').set({ cities: FieldValue.arrayUnion('hiroshima') });
    expect(f.data.users.aaa).toEqual({ cities: ['hiroshima'] });
    f.doc('users/aaa').update({ cities: FieldValue.arrayUnion('tokyo') });
    expect(f.data.users.aaa).toEqual({ cities: ['hiroshima', 'tokyo'] });
    f.doc('users/aaa').update({ cities: FieldValue.arrayRemove('tokyo') });
    expect(f.data.users.aaa).toEqual({ cities: ['hiroshima'] });
  });

  it('FieldValue delete', () => {
    const f = new FakeFirestore({
      users: {
        aaa: {
          follows: { A: { name: 'a' }, B: { name: 'b' }, C: { name: 'c' } },
        },
      },
    });
    f.doc('users/aaa').update({ follows: { B: FieldValue.delete() } });
    expect(Object.keys(f.data.users.aaa.follows).sort()).toEqual(['A', 'C']);
    f.doc('users/aaa').update({ follows: { X: FieldValue.delete() } });
    expect(Object.keys(f.data.users.aaa.follows).sort()).toEqual(['A', 'C']);
  });
});
