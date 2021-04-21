import { PubSub } from '@google-cloud/pubsub';
import * as admin from 'firebase-admin';
import { EventContext } from 'firebase-functions/lib/cloud-functions';
import { Message } from 'firebase-functions/lib/providers/pubsub';

export const pubMulticastMessages = async (msgs: admin.messaging.MulticastMessage[]) => {
  const pubsub = new PubSub();
  const topic = pubsub.topic('send-notification', {
    batching: { maxMessages: 100, maxMilliseconds: 50 },
  });
  for (const mmsg of msgs) {
    console.debug('multicastMsg', mmsg);
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
    console.debug('tokenMsgs', tmsgs);
    void topic.publishJSON({ tmsgs });
  }

  await topic.flush();
};

export const pubsubSendNotification = async (
  msg: Message,
  context: EventContext,
  adminApp: admin.app.App,
) => {
  console.log('pubsubSendNotification', msg.json);
  const messaging = adminApp.messaging();
  {
    const mmsg = msg.json.mmsg as admin.messaging.MulticastMessage;
    if (mmsg) {
      console.debug('sendMulticast', mmsg);
      const result = await messaging.sendMulticast(mmsg);
      if (result.failureCount > 0) {
        console.warn(result);
        // TODO
      }
      return;
    }
  }
  {
    const tmsgs = msg.json.tmsgs as admin.messaging.TokenMessage[];
    if (tmsgs) {
      console.debug('sendAll', tmsgs);
      const result = await messaging.sendAll(tmsgs);
      if (result.failureCount > 0) {
        console.warn(result);
        // TODO
      }
      return;
    }
  }
  console.warn('no msgs');
};
