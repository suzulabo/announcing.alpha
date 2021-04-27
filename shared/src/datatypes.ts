type Timestamp = {
  toMillis: () => number;
};

const languages = ['en', 'ja'] as const;
export type Lang = typeof languages[number];

export interface Post {
  title?: string;
  body?: string;
  link?: string;
  img?: string;
  pT: Timestamp; // published time
}

export const PostRule = {
  title: { length: 100 },
  body: { length: 500 },
  link: { length: 500 },
};

export interface Announce {
  mid: string; // meta id
  posts?: string[];
  pid?: string; // (current) post id
  uT: Timestamp; // updated time
}

export interface AnnounceMeta {
  name: string;
  desc?: string;
  link?: string;
  icon?: string;
  cT: Timestamp; // created time
}

export const AnnounceMetaRule = {
  name: { length: 100 },
  desc: { length: 500 },
  link: { length: 500 },
};

export interface User {
  announces?: string[];
}

export interface Image {
  data: Uint8Array;
}

export const ImageRule = {
  data: { length: 1000 * 1000 },
};

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

export const isLang = (s: any): s is Lang => {
  return languages.includes(s);
};

export interface RegisterNotificationParams {
  fcmToken?: string;
  lang?: Lang;
  follows?: { id?: string; hours?: number[] }[];
}
