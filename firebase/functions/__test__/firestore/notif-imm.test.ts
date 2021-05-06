import { firestoreImmediateNotificationWrite } from 'src/firestore/notif-imm';
import { FakeFirestore } from '__test__/fake-firestore';

describe('firestoreImmediateNotificationWrite', () => {
  it('no archives', async () => {
    const tokenSuffix = 'x'.repeat(160);

    const followers = Object.fromEntries(
      [...Array(4999)].map((_, i) => {
        return [`token${i}-${tokenSuffix}`, ['ja']];
      }),
    );

    const firestore = new FakeFirestore({
      'notif-imm': {
        '111111111111': {
          announceID: '111111111111',
          followers: followers,
        },
      },
    });

    await firestoreImmediateNotificationWrite(
      { after: firestore.doc('notif-imm/111111111111').get() } as any,
      {} as any,
      firestore.adminApp(),
    );
    expect(firestore.data['notif-imm']['111111111111'].archives).toBeUndefined();
  });

  it('do archives', async () => {
    const tokenSuffix = 'x'.repeat(160);

    const followers = Object.fromEntries(
      [...Array(5000)].map((_, i) => {
        return [`token${i}-${tokenSuffix}`, ['ja']];
      }),
    );

    const firestore = new FakeFirestore({
      'notif-imm': {
        '111111111111': {
          announceID: '111111111111',
          followers: followers,
        },
      },
    });

    await firestoreImmediateNotificationWrite(
      { after: firestore.doc('notif-imm/111111111111').get() } as any,
      {} as any,
      firestore.adminApp(),
    );
    expect(firestore.doc('notif-imm/111111111111').get().data()).toEqual({
      announceID: '111111111111',
      archives: ['1'],
      uT: expect.any(Date),
    });

    const archives1 = firestore.doc('notif-imm/111111111111/archives/1').get().data()!;
    expect(archives1.followers).toEqual(followers);
  });

  it('unfollows', async () => {
    const tokenSuffix = 'x'.repeat(160);

    const followers = Object.fromEntries(
      [...Array(5000)].map((_, i) => {
        return [`token${i}-${tokenSuffix}`, ['ja']];
      }),
    );

    const firestore = new FakeFirestore({
      'notif-imm': {
        '111111111111': {
          announceID: '111111111111',
          followers: followers,
        },
      },
    });

    await firestoreImmediateNotificationWrite(
      { after: firestore.doc('notif-imm/111111111111').get() } as any,
      {} as any,
      firestore.adminApp(),
    );

    const unfollows = Object.keys(followers);
    firestore.doc('notif-imm/111111111111').update({ unfollows });

    await firestoreImmediateNotificationWrite(
      { after: firestore.doc('notif-imm/111111111111').get() } as any,
      {} as any,
      firestore.adminApp(),
    );
    expect(firestore.doc('notif-imm/111111111111').get().data()).toEqual({
      announceID: '111111111111',
      archives: [],
      uT: expect.any(Date),
    });
    expect(firestore.data['notif-imm']['111111111111']['_collections']['archives']).toEqual({});
  });
});
