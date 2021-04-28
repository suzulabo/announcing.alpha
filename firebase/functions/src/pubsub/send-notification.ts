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
  context: EventContext,
  adminApp: admin.app.App,
) => {
  logger.debug('pubsubSendNotification', msg.json);
  const messaging = adminApp.messaging();
  {
    const mmsg = msg.json.mmsg as admin.messaging.MulticastMessage;
    if (mmsg) {
      logger.debug('sendMulticast', mmsg);
      const result = await messaging.sendMulticast(mmsg);
      if (result.failureCount > 0) {
        logger.warn('send error', result);
        // TODO
      }
      return;
    }
  }
  {
    const tmsgs = msg.json.tmsgs as admin.messaging.TokenMessage[];
    if (tmsgs) {
      logger.debug('sendAll', tmsgs);
      const result = await messaging.sendAll(tmsgs);
      if (result.failureCount > 0) {
        logger.warn('send error', result);
        // TODO
      }
      return;
    }
  }
  logger.warn('no msgs');
};
