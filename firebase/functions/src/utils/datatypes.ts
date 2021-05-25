import admin from 'firebase-admin';
import { Lang } from '../shared';

export interface NotificationDevice {
  signKey: string;
  lang: Lang;
  announces: string[];
  uT: admin.firestore.Timestamp;
}

export interface ImmediateNotification {
  announceID: string;
  devices?: { [token: string]: [lang: Lang] };
  cancels?: string[];
  archives?: string[];
  uT: admin.firestore.Timestamp;
}

export interface ImmediateNotificationArchive {
  devices: { [token: string]: [lang: Lang] };
}
