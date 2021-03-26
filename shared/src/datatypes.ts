export interface Post {
  title?: string;
  body: string;
  link?: string;
  img?: string;
  pT: number; // published time
}

export interface Announce {
  mid: string; // meta id
  posts?: string[];
  pid?: string; // (current) post id
  uT: number; // updated time
}

export interface AnnounceMeta {
  name: string;
  desc?: string;
  link?: string;
  icon?: string;
  cT: number; // created time
}

export interface User {
  announces?: string[];
}

export interface Image {
  d: Uint8Array;
}

export interface Device {
  fcmToken: string;
  signKey: string;
}

export interface CreateAnnounceParams {
  name?: string;
  desc?: string;
}

export interface EditAnnounceParams {
  id?: string;
  name?: string;
  desc?: string;
  link?: string;
  icon?: string;
  newIcon?: string;
}

export interface DeleteAnnounceParams {
  id?: string;
}

export interface PutPostParams {
  id?: string;
  title?: string;
  body?: string;
  link?: string;
  imgData?: string;
  editID?: string;
}

export interface DeletePostParams {
  id?: string;
  postID?: string;
}

export type NotificationMode = 'disabled' | 'always' | 'hours';

export interface RegisterNotificationParams {
  fcmToken?: string;
  announceID?: string;
  mode?: NotificationMode;
  hours?: number[];
}
