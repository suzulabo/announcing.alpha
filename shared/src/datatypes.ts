type Timestamp = {
  toMillis: () => number;
};
type Blob = {
  toBase64: () => string;
};

const languages = ['en', 'ja'] as const;
export type Lang = typeof languages[number];

export const isLang = (s: any): s is Lang => {
  return languages.includes(s);
};

export interface Announce {
  mid: string; // meta id
  posts: { [postID: string]: { pT: Timestamp } };
  uT: Timestamp; // updated time
}

interface PostBase {
  title?: string;
  body?: string;
  link?: string;
  img?: string;
  edited?: string;
}

export interface Post extends PostBase {
  pT: Timestamp; // published time
}
export interface PostJSON extends PostBase {
  pT: number; // published time
}

export const PostRule = {
  title: { length: 100 },
  body: { length: 500 },
  link: { length: 500 },
};

export interface AnnounceMetaBase {
  name: string;
  desc?: string;
  link?: string;
  icon?: string;
}
export interface AnnounceMeta extends AnnounceMetaBase {
  cT: Timestamp; // created time
}
export interface AnnounceMetaJSON extends AnnounceMetaBase {
  cT: number; // created time
}

export const AnnounceMetaRule = {
  name: { length: 50 },
  desc: { length: 500 },
  link: { length: 500 },
};

export interface User {
  announces?: string[];
  uT: Timestamp;
}

export interface Image {
  data: Blob;
}

export const ImageRule = {
  data: { length: 1000 * 1000 },
};

export type AnnounceAndMeta = Announce & AnnounceMetaBase;

export interface CreateAnnounceParams {
  name: string;
  desc?: string;
}

export interface EditAnnounceParams {
  id: string;
  name: string;
  desc?: string;
  link?: string;
  icon?: string;
  newIcon?: string;
}

export interface DeleteAnnounceParams {
  id: string;
}

export interface PutPostParams {
  id: string;
  title?: string;
  body?: string;
  link?: string;
  imgData?: string;
  editID?: string;
}

export interface DeletePostParams {
  id: string;
  postID: string;
}

export interface RegisterNotificationParams {
  token: string;
  signKey: string;
  sign: string;
  lang: Lang;
  announces: string[];
}
