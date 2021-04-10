import { Announce, AnnounceMeta } from 'src/shared';

export interface Follow {
  notify: { enable: boolean; hours: number[] };
  readTime: number;
}

export interface AnnounceState extends Announce, AnnounceMeta {
  id: string;
  iconData?: string;
}
