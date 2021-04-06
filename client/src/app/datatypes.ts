import { Announce, AnnounceMeta, NotificationMode } from 'src/shared';

export interface Follow {
  notify: { mode: NotificationMode; hours: number[] };
  readTime: number;
}

export interface AnnounceState extends Announce, AnnounceMeta {
  id: string;
  iconData?: string;
}
