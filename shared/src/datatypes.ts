export interface Post {
  title: string;
  body: string;
  link?: string;
  img?: string;
  pT: number; // published time
}

export interface Announce {
  posts?: string[];
  mid: string; // meta id
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

export type NotificationMode = 'disabled' | 'always' | 'hours';

export interface RegisterNotificationParams {
  signKey: string;
  fcmToken: string;
  announceID: string;
  mode: NotificationMode;
  hours: number[];
  signature: string;
  unfollow: boolean;
}

export interface RegisterNotificationResult {
  deviceID: string;
}

export interface DataPermissions {
  announces: {
    list: string[];
  };
}

export interface DataPermissionParams {
  permissions: DataPermissions;
}

export interface FetchFeedParams {
  url: string;
}

export interface AnnounceResult
  extends Omit<Announce, 'users' | 'mid' | 'uT'>,
    Omit<AnnounceMeta, 'cT'> {
  postsData: Omit<Post, 'oid'>[];
}

export interface FetchFeedResult {
  announce: AnnounceResult;
}

export interface ImportFeedParams {
  id: string;
  url: string;
}
