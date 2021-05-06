import admin from 'firebase-admin';
import { Lang } from '../shared';

export interface NotificationDevice {
  signKey: string;
  lang: Lang;
  tz: string;
  follows: { [id: string]: { hours?: number[] } };
  uT: admin.firestore.Timestamp;
}

export interface ImmediateNotification {
  announceID: string;
  followers?: { [token: string]: [lang: Lang] };
  unfollows?: string[];
  archives?: string[];
  uT: admin.firestore.Timestamp;
}

export interface ImmediateNotificationArchive {
  followers: { [token: string]: [lang: Lang] };
}

export interface TimedNotification {
  time: number;
  followers?: {
    [token: string]: [lang: Lang, follows: { [announceID: string]: [hoursBefore?: number] }];
  };
  unfollows?: string[];
  archives?: string[];
  uT: admin.firestore.Timestamp;
}

export interface TimedNotificationArchive {
  followers: {
    [token: string]: [lang: Lang, follows: { [announceID: string]: [hoursBefore?: number] }];
  };
}
