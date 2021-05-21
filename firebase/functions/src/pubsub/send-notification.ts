import { PubSub } from '@google-cloud/pubsub';
import * as admin from 'firebase-admin';
import { EventContext } from 'firebase-functions/lib/cloud-functions';
import { Message } from 'firebase-functions/lib/providers/pubsub';
import { logger } from '../utils/logger';

export const pubMulticastMessages = async (msgs: admin.messaging.MulticastMessage[]) => {
  const pubsub = new PubSub();
  const topic = pubsub.topic('send-notification', {
    batching: { maxMessages: 100, maxMilliseconds: 50 },
  });
  for (const mmsg of msgs) {
    logger.debug('multicastMsg', mmsg);
    void topic.publishJSON({ mmsg });
  }
  await topic.flush();
};

export const pubTokenMessages = async (msgs: admin.messaging.TokenMessage[]) => {
  const pubsub = new PubSub();
  const topic = pubsub.topic('send-notification', {
    batching: { maxMessages: 100, maxMilliseconds: 50 },
  });

  while (msgs.length) {
    const tmsgs = msgs.splice(0, 500);
    logger.debug('tokenMsgs', tmsgs);
    void topic.publishJSON({ tmsgs });
  }

  await topic.flush();
};

export const pubsubSendNotification = async (
  msg: Message,
  _context: EventContext,
  adminApp: admin.app.App,
) => {
  const handleResponse = async (bs: admin.messaging.BatchResponse, tokens: string[]) => {
    if (bs.failureCount == 0) {
      return;
    }

    const firestore = adminApp.firestore();
    const batch = firestore.batch();
    let update = false;
    bs.responses.forEach((res, i) => {
      if (res.success) {
        return;
      }

      const token = tokens[i];
      const err = res.error;
      logger.warn('send error', { ...err, token });
      if (err && err.code == 'messaging/registration-token-not-registered') {
        batch.delete(firestore.doc(`notif-devices/${token}`));
        update = true;
      }
    });
    if (update) {
      try {
        await batch.commit();
      } catch (err) {
        logger.error('update error', err);
      }
    }
  };

  const messaging = adminApp.messaging();
  {
    const mmsg = msg.json.mmsg as admin.messaging.MulticastMessage;
    if (mmsg) {
      logger.debug('sendMulticast', mmsg);
      const res = await messaging.sendMulticast(mmsg);
      await handleResponse(res, mmsg.tokens);
      return;
    }
  }
  {
    const tmsgs = msg.json.tmsgs as admin.messaging.TokenMessage[];
    if (tmsgs) {
      logger.debug('sendAll', tmsgs);
      const res = await messaging.sendAll(tmsgs);
      await handleResponse(
        res,
        tmsgs.map(v => {
          return v.token;
        }),
      );
      return;
    }
  }
  logger.warn('no msgs', msg.json);
};
