export interface Post {
  oid: string; // original ID
  title: string;
  body: string;
  link?: string;
  img?: string;
  pT: number; // published time
}

export interface Announce {
  id: string;
  users: { [key: string]: { own: boolean } };
  posts?: string[];
  pid?: string; // (current) post id
  mid: string; // meta id
  uT: number; // updated time
  del?: boolean;
}

export interface AnnounceMeta {
  name: string;
  desc?: string;
  link?: string;
  icon?: string;
  feed?: string;
  cT: number; // created time
}

export interface Feed {
  url: string;
  users: { [key: string]: { own: boolean } };
  uT: number; // updated time
  cT: number; // created time
}

export interface Device {
  fcmToken: string;
  signKey: string;
}

export interface CreateAnnounceParams {
  name: string;
  desc?: string;
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
