import { Announce, AnnounceMeta, Post } from 'announsing-shared';

export interface PostState extends Post {
  id: string;
}

export interface AnnounceState extends Announce, AnnounceMeta {
  id: string;
  postsData: PostState[];
  iconData?: string;
}