import { firestoreNotificationDeviceWrite } from 'src/firestore/notif-devices';
import { FakeFirestore } from '__test__/fake-firestore';

describe('firestoreNotificationDeviceWrite', () => {
  it('no announces', async () => {
    const token1 = 'token1-' + 'x'.repeat(160);

    const firestore = new FakeFirestore({
      'notif-devices': {
        [token1]: {
          lang: 'ja',
          announces: [],
        },
      },
    });

    await firestoreNotificationDeviceWrite(
      {
        before: {
          data: () => {
            return;
          },
        },
        after: firestore.doc(`notif-devices/${token1}`).get(),
      } as any,
      { params: { token: token1 } } as any,
      firestore.adminApp(),
    );
    expect(firestore.data['notif-imm']).toBeUndefined();
  });

  it('imm devices', async () => {
    const token1 = 'token1-' + 'x'.repeat(160);

    const firestore = new FakeFirestore({
      'notif-devices': {
        [token1]: {
          lang: 'ja',
          announces: ['111111111111', '111111111112'],
        },
      },
    });

    await firestoreNotificationDeviceWrite(
      {
        before: {
          data: () => {
            return;
          },
        },
        after: firestore.doc(`notif-devices/${token1}`).get(),
      } as any,
      { params: { token: token1 } } as any,
      firestore.adminApp(),
    );
    expect(Object.keys(firestore.data['notif-imm']).sort()).toEqual([
      '111111111111',
      '111111111112',
    ]);

    {
      const imm = {
        devices: { [token1]: ['ja'] },
        cancels: expect.anything(),
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

  it('cancels', async () => {
    const token1 = 'token1-' + 'x'.repeat(160);

    const data = {
      'notif-devices': {
        [token1]: {
          lang: 'ja',
          announces: ['111111111111', '111111111112'],
        },
      },
    };
    const firestore = new FakeFirestore(data);

    const doc1 = firestore.doc(`notif-devices/${token1}`).get();
    await firestoreNotificationDeviceWrite(
      {
        before: {
          data: () => {
            return;
          },
        },
        after: doc1,
      } as any,
      { params: { token: token1 } } as any,
      firestore.adminApp(),
    );

    data['notif-devices'][token1]['announces'] = [] as any;

    const doc2 = firestore.doc(`notif-devices/${token1}`).get();
    await firestoreNotificationDeviceWrite(
      { before: doc1, after: doc2 } as any,
      { params: { token: token1 } } as any,
      firestore.adminApp(),
    );

    expect(firestore.data['notif-imm']['111111111111']).toEqual({
      announceID: '111111111111',
      devices: {},
      cancels: [token1],
      uT: expect.any(Date),
    });
  });
});
