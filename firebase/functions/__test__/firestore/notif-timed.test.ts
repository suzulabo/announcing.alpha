import { firestoreTimedNotificationWrite } from 'src/firestore/notif-timed';
import { FakeFirestore } from '__test__/fake-firestore';

describe('firestoreTimedNotificationWrite', () => {
  it('no archives', async () => {
    const tokenSuffix = 'x'.repeat(160);

    const followers = Object.fromEntries(
      [...Array(4300)].map((_, i) => {
        return [`token${i}-${tokenSuffix}`, ['ja', { '111111111111': [] }]];
      }),
    );

    const firestore = new FakeFirestore({
      'notif-timed': {
        '0000': {
          time: 0,
          followers: followers,
        },
      },
    });

    await firestoreTimedNotificationWrite(
      { after: firestore.doc('notif-timed/0000').get() } as any,
      {} as any,
      firestore.adminApp(),
    );
    expect(firestore.data['notif-timed']['0000'].archives).toBeUndefined();
  });

  it('do archives', async () => {
    const tokenSuffix = 'x'.repeat(160);

    const followers = Object.fromEntries(
      [...Array(4400)].map((_, i) => {
        return [`token${i}-${tokenSuffix}`, ['ja', { '111111111111': [] }]];
      }),
    );

    const firestore = new FakeFirestore({
      'notif-timed': {
        '0000': {
          time: 0,
          followers: followers,
        },
      },
    });

    await firestoreTimedNotificationWrite(
      { after: firestore.doc('notif-timed/0000').get() } as any,
      {} as any,
      firestore.adminApp(),
    );
    expect(firestore.data['notif-timed']['0000'].archives).toEqual(['1', '2']);

    const archives1 = firestore.doc('notif-timed/0000/archives/1').get().data()!;
    const archives2 = firestore.doc('notif-timed/0000/archives/2').get().data()!;
    const archivesFollowers = { ...archives1.followers, ...archives2.followers };
    expect(archivesFollowers).toEqual(followers);

    // test unfollow
    const followers2 = Object.fromEntries(
      [...Array(3000)].map((_, i) => {
        return [`token${5000 + i}-${tokenSuffix}`, ['ja', { '111111111112': [] }]];
      }),
    );
    const unfollows = Object.keys(followers);
    firestore.doc('notif-timed/0000').update({ followers: followers2, unfollows });

    await firestoreTimedNotificationWrite(
      { after: firestore.doc('notif-timed/0000').get() } as any,
      {} as any,
      firestore.adminApp(),
    );

    expect(firestore.doc('notif-timed/0000').get().data()).toEqual({
      time: 0,
      archives: ['1'],
      uT: expect.any(Date),
    });
    expect(firestore.doc('notif-timed/0000/archives/1').get().data()).toEqual({
      followers: followers2,
    });
    expect(firestore.doc('notif-timed/0000/archives/2').get().exists).toEqual(false);
  });
});
