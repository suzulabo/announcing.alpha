import { firestoreNotificationDeviceWrite } from 'src/firestore/notif-devices';
import { FakeFirestore } from '__test__/fake-firestore';

describe('firestoreNotificationDeviceWrite', () => {
  it('no follows', async () => {
    const token1 = 'token1-' + 'x'.repeat(160);

    const firestore = new FakeFirestore({
      'notif-devices': {
        [token1]: {
          lang: 'ja',
          tz: 'Asia/Tokyo',
          follows: {},
        },
      },
    });

    await firestoreNotificationDeviceWrite(
      { before: { data: () => {} }, after: firestore.doc(`notif-devices/${token1}`).get() } as any,
      { params: { token: token1 } } as any,
      firestore.adminApp(),
    );
    expect(firestore.data['notif-imm']).toBeUndefined();
    expect(firestore.data['notif-timed']).toBeUndefined();
  });

  it('imm follows', async () => {
    const token1 = 'token1-' + 'x'.repeat(160);

    const firestore = new FakeFirestore({
      'notif-devices': {
        [token1]: {
          lang: 'ja',
          tz: 'Asia/Tokyo',
          follows: {
            ['111111111111']: {},
            ['111111111112']: {},
          },
        },
      },
    });

    await firestoreNotificationDeviceWrite(
      { before: { data: () => {} }, after: firestore.doc(`notif-devices/${token1}`).get() } as any,
      { params: { token: token1 } } as any,
      firestore.adminApp(),
    );
    expect(firestore.data['notif-timed']).toBeUndefined();
    expect(Object.keys(firestore.data['notif-imm']).sort()).toEqual([
      '111111111111',
      '111111111112',
    ]);

    {
      const imm = {
        followers: { [token1]: ['ja'] },
        unfollows: expect.anything(),
        uT: expect.anything(),
      };
      expect(firestore.data['notif-imm']['111111111111']).toEqual({
        ...imm,
        announceID: '111111111111',
      });
      expect(firestore.data['notif-imm']['111111111112']).toEqual({
        ...imm,
        announceID: '111111111112',
      });
    }
  });

  it('timed follows', async () => {
    const token1 = 'token1-' + 'x'.repeat(160);

    const firestore = new FakeFirestore({
      'notif-devices': {
        [token1]: {
          lang: 'ja',
          tz: 'Asia/Tokyo',
          follows: {
            ['111111111111']: { hours: [7, 18] },
            ['111111111112']: { hours: [12] },
          },
        },
      },
    });

    await firestoreNotificationDeviceWrite(
      { before: { data: () => {} }, after: firestore.doc(`notif-devices/${token1}`).get() } as any,
      { params: { token: token1 } } as any,
      firestore.adminApp(),
    );
    expect(firestore.data['notif-imm']).toBeUndefined();
    expect(Object.keys(firestore.data['notif-timed']).sort()).toEqual(['0300', '0900', '2200']);

    {
      const timed = {
        unfollows: expect.anything(),
        uT: expect.anything(),
      };
      expect(firestore.data['notif-timed']['0300']).toEqual({
        ...timed,
        time: 300,
        followers: { [token1]: ['ja', { '111111111112': [] }] },
      });
      expect(firestore.data['notif-timed']['0900']).toEqual({
        ...timed,
        time: 900,
        followers: { [token1]: ['ja', { '111111111111': [11] }] },
      });
      expect(firestore.data['notif-timed']['2200']).toEqual({
        ...timed,
        time: 2200,
        followers: { [token1]: ['ja', { '111111111111': [13] }] },
      });
    }
  });
});
